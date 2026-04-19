# Article 6.2 Functionality Specification

This directory documents the registry's implementation of UNFCCC Paris Agreement Article 6.2 and maps each requirement to runnable Playwright E2E tests under `tests/e2e/article6/`.

## Feature index

| # | Feature | Phase commit | Doc | Test spec |
|---|---|---|---|---|
| 1 | Cooperative Approach | `3495767b8` | [01-cooperative-approach.md](./01-cooperative-approach.md) | `tests/e2e/article6/cooperative-approach.spec.ts` |
| 2 | ITMO lifecycle & accounts | `9d3ee0edd` | [02-itmo-lifecycle.md](./02-itmo-lifecycle.md) | `tests/e2e/article6/itmo-lifecycle.spec.ts` |
| 3 | OMGE/SOP deductions | `3e9481436` | [03-omge-sop-deductions.md](./03-omge-sop-deductions.md) | `tests/e2e/article6/omge-sop-deductions.spec.ts` |
| 4 | AEF reporting | `e74142295` | [04-aef-reporting.md](./04-aef-reporting.md) | `tests/e2e/article6/aef-reporting.spec.ts` |
| 5 | Corresponding Adjustment | `83ce32640` | [05-corresponding-adjustment.md](./05-corresponding-adjustment.md) | `tests/e2e/article6/corresponding-adjustment.spec.ts` |
| 6 | Initial Report | `1c00e24e4` | [06-initial-report.md](./06-initial-report.md) | `tests/e2e/article6/initial-report.spec.ts` |
| 7 | Cross-cutting integration & CASL | — | [07-cross-cutting.md](./07-cross-cutting.md) | `tests/e2e/article6/cross-cutting.spec.ts` |

> This README is a stub — the consolidated gaps summary and full quickstart are generated after all per-feature docs are complete.

## Running the suite

The suite expects the docker-compose stack running locally:

```
docker compose up -d
npx playwright test tests/e2e/article6/
```

Override the defaults if needed:

```
E2E_BASE_URL=http://localhost:3030 \
E2E_API_URL=http://localhost:3000 \
npx playwright test tests/e2e/article6/
```

Seeded test users (from `backend/services/users.csv`) used by fixtures:
- `palinda+add@xeptagon.com` (DNA admin)
- `palinda+dev@xeptagon.com` (PD admin)
- `palinda+cet@xeptagon.com` (IC admin)

All passwords: `123`.

## Shared helpers

- `tests/e2e/article6/support/auth.ts` — `login()`, credentials, overlay helper
- `tests/e2e/article6/support/api-client.ts` — authenticated REST wrapper
- `tests/e2e/article6/support/factories.ts` — `createCooperativeApproach`, `generateInitialReport`, `calculateCorrespondingAdjustment`, etc.
- `tests/e2e/article6/support/fixtures.ts` — `test` extended with `dnaPage`, `pdPage`, `apiDna`, `apiPd`, `apiIc`

## Source of truth for UNFCCC requirements

UNFCCC paragraph citations in each feature doc reference:
- Decision 2/CMA.3 (Glasgow, 2021) — foundational Article 6.2 guidance
- Decision 6/CMA.4 (Sharm el-Sheikh, 2022)
- Decision 5/CMA.5 (Dubai, 2023)
- Decision 4/CMA.6 Annex II (Baku, 2024) — current AEF table structure
