# 04 - AEF Reporting Expansion (Article 6.2, Phase 4)

> **Phase commit**: `e74142295` - **Primary entity**: `AefActionsTableEntity`, `AefActionTypeEnum`, `AefReportTypeEnum` - **Test spec**: [`aef-reporting.spec.ts`](../../tests/e2e/article6/aef-reporting.spec.ts)

## UNFCCC requirement

The "Agreed Electronic Format" (AEF) is the structured reporting schema in which Parties engaging in Article 6.2 cooperative approaches report their ITMO activity to the UNFCCC secretariat. Phase 4 expands the registry's AEF coverage to the Article 6.2 annual-information obligations.

Key obligations relevant to Phase 4 of the registry:

- **Annual information submission** (Decision 2/CMA.3, Glasgow 2021, annex ch. IV, para 20). Each participating Party must submit an annual information report covering every action taken during the reporting year: authorization, first transfer, subsequent transfers, acquisition, use towards NDC, use for OIMP, voluntary cancellation and OMGE cancellation. The submission must include the ITMO serial numbers, the vintage, the sector, the activity type, and the participating Parties involved. The reporting cycle is a calendar year.
- **AEF table structure** (Decision 4/CMA.6 Annex II, Baku 2024 - "Common Reporting Tables"). The current AEF consists of **five structured tables**: (1) *Submission* — country and contact metadata, (2) *Authorizations* — one row per authorization event, (3) *Actions* — one row per ITMO lifecycle action during the reporting year, (4) *Holdings* — snapshot of current holdings at the end of the reporting year, (5) *Authorized Entities* — registry of entities authorized to hold/transact ITMOs on behalf of the Party. The Baku 2024 structure supersedes the earlier pilot formats introduced under Decision 2/CMA.3 and the SBSTA 58/59 draft tables referenced in Decision -/CMA.5.
- **Action-type catalogue for AEF rows** (Draft CMA.5 para 80, re-codified in Dec 4/CMA.6 Annex II). Each AEF *Actions* row must record one of: authorization, first transfer, subsequent transfer (acquisition side), retirement for NDC use, retirement for OIMP, voluntary cancellation, cancellation for OMGE. SOP contributions appear as an account transfer (not a separate action type).
- **Cooperative-approach linkage** (Dec 4/CMA.6 Annex II; Draft CMA.5 para 27(a)). Every AEF row must reference the cooperative approach under which the ITMO is issued via the `CA{NNNN}` unique identifier so that a reviewer can trace a row back to the authorization record.
- **Authorization purpose on every AEF row** (Dec 2/CMA.3 annex para 1(d)-(f)). `NDC`, `OIMP` or `Other purposes` must be recorded for every ITMO action — the purpose is set at authorization and preserved through transfers.
- **First-transfer identification** (Draft CMA.5 para 27(t), para 73). AEF rows must flag the first-transfer event distinctly from subsequent transfers, because corresponding-adjustment obligations fire at first transfer only.
- **Cumulative totals** (Dec 4/CMA.6 Annex II - Holdings and Actions tables both carry cumulative year-to-date columns). A reviewer must be able to compute the year-end holding balance from the published rows without needing the registry's private state.

## Registry implementation

### Extended entity: `AefActionsTableEntity`

`backend/services/libs/shared/src/entities/aef.actions.table.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | `int` (PK) | Auto-generated. |
| `creditBlockStartId` | `string` | First ITMO serial in the contiguous range this row covers. |
| `creditBlockEndId` | `string` | Last ITMO serial in the range. |
| `creditAmount` | `number` | Count of ITMOs in the range. |
| `vintage` | `string` | Extracted from the serial number. |
| `sector` | `string` | Project sector at authorization time (Energy, Agriculture, ...). |
| `sectoralScope` | `string` | Project sectoral scope. |
| `projectAuthorizationTime` | `bigint` | Epoch ms. |
| `authorizationId` | `string` | Authorization ID on the project. |
| `actionTime` | `bigint` | Epoch ms of the underlying `CreditBlocksEntity.txTime`. |
| `actionType` | `enum AefActionTypeEnum` | One of 11 values (see below). |
| `aquiringParty` | `string` | Acquiring party label; populated from `AEF.defaultAquiringParty` config or, for cross-border retirements, the retirement's `country`. |
| `cooperativeApproachId` | `string` (nullable) | **Phase 4.** Copied from `creditBlock.cooperativeApproachId`. |
| `acquiringPartyCountryCode` | `string` (nullable) | **Phase 4.** ISO country code; copied from `project.acquiringPartyCountryCode` at authorization, or `retireTransaction.country` for cross-border retirements. |
| `authorizationPurpose` | `enum AuthorizationPurpose` (nullable) | **Phase 4.** Copied from `creditBlock.authorizationPurpose`. |
| `isFirstTransfer` | `boolean` (default `false`) | **Phase 4.** `true` when `creditBlock.isNotTransferred && creditBlock.txType === TRANSFER`. |
| `cumulativeAmount` | `decimal` (nullable) | **Phase 4.** Reserved for cumulative year-to-date sum. See Gaps. |
| `reportingYear` | `int` (nullable) | **Phase 4.** `new Date(creditBlock.txTime).getFullYear()`. |
| `createdTime` | `bigint` | Epoch ms, set via `@BeforeInsert`. |

### Enums

| Enum | Values | Source |
| --- | --- | --- |
| `AefActionTypeEnum` (expanded, 11 values) | `AUTHORIZATION = "authorization"`, `FIRST_TRANSFER = "firstTransfer"`, `TRANSFER = "transfer"`, `ACQUISITION = "acquisition"`, `RETIRE = "retire"`, `CROSS_BOARDER_TRANSFER = "crossBoarderTransfer"`, `USE_TOWARDS_NDC = "useTowardsNDC"`, `USE_FOR_OIMP = "useForOIMP"`, `VOLUNTARY_CANCELLATION = "voluntaryCancellation"`, `OMGE_CANCELLATION = "omgeCancellation"`, `HOLDINGS_SNAPSHOT = "holdingsSnapshot"` | `enum/aef.action.type.enum.ts` |
| `AefReportTypeEnum` (3 values) | `HOLDINGS = "HOLDINGS"`, `ACTIONS = "ACTIONS"`, `ANNUAL_INFORMATION = "ANNUAL_INFORMATION"` | `enum/aef.report.type.enum.ts` |
| `ExportFileType` (2 values) | `XLSX = "xlsx"`, `CSV = "csv"` | `enum/export.file.type.enum.ts` |
| `AuthorizationPurpose` (3 values, defined Phase 1, consumed here) | `NDC = "UseTowardsNDC"`, `OIMP = "OtherInternationalMitigationPurposes"`, `OTHER = "OtherPurposes"` | `enum/authorization.purpose.enum.ts` |

Of the 11 `AefActionTypeEnum` entries, 4 existed before Phase 4 (`AUTHORIZATION`, `TRANSFER`, `RETIRE`, `CROSS_BOARDER_TRANSFER`) and 7 are new (`FIRST_TRANSFER`, `ACQUISITION`, `USE_TOWARDS_NDC`, `USE_FOR_OIMP`, `VOLUNTARY_CANCELLATION`, `OMGE_CANCELLATION`, `HOLDINGS_SNAPSHOT`).

### Transaction -> AEF action-type mapping

`AefReportManagementService.handleAefRecord(creditBlock, em)` is called from the programme-ledger whenever a `CreditBlocksEntity` row is written with `txType IN (ISSUE, TRANSFER, RETIRE)`. It derives the `AefActionsTableEntity.actionType` as follows:

| `CreditBlocksEntity.txType` | Branching condition | `actionType` |
| --- | --- | --- |
| `ISSUE` | — | `AUTHORIZATION` |
| `TRANSFER` | `creditBlock.isNotTransferred === true` | `FIRST_TRANSFER` (and `isFirstTransfer` is explicitly forced to `true`) |
| `TRANSFER` | `creditBlock.isNotTransferred === false` | `TRANSFER` |
| `RETIRE` | `txData.action === ACCEPT`, `retirementType === CROSS_BORDER_TRANSACTIONS` | `CROSS_BOARDER_TRANSFER` (also populates `aquiringParty` and `acquiringPartyCountryCode` from `retireTransaction.country`) |
| `RETIRE` | `txData.action === ACCEPT`, `retirementType === USE_TOWARDS_NDC` | `USE_TOWARDS_NDC` |
| `RETIRE` | `txData.action === ACCEPT`, `retirementType === USE_FOR_OIMP` | `USE_FOR_OIMP` |
| `RETIRE` | `txData.action === ACCEPT`, `retirementType === VOLUNTARY_CANCELLATIONS` | `VOLUNTARY_CANCELLATION` |
| `RETIRE` | `txData.action === ACCEPT`, `retirementType === OMGE_CANCELLATION` | `OMGE_CANCELLATION` |
| `RETIRE` | `txData.action === ACCEPT`, other `retirementType` | `RETIRE` |
| `RETIRE` | no `txData` (written via `retireToAccount`) | `RETIRE` |

Every record also captures `cooperativeApproachId`, `authorizationPurpose`, `acquiringPartyCountryCode`, `isFirstTransfer` and `reportingYear` per the rules above. `HOLDINGS_SNAPSHOT` and `ACQUISITION` are defined in the enum but **not** produced by `handleAefRecord` today (see Gaps).

### API endpoints

All paths are relative to `http://localhost:3000/national/reportsManagement/`.

| Method | Path | Body | CASL action | Effective gate |
| --- | --- | --- | --- | --- |
| `POST` | `queryAefRecords` | `QueryDto { page, size, filterAnd?, sort? }` | `Action.Read, ProjectEntity` (controller) + service-level DNA+(Admin/Root) check | DNA Admin/Root only |
| `POST` | `downloadAefReport` | `AefExportDto { reportType, fileType }` | `Action.Read, ProjectEntity` (controller) + service-level DNA+(Admin/Root) check | DNA Admin/Root only |

Guards: `JwtAuthGuard` + `PoliciesGuard` wired in `backend/services/src/national-api/reports.management.controller.ts`. The controller's CASL check is `ability.can(Action.Read, ProjectEntity)`, which every authenticated user passes (PD, IC, DNA all have `can(Action.Read, ProjectEntity)` rules in `casl-ability.factory.ts`). The real gate is a hand-rolled check inside `AefReportManagementService.queryAefRecords` and `.downloadAefReport`:

```ts
if (
  user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
  ![Role.Admin, Role.Root].includes(user.role)
) {
  throw new HttpException("aef.unauthorized", HttpStatus.UNAUTHORIZED);
}
```

Non-DNA or non-admin users therefore receive **HTTP 401** (not the 403 that a CASL-layer rule would emit).

`downloadAefReport` returns a JSON body of shape `{ url, outputFileName }` once the generated CSV/XLSX file is uploaded via the configured `FileHandler` (S3 or MinIO in deployed environments; local disk in dev). When the underlying table is empty, the service throws `HttpStatus.BAD_REQUEST` with message key `reportExport.nothingToExport` — the endpoint does not return an empty file.

### UI

| Route | Component | Who sees it |
| --- | --- | --- |
| `/reports` | `web/src/Pages/Reports/Reports.tsx` -> `web/src/Components/Reporting/ReportingComponent.tsx` | DNA Admin/Root only (sidebar entry gated in `web/src/Components/Sider/layout.sider.tsx` lines 98-117). |

The page renders:

- a year-picker (antd `DatePicker` with `picker="year"`) defaulting to the current year;
- a multi-select of report types (antd `Select mode="multiple"`), defaulting to both `ACTIONS` and `HOLDINGS` selected;
- for each selected report type, a `ReportCard` that shows the paginated preview plus two buttons: `Export AS EXCEL` (POSTs `/downloadAefReport` with `fileType=xlsx`) and `Export AS CSV` (`fileType=csv`).

Selecting a year fires `POST /queryAefRecords` with two `filterAnd` entries bounding `actionTime` to that year's `[startOf("year"), endOf("year")]` range. The HOLDINGS card additionally adds `{ key: "actionType", operation: "=", value: "authorization" }` to the filter.

`ANNUAL_INFORMATION` is defined in the backend enum and accepted by `POST /downloadAefReport`, but **is not wired into the UI's `REPORT_TYPES` enum** (`web/src/Components/Reporting/reportTypes.ts` only exports `ACTIONS` and `HOLDINGS`). It is reachable only via direct API.

## Requirement -> implementation mapping

| UNFCCC requirement | Implementation | Verified by |
| --- | --- | --- |
| AEF *Authorizations* table row per authorization event (Dec 4/CMA.6 Annex II) | `actionType === AUTHORIZATION` rows in `AefActionsTableEntity`, produced on `txType === ISSUE` | `API: queryAefRecords > POST /reportsManagement/queryAefRecords ...` |
| AEF *Actions* table row per lifecycle action (Dec 2/CMA.3 para 20; Dec 4/CMA.6 Annex II) | All 11 `AefActionTypeEnum` rows produced in `handleAefRecord`; `reportType: ACTIONS` download projects them | `API: downloadAefReport > ACTIONS × CSV round-trip`, `Enum shape > AefActionTypeEnum expanded to 11 values` |
| AEF *Holdings* snapshot at reporting period end (Dec 4/CMA.6 Annex II) | `reportType: HOLDINGS` download filters to `actionType=authorization`; UI HOLDINGS card ditto | `API: downloadAefReport > HOLDINGS × CSV`, `HOLDINGS × XLSX` |
| Annual information submission covering NDC year (Dec 2/CMA.3 para 20) | `reportType: ANNUAL_INFORMATION` download projects the same rows as `ACTIONS` with a different output filename | `API: downloadAefReport > ANNUAL_INFORMATION × CSV` |
| Cooperative approach link on every AEF row (Draft CMA.5 para 27(a)) | `AefActionsTableEntity.cooperativeApproachId`, copied from `creditBlock.cooperativeApproachId` | `API: queryAefRecords > ... returns a paginated envelope with the Phase 4 columns` |
| Authorization purpose on every AEF row (Dec 2/CMA.3 annex para 1(d)-(f)) | `AefActionsTableEntity.authorizationPurpose` | `API: queryAefRecords > ... Phase 4 columns` |
| First-transfer distinct from subsequent transfer (Draft CMA.5 para 27(t)) | `isFirstTransfer` boolean on `AefActionsTableEntity`; distinct `FIRST_TRANSFER` and `TRANSFER` action types | `Enum shape > AefActionTypeEnum expanded to 11 values`, `API: queryAefRecords > ... Phase 4 columns` |
| Acquiring-party identification for cross-border retirements (Draft CMA.5 para 27(r)) | `acquiringPartyCountryCode` column populated from either `project.acquiringPartyCountryCode` or `retireTransaction.country` for `CROSS_BOARDER_TRANSFER` rows | `API: queryAefRecords > ... Phase 4 columns` |
| Reporting-year scoping (Dec 2/CMA.3 para 20) | `reportingYear` derived from `new Date(creditBlock.txTime).getFullYear()`; UI page also filters on `actionTime` ranges by year | `API: queryAefRecords > ... Phase 4 columns` |
| Format choice CSV or XLSX (Dec 4/CMA.6 Annex II prescribes XLSX; CSV offered as operator convenience) | `ExportFileType { CSV, XLSX }`; XLSX uses the templates under `backend/services/libs/shared/src/templates/` | `Enum shape > ExportFileType supports exactly CSV + XLSX`, `API: downloadAefReport > HOLDINGS × XLSX round-trip` |
| DNA-only access to the AEF submission surface | Service-level check `companyRole === DNA && role IN (Admin, Root)` in both endpoints | `Permissions: AEF download is DNA-admin/root only > PD user cannot POST /downloadAefReport`, `IC user cannot POST /downloadAefReport`, `PD user cannot POST /queryAefRecords` |
| Input validation on export parameters | `AefExportDto` uses `@IsEnum(AefReportTypeEnum)` + `@IsEnum(ExportFileType)` | `API: downloadAefReport > rejects an invalid reportType`, `rejects an invalid fileType` |
| DNA-facing UI surface | `/reports` sidebar entry + `ReportingComponent` with per-card export buttons | `UI: /reports smoke > DNA user can navigate to /reports ...`, `... Export AS CSV and Export AS EXCEL buttons`, `... year picker and a report-type multi-select` |

## Gaps / deviations

- **Only 3 report types vs Dec 4/CMA.6 Annex II's 5 AEF tables.** The registry exposes `HOLDINGS`, `ACTIONS`, and `ANNUAL_INFORMATION` but offers no standalone export for the Baku-2024 *Submission* (country and contact metadata) and *Authorized Entities* tables. *Authorizations* is partially covered by filtering `ACTIONS` to `actionType=authorization` (the same filter used for `HOLDINGS`). A reviewer seeking a faithful AEF export would need to derive Submission and Authorized-Entities content from other parts of the registry — Submission information lives in the `AEF.*` config keys (`party`, `defaultAquiringParty`) read at export time, and the authorized-entities concept is not modeled at all (see below).
- **Submission (country + contact info) section of AEF is not captured anywhere.** The Baku 2024 AEF requires the Party name, contact point, and submission date on the Submission table. In this registry, the Party name is a single `AEF.party` config value; there is no submission-date tracking, no contact-point entity, and no operator-facing UI to edit them.
- **Authorized Entities (Draft CMA.5 para 27(s), Dec 4/CMA.6 Annex II) is not a separate table.** The registry's `Company` entity carries a `companyRole` enum but not a first-class "Authorized Entity" record with cooperative-approach scoping. Any authorization of an entity to hold/transact ITMOs is implicit in company permissions rather than recorded on the AEF.
- **`HOLDINGS_SNAPSHOT` enum value is unused by `handleAefRecord`.** The 11th `AefActionTypeEnum` entry is defined but no code path writes a row with that type. The `HOLDINGS` report instead projects `AUTHORIZATION` rows, which only represents the issuance-time snapshot — there is no mechanism to capture a point-in-time holdings snapshot after subsequent transfers. A Party filing a mid-year AEF would see only the ITMOs that were issued during the filter window, not the ITMOs actually held on the cutoff date.
- **`cumulativeAmount` is declared but not populated.** The column exists on `AefActionsTableEntity` but `handleAefRecord` never assigns a value, so every row has `cumulativeAmount = null`. Dec 4/CMA.6 Annex II requires cumulative year-to-date columns on both *Holdings* and *Actions*; this is not currently computable from the exported file without post-processing.
- **`ACQUISITION` action type is defined but not produced.** Phase 2's doc already flagged that the acquisition side of a transfer is not modeled as a distinct event (the registry writes one `TRANSFER` row on the source block, not a paired transfer+acquisition pair). Accordingly, the Baku 2024 AEF Actions table's `acquisition` rows are absent from this registry's output.
- **`reportingYear` is derived from `creditBlock.txTime`, not from an explicit reporting-year parameter.** `new Date(creditBlock.txTime).getFullYear()` assumes the AEF reporting year equals the calendar year of the action. For Parties whose reporting cycle is not the calendar year (or who wish to back-fill historical data into a different reporting year), this is not configurable.
- **`acquiringPartyCountryCode` population is partial.** The field is populated for `CROSS_BOARDER_TRANSFER` rows (from `retireTransaction.country`) and for `AUTHORIZATION` rows whose project carries `project.acquiringPartyCountryCode`. For ordinary `TRANSFER` / `FIRST_TRANSFER` / `USE_TOWARDS_NDC` / `USE_FOR_OIMP` rows it is either null or inherited from the project's static field — i.e., it does not reflect the actual transferee at the moment of transfer.
- **Service-level gate returns 401, not 403.** The CASL guard on the controller is satisfied by every authenticated user because every role has `can(Action.Read, ProjectEntity)`. The real DNA-admin/root gate is a hand-rolled `throw new HttpException("aef.unauthorized", HttpStatus.UNAUTHORIZED)` inside the service. Conventionally, an authenticated-but-unauthorized caller receives 403 Forbidden, not 401 Unauthorized — the current status code misleads clients that differentiate "needs login" from "needs different role".
- **`downloadAefReport` returns a file URL, not the file body.** The generated CSV/XLSX is written to disk, uploaded via `FileHandler.uploadFile("documents/exports/..." )`, and the response body is `{ url, outputFileName }`. In deployed environments this URL points at S3/MinIO and requires the caller to perform a second HTTP fetch, potentially with its own auth. A Playwright test that wants to inspect the row content must follow the redirect and, depending on bucket policy, may not be able to reach the file without AWS credentials. The phase-4 spec therefore asserts file-metadata shape rather than parsing the exported rows.
- **`downloadAefReport` on an empty table throws 400 `nothingToExport`.** There is no empty-file success path. A DNA admin who opens a fresh registry will see an error toast rather than a zero-row AEF — a confusing UX for the "no activity this year" case, which is a legal possibility the AEF format is designed to express.
- **`ANNUAL_INFORMATION` is not exposed in the UI.** `web/src/Components/Reporting/reportTypes.ts` hardcodes `REPORT_TYPES = { ACTIONS, HOLDINGS }`. The Annual Information export (the one variant that maps most directly onto Dec 2/CMA.3 para 20's annual obligation) is only reachable via API.
- **CSV generation is hand-rolled string concatenation.** `AefReportManagementService.generateCsvOrExcel` builds the CSV via `Object.values(item)` wrapped in double quotes joined by commas. It does not escape embedded quotes or commas in string fields. Any free-text field containing `,` or `"` (for example a project description included in a future export extension) will break the CSV structure. The XLSX path uses ExcelJS and is unaffected.
- **XLSX template path is fragile.** `fillTemplate` resolves the template with `path.resolve(__dirname, "shared", "src", "templates", templateName)`. This works in dev (unbundled) but depends on preserving the `shared/src/templates/` prefix through the build output; the repo has both `.build/` and `dist/` copies of the templates, but a future repack that flattens the directory layout would silently break XLSX export.
- **No integration-level assertion on AEF row contents.** The full chain "issue credits -> `handleAefRecord` writes a row -> `queryAefRecords` returns it with the Phase 4 columns populated" requires a credit-issuance fixture (same blocker as Phase 2 and Phase 3). The spec covers the query/download endpoints and the enum shape but defers content-level assertions as `test.fixme` (see Test coverage below).

## Test coverage

The Playwright spec is structured as one top-level describe (`AEF Reporting - Article 6.2`) with five nested blocks:

- `API: queryAefRecords` — 1 executing test: POST returns a paginated envelope and any returned row carries Phase 4 columns of the expected types.
- `API: downloadAefReport` — 6 executing tests (HOLDINGS × CSV, ACTIONS × CSV, ANNUAL_INFORMATION × CSV, HOLDINGS × XLSX round-trips, invalid-reportType rejection, invalid-fileType rejection) and 2 `test.fixme` entries documenting the file-body assertions that require either file-fetch access or a credit-issuance fixture.
- `Enum shape` — 3 executing tests locking in the 11 `AefActionTypeEnum` values, the 3 `AefReportTypeEnum` values, and the 2 `ExportFileType` values.
- `Permissions: AEF download is DNA-admin/root only` — 3 executing tests: PD cannot download, IC cannot download, PD cannot query. All three accept 401 or 403 since the service raises 401 where one might expect 403.
- `UI: /reports smoke` — 3 executing tests: DNA user reaches `/reports` without redirect, the page renders `Export AS CSV` + `Export AS EXCEL` buttons, and the page exposes a year-picker plus a report-type multi-select.

Total: 18 tests, of which 2 are `test.fixme` (deferred pending a credit-issuance fixture or HTTP-reachable upload URL) and 16 execute. The spec is read-only; `uniqueSuffix()` is retained only for the two invalid-parameter tests, where injecting a unique marker helps correlate a specific failure to a specific request in server logs.

## Running

```bash
npx playwright test tests/e2e/article6/aef-reporting.spec.ts
```
