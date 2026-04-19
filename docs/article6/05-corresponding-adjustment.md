# 05 - Corresponding Adjustment Accounting (Article 6.2, Phase 5)

> **Phase commit**: `83ce32640` - **Primary entity**: `CorrespondingAdjustment`, `NdcType`, `CaMethod`, `CaStatus` - **Test spec**: [`corresponding-adjustment.spec.ts`](../../tests/e2e/article6/corresponding-adjustment.spec.ts)

## UNFCCC requirement

Corresponding adjustments are the accounting mechanism by which a participating Party neutralises the emissions impact of ITMOs it issues, transfers, or uses under an Article 6.2 cooperative approach. Phase 5 introduces a first-class record of that accounting per reporting year.

Key obligations relevant to Phase 5 of the registry:

- **Method choice by NDC type** (Decision 2/CMA.3, Glasgow 2021, annex ch. III, para 7). For a Party with a **single-year NDC** the corresponding adjustment is applied to an indicative emissions-and-removals trajectory covering every year of the NDC implementation period (para 7a(i)) or by averaging the annual adjustments over that period (para 7a(ii)). For a Party with a **multi-year NDC** the adjustment is applied directly to the multi-year target (para 7b). The registry must record which method was chosen for each reporting year.
- **Emissions-balance formula** (Dec 2/CMA.3 annex ch. III, para 8). For each reporting year the adjustment is the difference of ITMOs *first-transferred* out, ITMOs *acquired* in, and ITMOs *used towards NDC* by the Party itself. In the sign convention used by para 8 the balance is a positive adjustment to the Party's reported emissions when it is a net outgoing transferor.
- **Safeguard** (Dec 2/CMA.3 annex ch. III, para 9). Engaging in Article 6.2 cooperative approaches must not lead to a net increase in emissions against the Party's NDC target. The registry must be able to flag a reporting year in which the adjusted emissions exceed the NDC emission-reduction target.
- **Multi-year averaging guidance** (Draft -/CMA.5, Sharm el-Sheikh 2022 / SBSTA 58 text, paragraphs on multi-year accounting under para 7b). The averaging method for a multi-year NDC must produce a per-year adjustment consistent with the Party's accounting approach for the full target period.
- **Same-period rule** (STC03 in Supervisory Body guidance on authorization scope). The corresponding-adjustment year must fall inside the Party's NDC implementation period; adjustments for activity outside that window are not reported.

## Registry implementation

### Entity: `CorrespondingAdjustment`

`backend/services/libs/shared/src/entities/corresponding.adjustment.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `caId` | `string` (PK) | Format `CA-ADJ-<n>` (e.g. `CA-ADJ-001`); allocated by `CounterService.incrementCount(CORRESPONDING_ADJUSTMENT, 3)`. |
| `year` | `int` | Reporting year. |
| `cooperativeApproachId` | `string` (nullable) | Optional scope filter; unique identifier `CA{NNNN}` from Phase 1. |
| `metric` | `string`, default `"tCO2e"` | Only `tCO2e` is supported today. |
| `ndcType` | `enum NdcType` | `SingleYear` or `MultiYear`. |
| `caMethod` | `enum CaMethod` | `Trajectory` / `Averaging` / `MultiYear`. |
| `authorizedItmos` | `decimal 15,5`, default 0 | Sum of `AUTHORIZED` + `ISSUED` CreditTransaction amounts in the year. |
| `firstTransferredItmos` | `decimal 15,5`, default 0 | Sum of `FIRST_TRANSFER` + `TRANSFERED` (with `isFirstTransfer=true`). |
| `acquiredItmos` | `decimal 15,5`, default 0 | Sum of `ACQUIRED`. |
| `usedTowardsNdcItmos` | `decimal 15,5`, default 0 | Sum of `USE_TOWARDS_NDC`. |
| `cancelledItmos` | `decimal 15,5`, default 0 | Sum of `VOLUNTARY_CANCELLATION` + `OMGE_CANCELLATION`. |
| `emissionsBalance` | `decimal 15,5`, default 0 | Computed `firstTransferredItmos - acquiredItmos + usedTowardsNdcItmos`. |
| `ndcTarget` | `decimal 15,5` (nullable) | NDC emission reduction target for the year, carried on the calculate request. |
| `adjustedEmissions` | `decimal 15,5` (nullable) | `nationalEmissions + emissionsBalance` when `Emission` data is present for the (year, systemCountry). |
| `safeguardCheckPassed` | `boolean`, default `false` | Set to `adjustedEmissions <= ndcTarget` when both values are resolvable; the service-layer initializer seeds it to `true` before the comparison runs (see Gaps). |
| `safeguardNotes` | `text` (nullable) | Free-text explanation produced alongside the pass/fail decision. |
| `status` | `enum CaStatus`, default `Draft` | `Draft` -> `Submitted` via `PUT /submit`. `Approved` is defined but no endpoint transitions to it. |
| `createdTime`, `updatedTime` | `bigint` | Epoch ms; both set at calculate time, `updatedTime` refreshed by `PUT /submit`. |

### Enums

| Enum | Values | Source |
| --- | --- | --- |
| `NdcType` | `SINGLE_YEAR = "SingleYear"`, `MULTI_YEAR = "MultiYear"` | `enum/ndc.type.enum.ts` |
| `CaMethod` | `TRAJECTORY = "Trajectory"`, `AVERAGING = "Averaging"`, `MULTI_YEAR = "MultiYear"` | `enum/ca.method.enum.ts` |
| `CaStatus` | `DRAFT = "Draft"`, `SUBMITTED = "Submitted"`, `APPROVED = "Approved"` | `enum/ca.status.enum.ts` |

**On-wire values are PascalCase**, not the TypeScript SCREAMING_SNAKE keys. The DTO's `@IsEnum(NdcType)` and `@IsEnum(CaMethod)` validate against `Object.values(NdcType)` / `Object.values(CaMethod)`, so a payload with `"SINGLE_YEAR"` is rejected with 400. The factory helper `CaCalculateInput` in `tests/e2e/article6/support/factories.ts` advertises `"SINGLE_YEAR" | "MULTI_YEAR"` as a TypeScript union for ergonomic autocomplete only; the wire payload the spec actually sends uses the PascalCase values.

### Calculation pipeline

`CorrespondingAdjustmentService.calculateCA(year, cooperativeApproachId, ndcType, caMethod, ndcTarget, user)` performs:

1. Allocate a fresh `caId = "CA-ADJ-<counter>"` (counter width 3 digits, left-padded).
2. Build the `[Jan 1 year 00:00, Jan 1 year+1 00:00)` epoch window and fetch `CreditTransactionsEntity` rows whose `createTime` falls inside it.
3. If `cooperativeApproachId` is provided, filter to `tx.cooperativeApproachId = :caId`; otherwise no filter.
4. Bucket each transaction by `CreditTransactionTypesEnum`:
   - `AUTHORIZED` or `ISSUED` -> `authorizedItmos += tx.amount`
   - `FIRST_TRANSFER` -> `firstTransferredItmos += tx.amount`
   - `TRANSFERED` with `tx.isFirstTransfer === true` -> `firstTransferredItmos += tx.amount`
   - `ACQUIRED` -> `acquiredItmos += tx.amount`
   - `USE_TOWARDS_NDC` -> `usedTowardsNdcItmos += tx.amount`
   - `VOLUNTARY_CANCELLATION` or `OMGE_CANCELLATION` -> `cancelledItmos += tx.amount`
5. Compute `emissionsBalance = firstTransferredItmos - acquiredItmos + usedTowardsNdcItmos` (Dec 2/CMA.3 para 8).
6. Fetch `Emission` for `{ year: String(year), country: config.systemCountry }`. If present and its `totalCo2WithoutLand.co2eq` is set, `adjustedEmissions = Number(totalCo2WithoutLand.co2eq) + emissionsBalance`; otherwise `adjustedEmissions = null`.
7. Safeguard: `safeguardCheckPassed` is initialized to `true`. If **both** `ndcTarget` and `adjustedEmissions !== null` are present, compare `adjustedEmissions <= ndcTarget`; if not, the "could not be performed" note is written and the initial `true` is left in place.
8. Persist the row with `status = Draft`, `metric = "tCO2e"`, and the current epoch ms in `createdTime`/`updatedTime`.

### API endpoints

All paths are relative to `http://localhost:3000/national/correspondingAdjustment/`.

| Method | Path | Body / Query | CASL action | Effective gate |
| --- | --- | --- | --- | --- |
| `POST` | `calculate` | `CaCalculateDto { year, cooperativeApproachId?, ndcType, caMethod, ndcTarget? }` | `Action.Create, CorrespondingAdjustment` | DNA Admin/Root + Ministry (Admin/Root). |
| `POST` | `query` | `QueryDto { page, size, filterAnd?, sort? }` | `Action.Read, CorrespondingAdjustment` | DNA + Ministry (any role including ViewOnly); IC and PD blocked. |
| `GET` | `get?id=<caId>` | — | `Action.Read, CorrespondingAdjustment` | Same as `query`. |
| `PUT` | `submit?id=<caId>` | — | `Action.Update, CorrespondingAdjustment` | DNA Admin/Root + Ministry (Admin/Root). |

Guards: `JwtAuthGuard` + `PoliciesGuardEx(...)` wired in `backend/services/src/national-api/corresponding-adjustment.controller.ts`. CASL grants in `casl-ability.factory.ts`:

```ts
// DNA branch (lines 161-199)
can(Action.Read, CorrespondingAdjustment);
if (user.role !== Role.ViewOnly) {
  can(Action.Manage, CorrespondingAdjustment);
}

// Ministry branch (lines 201-226): identical shape.
// No other companyRole has a CorrespondingAdjustment rule.
```

PD (`PROJECT_DEVELOPER`) and IC (`INDEPENDENT_CERTIFIER`) users therefore receive **HTTP 403** on any endpoint; this matches the Phase 4 spec's expectation that a CASL-layer denial emits 403 (not the 401 that the hand-rolled AEF check emits).

Status-code shape for success paths:

- `POST /calculate` -> `DataResponseDto(HttpStatus.CREATED, saved)`. Nest's default for `@Post` is 201.
- `POST /query` -> `DataListResponseDto { data, total }`.
- `GET /get` / `PUT /submit` -> `DataResponseDto(HttpStatus.OK, ...)`.
- Not-found paths on `get` / `submit` throw `HttpException(..., HttpStatus.NOT_FOUND)`.

### UI

| Route | Component | Who sees it |
| --- | --- | --- |
| `/correspondingAdjustments/viewAll` | `web/src/Pages/CorrespondingAdjustment/caManagement.tsx` | Rendered for DNA/Ministry (sidebar entry gated similarly to `/reports`); the `Calculate CA` button is additionally gated on `companyRole === DESIGNATED_NATIONAL_AUTHORITY`. |
| `/correspondingAdjustments/calculate` | `web/src/Pages/CorrespondingAdjustment/caCalculation.tsx` | DNA only in practice (the page is the target of the "Calculate CA" button). |

Routes are registered in `web/src/App.tsx` lines 184-192.

`caManagement.tsx` columns:

| Column | Source | Formatter |
| --- | --- | --- |
| ID | `caId` | raw |
| Year | `year` | raw, sortable |
| Cooperative Approach | `cooperativeApproachId` | raw |
| NDC Type | `ndcType` | raw PascalCase ("SingleYear" / "MultiYear") |
| CA Method | `caMethod` | raw PascalCase |
| Emissions Balance | `emissionsBalance` | `toFixed(2)` |
| Safeguard | `safeguardCheckPassed` | green "Passed" / red "Failed" Tag |
| Status | `status` | colored Tag: Draft=default, Submitted=blue, Approved=green |

`caCalculation.tsx` form:

| Field | Control | Constraints |
| --- | --- | --- |
| `year` | `InputNumber` | required, `min=2021`, `max=2050`. |
| `ndcType` | `Select` | options `SingleYear` / `MultiYear`, labels "Single-Year Target" / "Multi-Year Target". |
| `caMethod` | `Select` | options `Trajectory` / `Averaging` / `MultiYear`, labels per para 7a(i) / 7a(ii) / 7b. |
| `ndcTarget` | `InputNumber` | optional, `tCO2eq`. |
| `cooperativeApproachId` | `Select` | optional, the option list is currently empty (populated only in a full implementation — see Gaps). |

On submit the page POSTs `national/correspondingAdjustment/calculate` with the raw form values and renders:

- an `Alert` above the Descriptions card — success (green) when `safeguardCheckPassed`, warning (yellow) when not;
- a `Descriptions` card with `CA ID`, `Status` (Tag), the five ITMO counts (2-decimal), `Emissions Balance`, `Adjusted Emissions` (or `N/A` when null), and `NDC Target`.

## Requirement -> implementation mapping

| UNFCCC requirement | Implementation | Verified by |
| --- | --- | --- |
| Record CA method per reporting year: Trajectory / Averaging / Multi-Year (Dec 2/CMA.3 para 7) | `CaMethod` enum + `CorrespondingAdjustment.caMethod` column | `API: calculate > all three CaMethod values are accepted (Trajectory, Averaging, MultiYear)`, `Enum cardinality > CaMethod has exactly 3 values` |
| Distinguish single-year from multi-year NDC targets (Dec 2/CMA.3 para 7) | `NdcType` enum + `CorrespondingAdjustment.ndcType` column | `API: calculate > both NdcType values are accepted (SingleYear, MultiYear)`, `Enum cardinality > NdcType has exactly 2 values` |
| Emissions-balance formula `firstTransferred - acquired + usedTowardsNdc` (Dec 2/CMA.3 para 8) | `CorrespondingAdjustmentService.calculateCA` line 105; persisted as `emissionsBalance` | `API: calculate > emissionsBalance = firstTransferred - acquired + usedTowardsNdc (Dec 2/CMA.3 para 8)` |
| Aggregate ITMO counts by action type per reporting year | Bucket branches at lines 73-100 of the service; persisted as `authorizedItmos`, `firstTransferredItmos`, `acquiredItmos`, `usedTowardsNdcItmos`, `cancelledItmos` | `API: calculate > POST /calculate returns 201 ...`, `API: calculate > empty year (no transactions) returns zero ITMO counts ...` |
| Scope aggregation to a single cooperative approach when required | `cooperativeApproachId` filter at lines 57-63 of the service | `API: calculate > cooperativeApproachId filter scopes the aggregation (no cross-contamination)` |
| Safeguard against net emissions increase (Dec 2/CMA.3 para 9) | `safeguardCheckPassed` comparison at lines 122-135 of the service | `API: calculate > safeguard defaults to passed=true when nationalEmissions data is missing`; fail path as `test.fixme` — see Gaps. |
| Immutable reporting-year scope | Year-window query at lines 49-54 of the service | Implicit in `API: calculate > emissionsBalance = ...` (different reporting years are independent) |
| Draft-then-submit reporting lifecycle | `CaStatus` enum + `PUT /submit` handler | `API: CRUD > PUT /submit flips status from Draft to Submitted`, `Enum cardinality > CaStatus has exactly 3 values` |
| DNA-only authorship of corresponding adjustments | CASL `Manage CorrespondingAdjustment` for DNA + Ministry | `Permissions: DNA-admin/root only > PD user cannot POST /calculate`, `... cannot POST /query` |
| Input validation on calculate payload | `CaCalculateDto` with `@IsInt year`, `@IsEnum NdcType`, `@IsEnum CaMethod` | `API: calculate > rejects an invalid ndcType with 4xx`, `... rejects a missing year with 4xx` |
| Operator-facing UI for CA records | `/correspondingAdjustments/viewAll` list + `/calculate` form | `UI: DNA flow > DNA user can navigate to /correspondingAdjustments/viewAll and the list renders`, `... calculate and see the form controls` |
| Look up a single CA row and list them paginated | `GET /get?id=` and `POST /query` | `API: CRUD > GET /get?id=<caId> returns the CA row`, `... POST /query returns a paginated envelope {data, total}`, `... GET /get?id=NONEXISTENT returns 404` |

## Gaps / deviations

- **No `Approved` transition path.** `CaStatus.APPROVED` is declared in the enum and the UI tag-color map, but there is no `PUT /approve` endpoint and `calculateCA` / `submit` never write `Approved`. A Party that wants to publish an approved CA record has to edit the database directly. The Phase 5 service exposes only `Draft -> Submitted`.
- **`submit` is not state-guarded.** `CorrespondingAdjustmentService.submit` unconditionally sets `status = SUBMITTED` regardless of the current value. Re-submitting a row that is already `Submitted` succeeds silently (and refreshes `updatedTime`). There is no audit-trail entry recording the transition, and no way to un-submit. The spec's `PUT /submit on an already-Submitted CA is idempotent (no 4xx)` test documents the current behaviour and accepts either 2xx or 4xx so a future guard does not require a test change.
- **`CaMethod.MULTI_YEAR` overlaps semantically with `NdcType.MULTI_YEAR`.** Both enums share the string value `"MultiYear"`. A multi-year NDC (`NdcType.MULTI_YEAR`) implies the multi-year method (`CaMethod.MULTI_YEAR` / para 7b), but there is no validation that prevents the nonsensical combination `ndcType=SingleYear, caMethod=MultiYear` or its converse. A reviewer cannot tell from the stored row whether the author intentionally chose an averaging method for a single-year NDC or simply miswired the form.
- **`ndcTarget` is not versioned.** It is only present on the calculate request and persisted on the resulting row. There is no `NdcTarget` entity that tracks the Party's target per year / per revision, so a re-run of `calculate` for the same year with a different target leaves earlier rows with their stale targets. For audit the caller must inspect `createdTime` across the CA rows themselves.
- **Safeguard silently defaults to `true` when emissions data is missing.** The service-level initializer seeds `safeguardCheckPassed = true`. When the `Emission` row for `(year, systemCountry)` is absent, `adjustedEmissions` stays `null`, the safeguard branch falls through to the "could not be performed" note, and the `true` seed is what gets persisted. The entity column default is `false`, so the mismatch between "service default `true`" and "entity default `false`" is load-bearing. A DNA admin reading a row with no emissions data will see a green "Passed" tag — which may mask a violation. This is flagged as the most significant deviation from Dec 2/CMA.3 para 9.
- **No same-period (STC03) enforcement.** The service accepts any integer `year` (the entity is an `int` column with no bound; the UI restricts to `[2021, 2050]` but the API does not). Nothing checks that `year` falls inside the Party's NDC implementation period, so an adjustment can be recorded for a year outside the reporting window. A reviewer has to cross-reference the `/initialReports` NDC period manually.
- **No re-calculation audit trail.** Calling `POST /calculate` twice for the same `(year, cooperativeApproachId)` creates two DRAFT rows with different `caId`s. There is no `supersededBy` link, no deduplication, and no explicit version number. The natural key of the published record is the pair `(year, cooperativeApproachId)` but the registry's primary key is `caId`, so a downstream consumer that queries by year will see a growing list of half-finished drafts. Listing order is `createdTime DESC` so the most recent one wins in the UI, but nothing enforces that the older drafts are deleted or archived.
- **Only `tCO2e` is modelled.** `metric` is a free string column with default `"tCO2e"` and is never set from the calculate request. Non-GHG metric ITMOs (the "non-tCO2e" option discussed in Dec 2/CMA.3 annex para 1(d) and flagged in draft -/CMA.5) cannot be represented. The column's presence suggests this was anticipated but not wired.
- **`cooperativeApproachId` UI dropdown is empty.** `caCalculation.tsx` lines 128-131 render a `Select` with no options and the source comment `Populated dynamically in a full implementation`. A DNA admin cannot scope a calculation to a specific cooperative approach through the UI today — they must use the API directly. The Phase 1 cooperative-approach entity exists and is paginated, so the fix is plumbing only.
- **Year-window query uses `tx.createTime`, not the authorization or transfer date.** `calculateCA` at lines 49-54 filters `CreditTransactionsEntity` by `createTime` (the row-insert timestamp) rather than the effective action time. In practice these match, but a CreditTransactions row inserted late (a back-dated correction) would be assigned to the wrong reporting year. The AEF service uses `creditBlock.txTime` for the same purpose — this phase is inconsistent with that convention.
- **`authorizedItmos` aggregation double-counts some cases.** The switch statement accumulates both `AUTHORIZED` (line 75) and `ISSUED` (line 91) into `authorizedItmos`. In the current credit pipeline these are alternative types for the same semantic event, but if a future migration writes both flavours for a single issuance the count would double. No test seeds CreditTransactions so this remains a latent hazard; the spec's empty-year test simply asserts the count is zero.
- **Single-row DTO, not a running journal.** The persisted record collapses an entire reporting year into one row. Decision 2/CMA.3 para 8 talks about the balance at the end of the reporting period; nothing in the entity distinguishes an end-of-period snapshot from a mid-period draft. A Party that publishes a Q1 draft, a Q2 draft, and a final year-end record cannot tell from the stored rows which is which.
- **UI form submits `onFinish` without re-validating the year vs NDC implementation period.** The `caCalculation.tsx` form enforces `[2021, 2050]` as the only client-side bound. Because the backend has no STC03 check either (above), there is no layer that tells the operator "this year falls outside your current NDC".

## Test coverage

The Playwright spec is structured as one top-level describe (`Corresponding Adjustment - Article 6.2`) with five nested blocks:

- `API: calculate` — 9 executing tests (201 response shape, emissions-balance arithmetic identity, each of the 3 `CaMethod` values, each of the 2 `NdcType` values, empty-year zero-fill, safeguard-default-true when emissions missing, `cooperativeApproachId` filter scope, invalid-ndcType 4xx rejection, missing-year 4xx rejection) and 1 `test.fixme` (safeguard fail path, deferred pending a credit-issuance fixture).
- `API: CRUD` — 5 executing tests (`query` pagination envelope, `get` happy path, `get` 404, `submit` Draft -> Submitted, `submit` 404 for unknown caId) and 1 tolerant re-submit test that accepts either 2xx (current idempotent behaviour) or 4xx (a future state-guard).
- `Enum cardinality` — 3 executing tests locking in the 2 `NdcType` values, the 3 `CaMethod` values, and the 3 `CaStatus` values. The canary fires on silent enum renames that the API tests would miss on an empty database.
- `Permissions: DNA-admin/root only` — 2 executing tests: PD cannot `POST /calculate`, PD cannot `POST /query`. Both accept 401 or 403.
- `UI: DNA flow` — 2 executing tests (viewAll list renders with Calculate CA button; calculate form exposes all five named fields and the submit button) and 1 `test.fixme` (full form submission driving antd Select + InputNumber, deferred pending a shared antd helper in `support/factories.ts`).

Total: 23 tests, of which 2 are `test.fixme` (deferred pending a credit-issuance fixture and an antd Select/InputNumber helper) and 21 execute.

## Running

```bash
npx playwright test tests/e2e/article6/corresponding-adjustment.spec.ts
```
