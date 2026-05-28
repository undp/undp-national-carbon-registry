# 06 - Initial Report Generation (Article 6.2, Phase 6)

> **Phase commit**: `1c00e24e4` - **Primary entity**: `InitialReport`, `InitialReportStatus` - **Test spec**: [`initial-report.spec.ts`](../../tests/e2e/article6/initial-report.spec.ts)

## UNFCCC requirement

Article 6.2 requires each participating Party to publish an initial report that demonstrates its eligibility to issue or acquire ITMOs and that describes the cooperative approach in enough detail for the UNFCCC Article-6 Technical Expert Review (TER). The initial report is the **pre-condition** for the first ITMO authorization under a given cooperative approach — without a submitted initial report a Party may not authorise ITMOs.

Key obligations relevant to Phase 6 of the registry:

- **Initial report required before first authorization** (Decision 2/CMA.3, Glasgow 2021, annex chapter V, para 18). Each participating Party must provide an initial report covering the cooperative approach when it first authorises ITMOs, or when it first transfers/first uses ITMOs authorised by another Party. No ITMO may be authorised for a CA for which the Party has not yet submitted an initial report.
- **Required initial-report content** (Dec 2/CMA.3 annex chapter V, paras 18(a)–(i), and draft -/CMA.5 chapter V, Sharm/Dubai outcomes). The initial report must cover, at a minimum:
  - *Paras 18(a)–(b)*: demonstration that the Party is a Party to the Paris Agreement, has an NDC, has the arrangements in place for tracking and authorization of ITMOs.
  - *Para 18(c)*: the ITMO metric (primary metric `tCO2e`; any non-GHG metric that is used).
  - *Para 18(d)*: description of the cooperative approach — participating Parties, duration, expected mitigation outcomes, description of authorised activities.
  - *Para 18(e)*: the quantification of the NDC in `tCO2e`-equivalent for the accounting period (base year, target year, sectors, GHGs covered).
  - *Para 18(f)*: the chosen method for applying the corresponding adjustment (trajectory / averaging / multi-year, cross-referenced with Phase 5).
  - *Paras 18(g)–(h)*: environmental-integrity assessment — no net increase, conservative baselines, non-permanence-risk mitigation, leakage risk.
- **Sequencing: TER of the initial report before AEF actions are valid** (Draft -/CMA.5 paras 92–93 and related SBSTA 58/59 outcomes). Actions on the Agreed Electronic Format (issuance, first transfer, acquisition, use, cancellation) for a CA are reported against the initial-report submission; reviewers expect the initial report to have been submitted before AEF rows accumulate.
- **Revision on material change** (Dec 2/CMA.3 para 19). If the CA scope, duration, or environmental-integrity assessment changes materially, the Party must submit a revised initial report. A "published" initial report is therefore not immutable in principle — only after revision has itself been processed.

## Registry implementation

### Entity: `InitialReport`

`backend/services/libs/shared/src/entities/initial.report.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `reportId` | `string` (PK) | Format `IR-<n>` (e.g. `IR-001`); allocated by `CounterService.incrementCount(CounterType.INITIAL_REPORT, 3)`. |
| `cooperativeApproachId` | `string` | FK to `CooperativeApproach.cooperativeApproachId`. Not declared as a TypeORM relation — the service does a manual `findOneBy` in `generateDraft`. The one-IR-per-CA invariant is enforced at the service layer (see below), not by a DB UNIQUE constraint. |
| `status` | `enum InitialReportStatus` | Default `Draft`. |
| `participationDemonstration` | `jsonb` (nullable) | `{ isPartyToParisAgreement, hasNDC, hasTrackingArrangements, hasAuthorizationArrangements, countryCode }` — para 18(a)–(b). |
| `itmoMetrics` | `jsonb` (nullable) | `{ primaryMetric, nonGhgMetrics[] }` — para 18(c). `primaryMetric` defaults to `"tCO2e"`. |
| `caMethodDescription` | `text` (nullable) | Free-form prose describing the CA method — para 18(f). |
| `ndcQuantification` | `jsonb` (nullable) | `{ ndcTarget, baseYear, targetYear, sectors[], ghgs[] }` — para 18(e). |
| `cooperativeApproachDetails` | `jsonb` (nullable) | `{ title, participatingParties[], description, duration: {startDate, endDate}, expectedMitigation }` — para 18(d). |
| `environmentalIntegrity` | `jsonb` (nullable) | `{ noNetIncrease, conservativeBaselines, nonPermanenceRisk, leakageRisk }` — paras 18(g)–(h). |
| `generatedDocumentUrl` | `string` (nullable) | Reserved for a future PDF generation step. No endpoint writes to it today. |
| `createdTime`, `updatedTime` | `bigint` | Epoch ms; both set at generate time. `updatedTime` is refreshed by `PUT /update` and `PUT /submit`. |

### Enum

| Enum | Values | Source |
| --- | --- | --- |
| `InitialReportStatus` | `DRAFT = "Draft"`, `SUBMITTED = "Submitted"`, `PUBLISHED = "Published"` | `enum/initial.report.status.enum.ts` |

**On-wire values are PascalCase**, not the TypeScript SCREAMING_SNAKE keys — matching the Phase 5 convention (CaStatus, NdcType, CaMethod). The entity's `@Column` default is `InitialReportStatus.DRAFT` which persists the string `"Draft"`. The UI's `statusColors` map in `initialReportManagement.tsx` is keyed on the PascalCase values.

### Service logic

`InitialReportService` (`backend/services/libs/shared/src/initial-report/initial-report.service.ts`):

- **`generateDraft(dto, user)`** (lines 30–117):
  1. `findOneBy({ cooperativeApproachId: dto.cooperativeApproachId })` on `CooperativeApproach` — returns 400 Bad Request with message `initialReport.cooperativeApproachNotFound` if absent.
  2. `findOneBy({ cooperativeApproachId })` on `InitialReport` — returns **409 Conflict** with message "An initial report already exists for this cooperative approach. Use update instead." if one is already present. This is the one-IR-per-CA invariant.
  3. Allocate `reportId = "IR-<counter>"` via `CounterService` (3-digit left-padded counter).
  4. Pre-populate each of the five jsonb sections and `caMethodDescription` from either (a) the DTO if the caller supplied the field, or (b) a default that mixes in data from the linked CA (`title`, `participatingParties`, `description`, `startDate`, `endDate`, `expectedMitigationOutcomes`, `environmentalIntegrityAssessment`) and from `configService.get("systemCountry")`.
  5. `status = DRAFT`, persist, return `DataResponseDto(HttpStatus.CREATED, saved)`.
- **`update(dto, user)`** (lines 167–207):
  1. `findOneBy({ reportId })` → throws 404 (`initialReport.notFound`) if missing.
  2. Throws 400 "Published initial reports cannot be modified." if `status === PUBLISHED`. (No endpoint currently transitions into `PUBLISHED` — the guard exists but cannot be exercised through the HTTP surface. See Gaps.)
  3. Merges only the fields whose DTO value is `!== undefined`. **Important subtlety**: explicit `null` is NOT the same as `undefined` — an explicit `null` for a jsonb field assigns `null` to the column, which is how the submit-incomplete test path is set up.
  4. Refreshes `updatedTime`, persists, returns 200.
- **`submitReport(reportId, user)`** (lines 209–241):
  1. 404 if not found.
  2. Completeness check: builds a `missing[]` list by checking `participationDemonstration`, `itmoMetrics`, `ndcQuantification`, `cooperativeApproachDetails`, `environmentalIntegrity`. If any are falsy (null/undefined), throws 400 "Initial report is incomplete. Missing sections: <comma-list>". **`caMethodDescription` is NOT in the required list** (service line 222–227 enumerates five fields, not six) — a freshly generated IR with the default empty string passes the submit check.
  3. Sets `status = SUBMITTED`, refreshes `updatedTime`, persists. **There is no state-guard** — calling submit on an already-SUBMITTED row succeeds and updates `updatedTime` (see Gaps: "No state-machine enforcement").
- **`hasSubmittedReport(cooperativeApproachId)`** (lines 247–253): returns `true` iff a row exists with the given `cooperativeApproachId` **and** `status === SUBMITTED`. **This method is never called anywhere in the backend except from the controller's `/check` endpoint** — see Gaps.

### API endpoints

All paths are relative to `http://localhost:3000/national/initialReport/`.

| Method | Path | Body / Query | CASL action | Effective gate |
| --- | --- | --- | --- | --- |
| `POST` | `generate` | `InitialReportCreateDto { cooperativeApproachId, participationDemonstration?, itmoMetrics?, caMethodDescription?, ndcQuantification?, cooperativeApproachDetails?, environmentalIntegrity? }` | `Action.Create, InitialReport` | DNA Admin/Root + Ministry (Admin/Root). |
| `POST` | `query` | `QueryDto { page, size, filterAnd?, sort? }` | `Action.Read, InitialReport` (with `ex=true` -> applies ability condition to the query) | DNA + Ministry (any role including ViewOnly). |
| `GET` | `get?id=<reportId>` | — | `Action.Read, InitialReport` | DNA + Ministry (any role). |
| `PUT` | `update` | `InitialReportUpdateDto { reportId, ...same-as-create }` | `Action.Update, InitialReport` | DNA Admin/Root + Ministry (Admin/Root). |
| `PUT` | `submit?id=<reportId>` | — | `Action.Update, InitialReport` | DNA Admin/Root + Ministry (Admin/Root). |
| `GET` | `check?cooperativeApproachId=<caId>` | — | **`JwtAuthGuard` only — no PoliciesGuard** | Any authenticated user (DNA, Ministry, PD, IC, API). |

Guards: `JwtAuthGuard` + `PoliciesGuardEx(...)` for every handler except `check`, wired in `backend/services/src/national-api/initial-report.controller.ts`. CASL grants in `casl-ability.factory.ts`:

```ts
// DNA branch (lines 161-199)
can(Action.Read, InitialReport);
if (user.role !== Role.ViewOnly) {
  can(Action.Manage, InitialReport);
}

// Ministry branch (lines 201-226): identical shape.
// No other companyRole has an InitialReport rule.
```

PD (`PROJECT_DEVELOPER`) and IC (`INDEPENDENT_CERTIFIER`) receive HTTP 403 on generate/query/get/update/submit. The `/check` endpoint is **not CASL-gated** and a PD user can probe it freely — this is deliberate per the phase brief, since downstream issuance code is expected to call `/check` before minting the first authorization, but (see Gaps) that integration is not wired yet.

Status-code shape for success paths:

- `POST /generate` → `DataResponseDto(HttpStatus.CREATED, saved)`. Nest's default for `@Post` is 201.
- `POST /query` → `DataListResponseDto { data, total }`.
- `GET /get` / `PUT /update` / `PUT /submit` → `DataResponseDto(HttpStatus.OK, ...)`.
- `GET /check` → raw `{ hasSubmittedReport: boolean }` (no `DataResponseDto` wrapping).
- Not-found paths throw `HttpException(..., HttpStatus.NOT_FOUND)`.
- Missing CA on generate → `HttpStatus.BAD_REQUEST (400)`.
- Duplicate IR on generate → `HttpStatus.CONFLICT (409)`.

### UI

| Route | Component | Who sees it |
| --- | --- | --- |
| `/initialReports/viewAll` | `web/src/Pages/InitialReport/initialReportManagement.tsx` | Rendered for DNA + Ministry (sidebar entry gated by the same CASL read rule). The `Generate Report` button is additionally gated on `companyRole === DESIGNATED_NATIONAL_AUTHORITY` (`canCreate` at line 26). |
| `/initialReports/create` | `web/src/Pages/InitialReport/createInitialReport.tsx` | DNA only in practice (the page is the target of the "Generate Report" button). |

Routes are registered in `web/src/App.tsx` lines 193–207.

`initialReportManagement.tsx` columns:

| Column | Source | Formatter |
| --- | --- | --- |
| Report ID | `reportId` | raw |
| Cooperative Approach | `cooperativeApproachId` | raw |
| Status | `status` | colored Tag: Draft=default, Submitted=blue, Published=green |
| Created | `createdTime` | `new Date(Number(ts)).toLocaleDateString()` |

`createInitialReport.tsx` form:

| Field | Control | Span | Constraints |
| --- | --- | --- | --- |
| `cooperativeApproachId` | `Input` | 12 | required |
| `ndcTarget` | `Input` (parsed to Number) | 8 | optional |
| `baseYear` | `Input` (parsed to Number) | 8 | optional |
| `targetYear` | `Input` (parsed to Number) | 8 | optional |
| `sectors` | `Input` (comma-split) | 12 | optional |
| `caMethodDescription` | `TextArea` rows=4 | 24 | optional |

On submit the page POSTs `national/initialReport/generate` with only a subset of the backend's DTO (the UI wraps `ndcTarget`/`baseYear`/`targetYear`/`sectors` into a single `ndcQuantification` jsonb object with `ghgs: ["CO2"]` baked in) and navigates to `/initialReports/viewAll`. On failure an antd `message.error` is shown.

## Requirement -> implementation mapping

| UNFCCC content item (para 18) | jsonb section / field | Verified by |
| --- | --- | --- |
| 18(a)–(b) demonstration of Paris-Agreement participation, NDC, tracking and authorization arrangements | `participationDemonstration.{isPartyToParisAgreement, hasNDC, hasTrackingArrangements, hasAuthorizationArrangements, countryCode}` | `API: generate > pre-population: ...` (locks the default shape) and `API: generate > POST /generate with only cooperativeApproachId returns 201, ... all 5 jsonb sections non-null` |
| 18(c) ITMO metric(s) | `itmoMetrics.{primaryMetric, nonGhgMetrics[]}` | `API: generate > pre-population: ... itmoMetrics.primaryMetric=tCO2e` |
| 18(d) description of the cooperative approach | `cooperativeApproachDetails.{title, participatingParties[], description, duration, expectedMitigation}` | `API: generate > pre-population: cooperativeApproachDetails.title matches CA title ...` |
| 18(e) NDC quantification | `ndcQuantification.{ndcTarget, baseYear, targetYear, sectors[], ghgs[]}` | `API: update > PUT /update with partial fields merges ...` (round-trips ndcQuantification) and `API: generate > POST /generate with explicit jsonb overrides preserves supplied values` |
| 18(f) chosen corresponding-adjustment method | `caMethodDescription` (free-form text) — cross-refs Phase 5 `CaMethod` enum | `API: update > PUT /update with partial fields merges ...` (updates caMethodDescription); Phase 5 spec covers the enum itself |
| 18(g)–(h) environmental-integrity assessment | `environmentalIntegrity.{noNetIncrease, conservativeBaselines, nonPermanenceRisk, leakageRisk}` | `API: generate > pre-population: ... environmentalIntegrity.noNetIncrease` |
| Report must exist and be submitted before first ITMO authorization (para 18 chapeau) | `hasSubmittedReport(caId)` service method + `GET /check` endpoint | `API: check > GET /check ... before any IR exists returns { hasSubmittedReport: false }` and `API: check > GET /check after PUT /submit returns { hasSubmittedReport: true }`. See Gaps — the method exists but is not called anywhere in the authorization pipeline. |
| One-IR-per-CA invariant (implicit from the "initial" singular in para 18) | Service-layer duplicate check in `generateDraft` (lines 49–57) | `API: generate > POST /generate twice for the same cooperativeApproachId returns 409 Conflict` |
| Required-content validator before TER submission | `submitReport` completeness check (lines 222–234) | `API: submit > PUT /submit on a fully pre-populated Draft flips status to Submitted` and `API: submit > PUT /submit on an IR with a nulled required section returns 400 listing the missing field` |
| Draft-then-submit lifecycle | `InitialReportStatus` enum + `PUT /submit` handler | `API: submit > PUT /submit on a fully pre-populated Draft flips status to Submitted`, `Enum cardinality > InitialReportStatus has exactly 3 values` |
| DNA-only authorship of initial reports | CASL `Manage InitialReport` for DNA + Ministry | `Permissions > PD user cannot POST /generate` |
| Operator-facing UI for IR records | `/initialReports/viewAll` list + `/create` form | `UI: DNA flow > DNA user can navigate to /initialReports/viewAll ...`, `UI: DNA flow > DNA can open /initialReports/create and see the form controls` |
| Look up a single IR row and list them paginated | `GET /get?id=` and `POST /query` | `API: query and get > GET /get?id=<reportId> returns the IR row`, `... POST /query returns a paginated envelope {data, total}`, `... GET /get?id=NONEXISTENT returns 404` |

## Gaps / deviations

- ~~**CRITICAL: `hasSubmittedReport` is never called as a guard before ITMO authorization.**~~ **FIXED.** `programme.service.authorizeProgramme` now enforces Dec 2/CMA.3 Annex para 18 for any `article6trade` programme: (1) the programme must have a `cooperativeApproachId`, and (2) an `InitialReport` in status `Submitted` or `Published` must exist for that CA. The refusal returns HTTP 400 with an error message that explicitly cites the paragraph. Verified by the cross-cutting spec's "Authorizing a programme without a submitted IR ..." and "... WITH a submitted IR passes the para 18 gate" tests. The read-only `InitialReportService.hasSubmittedReport` probe still exists for UI gating, but the authoritative guard is now in `authorizeProgramme`.
- **`Published` status is unreachable through the HTTP API.** `InitialReportStatus.PUBLISHED` is declared, is honoured by the update edit-lock at service line 184 ("Published initial reports cannot be modified."), and is coloured green in the UI's `statusColors` map. But neither `submitReport` nor any other endpoint writes the value — the lifecycle stops at `Submitted`. A Party that wants to lock an IR as published has to mutate the DB directly. The spec's `PUT /update on a Published IR returns 400` test is marked `test.fixme` for this reason.
- **No TER (Article 6 Technical Expert Review) workflow.** The status enum stops at `Submitted/Published` — there is no `UNDER_REVIEW`, `REVIEWED`, `TER_PASSED`, `TER_REJECTED`. In UNFCCC terms, `Submitted` means "the Party has written the report" and `Published` would mean "the Party has locked the report for TER" — it does not mean "TER has concluded with no outstanding findings". A reviewer cannot tell from the stored row what stage of TER the IR is in, nor whether findings were issued against it.
- **No submit state-guard.** `InitialReportService.submitReport` unconditionally sets `status = SUBMITTED`. Re-submitting an already-`Submitted` IR succeeds silently (and refreshes `updatedTime`). There is no audit-trail row recording the transition, and no way to un-submit. The spec's "PUT /submit called twice is idempotent" test documents the current behaviour and accepts either 2xx (current idempotent behaviour) or 4xx (a future state-guard).
- **`caMethodDescription` is not in the completeness validator.** The submit check at lines 222–227 enumerates exactly five jsonb sections and omits `caMethodDescription`. A DNA Admin can submit an IR whose `caMethodDescription` is the default empty string (service line 84 assigns `""` when the DTO omits it). Decision 2/CMA.3 para 18(f) requires the CA method to be described — the registry does not enforce that requirement at submit time.
- **JSONB sections have no schema validation.** `participationDemonstration`, `itmoMetrics`, `ndcQuantification`, `cooperativeApproachDetails`, and `environmentalIntegrity` are typed `any` in both the DTO and the entity. The DTO validator `@IsOptional()` does nothing to check the shape. A caller could submit `{ ndcQuantification: "not-an-object" }` or `{ ndcQuantification: { ndcTarget: "seven hundred", baseYear: null } }` and the row will persist — the completeness validator only checks "not falsy", not "has the expected keys". The registry trusts whatever the DNA Admin writes, which in practice means TER reviewers will be the ones catching shape errors.
- **No revision workflow for material CA changes (Dec 2/CMA.3 para 19).** The entity has a single-row-per-CA model and the service enforces it with a 409 Conflict on duplicate generate. If the underlying `CooperativeApproach` changes materially (new party, extended duration, amended environmental-integrity assessment), there is no endpoint to spawn a "revision 2" of the IR — the only path is `PUT /update`, which overwrites the prior draft/submitted record in place with no version history. Audit reviewers cannot see the pre-revision shape.
- **Pre-population is a one-shot snapshot.** The service copies fields from the CA at generate time into `cooperativeApproachDetails` (title, participatingParties, description, startDate, endDate, expectedMitigationOutcomes) and into `environmentalIntegrity.noNetIncrease` (from `environmentalIntegrityAssessment`). Subsequent changes on the CA are not propagated to the IR — the IR becomes a stale copy. `GET /get` always returns the snapshot values, not the current CA values. Combined with the lack of revision workflow (above), this means an IR that was correct at TER time can silently drift from the underlying CA it describes.
- **`generatedDocumentUrl` is reserved but no PDF/document generation exists.** The column is nullable string. No endpoint writes to it, no service renders to PDF, no UI surfaces the field. The intent is clearly to eventually back an "export initial report PDF" feature, but that wiring is absent.
- **`POST /generate` does not record the authoring DNA user for authorship audits.** The service takes `user` but uses it only for (unused) audit-trail scaffolding — `report.createdTime`/`updatedTime` are set but no `createdBy` column is persisted. A future reviewer asking "which DNA Admin authored this IR" must cross-reference HTTP logs.
- **`PUT /update` does not check that the updater is the same DNA who generated the report.** Any DNA Admin/Root (or Ministry Admin/Root) can edit any IR. For a single-Party registry this is usually fine, but if a registry deployment is hosting multiple Party DNAs the update surface could allow cross-Party edits without the rule being visible in code.
- **CASL grants `Manage InitialReport` to `MINISTRY` as well as DNA.** The brief describes IR authorship as DNA-only, but the CASL factory (factory.ts lines 201–226) gives Ministry the same grants. A Ministry Admin can generate, update, submit, and read IRs. Whether that matches policy depends on the deployment; the UI gates the "Generate Report" button on `companyRole === DESIGNATED_NATIONAL_AUTHORITY` so Ministry users see the list but not the create button, but the API is open. Documented here rather than in the brief because the mismatch surfaced during review.
- **`GET /check` is not rate-limited and not CASL-gated.** Any authenticated user can probe `/check?cooperativeApproachId=<any>` and learn whether a submitted IR exists for any CA the caller names. The CA identifiers are short predictable strings (`CA<NNNN>` from Phase 1) so a motivated PD or IC user can enumerate. For a public registry this is not a confidentiality issue (CA existence is public); for a gated registry it could be. Documented as a deviation from the otherwise uniform CASL enforcement on adjacent endpoints.

## Test coverage

The Playwright spec is structured as one top-level describe (`Initial Report - Article 6.2`) with seven nested blocks:

- `API: generate` — 5 executing tests (201 response shape including `IR-<n>` regex and five non-null jsonb sections; pre-population correctness for `cooperativeApproachDetails.title`, `itmoMetrics.primaryMetric`, `participationDemonstration.*`, and `environmentalIntegrity.noNetIncrease`; explicit overrides preserved; missing-CA 400; duplicate-IR 409).
- `API: update` — 2 executing tests (partial-field merge preserves other sections and bumps `updatedTime`; 404 on missing `reportId`) and 1 `test.fixme` (`PUT /update` on a `Published` IR — deferred because no endpoint transitions into `Published`).
- `API: submit` — 4 executing tests (happy path `Draft -> Submitted`; incomplete-submit 400 with the missing-field name in the body — uses `test.skip` at runtime if the DTO layer rejects the explicit-null patch; 404 on missing `reportId`; re-submit tolerant test accepting 2xx or 4xx). The incomplete-submit test is counted as executing because the `test.skip` is a runtime guard, not a compile-time skip.
- `API: check` — 2 executing tests (false before any IR exists; false for a generated-but-not-submitted IR and true after `PUT /submit`). These anchor the `/check` endpoint's wire contract so that when a future phase wires the para-18 guard, its integration test can depend on a stable shape.
- `API: query and get` — 3 executing tests (`/query` paginated envelope, `/get` happy path, `/get` 404).
- `Enum cardinality` — 1 executing test (locks in the 3 `InitialReportStatus` values). A canary for silent enum renames.
- `Permissions` — 2 executing tests (PD cannot `POST /generate`; `GET /check` is reachable by any authenticated user per the JwtAuthGuard-only wiring). Both accept 401/403 for permission-denial paths.
- `UI: DNA flow` — 2 executing tests (viewAll list renders with the `Generate Report` button; create form exposes all six named fields and the `Generate Draft` submit button) and 1 `test.fixme` (full form submission driving antd Inputs and verifying the post-submit table row — deferred pending a stable post-navigation waiter).

Total: **23 tests**, of which **2 are `test.fixme`** (the Published-update edit-lock and the UI form-submission flow) and **21 execute** (one of which — the submit-incomplete-section test — carries a runtime `test.skip` guard in case the DTO layer rejects explicit null).

The spec creates a fresh `CooperativeApproach` per test via `createCooperativeApproach(apiDna, { title: "... ${uniqueSuffix()}" })` so the one-IR-per-CA invariant does not cause cross-test interference, except in the 409-conflict test which deliberately re-uses one CA for a second `POST /generate`.

## Running

```bash
npx playwright test tests/e2e/article6/initial-report.spec.ts
```
