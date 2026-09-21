# `@app/cadtrust` — CAD Trust v2 client

A typed transport client for a [CADT](https://github.com/Chia-Network/cadt) v2 node.

This package is **infrastructure, not business logic**. It knows how to talk HTTP to CAD Trust and
nothing else. It is meant to be consumed unmodified by adaptors for *any* registry — nothing in
here should ever need to change because a particular registry's data model changed.

---

## Scope

### In scope

- HTTP transport, `x-api-key` auth, per-environment configuration
- Request/response typing for every documented v2 resource
- Staging mechanics and the commit lifecycle
- Pagination (single page and full walk)
- Error normalization into a typed hierarchy
- Retries for transient failures
- Organization onboarding, including polling the async creation flow
- Resource-specific non-CRUD actions: unit split, project transfer, CSV batch upload, XLSX
  import/export, the full offer flow
- Live picklist reads

### Out of scope — do not add these here

- Mapping a registry's own data model onto CAD Trust types
- Deciding *when* to create which entity, or in what order
- Choosing picklist values
- Registry-specific validation
- Assumptions about which fields a given registry populates

If you are writing a mapper, a sync orchestrator, or a "create the project then the issuance then
the unit" workflow, you are in the wrong package. That is a separate, per-registry adaptor built
*on top of* this one.

Two endpoint groups are also deliberately unimplemented: **`filestore`** and **`audit`**. Neither is
needed to sync climate data, and both are outside the brief this package was built to.

---

## Usage

```ts
import { createCadTrustClient } from '@app/cadtrust';

const client = createCadTrustClient({
  baseUrl: process.env.CADT_V2_BASE_URL,   // defaults to http://localhost:31310/v2
  apiKey: process.env.CADT_V2_API_KEY,     // omit entirely if the node has no CADT_API_KEY
  timeoutMs: 30_000,
});

// 1. Stage. This is private to your node — nobody else can see it yet.
const program = await client.program.stageCreate({
  programName: 'Gold Standard',
  programRegistry: 'Gold Standard',
  programRegistryActivityId: 'GS-1234',
});

// 2. Publish. This is the only call that reaches the network.
await client.staging.commit({ author: 'undp-registry', comment: 'nightly sync' });
```

Inside this repo, `CadTrustModule` / `CadTrustV2Service` wrap the same client for NestJS DI:

```ts
@Module({ imports: [CadTrustModule] })
export class MyAdaptorModule {}

@Injectable()
export class MyAdaptor {
  constructor(private readonly cadTrust: CadTrustV2Service) {}

  async sync() {
    if (!this.cadTrust.enabled) return;      // CADT_V2_ENABLE — your call, not the client's
    const client = this.cadTrust.getClient();
  }
}
```

`CadTrustModule` is intentionally **not** registered in `SharedModule` — nothing consumes it yet.
Import it where you need it.

### Configuration

| Env var | Default | Notes |
|---|---|---|
| `CADT_V2_ENABLE` | `false` | Read by `CadTrustV2Service.enabled`; the client itself never gates on it |
| `CADT_V2_BASE_URL` | `http://localhost:31310/v2` | Include the `/v2` prefix |
| `CADT_V2_API_KEY` | — | Sent as `x-api-key` on every request, including `/health` |
| `CADT_V2_TIMEOUT_MS` | `30000` | Per request |

These are separate from the legacy `CADTRUST_ENABLE` / `CADTRUST_ENDPOINT` used by the **v1** client
at `libs/shared/src/cadt/`, which is unrelated to this package and untouched by it. A CADT node runs
v1 and v2 side by side with isolated data stores, so both can be configured at once.

---

## The three things to understand before using this

### 1. Every mutation only *stages*

`POST`, `PUT` and `DELETE` against any resource write to a private, local staging table on your own
node. Nothing is visible to another registry, to the CAD Trust dashboard, or to the blockchain until
`staging.commit()` runs.

That is why the CRUD methods are called `stageCreate` / `stageUpdate` / `stageDelete` and return
`Staged<T>` rather than the raw response — the type is meant to be hard to misread. **No method in
this package ever commits on your behalf.**

Deciding when to commit is the adaptor's call. Three workable strategies:

| Strategy | When it fits |
|---|---|
| Commit after every mutation | Low volume, and you want each record independently retryable |
| **Batch commit at the end of a dependency-ordered sync run** (suggested default) | Ordinary bulk sync — one commit per run, cheapest on-chain, and a failed run leaves nothing half-published |
| Stage, then commit after human review | Regulated flows where an operator signs off before anything is public |

Whatever you pick, `staging.hasUncommittedStagedRows()` (née `hasPendingCommits()`) is a valid
"is there anything to commit at all" short-circuit before calling `commit()` — see "Known gaps"
§17. It does NOT tell you whether a *previous* commit is still propagating on-chain; that's a
different precondition, enforced server-side by `POST /staging/commit` and `PUT /project/xlsx`
alike (both reject if violated). Stacking commits on top of one still propagating is how records
get stuck at `committed: true` — which is what `staging.resetCommitted()` exists to unstick.

**`resetCommitted()` is node-global and somewhat destructive: call it deliberately, not on a
timer.** It resets *every* tenant's stuck rows on a shared node (excluding transfers) and
re-publishes them on the next commit — it cannot be scoped to your own registry's rows. The
registry-side adaptor (`libs/shared/src/cadtrust-sync/`) never calls it automatically:
`CadTrustCommitHandler` only logs a warning once a run of consecutive commit failures crosses
`cadTrustV2.commitStuckThreshold`, naming this endpoint as the fix — an operator decides whether
to actually run it. See that module's README, rule 3 ("A stuck commit needs a human, not a bot")
of "Rules that are not negotiable".

### 2. `PUT` is a full replace, not a patch

Every update endpoint requires the complete object. That is why every `*UpdateInput` is an alias of
its `*CreateInput`. Your adaptor needs the current record (or its own last-known state) before it
can update anything — this package will not merge for you.

The two exceptions are CSV batch upload and XLSX import, which genuinely merge: fields present
overwrite, fields absent are left alone.

### 3. Insert order is a hard dependency chain

Records reference each other by UUID, so parents must be staged before children:

```
program → methodology → stakeholder → label → project →
project_methodology → stakeholder_projects → validation → verification →
location → estimation → rating → co_benefit → issuance → unit → unit_label
```

Exported as `INSERT_ORDER` (and `AEF_INSERT_ORDER` for the Article 6.2 tables) so you do not have to
retype it. **This package does not enforce it** — walking the chain and threading UUIDs from each
`*CreateResponse` into the next create is adaptor work.

Two dependencies are easy to miss: an `issuance` needs a `project_methodology` (not just a project),
and a `unit` needs an `issuance`, which means the whole chain above it must already exist.

---

## Errors

Every failure is one of these. Nothing throws a raw `Error`, and no axios exception escapes.

| Class | Cause | Retried? |
|---|---|---|
| `CadTrustNetworkError` | No response: refused connection, DNS, socket reset | ✅ |
| `CadTrustTimeoutError` | Timeout (a `CadTrustNetworkError` subclass) | ✅ |
| `CadTrustAuthError` | 401 / 403. Sets `readOnlyNode` when a `READ_ONLY` node is the cause rather than a bad key | ❌ |
| `CadTrustValidationError` | 400 / 422. CAD Trust's own message and body pass through untouched | ❌ |
| `CadTrustNotFoundError` | 404 | ❌ |
| `CadTrustReferentialIntegrityError` | 409 with a `references` array — something still points at the record you tried to delete | ❌ |
| `CadTrustOrgOperationInProgressError` | 409 with an `operationStatus` — another org create/upgrade/reclaim is already running | ❌ |
| `CadTrustConflictError` | Any other 409 | ❌ |
| `CadTrustRateLimitError` | 429 | ✅ |
| `CadTrustServerError` | 5xx | ✅ |
| `CadTrustHttpError` | Base class; also the fallback for any other non-2xx | ❌ |
| `CadTrustOrgCreationFailedError` | Org creation reached state `FAILED` (thrown by the poller) | ❌ |

All carry `{ method, url, status, body, headers }`.

**Retry policy is deliberately conservative.** GETs retry transient failures by default; mutations do
not, because CADT mutations stage records and a blind retry after an ambiguous failure can
double-stage something a later commit would then publish twice. Opt in per call with
`{ retryable: true }` where you know it is safe.

---

## Testing

Unit tests never touch the network. Pass `transport` to swap the HTTP layer:

```ts
import { createCadTrustClient, createFakeTransport } from '@app/cadtrust';

const fake = createFakeTransport({ data: { message: 'ok', uuid: 'u-1', success: true } });
const client = createCadTrustClient({ transport: fake.transport });

await client.project.stageCreate(input);
expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project');
```

`createFakeTransport` is exported for adaptors to use on their own mapping tests, not just for this
package's suite.

```
yarn test -- libs/cadtrust                       # no CADT node required
CADT_V2_LIVE_URL=http://localhost:31310/v2 \
  yarn test -- libs/cadtrust/src/live            # read-only smoke tests against a real node

# Run every live test/capture in one shot (recommended over the individual
# commands below once there's more than one or two capture specs):
../../scripts/run-cadtrust-live-tests.sh http://localhost:31310/v2 [api-key]

# Or run one capture spec at a time:
CADT_V2_LIVE_URL=http://localhost:31310/v2 \
  yarn test -- libs/cadtrust/src/live/organizations.capture
CADT_V2_LIVE_URL=http://localhost:31310/v2 \
  yarn test -- libs/cadtrust/src/live/program.capture
CADT_V2_LIVE_URL=http://localhost:31310/v2 \
  yarn test -- libs/cadtrust/src/live/methodology.capture
```

### Live-node capture workflow

Every interface in this package is auto-extracted from the API guide, not validated against a
running node — `OrganizationSummary` already turned out wrong this way (snake_case fields, several
undocumented ones). Rather than find the next mismatch as a production bug, reconcile each resource
group against a real node once, systematically:

1. `createRecordingTransport()` (`testing/recording-transport.ts`) wraps the real `axiosTransport`
   and records every request/response pair as it happens — the literal wire shapes the typed client
   (and therefore production code) actually sends and receives, not a hand-copied guess.
2. A `live/<resource>.capture.spec.ts` file (see `organizations.capture.spec.ts`) builds a client
   with that transport and writes every captured call to
   `live/.captures/<resource>-<timestamp>.json` (gitignored). For a **generic CRUD resource**
   (program, methodology, and everything in `resources/entities.ts`), the SAFE calls to make are
   `list()`, `get()` (when a real id exists), **and `client.staging.list({ table: '<path>' })`** —
   all three, not just the first two. `list()`/`get()` only return already-COMMITTED records; a
   record can be genuinely staged-but-uncommitted on the node and invisible to both (confirmed in
   practice: `program.capture.spec.ts` found zero committed programs while a real one sat staged,
   only visible via `GET /staging?table=program`). Every capture spec for a future resource should
   follow the same three-call shape — see `program.capture.spec.ts` / `methodology.capture.spec.ts`.
3. Read the capture file, diff it field-by-field against the resource's current interface, fix
   what's wrong.

Mutating endpoints are deliberately left out of these captures by default — each capture file's doc
comment explains why for that specific resource group (e.g. organization creation is a ~30-minute,
effectively irreversible operation; program/methodology writes are instead covered by manual dev
testing against the real registry adaptor). Add a separate, explicitly-named capture file for
specific mutating calls only when you've decided it's safe to run them against the target node.

**`scripts/run-cadtrust-live-tests.sh`** (repo root) runs every file under `live/` in one jest
invocation — takes the base URL and (optional) API key as either positional args or pre-exported
`CADT_V2_LIVE_URL`/`CADT_V2_LIVE_API_KEY`. Needs no update when a new capture spec is added; it just
runs the whole directory.

**`LIVE_VALIDATION.md`** (package root) tracks every endpoint in this package, one row each: whether
it's been confirmed against a real node yet, how (capture spec or manual dev testing), and when —
check there before trusting an interface you haven't personally verified.

---

## Known gaps and caveats

Carried forward from the source documents rather than papered over.

1. **The v2 API is marked `[DRAFT]` in its own guide.** Every shape here is a best-known contract,
   not a frozen spec.
2. **Two unresolved conflicts between CAD Trust's own two source documents**, both implemented to
   match the interfaces package as given (its `NOTE:` comments are left intact):
   - `co-benefit`: the field is `cobenefit`, not `coBenefitId`.
   - `program`: the fields are `programRegistryActivityId` + `programRegistryProgramId`, not
     `programRegistryId`.

   `src/live/cadtrust.live.spec.ts` exists specifically to settle these against a real node. Record
   the answer here when you have one.
3. **Referential-integrity 409s are documented for only 3 of 21 resources** (program, methodology,
   stakeholder). Detection here is shape-based rather than resource-based, so other resources are
   classified correctly if they behave the same way — but the docs do not confirm which do.
4. **`GET /v2/organizations` returns a map keyed by `orgUid`, not an array.** Typed as such; easy to
   get wrong.
5. **Picklist keys are open.** `PickListResponse` is `Record<string, string[]>` on purpose — the key
   set is governed by CAD Trust's change-request process and the guide's example is illustrative
   only (it is not even valid JSON).
6. **Binary endpoints.** `GET /v2/project?xls=true`, `GET /v2/unit?xls=true` and `GET /v2/offer/`
   return bytes, not JSON. They come back as a `Buffer` plus the server-suggested filename; writing
   them anywhere is the caller's job.
7. **No `tokenize()` method on units.** Tokenizing on Chia is not a separate endpoint — it is an
   ordinary unit create with `marketplace: "Tokenized on Chia"` and a non-empty
   `marketplaceIdentifier`.
8. **`GET /v2/health/wallet` is named but never given an example response** in the guide, so it is
   typed as an open record rather than guessed at.
9. **`POST /v2/organizations/reclaim-home`** is filed under a "DELETE Examples" heading in the guide
   but its curl example is a POST. Implemented as a POST, following the working example.
10. **`OrganizationSummary` (`GET /v2/organizations`) is snake_case on the wire**, unlike every
    other interface in this package — the guide's auto-extracted example used camelCase
    throughout. Confirmed against a live node (a real 7-organization capture via
    `live/organizations.capture.spec.ts`): `org_uid`, `org_hash`, `is_home`, `subscribed`,
    `synced`, `file_store_subscribed`, `registry_id`, `registry_hash`, `sync_remaining`,
    `data_model_version_store_id`, `data_model_version_store_hash` are all snake_case and present on
    every entry; `xchAddress` alone stays camelCase. `registry_hash` can be `null` (seen on a
    subscribed-but-not-fully-synced entry). `xchAddress`/`balance` are present ONLY on the home
    organization's own entry — every imported/subscribed org omitted both entirely — so both are
    typed optional, not required.
11. **`OrganizationStatusResponse` (`GET /v2/organizations/status?orgUid=`) bears no resemblance to
    the guide's documented shape.** Confirmed against a live node: the real response is
    `{ ready, status: { wallet_synced, home_org_synced, pending_commits, home_org_profile_synced },
    success }` — the guide's `{ orgUid, synced, sync_remaining }` does not appear on the wire at all,
    and the `orgUid` query param is never echoed back.
12. **`OrganizationMetadataResponse` (`GET /v2/organizations/metadata?orgUid=`) is a bare map, not a
    `{ orgUid, metadata }` wrapper.** Confirmed against a live node for the empty case (`{}` exactly,
    for an org with no metadata set) — typed as `Record<string, string>` directly. **Unconfirmed for
    a populated response** — no organization on the captured node had any metadata set; re-verify with
    `addMetadata` + `getMetadata` against the same `org_uid` before relying on this for a non-empty
    case.
13. **`OrganizationCreationStatusResponse`'s idle case is confirmed correct** (`{ inProgress: false,
    state: null, message, success: true }`, matched exactly against a live node); the in-progress and
    upgrade-in-progress variants remain unverified — no creation or upgrade was running at capture
    time.
14. **A `?: string` optional field on a `*Record` read type can come back as an explicit `null`
    rather than an absent key.** Confirmed for `MethodologyRecord` (`methodologyVersion`,
    `methodologyDate`, `methodologyLink`, `methodologyType`, `orgUid` — all five always present as
    keys on a real record, `null` when unset). `field?: string` only type-checks `undefined`, not
    `null`, so this was a real gap. `MethodologyCreateInput`'s own optionality is untouched (unverified
    for writes — this capture only exercised reads). Worth checking the same way for every other
    `*Record` type in this package that has optional fields — not yet done for any of them.
15. **`GET /program`/`GET /methodology` (and, by the same CRUD machinery, every other core resource's
    `list()`/`get()`) only return already-COMMITTED records — never staged-but-uncommitted ones.**
    Confirmed the hard way: `program.capture.spec.ts` found zero committed programs on a node that
    had a real program sitting in the staging table, only visible via
    `GET /staging?table=program`. Every capture spec for a generic CRUD resource now includes a
    `client.staging.list({ table })` call for exactly this reason — see the "Live-node capture
    workflow" section above.
16. **`StagingRecord` (`GET /staging`) had two real bugs**, both confirmed twice — once on a staged
    `program` row and once on a staged `methodology` row, same structure both times. `is_transfer`
    was missing entirely (despite `resetCommitted`'s own doc comment already naming it). `diff.change`
    is an **array** of one object, not a single object as previously typed — `record.diff.change`
    needs `[0]` before the field access. Also worth knowing: `diff.change`'s keys are the table's own
    snake_case DB column names (`program_name`, `cad_trust_program_id`, ...), not the camelCase used
    by that resource's `CreateInput`/`Record` types elsewhere in this package — don't assume
    `diff.change[0]` matches a `CreateInput` field-for-field.
17. **`GET /staging/pending` (`hasPendingCommits()`) means the opposite thing on v2 that it did on
    v1, and this package's original doc comments were written against the v1 meaning.** v1's version
    counts already-pushed-but-still-propagating commits (`confirmed:false` = "wait, don't commit
    again yet"). v2's version (per its own doc comment upstream) counts staged-but-uncommitted rows
    (`confirmed:false` = "you have staged work that still needs a commit" — the state in which a
    commit *should* run). A caller that gates a commit attempt on `confirmed` using the **v1
    reading** (`!confirmed => skip`) will skip every commit, permanently, the moment anything is
    staged — confirmed via live testing (2026-08-21) after exactly this bug stuck a
    program/methodology bootstrap commit forever.

    Gating on the **v2 reading** is fine, and is a legitimate "nothing staged, nothing to commit"
    short-circuit — that's what `hasUncommittedStagedRows()` is for
    (`CadTrustCommitHandler` uses it). What `hasPendingCommits()`/`hasUncommittedStagedRows()`
    still can't tell you, on either reading, is whether a *previous* commit is still propagating
    on-chain — `POST /staging/commit` enforces that (v1-style) precondition server-side and
    rejects if violated; that's the reliable signal for it. Also confirmed: `GET
    /staging?type=pending` still uses the v1 meaning even on the same v2 node — the two "pending"
    endpoints disagree with each other. See `StagingV2PendingResponse`'s doc comment.

---

## Layout

```
src/
  client.ts        createCadTrustClient — the entry point
  config.ts        Config, defaults, resolved context
  interfaces/      Vendored `cadtrust-sync-interfaces` (see its own README)
  http/            transport · request · errors · retry · multipart · query
  resources/       Generic CRUD + the resource/primary-key table + typed wrappers
  actions/         staging · organizations · project · unit · offer · governance · system
  nest/            Optional NestJS module and service
  testing/         Recording fake transport
  live/            Env-gated smoke tests against a real node
```

`src/interfaces/` is vendored **verbatim** from the `cadtrust-sync-interfaces` package, which has no
npm registry to install from. Do not rename, reformat or "fix" fields in it, and leave its `NOTE:`
comments in place — regenerate it from source instead. The only additions made were endpoint types
the source package had not covered (the rest of the `organizations` set, plus `governance` and
`system`), added to the existing files in their existing style.
