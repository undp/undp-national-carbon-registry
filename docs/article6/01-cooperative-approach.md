# 01 - Cooperative Approach (Article 6.2, Phase 1)

> **Phase commit**: `3495767b8` - **Primary entity**: `CooperativeApproach` - **Test spec**: [`cooperative-approach.spec.ts`](../../tests/e2e/article6/cooperative-approach.spec.ts)

## UNFCCC requirement

Under Article 6.2 of the Paris Agreement, Parties engaging in cooperative approaches that result in internationally transferred mitigation outcomes (ITMOs) must meet the guidance set out in **Decision 2/CMA.3** (Glasgow, 2021) and elaborated in **Draft Decision -/CMA.5** (SBSTA 59, Dubai 2023).

Key obligations relevant to Phase 1 of the registry:

- **Participation responsibilities** (Dec 2/CMA.3 annex ch. II, paras 3-5). Each participating Party must be a Party to the Paris Agreement, maintain an NDC under Article 4.2, and have arrangements in place for authorizing ITMO use and for tracking ITMOs (para 4(a)-(d)). Participation requirements must be demonstrable in the Initial Report (para 18(a)).
- **Unique identification of the cooperative approach** (Draft CMA.5 paras 4-13). Each cooperative approach must be uniquely identified by a secretariat-assigned ID of the form `CA{NNNN}`, with `CA0001` reserved for the Article 6.4 mechanism. At minimum, the cooperative approach must record its participants (including at least one first-transferring Party) and its modality (project-based, sectoral, subnational/national, ETS linkage, or other).
- **Authorization content** (Draft CMA.5 para 27). The authorization associated with a cooperative approach must at minimum contain: unique CA identifier (27(a)), name and parameters (27(b)), participating Parties (27(c)), registries involved (27(d)), activity types (27(e)), metrics and units (27(f)-(g)), authorization types (27(h)), sectors (27(i)), account types (27(j)), action/transaction types (27(k)), adaptation and OMGE contributions (27(l)-(m), bracketed), date and duration of authorization (27(n)-(o)), revocation conditions (27(p)), authorizing Party (27(q)), authorized entity arrangements (27(r)-(s)), first-transfer definition (27(t)), and a narrative description including NDC/LT-LEDS fit and environmental integrity treatment (27(u)(i)-(viii)).
- **Authorization purpose** (Dec 2/CMA.3 annex para 1). ITMOs may be authorized for use towards an NDC ("NDC"), for other international mitigation purposes ("OIMP" - e.g. CORSIA), or for "other purposes" (OP).
- **Environmental integrity and NDC linkage** (Dec 2/CMA.3 annex para 18(h)). The cooperative approach must include an assessment of environmental integrity and a link to the host Party's NDC.

## Registry implementation

### Entity

`backend/services/libs/shared/src/entities/cooperative.approach.entity.ts`

| Field | Type | Notes |
| --- | --- | --- |
| `cooperativeApproachId` | `string` (PK) | Auto-assigned `CA-<n>` via `CounterService` (3-digit padded, e.g. `CA-001`). |
| `title` | `string` | Required. |
| `participatingParties` | `varchar[]` | Required, `@ArrayMinSize(1)`. Country codes. |
| `hostParty` | `string` | Required. Country code. |
| `description` | `text` | Optional. |
| `startDate` | `bigint` | Epoch ms, optional. |
| `endDate` | `bigint` | Epoch ms, optional. |
| `expectedMitigationOutcomes` | `text` | Optional. |
| `environmentalIntegrityAssessment` | `text` | Optional. |
| `ndcLink` | `text` | Optional; URL or reference to host NDC. |
| `authorizationDocumentUrl` | `string` | Optional; URL reference only - no file upload. |
| `status` | `enum CooperativeApproachStatus` | Default `Draft`. |
| `createdTime` | `bigint` | Epoch ms, auto. |
| `updatedTime` | `bigint` | Epoch ms, auto. |

### Enums

| Enum | Values |
| --- | --- |
| `CooperativeApproachStatus` (`enum/cooperative.approach.status.enum.ts`) | `DRAFT = "Draft"`, `ACTIVE = "Active"`, `SUSPENDED = "Suspended"`, `COMPLETED = "Completed"` |
| `AuthorizationPurpose` (`enum/authorization.purpose.enum.ts`) | `NDC = "UseTowardsNDC"`, `OIMP = "OtherInternationalMitigationPurposes"`, `OTHER = "OtherPurposes"` |

`AuthorizationPurpose` is defined in Phase 1 but is consumed by credit-block authorization in Phase 2 - it does not sit on the `CooperativeApproach` entity itself.

### API endpoints

All paths are relative to `http://localhost:3000/national/`.

| Method | Path | Body | CASL action | Role gate |
| --- | --- | --- | --- | --- |
| `POST` | `cooperativeApproach/create` | `CooperativeApproachCreateDto` | `Action.Create` | DNA (Admin/Root/Manager), Ministry |
| `POST` | `cooperativeApproach/query` | `QueryDto { page, size, filterAnd?, sort? }` | `Action.Read` | Any authenticated (read-subject) user |
| `GET` | `cooperativeApproach/get?id=<caId>` | - | `Action.Read` | Any authenticated (read-subject) user |
| `PUT` | `cooperativeApproach/update` | `CooperativeApproachUpdateDto` | `Action.Update` | DNA, Ministry |

Guards: `JwtAuthGuard` + `PoliciesGuardEx` in `backend/services/src/national-api/cooperative-approach.controller.ts`. Read-only roles: PD, IC, DNA ViewOnly.

### UI routes

| Route | Component | Who sees it |
| --- | --- | --- |
| `/cooperativeApproaches/viewAll` | `web/src/Pages/CooperativeApproaches/cooperativeApproaches.tsx` | All authenticated users with read access. |
| `/cooperativeApproaches/add` | `web/src/Pages/CooperativeApproaches/addCooperativeApproach.tsx` | DNA / Ministry only (Add New button gated by `canCreate`). |
| `/cooperativeApproaches/view/:id` | `web/src/Pages/CooperativeApproaches/cooperativeApproachDetails.tsx` | All with read; only DNA / Ministry see the editable status dropdown and Edit button. |

### Sidebar nav

`Cooperative Approaches` - key `cooperativeApproaches/viewAll`, icon `GlobalOutlined` (see `web/src/Components/Sider/layout.sider.tsx`).

## Requirement -> implementation mapping

| UNFCCC requirement | Implementation | Verified by |
| --- | --- | --- |
| Uniquely identify the cooperative approach (Draft CMA.5 para 12, `CA{NNNN}`) | `cooperativeApproachId` PK generated as `CA-<n>` via `CounterService` | `API: CRUD > POST /create with minimal required fields` |
| Human-readable name for the approach (Draft CMA.5 para 27(b)) | `title` field, `@IsNotEmpty` | `API: CRUD > POST /create ...`, `UI: DNA flow > full UI create flow` |
| Identify participating Parties, at least one first-transferring Party (Draft CMA.5 para 4, para 27(c)) | `participatingParties: string[]`, `@ArrayMinSize(1)` | `API: CRUD > POST /create missing participatingParties is rejected` |
| Distinguish the host / authorizing Party (Draft CMA.5 para 27(q)) | `hostParty` field, required | `API: CRUD > POST /create ...` |
| Lifecycle status (Dec 2/CMA.3 annex para 18 - approach moves from authorization draft to active through BTR cycle) | `CooperativeApproachStatus` enum, default `Draft` | `API: CRUD > status lifecycle DRAFT -> ACTIVE -> SUSPENDED -> COMPLETED`, `UI: DNA flow > DNA changes status` |
| Link to host-Party NDC (Dec 2/CMA.3 annex para 18(h), Draft CMA.5 para 27(u)(iii)) | `ndcLink` text field | *(form field and details view - no dedicated assertion; covered by Requirement-mapping inspection.)* |
| Authorization purpose NDC / OIMP / OP (Dec 2/CMA.3 annex para 1(d)(f)) | `AuthorizationPurpose` enum - applied to credit blocks, not to the CA entity | *(covered in Phase 2 doc, ITMO lifecycle)* |
| Environmental integrity assessment (Dec 2/CMA.3 annex para 18(h), Draft CMA.5 para 27(u)(iv)-(v)) | `environmentalIntegrityAssessment` text field | *(form field exercised in UI create flow; no independent assertion beyond round-trip)* |
| Expected mitigation outcomes (Draft CMA.5 para 27(b), (u)(vii)) | `expectedMitigationOutcomes` text field | *(form field, round-tripped via create + query)* |
| Authorization document (Draft CMA.5 para 27(a)-(u) - authorization record) | `authorizationDocumentUrl` string (URL only) | *(stored/returned by entity; see Gaps)* |
| Duration of authorization (Draft CMA.5 para 27(o)) | `startDate` / `endDate` (epoch ms) | *(stored; not asserted separately)* |

## Gaps / deviations

- **`CA{NNNN}` format vs implemented `CA-<n>`**. Draft CMA.5 para 12 specifies a secretariat-assigned ID shaped `CA0001`. The registry generates `CA-001`, `CA-002`, ... via `CounterService` with an inserted hyphen. Functionally equivalent (sequential, zero-padded) but not byte-identical to the CMA.5 specification. `CA0001` is also not reserved for the Article 6.4 mechanism in this local issuance scheme.
- **Modality is not a structured field**. Draft CMA.5 para 6 requires the modality to be one of: project-based, sectoral, subnational/national, ETS linkage, or other. The current entity has no `modality` column; any such classification lives only inside the free-text `description`.
- **First-transferring Party is not distinguished**. `participatingParties: string[]` is an unordered array. Draft CMA.5 para 5 requires that at least one participant be classified as a first-transferring Party vs. a Party cooperating on NDC implementation.
- **Authorization content list (Draft CMA.5 para 27(a)-(u)) is only partially captured**. Activity types, metrics/units, account types, transaction types, sectors, first-transfer definition, revocation conditions, authorizing-Party details, authorized entities, GHGs covered - these are not modelled as structured fields on `CooperativeApproach`. Most are captured downstream on credit blocks, ITMO transactions, or the Initial Report (Phases 2, 5, 6).
- **Authorization document is a URL string, not a file upload**. `authorizationDocumentUrl` accepts any string; the registry does not host the authorization letter itself.
- **No enforced minimum length on `participatingParties` at the UI layer**. The backend DTO enforces `@ArrayMinSize(1)`; the frontend form uses `required: true` on the antd `Select` but does not independently assert a length >= 1 before submit.
- **Status lifecycle is free-form**. Any status -> any status transition is permitted by `PUT /update`. Draft CMA.5 does not prescribe a strict automaton, but a future hardening might enforce e.g. `Completed` as terminal.
- **Status values are capitalized enum string values** (`"Draft"`, `"Active"`, ...), not screaming-snake enum keys. Clients must use the string values.
- **`authorizationDocumentUrl` is set on create only via `CooperativeApproachCreateDto` / on update via `CooperativeApproachUpdateDto`**, but the add/edit form does not currently expose a field for it. It is reachable only through the API.

## Test coverage

The Playwright spec is structured as one top-level describe (`Cooperative Approach - Article 6.2`) with three nested blocks:

- `API: CRUD` - 7 tests covering create happy path (ID shape + DRAFT default), create validation rejection, get/get-404, query pagination, update happy path, update-404, and the full DRAFT -> ACTIVE -> SUSPENDED -> COMPLETED status walk.
- `UI: DNA flow` - 4 tests: sidebar -> list with Add New visible for DNA, end-to-end create through the antd form, row click -> details page, and DNA-driven status change via the antd Select dropdown.
- `Permissions: PD is read-only` - 2 tests: PD sees the list but not the Add New button, and PD `POST /create` is blocked by CASL (403).

Total: 13 tests. Every mutating test derives a unique `title` via `uniqueSuffix()` for parallel safety.

## Running

```bash
npx playwright test tests/e2e/article6/cooperative-approach.spec.ts
```
