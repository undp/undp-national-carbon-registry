# CAD Trust v2 — endpoint validation status

Every request/response shape in `src/interfaces/` was auto-extracted from the Chia-Network CADT v2
API guide, not validated against a running node. This file tracks, endpoint by endpoint, which ones
have actually been confirmed against a real node and which are still guide-only — so a future
developer (or future you) doesn't have to re-derive that from git history.

**✅ Validated** means a real request/response pair has been seen and the interface either matched or
was corrected to match. **⏳ Not yet validated** means the interface is still exactly what the guide
said, unverified.

## How a row gets flipped to ✅

Two paths, both land in this same table:

1. **Automated capture.** Run a `src/live/<resource>.capture.spec.ts` file against a real node (see
   `README.md`'s "Live-node capture workflow" for how these work and how to run one), then hand the
   result over — the output JSON is read directly, the relevant interface is corrected if needed, and
   the row(s) below are updated with `Validated via: Live capture spec` and today's date.
2. **Manual dev testing.** You exercise an endpoint some other way (e.g. through the real
   `CadTrustBootstrapHandler`/`CadTrustProjectCreateHandler` flow against a live node) and report what
   you saw — matched or not. Same outcome: correction if needed, row updated with
   `Validated via: Manual dev testing` and the date.

Endpoints with no capture spec yet are still worth manually reporting on if you happen to exercise
them — tell me and the row gets updated regardless of mechanism.

---

## Organizations (`actions/organizations.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /organizations` | ✅ | Live capture spec | 2026-08-21 | `OrganizationSummary` corrected — see README "Known gaps" §10 |
| `GET /organizations/status?orgUid=` | ✅ | Live capture spec | 2026-08-21 | `OrganizationStatusResponse` fully rewritten — see README §11 |
| `GET /organizations/creation-status` | ✅ | Live capture spec | 2026-08-21 | Idle case matched exactly — see README §13 |
| `GET /organizations/metadata?orgUid=` | ✅ | Live capture spec | 2026-08-21 | `OrganizationMetadataResponse` corrected for the empty case only — see README §12 |
| `POST /organizations` (create) | ⏳ | — | — | Excluded from capture: ~30 min, effectively irreversible |
| `POST /organizations` (createFromFile) | ⏳ | — | — | Same endpoint, file-upload variant |
| `POST /organizations/upgrade` | ⏳ | — | — | Excluded from capture: irreversible V1→V2 op |
| `POST /organizations/metadata` (addMetadata) | ⏳ | — | — | |
| `POST /organizations/sync` | ⏳ | — | — | |
| `POST /organizations/mirror` (addMirror) | ⏳ | — | — | |
| `POST /organizations/remove-mirror` | ⏳ | — | — | |
| `POST /organizations/reclaim-home` | ⏳ | — | — | Excluded from capture: promotes a different org to home |
| `PUT /organizations/edit` (edit) | ⏳ | — | — | |
| `PUT /organizations/edit` (editFromFile) | ⏳ | — | — | Same endpoint, file-upload variant |
| `PUT /organizations` (importOrganization) | ⏳ | — | — | |
| `PUT /organizations/subscribe` | ⏳ | — | — | |
| `PUT /organizations/unsubscribe` | ⏳ | — | — | |
| `PUT /organizations/resync` | ⏳ | — | — | |
| `DELETE /organizations/{orgUid}` (remove) | ⏳ | — | — | |

Capture spec: `src/live/organizations.capture.spec.ts` (read-only endpoints only). Re-run 2026-08-21
via `scripts/run-cadtrust-live-tests.sh` re-confirmed all four ✅ rows above exactly — same 7
organizations, no drift.

---

## Program (`resources/entities.ts`, path `/program`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /program?page=&limit=` (list) | ✅ | Live capture spec | 2026-08-21 | Pagination envelope confirmed exactly (`PagedResponse<T>`); node has zero *committed* programs, so `ProgramRecord`'s own field shape is still unconfirmed — a real one is staged, see the row below |
| `GET /program/{id}` (get) | ⏳ | — | — | Never called — no committed program id exists to call it with |
| `GET /staging?table=program` | ✅ | Live capture spec | 2026-08-21 | Found a real staged program — `StagingRecord` corrected (see README "Known gaps" §16: `is_transfer` added, `diff.change` is an array of snake_case DB-column-named fields, not a single camelCase object) |
| `POST /program` (stageCreate) | ✅ | Manual dev testing | 2026-08-24 | Staged via `CadTrustBootstrapHandler` against this real node (`programName: "UNDP Demo Program"`, `programRegistry: "SystemX"`, `programRegistryActivityId: "NG"` — matches configured defaults). A full bootstrap run on 2026-08-24 committed it via the inline `CadTrustCommitHandler`: `committed:true` confirmed on the node afterward |
| `PUT /program/{id}` (stageUpdate) | ⏳ | — | — | Not currently exercised by any handler, but the transport method exists |
| `DELETE /program/{id}` (stageDelete) | ⏳ | — | — | Blocked with 409 while any project references the program (per the interface's own NOTE) |

---

## Methodology (`resources/entities.ts`, path `/methodology`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /methodology?page=&limit=` (list) | ✅ | Live capture spec | 2026-08-21 | 36 real methodologies, 20 returned; every field name matched exactly (no snake_case surprises, unlike organizations) |
| `GET /methodology/{id}` (get) | ✅ | Live capture spec | 2026-08-21 | Matched the list entry exactly |
| `GET /staging?table=methodology` | ✅ | Live capture spec | 2026-08-21 | Found a real staged methodology — same `StagingRecord` correction as program (see README "Known gaps" §16) |
| `POST /methodology` (stageCreate) | ✅ | Manual dev testing | 2026-08-24 | Staged via `CadTrustBootstrapHandler` against this real node (`methodologyCode: "NG-NCC"`, `methodologyName: "National Carbon Crediting"` — matches configured defaults). Committed in the same 2026-08-24 bootstrap run as the program row above; `committed:true` confirmed on the node afterward |
| `PUT /methodology/{id}` (stageUpdate) | ⏳ | — | — | Not currently exercised by any handler, but the transport method exists |
| `DELETE /methodology/{id}` (stageDelete) | ⏳ | — | — | Blocked with 409 while any project_methodology references it (per the interface's own NOTE) |

**Correction found**: `MethodologyRecord`'s `methodologyVersion`/`methodologyDate`/`methodologyLink`/
`methodologyType`/`orgUid` are always-present-but-nullable on read, not optional-may-be-absent as
originally typed — see README "Known gaps" §14.

---

## Other core CRUD resources (`resources/entities.ts`, all built by the same `makeResource()`)

Every resource below exposes the identical 5-endpoint shape program/methodology do
(`stageCreate`/`stageUpdate`/`stageDelete`/`get`/`list`) — validating the *mechanism* once
(program/methodology) confirms `makeResource()` itself works, but each resource's own field names
are a separate, unvalidated guess until captured individually.

`stageCreate`/`stageUpdate` are split from `stageDelete` below because dev testing (2026-08-24
project lifecycle, then 2026-09-02 credit lifecycle — via the real handlers against a live node, see
the two paragraphs below the table) confirmed the former for most of these resources without ever
exercising the latter for any of them.

| Resource | Path | `list`/`get` | `stageCreate` | `stageUpdate` | `stageDelete` |
|---|---|---|---|---|---|
| Stakeholder | `/stakeholder` | ⏳ | ✅ | ⏳ | ⏳ |
| Label | `/label` | ⏳ | ✅ | ⏳ | ⏳ |
| Project | `/project` | ⏳ | ✅ | ✅ | ⏳ |
| ProjectMethodology | `/project-methodology` | ⏳ | ✅ | ⏳ | ⏳ |
| StakeholderProject | `/stakeholder-projects` | ⏳ | ✅ | ⏳ | ⏳ |
| Validation | `/validation` | ⏳ | ✅ | ⏳ | ⏳ |
| Verification | `/verification` | ⏳ | ✅ | ⏳ | ⏳ |
| Location | `/location` | ⏳ | ✅ | ⏳ | ⏳ |
| Estimation | `/estimation` | ⏳ | ⏳ | ⏳ | ⏳ |
| Rating | `/rating` | ⏳ | ⏳ | ⏳ | ⏳ |
| CoBenefit | `/co-benefit` | ⏳ | ⏳ | ⏳ | ⏳ |
| Issuance | `/issuance` | ⏳ | ✅ | ⏳ | ⏳ |
| Unit | `/unit` | ⏳ | ✅ | ✅ | ⏳ |
| UnitLabel | `/unit-label` | ⏳ | ✅ | ⏳ | ⏳ |

Validated via: manual dev testing, 2026-08-24 — `Stakeholder.stageCreate` (`CadTrustProjectCreateHandler.ensureStakeholder`),
`Project.stageCreate` (`ensureProject`), `Project.stageUpdate` (`CadTrustProjectUpdateHandler`),
`ProjectMethodology.stageCreate` (`ensureProjectMethodology`), `StakeholderProject.stageCreate`
(`ensureStakeholderProject`), `Location.stageCreate` (`ensureLocation`), and `Validation.stageCreate`
(`CadTrustValidationCreateHandler`) were each staged, committed, and confirmed on the node through a
full project-lifecycle pass (INF submit through `APPROVE_VALIDATION`) — superseding the "504 Gateway
time-out" note that used to sit here for Stakeholder/Project: those were transient origin overload on
an earlier attempt the same day, not a standing problem.

Validated via: manual dev testing, 2026-09-02 — the full credit lifecycle
(verification-report approval → issuance → whole-block domestic transfer → retirement →
ITMO authorization → partial split) was run through the real handlers against a live node:
`Verification.stageCreate` (`CadTrustVerificationCreateHandler`), `Issuance.stageCreate` and
`Unit.stageCreate` (`CadTrustCreditIssuanceHandler`), `Unit.stageUpdate`, `Label.stageCreate` and
`UnitLabel.stageCreate` (`CadTrustUnitUpdateHandler`, the label bootstrapped on first ITMO
authorization). Each record staged, committed, and was confirmed present on the node. Individual
record field names are still an unvalidated guess pending a per-resource capture pass — only the
staging/commit mechanism is confirmed for these.

`Project`'s `list` is a partial exception on the `get`/`list` side — `cadtrust.live.spec.ts`'s
`'paginates projects'` test already exercises `GET /project?page=&limit=` and asserts the pagination
envelope (`page`/`data`/length), but has not checked individual record field names, so that cell
stays ⏳ pending a full capture pass.

## AEF resources (Article 6.2 reporting, `resources/entities.ts`)

| Resource | Path | `list`/`get` | `stageCreate`/`stageUpdate`/`stageDelete` |
|---|---|---|---|
| AefT1Submission | `/aef-t1-submission` | ⏳ | ⏳ |
| AefT2Authorizations | `/aef-t2-authorizations` | ⏳ | ⏳ |
| AefT3Actions | `/aef-t3-actions` | ⏳ | ⏳ |
| AefT4Holdings | `/aef-t4-holdings` | ⏳ | ⏳ |
| AefT5AuthorizedEntities | `/aef-t5-authorized-entities` | ⏳ | ⏳ |

---

## Staging (`actions/staging.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /staging` (list/listAll) | ✅ | Live capture spec | 2026-08-21 | `StagingRecord` corrected via the `table=program`/`table=methodology` captures — see the Program/Methodology sections above and README "Known gaps" §16. `type`-filtered calls (`staged`/`pending`/`failed`) and unfiltered calls remain unexercised |
| `GET /staging/pending` (hasPendingCommits / hasUncommittedStagedRows) | ✅ | Manual dev testing | 2026-08-21 | `confirmed:false` means "staged rows still need a commit" on v2 — inverted from v1 and from this package's original doc comment. See README "Known gaps" §17. Not safe to gate a commit on the v1 reading (`!confirmed => skip`); the v2 reading (`confirmed => nothing to commit`) is safe and is what `hasUncommittedStagedRows()` / `CadTrustCommitHandler` now use |
| `POST /staging/commit` (commit) | ✅ | Manual dev testing | 2026-08-24 | First confirmed 2026-08-21: a program staging row moved from `committed:false` to `committed:true` once the bogus v1-reading `hasPendingCommits()` pre-check was removed from `CadTrustCommitHandler` (which now re-guards with the v2-reading `hasUncommittedStagedRows()` instead). Re-confirmed 2026-08-24 with a full `CadTrustBootstrapHandler` run: both the program and methodology rows staged in the same run committed together in one call |
| `POST /staging/retry` (retry) | ⏳ | — | — | |
| `POST /staging/reset-committed` (resetCommitted) | ⏳ | — | — | |
| `PUT /staging` (edit) | ⏳ | — | — | |
| `DELETE /staging` (remove) | ⏳ | — | — | |
| `DELETE /staging/clean` (clean) | ⏳ | — | — | |

---

## Project actions (`actions/project.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `PUT /project/transfer` | ⏳ | — | — | |
| `POST /project/batch` | ⏳ | — | — | CSV batch create/update |
| `PUT /project/xlsx` | ⏳ | — | — | XLSX import |
| `GET /project?xls=true` | ⏳ | — | — | XLSX export (binary) |

## Unit actions (`actions/unit.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `POST /unit/split` | ⏳ | — | — | |
| `POST /unit/batch` | ⏳ | — | — | CSV batch create/update |
| `PUT /unit/xlsx` | ⏳ | — | — | XLSX import |
| `GET /unit?xls=true` | ⏳ | — | — | XLSX export (binary) |

## Offer (`actions/offer.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /offer/` (download) | ⏳ | — | — | Binary — datalayer offer file |
| `DELETE /offer/` (cancel) | ⏳ | — | — | |
| `GET /offer/accept` (details) | ⏳ | — | — | |
| `POST /offer/accept/import` | ⏳ | — | — | |
| `POST /offer/accept/commit` | ⏳ | — | — | |
| `DELETE /offer/accept/cancel` | ⏳ | — | — | |

## Governance (`actions/governance.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /governance/meta/pickList` | ✅ | Live capture spec | 2026-08-21 | Exercised by `cadtrust.live.spec.ts`'s picklist test; response shape (`Record<string, string[]>`) confirmed, individual picklist values captured separately (see `mappers/picklist.map.ts` in the registry adaptor) |

## System (`actions/system.ts`)

| Endpoint | Status | Validated via | Date | Notes |
|---|---|---|---|---|
| `GET /health` | ⏳ | — | — | Reachability confirmed by `cadtrust.live.spec.ts` (`expect(health).toBeDefined()`), but that assertion doesn't check `HealthResponse`'s actual fields — not a real field-level validation yet |
| `GET /health/wallet` | ⏳ | — | — | Guide never gave an example response — typed as an open record (README "Known gaps" §8) |
| `GET /diagnostics` | ⏳ | — | — | |
