# Article 6.2 Functionality Specification

This directory documents the registry's implementation of UNFCCC Paris Agreement Article 6.2 and maps each requirement to runnable Playwright E2E tests under `tests/e2e/article6/`.

**Suite status**: 130 tests across 7 files (~110 executable, ~20 `test.fixme` placeholders tracking documented gaps).

## Feature index

| # | Feature | Phase commit | Tests | Doc |
|---|---|---|---|---|
| 1 | Cooperative Approach | `3495767b8` | 14 | [01-cooperative-approach.md](./01-cooperative-approach.md) |
| 2 | ITMO lifecycle & accounts | `9d3ee0edd` | 13 (9 + 4 fixme) | [02-itmo-lifecycle.md](./02-itmo-lifecycle.md) |
| 3 | OMGE/SOP deductions | `3e9481436` | 19 (14 + 5 fixme) | [03-omge-sop-deductions.md](./03-omge-sop-deductions.md) |
| 4 | AEF reporting | `e74142295` | 18 (16 + 2 fixme) | [04-aef-reporting.md](./04-aef-reporting.md) |
| 5 | Corresponding Adjustment | `83ce32640` | 24 (22 + 2 fixme) | [05-corresponding-adjustment.md](./05-corresponding-adjustment.md) |
| 6 | Initial Report | `1c00e24e4` | 23 (21 + 2 fixme) | [06-initial-report.md](./06-initial-report.md) |
| 7 | Cross-cutting integration & CASL | — | 19 (14 + 5 fixme) | [07-cross-cutting.md](./07-cross-cutting.md) |

Each feature doc follows the same template: UNFCCC requirement citations → registry implementation (entities, enums, endpoints, UI) → requirement-to-implementation mapping table → gaps / deviations → test coverage.

## Critical compliance gaps (aggregated)

These are the items most likely to matter in a UNFCCC compliance audit. Detail in the per-feature docs.

1. ~~Decision 2/CMA.3 ¶18 is not enforced~~ — **RESOLVED**. `programme.service.authorizeProgramme` now checks that any `article6trade` programme has a linked `cooperativeApproachId` with a submitted (or published) `InitialReport`, and returns `HTTP 400` citing the paragraph when the prerequisite is missing. See [06-initial-report.md](./06-initial-report.md) Gaps (struck-through entry) and the two cross-cutting tests under "Sequencing invariants" that verify both the deny path and the pass path.

2. ~~No structured 5-component ITMO serial number~~ — **RESOLVED**. `CreditBlocksEntity` gains an `itmoSerial` column populated at issuance with the UNFCCC 5-component identifier (`{originatingParty}-{itmoType}-{vintage}-{activityId}-{start}:{end}`), `SerialNumberManagementService` exposes `getItmoSerial` / `parseItmoSerial`, and the balance view surfaces the column so AEF Holdings can reference it. Immutability per Draft -/CMA.5 ¶132 is preserved by the registry's split-not-mutate pattern.

3. **Most ITMO lifecycle events are not HTTP-exposed** — `retireToAccount`, `ItmoAccount` CRUD, and the four new Article 6.2 retirement types (`USE_TOWARDS_NDC`, `USE_FOR_OIMP`, `OMGE_CANCELLATION`, `SOP_ADAPTATION`) are service-internal; the UI retirement modal only exposes the two pre-Article-6.2 options. **First-transfer toggling is RESOLVED** (see entry 3b below). [02-itmo-lifecycle.md](./02-itmo-lifecycle.md)

3b. ~~`isFirstTransfer` never toggled~~ — **RESOLVED**. `credit-transactions-management.service.ts` and `aef-report-management.service.ts` now receive the pre-update `CreditBlocksEntity` from the ledger-replicator and assign `CreditTransactionTypesEnum.FIRST_TRANSFER` + `AefActionTypeEnum.FIRST_TRANSFER` when the previous block state had `isNotTransferred=true`. The `credit_block_transfers_view_entity` view was also widened to include the new `FirstTransfer` rows (it had been filtering to `Transfered` only, which left FirstTransfer invisible to `queryTransfers` and AEF Actions consumers). Verified by the cross-cutting "isFirstTransfer=true on the first outgoing transfer, false on subsequent transfers" test that seeds three ledger events and asserts the replicator produces one FirstTransfer row and one subsequent-Transferred row.

4. **AEF output does not match Decision 4/CMA.6 Annex II** — registry exposes 3 report types (`HOLDINGS`, `ACTIONS`, `ANNUAL_INFORMATION`) vs the 5 AEF tables (Submission, Authorizations, Actions, Holdings, Authorized Entities) required since Baku 2024. The UI does not expose `ANNUAL_INFORMATION` at all. [04-aef-reporting.md](./04-aef-reporting.md)

5. **Orphan enum terminal states** — `CaStatus.APPROVED`, `InitialReportStatus.PUBLISHED`, and the `HOLDINGS_SNAPSHOT` / `ACQUISITION` AEF action types exist in code but no HTTP path transitions into them. [05-corresponding-adjustment.md](./05-corresponding-adjustment.md), [06-initial-report.md](./06-initial-report.md), [04-aef-reporting.md](./04-aef-reporting.md)

6. **Submit endpoints are idempotent with no state guard** — both Corresponding Adjustment and Initial Report re-submit silently; there is no audit trail or approval gate. [05-corresponding-adjustment.md](./05-corresponding-adjustment.md), [06-initial-report.md](./06-initial-report.md)

7. **No TER (Article 6 Technical Expert Review) workflow** — `SUBMITTED` status is the terminal state reachable via HTTP; there is no review, feedback, or approval channel before publication. [06-initial-report.md](./06-initial-report.md)

8. ~~No CA revocation or revision workflow~~ — **RESOLVED for revocation**. `CooperativeApproachStatus` gains a `REVOKED` terminal value per Draft -/CMA.5 ¶¶20-21. `programme.service.authorizeProgramme` refuses to mint ITMOs for a Revoked CA, returning HTTP 400 with a message that cites the paragraph. Revision workflow (para 19 — handling of changes to an active CA) remains open. [01-cooperative-approach.md](./01-cooperative-approach.md), [07-cross-cutting.md](./07-cross-cutting.md)

9. **Safeguard check silently defaults to `true`** when national emissions data is missing — the Corresponding Adjustment service persists `safeguardCheckPassed=true` when the `Emission` entity lacks a row for the target year, which could mask genuine violations. [05-corresponding-adjustment.md](./05-corresponding-adjustment.md)

10. **Voluntary OMGE/SOP deductions have no admin UI** — percentages and the `autoDeductAtIssuance` toggle are env-var-only, with no runtime introspection endpoint. [03-omge-sop-deductions.md](./03-omge-sop-deductions.md)

11. **CASL/UI permission drift** — `InitialReport` and `CorrespondingAdjustment` backends permit Ministry role via CASL `Manage`, but the UI navigation is DNA-admin-only. API callers with Ministry credentials can bypass the UI gate. [06-initial-report.md](./06-initial-report.md), [07-cross-cutting.md](./07-cross-cutting.md)

12. **Initial Report pre-population is a one-shot snapshot** — if the underlying Cooperative Approach is later edited (title, parties, description), the IR's embedded `cooperativeApproachDetails` drifts out of sync with no re-sync mechanism. [06-initial-report.md](./06-initial-report.md)

## Running the suite

The suite expects the docker-compose stack running locally:

```
docker compose up -d
npx playwright test tests/e2e/article6/
```

Run a single feature:

```
npx playwright test tests/e2e/article6/cooperative-approach.spec.ts
```

Override endpoints if needed:

```
E2E_BASE_URL=http://localhost:3030 \
E2E_API_URL=http://localhost:3000 \
npx playwright test tests/e2e/article6/
```

Enumerate without running (useful in CI for discovery only):

```
npx playwright test --list tests/e2e/article6/
```

Seeded test users (from `backend/services/users.csv`) used by fixtures:
- `palinda+add@xeptagon.com` — DNA admin
- `palinda+dev@xeptagon.com` — PD admin
- `palinda+cet@xeptagon.com` — IC admin

All passwords: `123`.

**Note**: Most executable tests hit a live backend. If the stack is not running, every test fails at login. The arithmetic-invariant tests in `omge-sop-deductions.spec.ts` are the only ones that pass with no server (pure TS).

## Shared helpers

- `tests/e2e/article6/support/auth.ts` — `login()`, `USERS`, `BASE_URL`, `API_URL`, overlay helper
- `tests/e2e/article6/support/api-client.ts` — `createApiClient(user)` returning `{ get, post, put, delete, json, token, request }` + `expectOk`
- `tests/e2e/article6/support/factories.ts` — `createCooperativeApproach`, `generateInitialReport`, `submitInitialReport`, `calculateCorrespondingAdjustment`, `queryCooperativeApproaches`, `uniqueSuffix`
- `tests/e2e/article6/support/fixtures.ts` — `test` extended with `dnaPage`, `pdPage`, `icPage`, `apiDna`, `apiPd`, `apiIc`

## Conventions

- **Enum wire values are PascalCase**, not SCREAMING_SNAKE. `CooperativeApproachStatus.DRAFT = "Draft"`, `CaMethod.TRAJECTORY = "Trajectory"`, `InitialReportStatus.SUBMITTED = "Submitted"`, etc. Always verify on disk in `backend/services/libs/shared/src/enum/*.enum.ts` before writing string literals.
- **ID formats**: `CA-<n>` (Cooperative Approach), `CA-ADJ-<n>` (Corresponding Adjustment), `IR-<n>` (Initial Report).
- **Permission denial status** is usually 401 (NestJS `UnauthorizedException` from CASL) but occasionally 403 — tests accept either `[401, 403]`.
- **Parallel safety**: every mutating test uses `uniqueSuffix()` in titles and future years (`2100+n`) to avoid collisions with seeded data and concurrent workers.
- **Gap-as-fixme**: when a feature doesn't match the UNFCCC spec, tests are written as they *should* pass and marked `test.fixme(...)` with an inline comment citing the gap. The gap is also documented in the relevant feature doc's "Gaps" section. Feature code is never modified.

## Source of truth for UNFCCC requirements

UNFCCC paragraph citations in each feature doc reference:
- **Decision 2/CMA.3** (Glasgow, 2021) — foundational Article 6.2 guidance
- **Decision 3/CMA.3** (Glasgow, 2021) — Article 6.4 rules (cited for contrast when 6.2 is voluntary)
- **Decision 6/CMA.4** (Sharm el-Sheikh, 2022) — ITMO serial number structure, action subtypes
- **Decision 4/CMA.6 Annex II** (Baku, 2024) — current AEF table structure (5 tables)
- **Draft -/CMA.5** (Dubai, 2023) — authorization content, revocation, TER sequencing

Cited paragraphs come from primary-source PDFs as compiled in the reference workup.
