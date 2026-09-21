# CAD Trust v2 sync adaptor

The registry-specific half of the CAD Trust integration. It decides **what** to send, **when**, and
**how this registry's data maps onto CAD Trust's model**.

The transport half is `@app/cadtrust` (`backend/services/libs/cadtrust/`), which knows nothing about
this registry and should never need to change for it. If you find yourself editing that package to
make something here work, the change probably belongs here instead.

Unrelated to `libs/shared/src/cadt/`, which is the legacy **v1** integration against the dead
`Programme` entity. A CADT node runs v1 and v2 side by side with isolated data stores.

---

## How a sync flows

```
DocumentManagementService                (producer, in the request path)
  └─ CadTrustSyncEnqueueService.enqueueProjectCreate(project)
       └─ AsyncOperationsInterface.AddAction({ actionType, actionProps })
            └─ async_action_entity row          (or SQS, under ASYNC_OPERATIONS_TYPE=Queue)

cadtrust-operations-handler              (CAD Trust's own consumer lane, in the replicator container —
  └─ CadTrustAsyncOperationsHandlerService     see "Two independent async lanes" below)
       └─ CadTrustSyncDispatcherService.handle(...)
            └─ CadTrustProjectCreateHandler.handle(props)     -- thin orchestrator; the ensureX
                 ├─ resources.ensureStakeholder(companyId)       methods below all live on
                 │       -> stage the owning PD company, once per company    CadTrustProjectResourceService
                 ├─ resources.ensureProject(refId, props, infContent)
                 │       -> stage the project, link cadTrustProgramId
                 ├─ resources.ensureProjectMethodology(...)   -> link project <-> the bootstrapped methodology
                 ├─ resources.ensureStakeholderProject(...)   -> link project <-> its owning stakeholder
                 ├─ resources.ensureLocation(...)              -> stage the project's site location, if the
                 │                                                 INF captured one            -> all PRIVATE to this node
                 └─ CadTrustCommitHandler.handle()  -- called directly, in-process, if anything was staged
                      └─ client.staging.commit(...)                                             -> PUBLIC on the network
```

Nothing is visible to the CAD Trust network until the commit runs. Five resources can be staged in
one project-create run (stakeholder, project, project_methodology, stakeholder_project, location) —
each independently idempotent via `existingSync()`, each self-catching so one failure never blocks
the others — followed by a single inline commit, not a queued one. (Earlier versions of this handler
queued the commit, matching the reasoning bootstrap's commit still documents below; once a single
project-create run stages up to five resources itself, that in-run batch is already worth committing
together immediately, and queueing added a round trip without adding any real batching benefit.)

`existingSync()`, `adoptOrphanedStagedRow()` and the five `ensureX` methods all live on
`CadTrustProjectResourceService`, not on the handler — extracted so `CadTrustProjectUpdateHandler`
and `CadTrustReconcileHandler` (both below) can re-drive the same child resources instead of each
reimplementing the staged/committed/orphan bookkeeping. `CadTrustProjectCreateHandler` itself is now
just the orchestration: which ensures to call, in what order, and whether the result adds up to a
commit being owed.

`CADTV2ProjectCreate` above is the steady-state flow. Before any project can sync, a one-time
`CADTV2Bootstrap` action verifies the CAD Trust home organization and stages this registry's one
program and one methodology, following the same staged-then-committed shape:

```
main.ts                                  (national-api start, after setupHandler.handler())
  └─ CadTrustSyncEnqueueService.enqueueBootstrap()
       └─ AsyncOperationsInterface.AddAction(...)         -> async_action_entity row

cadtrust-operations-handler               (consumer, in the replicator container)
  └─ CadTrustBootstrapHandler.handle()
       ├─ CadTrustRegistryProfileService.assertConfigured()  -> sentinel-default guard
       ├─ client.organizations.list() -> find is_home        -> VERIFY ONLY, never creates
       │     none found -> markFailed(ORGANIZATION), stop
       ├─ client.program.stageCreate(...)      -> markStaged, if not already synced
       ├─ client.methodology.stageCreate(...)  -> markStaged, if not already synced
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process, if anything was staged
```

Note the last step: bootstrap calls `CadTrustCommitHandler.handle()` directly rather than enqueuing
a `CADTV2Commit` action. `CadTrustProjectCreateHandler` now does the same, for the same underlying
reason — see above. `CadTrustCommitHandler` itself is unchanged either way and remains a fully
independent handler (a future path that does still want cross-run batching can enqueue
`CADTV2Commit` and reach it that way). Calling it in-process is safe because it already satisfies
the same never-throw contract this module requires everywhere.

See `handlers/bootstrap.handler.ts` for why organization creation is deliberately out of scope —
short version: it is node onboarding (~30 minutes), not a registry sync action, and calling
`organizations.waitForCreation()` from inside this queue would stall every action behind it.

Two more flows, both triggered off `DocumentManagementService.updateProposalStage`'s single funnel
for lifecycle transitions (INF approve/reject, all PDD steps, validation, authorisation) — but only
3 of the 11 transitions that funnel through it actually reach CAD Trust, by design:

```
DocumentManagementService.updateProposalStage      (producer, in the request path — fires on ALL 11
  └─ CadTrustSyncEnqueueService.enqueueProjectUpdate(refId, txType)   transitions unconditionally)
       └─ async_action_entity row

cadtrust-operations-handler
  └─ CadTrustProjectUpdateHandler.handle({ refId, txType })
       ├─ txType ∈ {APPROVE_INF, REJECT_INF, APPROVE_VALIDATION}?
       │     no  -> log "ignored", stop                    (the other 8 transitions end here)
       │     yes -> re-map the project from the LEDGER (not project_entity) + the INF's
       │            document_entity.content, PUT it, markStaged
       ├─ resources.ensureStakeholder / ensureProjectMethodology / ensureStakeholderProject /
       │       ensureLocation  -- re-drives any of the four child resources that never got
       │                          staged or committed at create time (see "Re-driving children"
       │                          below); a no-op for anything already COMMITTED
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process
```

### Re-driving children on update, and reconciling on a schedule

`CadTrustProjectCreateHandler` stages up to five resources in one run, each independently fallible.
A child that failed there (most commonly `ensureProjectMethodology`, when bootstrap hadn't yet
succeeded) had nothing else revisit it — until now. Two independent paths both call into
`CadTrustProjectResourceService`'s same `ensureX` methods to fill in what's missing:

- **`CadTrustProjectUpdateHandler`**, opportunistically, whenever a synced transition fires for that
  project anyway (see the diagram above).
- **`CadTrustReconcileHandler`**, on a schedule — see "Two independent async lanes" below for how
  that schedule actually runs.

`CadTrustReconcileHandler.handle()` itself:

```
CadTrustReconcileHandler.handle()
  ├─ client.staging.hasUncommittedStagedRows()?      -> retry CadTrustCommitHandler.handle()
  │
  ├─ PROJECT sweep — syncRecords.findFailedProjectRefIds()  -> distinct refIds with a FAILED
  │                                                       PROJECT / PROJECT_METHODOLOGY /
  │                                                       STAKEHOLDER_PROJECT / LOCATION record
  │     for each refId: re-read from the LEDGER, then the same four resources.ensureX calls
  │       CadTrustProjectUpdateHandler makes above    -> then commit if the sweep owed one
  │
  ├─ SNAPSHOT sweep — syncRecords.findFailedSnapshotRecords()  -> full FAILED VALIDATION /
  │                                                       VERIFICATION / ISSUANCE rows
  │     grouped & ordered VALIDATION -> VERIFICATION -> ISSUANCE; each record re-driven from its
  │       `syncProps` snapshot (or, for a pre-`syncProps` row, best-effort from `payload`) via
  │       resources.ensureValidation / creditResources.ensureVerification / .ensureIssuance
  │       -> commit after each group that owed one, so the next group sees it published
  │
  ├─ CREDIT_BLOCK sweep — syncRecords.findFailedCreditBlockIds()  -> distinct creditBlockIds with
  │                                                       a FAILED UNIT / UNIT_LABEL record
  │     for each creditBlockId: creditResources.ensureIssuanceForUncreatedUnit(creditBlockId) +
  │       ensureUnitUpdate(creditBlockId) + ensureItmoLabelIfAuthorized(creditBlockId)
  │       -- ensureUnitUpdate/ensureItmoLabelIfAuthorized are the same upsert ensureX the
  │       steady-state CadTrustUnitUpdateHandler calls; ensureIssuanceForUncreatedUnit is the
  │       one-off re-drive for the case below     -> then commit if the sweep owed one
```

A failed credit issuance never reaches `ensureUnitCreate`, so `CadTrustCreditResourceService`'s
`ensureCreditIssuance` writes a `FAILED` `UNIT` row (keyed by `creditBlockId`) as a breadcrumb before
returning — one per vintage block. Without it the `CREDIT_BLOCK` sweep would have nothing to find and
the units would stay unsynced forever, even once the `ISSUANCE` record itself reconciled via the
`SNAPSHOT` sweep (the two live in different sweeps, and `ISSUANCE`'s `syncProps` is only `{ refId }`,
so the snapshot sweep can't know which blocks were waiting on it). `ensureIssuanceForUncreatedUnit`
covers the narrower case where `ensureIssuance` bailed on its "no synced verification" early return
and so left *no* `ISSUANCE` row for the `SNAPSHOT` sweep either — the `CREDIT_BLOCK` sweep re-drives
that missing issuance itself, but only for a block whose unit has genuinely never been staged.

The three sweeps run in dependency order (project -> validation/verification/issuance -> unit), so
a chain broken at several links can fully heal in a single tick. Which `CadTrustLocalEntityType`
belongs to which sweep — and why `ORGANIZATION` / `PROGRAM` / `METHODOLOGY` belong to none (they are
`BOOTSTRAP_ONLY`; a FAILED row there recovers on the next `enqueueBootstrap()`), while `STAKEHOLDER`
and `LABEL` are re-driven only as a side effect of another sweep's `ensureX` — is defined and
explained in `reconcile-scope.ts`, with `reconcile-scope.spec.ts` pinning the partition.

Before this handler existed, nothing ever revisited a FAILED `cadtrust_sync_record` — recovery
depended on an unrelated later project or credit event happening to touch the exact same sync
record.

The `SNAPSHOT` sweep re-drives what the project sweep cannot: `VALIDATION` / `VERIFICATION` need the
request-side snapshot (`CadTrustValidationSyncProps` / `CadTrustVerificationSyncProps`) that
re-deriving from the operational DB would race the replicator for, and `ISSUANCE`'s `localId` is the
composite `${refId}-VERIFICATION-v${N}` key, not a bare refId. That snapshot is now persisted on the
sync record itself (`cadtrust_sync_record.syncProps`, written by
`CadTrustSyncRecordService.recordSyncProps` before staging — so it survives even the "project not
yet synced" early return), and reconcile reads it back. A row that failed before that column existed
falls back to the stored outbound `payload`; if neither is usable the record is logged and left
FAILED rather than guessed at.

```
DocumentManagementService.performPDDAction /                 (producer, in the request path — only
performValidationReportAction, DNA_APPROVED branch            on APPROVE_PDD_BY_DNA / APPROVE_VALIDATION)
  └─ CadTrustSyncEnqueueService.enqueueValidation({ refId, documentType, documentVersion,
       validationBodyName, creditPeriodStartDate?, creditPeriodEndDate?, validationDate })
       └─ async_action_entity row     -- a fuller snapshot than usual; see the interface's own doc
                                          for why the validating actor's identity can't safely be
                                          re-derived inside the async handler

cadtrust-operations-handler
  └─ CadTrustValidationCreateHandler.handle(props)
       ├─ resources.existingSync(...) for this exact document version:
       │     COMMITTED -> skip entirely
       │     STAGED    -> skip staging, retry the commit only
       │     FAILED    -> resources.adoptOrphanedStagedRow(...) before falling through to stage
       ├─ project not yet synced to CAD Trust?              -> markFailed, stop
       ├─ client.validation.stageCreate(...)  -> markStaged
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process
```

Uses `CadTrustProjectResourceService.existingSync()` / `adoptOrphanedStagedRow()`, not
`CadTrustSyncRecordService.isAlreadySynced()` — the latter collapses STAGED and COMMITTED into one
`true`, which used to leave a validation record staged-but-never-committed stuck forever, and would
re-stage (duplicating) one that had gone STAGED → FAILED after a commit failure. See
`handlers/validation-create.handler.ts`'s class doc.

`APPROVE_VALIDATION` fires both flows from the same request: the project record moves to
`"Authorized"` and a validation record is staged for the validation report, as two independent
async actions.

### Credits: issuance, unit create, and every later unit update

Two different producer-side hooks, for the same reason validation's request-path/replicator-side
split exists — the data each event needs is only safely readable from a different place:

```
document-management.service.ts        (producer, in the request path — performVerificationAction's
  performVerificationAction              DNA_APPROVED branch, right before issueCredits())
  └─ CadTrustSyncEnqueueService.enqueueVerification({ refId, documentVersion,
       verificationBodyName })
       └─ async_action_entity row

cadtrust-operations-handler
  └─ CadTrustVerificationCreateHandler.handle(props)
       └─ resources.ensureVerification(props)     -- stages a `verification` record keyed
              -> stage, keyed refId-VERIFICATION-vN    ${refId}-VERIFICATION-v${documentVersion}
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process
```

```
credit-transactions-management.service.ts    (producer, in the replicator — handleTransactionRecords,
  handleTransactionRecords                      one call per TxType.ISSUE row: issueCredits() writes
  └─ CadTrustSyncEnqueueService.enqueueCreditIssuance(creditBlockId)   one CreditBlocksEntity per vintage)
       └─ async_action_entity row     -- payload is just { creditBlockId }, safe to re-read: see
                                          CadTrustCreditResourceService's class doc

cadtrust-operations-handler
  └─ CadTrustCreditIssuanceHandler.handle({ creditBlockId })
       └─ resources.ensureCreditIssuance(creditBlockId)
              ├─ ensureIssuance(refId)     -- reuses VERIFICATION's own localId (findLatestSynced) —
              │     -> stage, same localId    safe because monitoring cycles are strictly serial
              └─ ensureUnitCreate(creditBlockId, cadTrustIssuanceId)   -- always a create: this
                     -> stage a new `unit`                                vintage's block is new
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process
```

Every later change to that same `creditBlockId` — a whole-block transfer, a `COMPLETED` retirement,
a `COMPLETED` ITMO authorization, or the retained/shrunken side of any partial split
(`TxType.CREDIT_BLOCK_SPLIT`) — funnels through one upsert action instead of one per event type:

```
credit-transactions-management.service.ts    (producer, in the replicator — handleTransactionRecords's
  handleTransactionRecords                      TRANSFER / RETIRE / ITMO_AUTH / CREDIT_BLOCK_SPLIT
  └─ CadTrustSyncEnqueueService.enqueueUnitUpdate(creditBlockId)   branches; RETIRE/ITMO_AUTH only
       └─ async_action_entity row                                  when status == COMPLETED)

cadtrust-operations-handler
  └─ CadTrustUnitUpdateHandler.handle({ creditBlockId })
       ├─ resources.ensureUnitUpdate(creditBlockId)     -- re-reads current CreditBlocksEntity state
       │     never synced   -> create (a split-off block's first sync)
       │     STAGED         -> retry the commit only, don't re-stage
       │     COMMITTED       -> full-replace PUT, reusing the unit's own original
       │                        cadTrustIssuanceId (read back from its stored payload)
       └─ resources.ensureItmoLabelIfAuthorized(creditBlockId)   -- no-op unless
              itmoAuthorizationRecord is set; bootstraps the singleton "Article 6 -
              Authorisation" label on first use, then links this unit to it
       └─ CadTrustCommitHandler.handle()  -- called directly, in-process, if either owed one
```

**Why `unit` is treated as create-once-then-upsert, not split-aware.** CAD Trust's own `/unit/split`
call takes one request describing every resulting fragment; the registry instead emits a split's two
halves as two independent, uncorrelated replicator events (`CREDIT_BLOCK_SPLIT` for the retained
low-range block, a normal `TRANSFER`/`RETIRE`/`ITMO_AUTH` for the new high-range one). Rather than
reassembling them, every distinct `creditBlockId` just gets its own `unit`, created once and kept in
sync via full-replace `stageUpdate` thereafter — see `CadTrustCreditResourceService`'s class doc and
`CadTrustCreditUnitMapper`'s class doc.

**A rejected or cancelled retirement/ITMO-authorization request never reaches CAD Trust** —
`handleTransactionRecords`'s own `RETIRE`/`ITMO_AUTH` branches only call `enqueueUnitUpdate` inside
their existing `status == CreditTransactionStatusEnum.COMPLETED` guard.

---

## Two independent async lanes

All nine CAD Trust `AsyncActionType` members (`CADTV2ProjectCreate`, `CADTV2ProjectUpdate`,
`CADTV2Commit`, `CADTV2Bootstrap`, `CADTV2ValidationCreate`, `CADTV2Reconcile`,
`CADTV2VerificationCreate`, `CADTV2CreditIssuance`, `CADTV2UnitUpdate`) — see
`CADTRUST_V2_ACTION_TYPES` in `libs/shared/src/enum/cadtrust.async.action.types.ts` — are written to
the same `async_action_entity` table every other async action is (`Email`, `RegistryCompanyCreate`,
the legacy v1 CADT actions, …), but they are **consumed by a completely separate process loop**,
`RUN_MODULE=cadtrust-operations-handler` (`src/async-operations-handler/cadtrust-async-operations-handler.service.ts`),
not `async-operations-handler`. It runs alongside `replicator,async-operations-handler` in the same
replicator container (see `docker-compose.yml`), but with its own cursor
(`CounterType.CADTRUST_ASYNC_OPERATIONS`, not `ASYNC_OPERATIONS`) and its own backoff.

Why: every CAD Trust handler already never throws (rule 1 below), so a CAD Trust failure could never
permanently stall the shared cursor — but the shared loop still processes one action at a time,
synchronously, in order. A *slow* (not failing) CAD Trust HTTP call — already observed live: 504s
from an overloaded node, see `libs/cadtrust/LIVE_VALIDATION.md` — sat inline ahead of whatever email
or registry-sync action was queued right behind it. `AsyncOperationsDatabaseHandlerService` now
excludes `CADTRUST_V2_ACTION_TYPES` from its own query, so the two loops partition the table with no
overlap: neither ever delays the other.

This split is also what makes fast, safe retry possible for CAD Trust specifically.
`CadTrustAsyncOperationsHandlerService` runs a **second, fully independent timer** alongside its
cursor loop — a self-rescheduling call straight to `CadTrustReconcileHandler` (via the dispatcher)
every `cadTrustV2.reconcileIntervalMs` (`CADT_V2_RECONCILE_INTERVAL_MS`, default 5 minutes),
bypassing the queue entirely. This is what actually retries a staging/commit call that failed
because a previous commit was still propagating on CAD Trust's side (see
`CadTrustCommitHandler`'s class doc) — without needing to detect that specific error: reconcile
already re-drives every `FAILED` project-scoped sync record unconditionally, so running it
frequently is enough. `main.ts`'s once-per-national-api-start `enqueueReconcile()` call still exists
too, as a cheap belt-and-braces immediately on national-api restart; the frequent timer is what
does the real work, in the process that actually executes CAD Trust calls.

---

## Rules that are not negotiable

### 1. A handler must never throw

Both `AsyncOperationsDatabaseHandlerService` (email, registry-sync, legacy CADT v1) and
`CadTrustAsyncOperationsHandlerService` (CAD Trust v2 — see "Two independent async lanes" above)
each keep their **own single cursor**, in the `counter` table. When a handler throws, its cursor
does not advance and the same action retries forever on `5000 * 2^retryCount` backoff — which very
quickly means never. **Everything behind it in that lane stops** — for the shared lane that includes
every outgoing email in the system; for the CAD Trust lane it would mean no further CAD Trust action
(including the reconcile timer's own dispatch calls) ever runs again.

So a CAD Trust node being down must not be able to take either lane down with it. Handlers catch
their own errors, record them on `cadtrust_sync_record`, and return normally.
`CadTrustSyncDispatcherService` catches anything that escapes anyway, as a backstop.

Failures are visible in `cadtrust_sync_record.syncStatus` / `lastError`, not by blocking the queue.

### 2. `AsyncActionType` members are append-only

It is a **numeric** TypeScript enum persisted as a Postgres enum whose labels are the ordinals as
strings. Inserting or reordering a member silently reinterprets every existing
`async_action_entity` row. Every new member also needs an `ALTER TYPE ... ADD VALUE` migration —
see `src/migrations/1785500000000-CadTrustV2Sync.ts` — or the first insert fails with
`invalid input value for enum`.

(The enums in this module are string-valued precisely to avoid inheriting that problem.)

### 3. A stuck commit needs a human, not a bot

CAD Trust's `assertNoPendingCommitsExcludingTransfers` guard is *usually* a previous commit still
propagating on-chain — the reconcile timer's frequent retries handle that on their own. But it can
also be a row whose confirmation never lands, which does **not** self-resolve (see
`CadTrustCommitHandler`'s class doc). That state's documented fix, `POST /staging/reset-committed`,
is node-global and re-publishes every tenant's stuck rows on a shared node — too destructive to call
automatically. Past `cadTrustV2.commitStuckThreshold` consecutive failures,
`CadTrustCommitHandler` logs a loud warning naming the fix. It never calls it. An operator decides.

---

## Adding a newly synced entity

1. **Append** an `AsyncActionType` member, and add its label in a migration.
2. Add the local/CAD Trust type to `CadTrustLocalEntityType` / `CadTrustResourceType`.
3. Add a mapper under `mappers/`.
4. Add a handler under `handlers/` extending `CadTrustSyncHandler`, and list it in `SYNC_HANDLERS`
   in `cadtrust-sync.module.ts`.
5. Add a typed method to `CadTrustSyncEnqueueService` and call it where the domain event happens.
6. **Append** the action type to `CADTRUST_V2_ACTION_TYPES` in
   `libs/shared/src/enum/cadtrust.async.action.types.ts` — one shared constant used by both
   producers' `CADT_V2_ENABLE` gate, `CadTrustAsyncOperationsHandlerService`'s consumer filter, and
   `AsyncOperationsDatabaseHandlerService`'s exclusion filter. (Before this constant existed, the
   gate list was hard-coded and duplicated in both producers separately, and had already drifted
   once — don't reintroduce that by hard-coding it anywhere else.)

Nothing outside this module changes — not the dispatcher, not the switch in
`async-operations-handler.service.ts`, and not `CadTrustAsyncOperationsHandlerService` (it dispatches
generically over whatever `CADTRUST_V2_ACTION_TYPES` contains).

### Conventions worth keeping

- **Payloads are identifiers, not entities — with one documented exception.** The handler normally
  re-reads current state, so a queued action can never publish a snapshot that was already stale when
  it was enqueued. (The legacy v1 CADT actions enqueue whole `programme` objects unconditionally and
  have exactly that problem.) `CadTrustProjectCreateSnapshot` breaks this deliberately: see the next
  bullet for why "re-read current state" is itself sometimes the wrong call.
- **Handlers are idempotent.** The queue is at-least-once and the database consumer re-runs a whole
  pass on failure, so re-delivery is routine. Check `CadTrustSyncRecordService.isAlreadySynced`
  before staging.
- **Read through repositories, not domain services.** `DocumentManagementService` enqueues these
  actions; injecting it here would make the two modules mutually dependent.
- **Respect CAD Trust's insert order.** `program → methodology → stakeholder → project →
  project_methodology → stakeholder_projects → ... → location → ... → verification → issuance →
  unit`. `INSERT_ORDER` is exported from `@app/cadtrust`. This module does not enforce it — a
  handler that needs a parent must confirm the parent's `cadTrustId` exists first.
  `CadTrustProjectCreateHandler` follows it directly: `ensureStakeholder`/`ensureProject` can run in
  either order (neither depends on the other), but `ensureProjectMethodology`/
  `ensureStakeholderProject`/`ensureLocation` all wait for `ensureProject` to resolve a
  `cadTrustProjectId` first, and `ensureProjectMethodology` additionally needs the singleton
  METHODOLOGY sync record bootstrap already produced.
- **Never read an operational-DB table that a replicator populates.** A sync action is enqueued at
  ledger-write time, but the ledger replicator that fills tables like `project_entity` polls
  independently — with no ordering guarantee relative to the async-operations consumer that runs
  these handlers. A read that assumes the row is already there is a race, and it fails silently: see
  `CadTrustProjectCreateHandler`'s doc for the exact failure mode this used to hit (project create
  read `project_entity`, missed it under normal replication lag, logged an error and returned
  without ever calling `markFailed` — no sync record, no retry, the project just never synced).
  Read instead from something guaranteed to exist at handler-run time: a table written synchronously
  in the same request (`document_entity`, via `getLatestInfContent`), a snapshot captured before the
  ledger write and carried on the queue payload (`CadTrustProjectCreateSnapshot`), or the ledger
  itself for a fresh read of current state (`programmeLedgerService.getProjectById`, not the
  operational DB — this is exactly what `CadTrustProjectUpdateHandler` does).
- **This applies to `document_entity` too, not just `project_entity`.** `document_entity.content` /
  `.type` / `.version` / `.createdTime` are written synchronously, once, at document creation, and
  are safe to re-read anytime. But `document_entity.status` and `.lastActionByUserId` are written
  asynchronously by the ledger replicator's call into `DocumentManagementService.modifyDocumentEntity`
  (`src/ledger-replicator/process.event.service.ts`) — the same lag class as `project_entity`. The
  validating actor's identity for a CAD Trust validation record (`certifiedByUserDetails.Organisation.name`
  / `vrSubmittedIC.Organisation.name` in `DocumentManagementService`) is resolved via
  `.lastActionByUserId`, correctly, synchronously, in-request — but re-deriving it later inside
  `CadTrustValidationCreateHandler` would race the replicator's own pending write for *this*
  transition. That's why `CadTrustValidationSyncProps` carries a fuller snapshot than most payloads
  in this module.

---

## What is implemented

| Action | Status |
|---|---|
| `CADTV2Bootstrap` | ✅ Implemented — verifies the home organization, stages the one program + methodology |
| `CADTV2ProjectCreate` | ✅ Implemented — stages a project on INF submission, linked to the program, plus its methodology link, its owning stakeholder + stakeholder-project link, and its site location |
| `CADTV2ProjectUpdate` | ✅ Implemented, deliberately narrow scope — of the 11 lifecycle transitions enqueued, only `APPROVE_INF` (→ `"Registered"`), `REJECT_INF` (→ `"Rejected"`), `APPROVE_VALIDATION` (→ `"Authorized"`) re-stage the project record; the other 8 are logged as ignored |
| `CADTV2ValidationCreate` | ✅ Implemented — stages a CAD Trust `validation` record on `APPROVE_PDD_BY_DNA` and `APPROVE_VALIDATION`, keyed by document + version so a resubmitted-and-reapproved document gets its own record |
| `CADTV2Commit` | ✅ Implemented — called both from the queue and inline from every other CAD Trust v2 handler |
| `CADTV2Reconcile` | ✅ Implemented — three sweeps in dependency order: retries a staged-but-uncommitted batch, re-drives any project with a FAILED sync record, re-drives any FAILED `VALIDATION`/`VERIFICATION`/`ISSUANCE` record from its persisted `syncProps` snapshot, and re-drives any credit block with a FAILED `UNIT`/`UNIT_LABEL` sync record; enqueued once per national-api start alongside `CADTV2Bootstrap` and re-run on a short timer. Never touches the `BOOTSTRAP_ONLY` singletons — see `reconcile-scope.ts` |
| `CADTV2VerificationCreate` | ✅ Implemented — stages a CAD Trust `verification` record on a DNA-approved verification report, keyed `${refId}-VERIFICATION-v${documentVersion}` |
| `CADTV2CreditIssuance` | ✅ Implemented — ensures the `verification` record above, stages the 1:1 `issuance` record, and creates one `unit` per newly-issued vintage block |
| `CADTV2UnitUpdate` | ✅ Implemented — full-replace upsert for a `unit`: whole-block transfer, `COMPLETED` retirement, `COMPLETED` ITMO authorization (plus the Article 6 label link), and the retained/shrunken side of any partial split |

Organization creation itself is **out of scope everywhere** — `CADTV2Bootstrap` verifies a home
organization exists and fails loudly if it doesn't; provisioning one is an operator action against
the CADT node directly, not something this registry does.

`CADTV2ProjectCreate`'s program and methodology links both assume bootstrap has already run.
`cadTrustProgramId` on the project is optional on CAD Trust's side, so a missing program link is
silently skipped (no error) if bootstrap hasn't run yet; the `project_methodology` link is required
for issuance/unit sync to ever work, so a missing methodology link is instead recorded as a `FAILED`
sync record with a message naming the likely cause, so it's visible rather than silently absent.
`CADTV2ProjectUpdate` re-derives `cadTrustProgramId` the same way on every PUT, since CAD Trust's PUT
is a full replace — omitting it when a program IS synced would silently unlink it.

---

## Configuration

| Env var | Default | Effect |
|---|---|---|
| `CADT_V2_ENABLE` | `false` | When off, `AddAction` drops every sync action; handlers also re-check |
| `CADT_V2_BASE_URL` | `http://localhost:31310/v2` | Which node to sync to |
| `CADT_V2_API_KEY` | — | Only when the node was started with `CADT_API_KEY` |
| `CADT_V2_REGISTRY_NAME` | `SYSTEM_NAME` | Published as `projectRegistryName` |
| `CADT_V2_COMMIT_AUTHOR` | `SYSTEM_NAME` | Author recorded on each commit |
| `CADT_V2_TIMEOUT_MS` | `30000` | Request timeout for every CAD Trust call |
| `CADT_V2_ORG_NAME` | `CADT_V2_REGISTRY_NAME` | Verify-only — logging only, never used to create an org |
| `CADT_V2_PROGRAM_NAME` | `"${systemCountryName} National Carbon Crediting Program"` | Required |
| `CADT_V2_PROGRAM_REGISTRY` | `CADT_V2_REGISTRY_NAME` | Required |
| `CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID` | `systemCountryCode` | Required |
| `CADT_V2_PROGRAM_REGISTRY_PROGRAM_ID` | — | Optional |
| `CADT_V2_PROGRAM_DESCRIPTION` | — | Optional |
| `CADT_V2_METHODOLOGY_CODE` | `"${systemCountryCode}-NCC"` | Required |
| `CADT_V2_METHODOLOGY_NAME` | `"National Carbon Crediting"` | Required |
| `CADT_V2_METHODOLOGY_VERSION` / `_DATE` / `_LINK` | — | Optional |
| `CADT_V2_METHODOLOGY_TYPE` | — | Optional, picklist `methodology_type` |
| `CADT_V2_RECONCILE_INTERVAL_MS` | `300000` (5 min) | How often the CAD Trust async lane re-runs the reconcile pass — see "Two independent async lanes" above |
| `CADT_V2_COMMIT_STUCK_THRESHOLD` | `6` | Consecutive commit failures before `CadTrustCommitHandler` logs a stuck-commit warning — see rule 3 above |
| `CADT_V2_VERIFICATION_BODY` | `CADT_V2_VALIDATION_BODY`, then `"DNV"` | Published as `verificationBody` on every `verification` record — never the real verifying body's name |
| `CADT_V2_UNIT_TYPE` | — (empty string) | Published as `unitType` on every `unit` record. No safe default — left empty until set, deliberately, so the node's own rejection surfaces a missing value rather than a guessed one. **Set this before enabling credit sync.** |

The consumer runs wherever `RUN_MODULE` includes `cadtrust-operations-handler` — today that is the
**replicator** container, not a service of its own. (`async-operations-handler` alongside it in the
same container handles every non-CAD-Trust async action — see "Two independent async lanes".)

All of the program/methodology values above go through `CadTrustRegistryProfileService` — the
single place they are read from, so a later move to a DB-backed profile (there isn't one today)
touches one file rather than every mapper and handler. Its `assertConfigured()` refuses to stage
anything while a *required* field would still resolve to a placeholder (`"CountryX"`, `"SystemX"`,
or the hardcoded `"NG"` country-code fallback) with no explicit override set — publishing a
program under one of those cannot be undone later the way a project can, since CAD Trust refuses
to delete a program once any project references it.

---

## Picklists

`mappers/picklist.map.ts` maps this registry's `UPPER_SNAKE` enums onto CAD Trust's title-case
picklist values. Every value is typed against `@app/cadtrust`'s `interfaces/picklistValues.ts` — a
snapshot of `GET /v2/governance/meta/pickList` fetched against a live node (2026-08-20) — so a typo
or an invented string is a **build failure**, not a silent node rejection weeks later. That is a
compile-time aid layered on top of the runtime check below, not a replacement for it: CAD Trust's
Technical Committee still governs and can change these values over time, which is why `@app/cadtrust`
types the *transport-level* fields as plain `string` rather than a union — only this adaptor's own
mapping tables are pinned to the snapshot.

`validationBody` is the one picklist deliberately left untyped (plain `string`) even in the
snapshot file — see `picklistValues.ts`'s doc comment for why. `verificationBody` gets the identical
treatment, for the identical reason (a configured default, `CADT_V2_VERIFICATION_BODY` — falling
back to `CADT_V2_VALIDATION_BODY`, then `"DNV"` — never the real verifying body's name).

`unitStatus` and `unitType` are **not yet captured from a live node** and are left as plain `string`
too, deliberately: `unitStatus` is derived internally (`"Held"` / `"Retired"` plus a fixed
reason-string map keyed by `AccountType` — see `UNIT_STATUS_REASON_MAP` in `picklist.map.ts`) so
there's low risk there, but `unitType` (`CADT_V2_UNIT_TYPE`) has **no safe default at all** — the
mapper sends an empty string rather than guess, specifically so the node's own rejection surfaces
the gap instead of silently publishing a wrong value. Capture both from a live node's
`GET /v2/governance/meta/pickList` before going live with credit sync, and set `CADT_V2_UNIT_TYPE`
before enabling it.

`CadTrustPicklistService` fetches the live lists (cached ~1h) and **logs a warning** for any mapped
value that is not in them — this is the runtime authority for drift after the snapshot ages. It
never blocks a sync — a stale local table is not a good enough reason to stop real data reaching CAD
Trust, and the node's own rejection message is more useful than anything guessed here. **Watch the
logs on the first real sync** and regenerate `picklistValues.ts` from what they say if the node has
moved on.

Two fixed (not derived-from-a-registry-enum) values are also checked: `STAKEHOLDER_TYPE_DEVELOPER`
(`"Developer"` — the PD company is always staged as this, a deliberate choice over CAD Trust's other
sample values `"Owner"`/`"Consultant"`) and `VALIDATION_TYPE_PDD_APPROVAL`
(`"Validation of Project Design Document"` — both `APPROVE_PDD_BY_DNA` and `APPROVE_VALIDATION` use
this same value; CAD Trust's other two `validation_type` values are for later re-validation events
this registry doesn't model).

`locationCountry` is not a hardcoded map — it comes from the deployment's `systemCountryName` at
runtime — so there's nothing to fix in code, but the match against CAD Trust's picklist is an
**exact string match** (`"Viet Nam"` not `"Vietnam"`, `"Democratic People's Republic of Korea"` not
`"North Korea"`). Confirm the configured `systemCountryName` matches one of `LOCATION_COUNTRY_VALUES`
before going live.

### `projectSector` / `projectType` source fields — swapped relative to their registry names

`PROJECT_SECTOR_MAP` reads from `sectoralScope` (`InfSectoralScopeEnum`), not `sector`; `PROJECT_TYPE_MAP`
reads from `sector` (`InfSectorEnum`), not `sectoralScope`. This looks backwards against the field
names but isn't: `InfSectoralScopeEnum` is, member for member, the UNFCCC/CDM sectoral-scopes list,
and so is CAD Trust's real `projectSector` picklist — 15 of 16 members match exactly. `InfSectorEnum`
(this registry's coarser category field) has almost no honest overlap with either real CAD Trust list
and is used as a best-effort source for `projectType` instead, which is itself a specific-technology
taxonomy (Hydro vs. Solar vs. Wind) neither registry field captures precisely. See the doc comments
on both maps in `picklist.map.ts` for the full member-by-member reasoning.

---

## Going live against a real node

The config split matters: `national-api` only ever reads `CADT_V2_ENABLE` (the
enqueue gate); every other key — base URL, API key, registry name, commit
author — is read inside the **replicator** container, because that's where
`cadtrust-operations-handler` (and therefore this module's dispatcher) runs. See
the CADT v2 blocks in `backend/services/.env.example`, `.env.replicator.example`
and `.env.national.example` for the full per-key breakdown.

**Order matters:**

1. Run the migrations *before* enabling anything:
   ```
   cd backend/services
   yarn migration:run
   ```
   Skipping this makes the first enqueued action fail with
   `invalid input value for enum async_action_entity_actiontype_enum: "17"` —
   the baseline migration only created labels `'0'..'16'`. There are nine
   CAD Trust migrations to run, in order: `1785500000000-CadTrustV2Sync.ts`
   (labels `17`–`19`, the `cadtrust_sync_record` table),
   `1785600000000-CadTrustV2Bootstrap.ts` (label `20`, plus `ORGANIZATION` /
   `PROGRAM` / `METHODOLOGY`), `1785700000000-CadTrustV2ProjectRelations.ts`
   (no new action-type label — adds `STAKEHOLDER` / `PROJECT_METHODOLOGY` /
   `STAKEHOLDER_PROJECT` / `LOCATION`), `1785800000000-CadTrustV2Validation.ts`
   (label `21`, plus `VALIDATION`), `1785900000000-CadTrustSyncRecordPayload.ts`
   (no new label — adds the debugging-only `payload` column),
   `1786000000000-CadTrustV2Reconcile.ts` (label `22`, for `CADTV2Reconcile`),
   `1787600000000-CadTrustAsyncOperationsCounter.ts` (no new action-type label —
   adds the `CADTRUST_ASYNC_OPERATIONS` counter row the second lane's cursor
   uses), `1787700000000-CadTrustV2Credits.ts` (labels `23`–`25`, plus
   `VERIFICATION` / `ISSUANCE` / `UNIT` / `LABEL` / `UNIT_LABEL`), and
   `1787900000000-CadTrustV2SyncProps.ts` (no new action-type label — adds the
   `syncProps` column the reconcile pass reads back to re-drive a FAILED
   `VALIDATION` / `VERIFICATION` / `ISSUANCE` record from its request-side
   snapshot).
2. Confirm it landed:
   ```sql
   SELECT unnest(enum_range(NULL::async_action_entity_actiontype_enum));            -- includes 17..25
   SELECT unnest(enum_range(NULL::cadtrust_sync_record_localentitytype_enum));      -- includes ORGANIZATION, PROGRAM,
                                                                                     -- METHODOLOGY, STAKEHOLDER,
                                                                                     -- PROJECT_METHODOLOGY,
                                                                                     -- STAKEHOLDER_PROJECT, LOCATION,
                                                                                     -- VALIDATION, VERIFICATION,
                                                                                     -- ISSUANCE, UNIT, LABEL, UNIT_LABEL
   SELECT to_regclass('public.cadtrust_sync_record');                               -- non-null
   ```
3. **Before touching any env var**, confirm a home organization already exists
   on the target node — `CADTV2Bootstrap` verifies, it never creates one:
   ```
   curl -H "x-api-key: $CADT_V2_API_KEY" "$CADT_V2_BASE_URL/organizations" | jq 'to_entries[] | select(.value.is_home)'
   ```
   If that is empty, provision the organization on the node first (its own
   onboarding flow, ~30 minutes) — enabling bootstrap against a node with no
   home organization just produces a `FAILED` `ORGANIZATION` sync record.
4. Set `CADT_V2_BASE_URL` / `CADT_V2_API_KEY` in `.env.replicator`. If the node
   runs on the host machine and the replicator runs in a container, `localhost`
   there means the container — use `host.docker.internal` or the host's LAN IP.
5. Set `HOST` and `SYSTEM_NAME` in `.env.replicator` too, even though nothing
   else in that container serves them. Left unset, `HOST` falls back to
   `http://localhost:3030` and `SYSTEM_NAME` to the placeholder `"SystemX"` —
   and both get published to the CAD Trust network as `projectLink` /
   `projectRegistryName` without any error. This is the easiest mistake to make
   and the hardest one to notice, since nothing fails.
6. Set the `CADT_V2_PROGRAM_*` / `CADT_V2_METHODOLOGY_*` keys in
   `.env.replicator` (see Configuration above) — or confirm `systemCountryName`
   / `systemCountryCode` / `SYSTEM_NAME` are all real values, since every one of
   these falls back to them. `CadTrustBootstrapHandler` refuses to stage
   anything and logs exactly which variable is missing if it can't.
7. Set `CADT_V2_ENABLE=true` in **both** `.env.national` and `.env.replicator`.

**Verify bootstrap first** — it runs automatically on the next national-api
restart once step 7 above is done:

```sql
-- bootstrap fired
SELECT * FROM async_action_entity WHERE "actionType" = '20' ORDER BY "actionId" DESC LIMIT 5;

-- all three rows COMMITTED, each with a cadTrustId (the org row's is the org_uid)
SELECT "localEntityType", "localId", "syncStatus", "cadTrustId", "lastError"
FROM cadtrust_sync_record
WHERE "localEntityType" IN ('ORGANIZATION', 'PROGRAM', 'METHODOLOGY');
```

Restart the container two or three more times and re-run that query — the
rows should not change, and no duplicate program or methodology should appear
on the node. That is the idempotency this action relies on: it is enqueued
on every start on purpose.

**Verify end to end** — create a project through the UI (Add Programme → INF
submit), then:

```sql
-- producer fired
SELECT * FROM async_action_entity WHERE "actionType" = '17' ORDER BY "actionId" DESC LIMIT 5;

-- consumer ran and the node accepted it
SELECT "localId", "syncStatus", "cadTrustId", "lastError"
FROM cadtrust_sync_record ORDER BY id DESC LIMIT 5;   -- expect COMMITTED, cadTrustId set

-- the global cursor advanced
SELECT * FROM counter WHERE id = 6;
```

Then check on the node itself (`GET {base}/project?page=1&limit=10`) that
`projectLink` is a real URL and `projectRegistryName` isn't `"SystemX"`.

**Do this once**: point `CADT_V2_BASE_URL` at a dead port, create a project,
and confirm the sync record goes `FAILED` with `lastError` set **while the
`counter` cursor still advances and email still sends**. That property — a
dead CAD Trust node cannot stall anything else — is the entire reason rule 1
above exists.

**Do this once too**: point `CADT_V2_BASE_URL` at a node with no home
organization, restart national-api, and confirm the `ORGANIZATION` sync record
goes `FAILED` with a readable `lastError` — and that the `PROGRAM` and
`METHODOLOGY` rows are never even attempted (`ensure()` never runs for them,
so no row exists yet at all). Then confirm the queue keeps moving.

---

## Tests

```
yarn test -- libs/shared/src/cadtrust-sync
```

No CADT node and no database. Repositories and the client are plain jest mocks; `@app/cadtrust` also
exports `createFakeTransport` if you want to drive a real client object against scripted HTTP
responses instead.

The specs that matter most are the "head-of-line guarantee" blocks in
`handlers/*.spec.ts` — they assert that a handler does **not** rethrow. If you change a handler's
error handling and those fail, do not relax them; re-read rule 1 above.
