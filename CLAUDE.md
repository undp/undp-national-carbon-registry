# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

UNDP's National Carbon Credit Registry (v2.0) — an open-source toolkit for tracking, issuing, transferring, and retiring carbon credits under Article 6 of the Paris Agreement. Service-oriented architecture: a NestJS backend (`backend/services`) exposing multiple logical services from one codebase, and a React/Vite frontend (`web`).

## Commands

### Backend (`backend/services`)

All commands run from `backend/services/`.

```
yarn install --frozen-lockfile   # sls:install does this via a cd; from inside the dir just use yarn install
yarn build                       # nest build
yarn start:dev                   # nest start --watch (single module — see RUN_MODULE below)
yarn lint                        # eslint --fix
yarn test                        # jest unit tests (*.spec.ts under src/ and libs/)
yarn test -- path/to/file.spec.ts --testNamePattern "name"   # run a single test
yarn test:cov                    # jest with coverage
yarn test:e2e                    # jest e2e config (./test/jest-e2e.json) — NOT the Playwright suite, see below
```

TypeORM migrations (uses `src/data-source.ts`):
```
yarn migration:generate <path>   # generate from entity diffs
yarn migration:create <path>     # blank migration
yarn migration:run
yarn migration:revert
yarn migration:show
```

Local (non-container) run via Serverless offline:
```
yarn sls:install
serverless invoke local --stage=local --function setup --data '{"rootEmail":"...","systemCountryCode":"..","name":"...","logoBase64":"..."}'
sls offline --stage=local        # Swagger at http://localhost:3000/local/national
```

### Frontend (`web`)

All commands run from `web/`.

```
yarn dev      # vite dev server on :3030
yarn build    # tsc -b && vite build
yarn lint     # eslint .
yarn preview
```

### Full stack (containers)

```
docker-compose up -d --build     # or podman-compose (dev docs assume podman)
```
Brings up `db` (Postgres), `national` (national-api), `stats` (analytics-api), `replicator`, `web`. Frontend on `:3030`, national API on `:3000/national`, stats API on `:3100/stats`. Env is supplied via `.env.db`, `.env.national`, `.env.replicator` at repo root (see the `.env.*.example` files) plus `backend/services/.env.example` for the full backend variable reference. Emails are disabled by default (`IS_EMAIL_DISABLED=true`); generated passwords, including the root user's, are printed to the `national` container logs — grep for `Password (temporary)`.

Demo data: `scripts/seed-demo.sh` (requires the stack up and `python3`/`curl`). Wipe/reseed procedure documented in `docs/testing/manual-qa-article6.md`.

### E2E tests (Playwright)

`playwright.config.ts` lives at the repo root and drives `tests/e2e/article6/**/*.spec.ts`. **There is no root `package.json`** — install `@playwright/test` ad hoc (`npm install -D @playwright/test` or equivalent) before running `npx playwright test`. Tests hit a live dev stack (`http://localhost:3000` national API, `http://localhost:3030` web) and several seed helpers in `tests/e2e/article6/support/factories.ts` shell out directly to `podman exec db psql` (override container name via `E2E_DB_CONTAINER`) — so the stack must be running under `podman-compose`, not plain Docker, for those helpers to work. See `docs/testing/e2e-coverage.md` for what's covered and known gaps, and `docs/testing/manual-qa-article6.md` for the manual QA walkthrough and seeded-data reference.

## Architecture

### One NestJS app, multiple logical services

`backend/services/src/main.ts` boots one or more "modules" selected by the comma-separated `RUN_MODULE` env var (default `national-api`). Each is a full NestJS module mounted under its own HTTP path, or a one-shot handler:

- `national-api` → `NationalAPIModule`, mounted at `/national`. Auth, users/companies, project & credit lifecycle. Controllers live flat under `src/national-api/*.controller.ts`.
- `analytics-api` → `AnalyticsAPIModule`, mounted at `/stats`. Read-only statistics from the operational DB.
- `replicator` → one-shot handler (`ledger-replicator/handler.ts`). Streams ledger events into the operational (Postgres) DB.
- `async-operations-handler` → one-shot handler for queued/async work (email sending, etc.); selected via `ASYNC_OPERATIONS_TYPE=Database|Queue`.
- `data-importer` → one-shot handler for external data imports (e.g. ITMO platform sync), controlled by `DATA_IMPORT_TYPES`.

`docker-compose.yml` runs these as separate containers, each pointed at the same image with a different `RUN_MODULE`. `serverless.yml` packages the same modules as Lambda functions for AWS deployment instead.

Shared code lives in two libs consumed via TS path aliases (`@app/shared`, `@app/core`):
- `backend/services/libs/shared/src/` — almost all domain logic: one directory per bounded concern (`project-management`, `programme`, `credit-blocks-management`, `credit-transactions-management`, `corresponding-adjustment`, `cooperative-approach`, `aef-report-management`, `itmo-account`, `company`, `user`, `auth`, `casl`, etc.), plus cross-cutting `entities/`, `view-entities/`, `dto/`, `enum/`, `ledger-db/`.
- `backend/services/libs/core/src/` — app configuration (`app-config/`).

### Dual-database ledger architecture

Two databases back every project/credit mutation:
- **Ledger DB** (system of record) — implementations behind `libs/shared/src/ledger-db/ledger.db.interface.ts`: `pgsql-ledger.service.ts` (default) and `qldb-ledger.service.ts` (AWS QLDB, immutable/cryptographically verifiable). Selected via `LEDGER_TYPE=PGSQL|QLDB`. Writing a new ledger backend means implementing this interface.
- **Operational DB** (Postgres, read side) — populated asynchronously by the `replicator` service from ledger events (`ledger-replicator/process.event.service.ts`), enriched with query-friendly data (e.g. geolocation via the location service). All `analytics-api` reads and most `national-api` list/query endpoints read from here, via `view-entities/`.

Because reads lag writes through the replicator, an entity you just wrote via the ledger may not immediately appear in an operational-DB query — this shows up frequently in e2e tests, which sometimes poll or seed the operational DB directly to avoid replicator-timing flakiness.

Credit identity: each project gets a project ID; each issuance batch gets a serial-number range within that project (format aligned to UNFCCC Decision 6/CMA.4 ¶17, e.g. `CA0004-VU-CH-356-1-3000-2023`). Transfers/retirements of a partial block split it — the original owner keeps the low end of the range, the counterparty gets a new block covering the high end. See `serial-number-management/` and `credit-blocks-management/`.

### Pluggable external services

Selected by env var, each behind its own interface so new backends can be added without touching callers:
- `LOCATION_SERVICE=FILE|OPENSTREET|MAPBOX` → `libs/shared/src/location/location.interface.ts`
- `FILE_SERVICE=LOCAL|S3|AZURE` → `libs/shared/src/file-handler/filehandler.interface.ts`. Uploads
  persist a bare storage key (`documents/foo.pdf`); the global `file-url.interceptor.ts` resolves
  keys to URLs on outbound HTTP responses via the active backend's `getUrl()`. Server-side
  consumers (email attachments, PDF links, export files) bypass that pipeline and must call
  `resolveStoredFile()`; anything accepting a reference back from a client must call
  `toStorageKey()`. Pre-existing absolute URLs match no prefix and are left untouched.
- `ASYNC_OPERATIONS_TYPE=Database|Queue`

### Authorization

CASL-based, defined once per side and kept in sync manually:
- Backend: `libs/shared/src/casl/casl-ability.factory.ts` builds abilities per role (`role.enum.ts`: Root / DNA / Project Developer / Independent Certifier, each Admin/Manager/ViewOnly); `policy.guard.ts` + `@Policy()` decorator enforce it on controllers.
- Frontend: `web/src/Casl/ability.ts` mirrors the same rules for UI gating (`Can` component), `web/src/Casl/Can.ts`.
JWT auth (`libs/shared/src/auth/`) plus a separate API-key strategy for machine/MRV-system integration.

### Frontend structure (`web/src`)

- `Config/apiConfig.ts` — API base URLs and endpoint paths; `Config/uiRoutingConfig.ts` — route table; `Config/colorConfigs.ts` — theme colors (a primary branding customization point).
- `Definitions/Enums` — controlled vocabularies (sectors, mitigation types, statuses, roles) driving dropdowns; kept parallel to backend `libs/shared/src/enum/`.
- `Context/` — `UserInformationContext`, `SettingsContext`, `ConnectionContext` (auth/session, system settings, connectivity state).
- `Pages/` — one directory per feature area (`ProgrammeManagement`, `CreditPages`, `CooperativeApproaches`, `CorrespondingAdjustment`, `InitialReport`, `Reports`, `UserManagement`, `CompanyManagement`, `Dashboard`, ...), generally mirroring the backend module boundaries.
- `locales/` (+ `public/locales/`) — i18next translation namespaces; English shipped, French/Spanish in progress.

### Customization

This codebase is deployed per-country with local overrides layered on top rather than forked. The main touchpoints (see README §"Customization Framework and Extensibility" for the full rationale):

| Area | Location |
|---|---|
| Frontend config / branding | `web/src/Config/`, `web/src/Styles/`, `web/public/` |
| Frontend controlled vocab | `web/src/Definitions/Enums/` |
| Backend enums/constants | `backend/services/libs/shared/src/enum/`, `.../constants/` |
| DTOs / API contracts | `backend/services/libs/shared/src/dto/` |
| Reference data | `backend/services/countries.json`, `regions.csv`, `organisations.csv`, `users.csv` |
| Active module/backend selection | env vars: `RUN_MODULE`, `LEDGER_TYPE`, `LOCATION_SERVICE`, `FILE_SERVICE`, `ASYNC_OPERATIONS_TYPE` |
| Localization | `web/public/locales/` |

New optional functionality should be added as a new implementation of the relevant interface (ledger replicator, location, file-handler, data importer) registered/selected via env var, not as a hard-coded branch in existing services.

### External integration: UNDP ITMO platform

`data-importer` module syncs projects/credits with UNDP's ITMO Voluntary Bilateral Cooperation Platform (daily pull of authorized projects, push of issuances). Field mapping and sector-mapping tables are documented in the root `README.md` under "External Connectivity" — consult that before changing `data-importer/importers/`.
