# 07 - Cross-cutting Integration & CASL (Article 6.2, Phase 7)

> **Phase commit**: cross-cutting synthesis of Phases 1-6 - **Primary entities**: all (`CooperativeApproach`, `InitialReport`, `CorrespondingAdjustment`, `AefActionsTableEntity`, `CreditTransaction`) - **Test spec**: [`cross-cutting.spec.ts`](../../tests/e2e/article6/cross-cutting.spec.ts)

## UNFCCC requirement

Article 6.2 is a **sequenced reporting pipeline**, not a set of independent features. Decision 2/CMA.3 (Glasgow, 2021) and Draft -/CMA.5 (SBSTA 59, Dubai) establish a strict ordering that each participating Party must follow:

1. **Participation** (Dec 2/CMA.3 annex chapter II, paras 3-5) — Party to the Paris Agreement, has an NDC, has tracking + authorization arrangements in place.
2. **Cooperative approach authorization** (Draft -/CMA.5 paras 4-13, 27) — uniquely identified as `CA{NNNN}`, participants listed, authorization content per para 27(a)-(u).
3. **Initial report** (Dec 2/CMA.3 annex chapter V, para 18) — submitted BEFORE the first ITMO authorization under the CA. The initial report must cover paras 18(a)-(i) on participation, metric, CA description, NDC quantification, CA method, and environmental integrity.
4. **First ITMO authorization** (Dec 2/CMA.3 para 1, Draft -/CMA.5 para 27(h)) — authorized for `UseTowardsNDC`, `OtherInternationalMitigationPurposes`, or `OtherPurposes`; the authorization references the CA and the submitted initial report.
5. **ITMO lifecycle** (Dec 2/CMA.3 para 6) — issuance -> first transfer -> transfer / acquisition -> use / cancellation, each action recorded with a timestamped AEF row.
6. **Annual AEF reporting** (Dec 2/CMA.3 para 20, Draft -/CMA.5 para 91 9-step flow, Dec 4/CMA.6 annex II) — the Agreed Electronic Format table is produced annually and covers all ITMO actions for the reporting year.
7. **Corresponding adjustment** (Dec 2/CMA.3 para 7-8) — the national greenhouse gas inventory is adjusted by `firstTransferred - acquired + usedTowardsNDC` so that accounting does not double-count.
8. **TER (Article 6 Technical Expert Review)** (Dec 2/CMA.3 annex chapter VII, Draft -/CMA.5 paras 92-93) — each initial report and each annual information submission is reviewed by the secretariat's Article 6 experts.
9. **Serial-number immutability** (Draft -/CMA.5 para 132) — each issued ITMO carries a stable unique identifier (serial number) that persists across first-transfer, transfer, retirement, cancellation, and TER review.
10. **Revision and revocation** (Dec 2/CMA.3 para 19, Draft -/CMA.5 paras 20-21) — if CA scope, duration, or environmental-integrity assessment changes materially, the Party must submit a revised initial report; cooperative approaches may be revoked under specific conditions.

Cross-cutting properties that the registry must honour across all of these steps:

- **Role separation of duties** — only a Designated National Authority (DNA) may author CAs, initial reports, and corresponding adjustments. Project Developers (PDs) and Independent Certifiers (ICs) are read-only on these artefacts. Ministry staff have a role somewhere between DNA and "observer" depending on the national setup.
- **Double-counting prevention** — ITMO totals in the AEF, in the corresponding-adjustment calculation, and in any holdings snapshot must reconcile. A unit cannot appear on two ledgers simultaneously.
- **Data integrity** — once an artefact is submitted or published, downstream consumers (TER reviewers, other Parties) must see a stable record. Editing a CA after the initial report has been submitted cannot silently mutate the IR's view of the CA.
- **Authorship audit** — every mutation must be attributable to a specific user. In practice the registry does not yet enforce this at the row level, but it is a cross-cutting requirement called out in the Gaps section below.

## Registry implementation

### Phase summary

| Phase | Feature | Key entities | Key endpoints | Spec |
| --- | --- | --- | --- | --- |
| 1 | Cooperative Approach | `CooperativeApproach`, `CooperativeApproachStatus` | `POST /national/cooperativeApproach/{create,query,update}`, `GET /get` | [01-cooperative-approach.md](./01-cooperative-approach.md) |
| 2 | ITMO lifecycle & account types | `CreditTransaction`, `AccountType`, `CreditRetirementType` | `GET /credit/*`, `POST /programmeSl/retireRequest`, various UI | [02-itmo-lifecycle.md](./02-itmo-lifecycle.md) |
| 3 | OMGE / SOP deductions | `CreditBlock.omgeQuantity,sopQuantity` | Indirect (service-layer on issuance) | [03-omge-sop-deductions.md](./03-omge-sop-deductions.md) |
| 4 | AEF reporting | `AefActionsTableEntity` | `POST /national/reportsManagement/queryAefRecords`, `POST /downloadAefReport` | [04-aef-reporting.md](./04-aef-reporting.md) |
| 5 | Corresponding adjustment | `CorrespondingAdjustment`, `CaStatus`, `CaMethod`, `NdcType` | `POST /national/correspondingAdjustment/{calculate,query,submit}`, `GET /get` | [05-corresponding-adjustment.md](./05-corresponding-adjustment.md) |
| 6 | Initial report | `InitialReport`, `InitialReportStatus` | `POST /national/initialReport/{generate,query,update,submit}`, `GET /{get,check}` | [06-initial-report.md](./06-initial-report.md) |

### How the phases chain together in `cross-cutting.spec.ts`

The flagship end-to-end test walks the canonical Article 6.2 sequence in one Playwright worker:

1. `createCooperativeApproach(apiDna, ...)` — Phase 1 factory. Returns `{ cooperativeApproachId: "CA-<n>", title, raw }`.
2. `generateInitialReport(apiDna, { cooperativeApproachId })` — Phase 6 factory. Returns `{ reportId: "IR-<n>", raw }` with all five jsonb sections pre-populated from the CA.
3. `GET /national/initialReport/check?cooperativeApproachId=<id>` — Phase 6 probe. Returns `{ hasSubmittedReport: false }` before submit, `{ hasSubmittedReport: true }` after.
4. `submitInitialReport(apiDna, reportId)` — Phase 6 factory. Flips `status: "Draft"` -> `"Submitted"`.
5. `calculateCorrespondingAdjustment(apiDna, { year, cooperativeApproachId, ndcType, caMethod })` — Phase 5 factory. Allocates `caId: "CA-ADJ-<n>"`, status `"Draft"`, with `emissionsBalance = firstTransferred - acquired + usedTowardsNDC` computed over `CreditTransactions` scoped to the given `cooperativeApproachId` + `year` pair.
6. `queryCooperativeApproaches(apiDna, ...)`, `POST /national/initialReport/query`, `POST /national/correspondingAdjustment/query` — read-back confirmations that each written row is visible through the audit / list surfaces.
7. `POST /national/reportsManagement/downloadAefReport { reportType: "HOLDINGS", fileType: "csv" }` — Phase 4 export. Returns `{ url, outputFileName }` on a seeded DB, `400 "nothingToExport"` on a fresh DB; either outcome is accepted.

That single test chains **seven HTTP calls across five features** (CA, IR, CA-check, CA-ADJ, AEF). A minimum of five is required for a "flagship" integration test; the flagship here exceeds that bound.

### The `/check` endpoint: what it is for

`GET /national/initialReport/check?cooperativeApproachId=<id>` is the only endpoint exposed as a **pure sequencing probe**. Its response is the bare `{ hasSubmittedReport: boolean }` — not the usual `DataResponseDto` wrapping. The handler is guarded by `JwtAuthGuard` only; any authenticated role can call it.

The INTENDED wiring is:

```
issueFirstItmoAuthorization(caId)
  -> hasSubmittedReport(caId)  // checked inside the authorization service
  -> if false, reject with 400 initialReportMissing
  -> else proceed
```

The ACTUAL wiring is:

```
issueFirstItmoAuthorization(caId)
  -> [no check]
  -> proceed
```

`hasSubmittedReport` is declared in `InitialReportService` and exposed through `/check`, but the registry does not call it from any authorization code path. See the Gaps section — this is the most serious UNFCCC deviation in the current codebase.

## CASL permission matrix

Actual observed behaviour from `cross-cutting.spec.ts` plus the per-phase specs and `casl-ability.factory.ts`. "Allow" = 2xx; "Deny" = 401 or 403 (service-layer or CASL-layer); "Probe" = JwtAuthGuard-only (any authenticated role succeeds).

| Feature / Endpoint | DNA Admin | DNA ViewOnly | Ministry Admin | PD Admin | IC Admin | API User |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /cooperativeApproach/create` (Phase 1) | Allow | Deny | Allow | Deny (403) | Deny (403) | Deny |
| `POST /cooperativeApproach/query` (Phase 1) | Allow | Allow (Read) | Allow | Allow (Read) | Allow (Read) | Deny |
| `PUT /cooperativeApproach/update` (Phase 1) | Allow | Deny | Allow | Deny | Deny | Deny |
| `GET /cooperativeApproach/get` (Phase 1) | Allow | Allow (Read) | Allow | Allow (Read) | Allow (Read) | Deny |
| `POST /initialReport/generate` (Phase 6) | Allow | Deny | Allow (!) | Deny (403) | Deny (403) | Deny |
| `POST /initialReport/query` (Phase 6) | Allow | Allow (Read) | Allow | Deny | Deny | Deny |
| `GET /initialReport/get` (Phase 6) | Allow | Allow (Read) | Allow | Deny | Deny | Deny |
| `PUT /initialReport/update` (Phase 6) | Allow | Deny | Allow (!) | Deny | Deny | Deny |
| `PUT /initialReport/submit` (Phase 6) | Allow | Deny | Allow (!) | Deny | Deny | Deny |
| `GET /initialReport/check` (Phase 6) | Probe | Probe | Probe | Probe | Probe | Probe |
| `POST /correspondingAdjustment/calculate` (Phase 5) | Allow | Deny | Allow | Deny (403) | Deny (403) | Deny |
| `POST /correspondingAdjustment/query` (Phase 5) | Allow | Allow (Read) | Allow | Deny | Deny | Deny |
| `GET /correspondingAdjustment/get` (Phase 5) | Allow | Allow (Read) | Allow | Deny | Deny | Deny |
| `PUT /correspondingAdjustment/submit` (Phase 5) | Allow | Deny | Allow | Deny | Deny | Deny |
| `POST /reportsManagement/queryAefRecords` (Phase 4) | Allow | Deny (service) | Deny (service) | Deny (401 service) | Deny (401 service) | Deny |
| `POST /reportsManagement/downloadAefReport` (Phase 4) | Allow | Deny (service) | Deny (service) | Deny (401 service) | Deny (401 service) | Deny |

Legend:
- **Allow** — CASL rule grants `Manage` or `Read` on the relevant subject; endpoint returns 2xx.
- **Deny (403)** — CASL `PoliciesGuardEx` rejects before the handler runs.
- **Deny (401 service)** — CASL rule permits read access, but the AEF service re-checks `companyRole=DNA AND role in {Admin, Root}` and throws `HttpStatus.UNAUTHORIZED` from inside the handler.
- **Probe** — only `JwtAuthGuard` is configured; any authenticated role succeeds with `{ hasSubmittedReport: boolean }`.
- **!** — deviation from the phase brief (see Gaps).

Ministry coverage is by reading `casl-ability.factory.ts` lines 201-226, not by executing the endpoint — `users.csv` does not seed a `GOVERNMENT` user. The cross-cutting spec marks Ministry as `test.fixme` for the same reason. DNA ViewOnly coverage is identical: the role exists in the enum but is not seeded.

## Sequencing invariants

This table is the cross-cutting audit of whether the registry enforces each UNFCCC sequencing rule. "Registry enforcement" is "yes" only if there is a code path that blocks the out-of-order action. Read-only probes (e.g. `/check`) are listed separately.

| UNFCCC requirement | Registry enforcement | Test coverage |
| --- | --- | --- |
| Participation demonstrated before CA authorization (Dec 2/CMA.3 para 3-5) | No explicit guard; `participationDemonstration` captured inside the IR's jsonb, not validated at CA create time | N/A (not a gate) |
| CA uniquely identified as `CA{NNNN}` (Draft -/CMA.5 paras 4-13) | Yes — `CounterService.incrementCount(CounterType.COOPERATIVE_APPROACH, 3)` allocates a sequential ID | `Data integrity > PUT /update ignores attempts to rewrite cooperativeApproachId` |
| **Initial report submitted before first ITMO authorization (Dec 2/CMA.3 para 18)** | **NO — `hasSubmittedReport` is declared but never called as a guard. CRITICAL GAP.** | `Sequencing invariants > Issuing the first ITMO authorization ... must be blocked` is `test.fixme` with citation; `/check endpoint accurately reports hasSubmittedReport transition` covers the probe wiring |
| One-IR-per-CA (implicit from para 18 "initial" singular) | Yes — service-layer duplicate check returns 409 | `Data integrity > second POST /generate for the same CA returns 409` (and the per-phase 409 test) |
| Initial report completeness before TER (Dec 2/CMA.3 para 18(a)-(i)) | Partial — `submitReport` validates 5 of the 6 required sections; `caMethodDescription` is NOT in the completeness validator | Per-phase spec `API: submit > PUT /submit on an IR with a nulled required section returns 400` |
| Corresponding adjustment arithmetic = first - acquired + used (Dec 2/CMA.3 para 8) | Yes | Per-phase spec `API: calculate > emissionsBalance = firstTransferred - acquired + usedTowardsNdc` |
| Corresponding adjustment scoped by CA (Dec 2/CMA.3 para 7) | Yes — `cooperativeApproachId` filter is wired | Per-phase spec `API: calculate > cooperativeApproachId filter scopes the aggregation` |
| Safeguard: `adjustedEmissions <= ndcTarget` (Dec 2/CMA.3 para 9) | Partial — defaults to "pass" when inventory data is missing | Per-phase spec `safeguard defaults to passed=true when nationalEmissions data is missing` |
| Revocation of CA blocks new first transfers (Draft -/CMA.5 paras 20-21) | No — no `Revoked` status, no revocation endpoint, no guard | `Sequencing invariants > Revoked CA cannot be the source ...` is `test.fixme` |
| Serial-number immutability for issued ITMOs (Draft -/CMA.5 para 132) | N/A — no HTTP-reachable issuance endpoint; credit block ID is stable in the entity but cannot be observed end-to-end | `Serial-number / ID immutability > once an ITMO credit block is issued ...` is `test.fixme`; CA-PK and IR-PK immutability tests execute and pass |
| Revision for material CA changes (Dec 2/CMA.3 para 19) | No revision workflow; `PUT /update` overwrites in place with no version history | Out of scope for the cross-cutting spec; `Data integrity > CA title change does NOT propagate to the IR snapshot` documents the drift behaviour that makes revision hard |
| TER workflow (Dec 2/CMA.3 annex chapter VII) | No — `InitialReportStatus` stops at `Submitted`/`Published`; `CaStatus` stops at `Approved` (and no endpoint writes it) | N/A; documented in 06-initial-report.md Gaps |

## Gaps / deviations

Aggregated from the per-phase Gaps sections plus the cross-cutting sweep. Most-critical first.

- **CRITICAL: Decision 2/CMA.3 paragraph 18 is not enforced.** `hasSubmittedReport` is declared in `InitialReportService` and exposed through `GET /check`, but a project-wide grep confirms it is never called as a guard. A DNA Admin can (in principle) authorize the first ITMO for a cooperative approach that has no submitted initial report. The registry today does not meet the para 18 precondition. Phase 6 Gap #1. Cross-cutting test: `Sequencing invariants > Issuing the first ITMO authorization ...` (fixme with citation).
- **No HTTP-reachable ITMO issuance or first-transfer endpoint.** Phase 2 finding. The `programme-ledger` service has internal methods for `retireToAccount` and `cancelForOMGE`, but they are not wired to any `/national/...` route. This blocks both: (a) behavioural enforcement of the para-18 guard (above), and (b) the serial-number immutability test (cannot observe issuance end-to-end).
- **No CA revocation or revision workflow (Draft -/CMA.5 paras 20-21, Dec 2/CMA.3 para 19).** `CooperativeApproachStatus` enum is `Draft / Active / Suspended / Completed` — there is no `Revoked`. The status dropdown in the UI allows a move to `Suspended`, but the semantic distinction between "Suspended" and "Revoked" is not defined and no code path treats either as a gate against new ITMO activity. Phase 1 + cross-cutting finding.
- **No TER workflow.** `InitialReportStatus.PUBLISHED` and `CaStatus.APPROVED` are declared in the enums but no endpoint transitions to them. The status enum stops at `Submitted` for both IR and CA-ADJ. A TER reviewer cannot tell from the stored row whether review has concluded or findings were issued. Phase 5 Gap, Phase 6 Gap.
- **No ITMO serial-number structure.** Credit blocks carry a primary key from the counter service but no UNFCCC-style serial (Draft -/CMA.5 para 132 specifies serial format and uniqueness scope). A reviewer mapping the registry's blocks to serial numbers would need to invent the mapping. Phase 2 finding.
- **Ministry role has `Manage` on `InitialReport` and `CorrespondingAdjustment`.** The phase briefs describe IR authorship as DNA-only; CASL factory lines 201-226 grants the same `Manage` to Ministry. The UI gates the "Generate Report" button on `companyRole === DESIGNATED_NATIONAL_AUTHORITY`, but the API is open. Phase 6 mismatch, restated here because it cuts across multiple features.
- **No `/check` call before `PUT /correspondingAdjustment/calculate`.** Consistent with the para-18 gap above, the corresponding-adjustment service also does not verify that the CA has a submitted initial report. A DNA Admin can calculate and submit a CA-ADJ for a cooperative approach with no IR. The arithmetic is still correct, but the UNFCCC narrative requires the IR to exist first. Cross-cutting finding.
- **No idempotency on `POST /correspondingAdjustment/calculate`.** Two calculations for the same `(cooperativeApproachId, year)` produce two `CA-ADJ-<n>` rows with different PKs. A TER reviewer reading the query must pick the most recent by `createdTime`. Phase 5 Gap, restated here because it surfaces in multi-feature audits. Cross-cutting test: `Data integrity > two CA-ADJ calculations for the same (CA, year) produce distinct IDs`.
- **No re-sync from CA to existing IR on CA update.** Phase 6 finding: pre-population is a one-shot snapshot at generate time. `PUT /cooperativeApproach/update` changes the CA's title but leaves the IR's `cooperativeApproachDetails.title` stale. Documented as the drift behaviour — not a crash but a TER reviewer risk. Cross-cutting test: `Data integrity > CA title change does NOT propagate to the already-generated IR snapshot` (executing, documents current behaviour).
- **`PUT /submit` is idempotent for both IR and CA-ADJ.** Re-submitting a row that is already `Submitted` succeeds silently and refreshes `updatedTime`. There is no state-machine enforcement, no audit-trail row, and no way to un-submit. Phase 5 Gap + Phase 6 Gap; no correctness bug but erases the lifecycle semantics a reviewer would expect.
- **No per-row audit trail / authorship capture.** `createdBy` / `updatedBy` columns do not exist on `CooperativeApproach`, `InitialReport`, or `CorrespondingAdjustment`. The service handlers take `user` but use it only for (unused) scaffolding. A reviewer asking "which DNA Admin authored this row" must cross-reference HTTP logs.
- **`GET /check` is not rate-limited and probes are visible to PD / IC roles.** JwtAuthGuard-only; any authenticated user can enumerate CAs (short predictable strings `CA<NNNN>`) and learn whether a submitted IR exists for each. For a public registry this is fine; for a gated deployment it is an information-disclosure deviation from the otherwise uniform CASL gates. Phase 6 finding. Cross-cutting test: `CASL permission matrix > IR /check endpoint is reachable by every authenticated role`.
- **JSONB sections have no schema validation.** `participationDemonstration`, `itmoMetrics`, `ndcQuantification`, `cooperativeApproachDetails`, and `environmentalIntegrity` are typed `any`. The DTO's `@IsOptional()` does not check the shape. A caller can submit garbage and the row persists; the completeness validator only checks "not falsy". Phase 6 Gap.
- **ITMO-lifecycle events not fully HTTP-exposed.** Phase 2 finding. `retireToAccount` and `cancelForOMGE` at the service layer do not have public routes. This blocks e2e testing of the AEF action types `firstTransfer`, `acquisition`, `useTowardsNDC`, `useForOIMP`, `voluntaryCancellation`, `omgeCancellation`, `holdingsSnapshot` — the Phase 4 AEF export can only be round-tripped on a fresh DB (where every type has zero rows) or after manual DB seeding.

## Test coverage

The Playwright spec is structured as one top-level describe (`Article 6.2 - Cross-cutting Integration`) with six nested blocks, plus a small auth-sanity block:

- `Flagship end-to-end` — 1 executing test (`test.describe.configure({ mode: "serial" })`). Chains seven HTTP calls across five features: CA create -> IR generate -> /check pre-submit -> IR submit -> /check post-submit -> CA-ADJ calculate -> CA query -> IR query -> CA-ADJ query -> AEF download.
- `CASL permission matrix` — 4 executing tests (DNA admin full access; PD read-only on CA, denied elsewhere; IC mirrors PD; /check probe reachable by every role) + 2 `test.fixme` (Ministry admin Manage; DNA ViewOnly read-only) — both fixmes are blocked on seeded users.
- `Sequencing invariants` — 1 executing test (`/check` transitions Draft -> Submitted accurately) + 2 `test.fixme` (para 18 first-ITMO guard; revocation-blocks-first-transfer). Both fixmes cite specific UNFCCC paragraphs and specific service-layer gaps.
- `Data integrity` — 5 executing tests (CA title pre-population; CA update does NOT propagate to IR snapshot; second IR on same CA -> 409; two CA-ADJ for same (CA, year) produce distinct IDs; status Submitted preserved across `get` and `query`).
- `Serial-number / ID immutability` — 2 executing tests (CA PK cannot be rewritten via `PUT /update`; IR PK is stable across update / submit / get lifecycle) + 1 `test.fixme` (ITMO serial-number immutability — blocked on no HTTP issuance).
- `Auth sanity (explicit createApiClient)` — 1 executing test (ad-hoc DNA client works alongside the fixture).

Total: **19 tests**, of which **5 are `test.fixme`** (para 18 guard, revocation, ITMO serial immutability, Ministry admin, DNA ViewOnly) and **14 execute**. Every fixme carries an inline comment citing the UNFCCC paragraph it represents and the specific gap blocking the test.

### Cross-feature matrix

For each of the six prior features, which cross-cutting tests exercise it:

| Feature | Flagship E2E | CASL Matrix | Sequencing | Data Integrity | Immutability |
| --- | --- | --- | --- | --- | --- |
| Phase 1: Cooperative Approach | Yes (step 1, step 7) | Yes (DNA/PD/IC create + query) | Yes (indirectly via IR) | Yes (PK immutability, drift documentation) | Yes (PK rewrite attempt) |
| Phase 2: ITMO lifecycle | No (blocked on no-HTTP-endpoint) | No | Yes (fixme para 18) | No | Yes (fixme serial immutability) |
| Phase 3: OMGE / SOP | No (no HTTP surface for issuance) | No | No | No | No |
| Phase 4: AEF reporting | Yes (step 8) | Yes (download denied for PD/IC; allowed for DNA) | No | No | No |
| Phase 5: Corresponding Adjustment | Yes (step 6, step 7) | Yes (DNA/PD/IC calculate) | No | Yes (duplicate calc produces distinct IDs) | No |
| Phase 6: Initial Report | Yes (steps 2-5) | Yes (full DNA/PD/IC + /check probe) | Yes (/check transition; para 18 fixme) | Yes (pre-population snapshot, drift, 409 duplicate, get/query parity) | Yes (IR PK stability) |

## Running

```bash
npx playwright test tests/e2e/article6/cross-cutting.spec.ts
```

Run the full Article 6.2 suite in one invocation:

```bash
npx playwright test tests/e2e/article6/
```

The flagship test is marked `serial` inside its describe block — Playwright will not run it in parallel with sibling cross-cutting tests in the same file. Other cross-cutting tests (CASL matrix, data integrity, immutability) run in parallel safely because every CA / IR / CA-ADJ is allocated with a `uniqueSuffix()` title and a fresh future year, so there is no cross-worker collision.
