# Credit block history tree — graph discovery & example

Reference doc for the Explorer drill-down that reconstructs a credit block's
full lineage — issuance → every split → every whole-block transfer/
retirement/ITMO authorization — as a flat list of graph nodes. Implemented by
`CreditTransactionsManagementService.getCreditBlockHistoryTree` (see
`buildCreditBlockHistoryTree` / `groupCreditBlockLedgerVersions` /
`findCreditBlockHistoryRoot` / `buildCreditBlockActionInfo` /
`buildCreditBlockItmoInfo` in `credit-transactions-management.service.ts`),
exposed at `POST /national/creditTransactionsManagement/creditBlockHistory`.

## Request

```
POST /national/creditTransactionsManagement/creditBlockHistory
Authorization: Bearer <DNA-user JWT>
Content-Type: application/json

{ "blockId": "<any creditBlockId in the lineage>" }
```

Gated by `ability.can(Action.Read, ProjectEntity)`, same as `queryExplorer` —
open to any authenticated user with project read access, not DNA-only.
`blockId` can be **any** block id that ever existed in the lineage — the
current leaf, an already-retired child, or the original root — since the root
is found by *range containment* against the project's issuance batches, not
by matching the id typed. All of them return the identical full tree.

## Where the data comes from

A block serial is `{prefix}-{projectId}-{blockStart}-{blockEnd}-{vintage}`,
and `creditBlockId` is derived from the first 5 parts (`prefix...-{blockStart}`).
Because of that, a block's **retained/low** portion keeps its id forever —
splitting only narrows its range — while the **high** portion sheared off by
a transfer/retirement always becomes a brand-new id.

The operational Postgres DB only stores each block's *current* row, so once a
block has been split more than once its earlier, wider ranges are gone. The
append-only ledger keeps every version, so the reconstruction reads from
there instead: `ProgrammeLedgerService.getCreditBlockLedgerHistory(projectRefId)`
calls `LedgerDBInterface.fetchHistory({ projectRefId }, creditBlocksTable)`,
returning every version of every block in the project, oldest first.

## Response shape

Every node is `{ range, children }`; the issuance root additionally carries
`info` directly (its `children` is always empty). Every entry in `children`
is `{ range, info }`, where `info` is a structured description of one action:

```ts
interface CreditBlockHistoryActionInfo {
  companyId: number | null;
  companyName: string | null;
  timestamp: number;    // raw epoch ms - the client formats it in its own
                         // local timezone, not baked into a server string
  amount: number;        // size of that leaf's range (end - start + 1)
  action: "ISSUE" | "RETAIN" | "TRANSFER" | "RETIRE" | "ITMO_AUTH";
  isItmo?: boolean;               // set on every action, not just ITMO_AUTH -
                                   // ITMO-ness is an attribute of the credits,
                                   // so a later RETIRE/TRANSFER/RETAIN of
                                   // already-authorized credits is still ITMO
  itmoSerial?: string | null;     // that ledger version's own ITMO serial
  authorizationPurpose?: string | null;  // ITMO_AUTH only - the raw
                                          // AuthorizationPurpose wire value
                                          // (e.g. "UseTowardsNDC"), same
                                          // convention as everywhere else
                                          // this field is transmitted (see
                                          // CreditBlockItmoAuthorizationsViewEntity).
                                          // The client translates it to a
                                          // label (formatActionNote), the
                                          // same way it already turns
                                          // "RETIRE" into "Retired".
  retireSubType?: string | null;         // RETIRE only
}
```

There is no free-text `note` field — everything the old `"{range} |
Transferred to X"` / `"{range} | Self Retired"` strings encoded is now these
structured fields, so the UI can render/filter/style without parsing text.

## How graph discovery works, per scenario

`groupCreditBlockLedgerVersions` buckets every ledger version by
`creditBlockId`, preserving chronological order within each bucket.
`findCreditBlockHistoryRoot` then picks the `ISSUE` version (no
`previousOwnerCompanyId`) whose range contains the queried block's current
range, in the same vintage — that's the tree's root regardless of how many
splits deep the queried block is.

From there, `buildCreditBlockHistoryTree` walks each group's own version
list and classifies every **consecutive pair** `(before, after)`:

| Scenario | Condition on `(before, after)` | Node produced |
|---|---|---|
| **Issuance** (root only, emitted once) | n/a — the group's very first version | `{ range, info: { action: "ISSUE", companyId, companyName, timestamp, amount }, children: [] }` |
| **Split** (partial transfer/retirement/**ITMO authorization**) | same `range.start`, `after.range.end < before.range.end` | 2-child node: `{ range: <pre-split range>, children: [low, high] }`. `low` = the retained portion (`action: "RETAIN"`, `companyId`/`companyName` from `after.ownerCompanyId`), still in the *same* group. `high` = a brand-new block, looked up in a `(vintage, start, txTime)` index built from every other group's first version — the split's `txTime` and the new block's creation `txTime` are always written in the same ledger transaction, so this always resolves; its `info` (`TRANSFER`, `RETIRE`, or `ITMO_AUTH`) comes from `buildCreditBlockActionInfo`. |
| **Whole-block transition** (entire remaining balance moved in one action — full transfer, full retirement, or full **ITMO authorization**) | same `range` (`start` *and* `end` unchanged), and either `ownerCompanyId` changed, or `itmoAuthorizationRecord` went from unset to set | 1-child node: `{ range, children: [{ range, info }] }` via the same `buildCreditBlockActionInfo`. No new group is created (id/range unchanged), so there's nothing to recurse into. |
| **No-op** (pending retire/ITMO-auth request, or one that was rejected/cancelled) | same `range`, **same** `ownerCompanyId` **and** `itmoAuthorizationRecord` | *nothing* — silently skipped. A rejected/cancelled retire request also writes `txType = RETIRE`, and a rejected/cancelled ITMO-auth request also writes `txType = ITMO_AUTH`, in both cases with no owner/authorization change — so it's the field that actually moved (`ownerCompanyId` or `itmoAuthorizationRecord`), not `txType`, that distinguishes a real action from a no-op. |

A split and a whole-block transition can never both match the same pair: the
retained/low side of a split never changes `ownerCompanyId` or
`itmoAuthorizationRecord` in that same version (only
`creditAmount`/`serialNumber`/`txType` change), so the conditions are
mutually exclusive by construction.

**`info` construction** (`buildCreditBlockActionInfo`, shared by a split's
high child and a whole-block transition), checked in this order:
1. `ownerCompanyId === 0` → `action: "RETIRE"`. This is the authoritative
   "this is a real retirement" signal, since a rejected/cancelled request
   also sets `txType = RETIRE` without an owner change. `companyId`/
   `companyName` deliberately identify the **retiring** company
   (`previousOwnerCompanyId`) rather than the resulting owner — retired
   credits have no owner (`0`), so showing that would make the node an
   orphan with no company attached. `retireSubType` is resolved from the
   completed `Retired` transaction pointed at this `creditBlockId`.
2. `txType === TxType.ITMO_AUTH` → `action: "ITMO_AUTH"`. The one action
   that never changes `ownerCompanyId` — the block just becomes an ITMO,
   still held by the same company — so it's checked *after* RETIRE (an
   ITMO block's own eventual retirement still has `ownerCompanyId === 0`
   and must read as `RETIRE`, not this). `companyId`/`companyName` are
   that unchanged owner; `authorizationPurpose` is resolved from the
   `ItmoAuthorized` transaction referenced by `itmoAuthorizationRecord`.
3. otherwise → `action: "TRANSFER"`, `companyId`/`companyName` from the new
   `ownerCompanyId` (the receiver).

Every branch also stamps `isItmo`/`itmoSerial` from that version's own
`itmoAuthorizationRecord`/`itmoSerial` — carried whether or not this
particular action is `ITMO_AUTH`, since a `RETIRE`/`TRANSFER`/`RETAIN` of
already-authorized credits is still ITMO. `amount` is always the leaf's own
range size (`end - start + 1`), not the parent block's full amount.

**Why `childIndex` keys on "not an issuance root" rather than
`previousOwnerCompanyId != null`.** An earlier version of this reconstruction
indexed split-produced children by `previousOwnerCompanyId != null` — true
for a transfer/retirement split (the new owner, or the retiring company, is
always a real id), but an ITMO-authorization split doesn't change ownership,
so its child copies the *parent's* `previousOwnerCompanyId`, which is `null`
whenever the parent was never itself transferred or retired (e.g. a
freshly-issued block). That child was never indexed, so the split lookup
missed it, fell back to labelling it from the *parent's* post-split version
(reading as a self-`TRANSFER` to the company that already owned it), and —
critically — never recursed into its subtree, silently dropping every later
transfer/retirement of those ITMO credits from the response. `childIndex` now
keys on "every group except an issuance root" (`txType === ISSUE &&
previousOwnerCompanyId == null`), which an ITMO child never satisfies either
way.

**Traversal order** is depth-first and **ancestor-before-descendant**, not
globally chronological across branches: a group's own chain of splits and
transitions is listed in full (in that group's chronological order) before
recursing into any branch a split spawned along the way. So a branch created
early (e.g. by the *first* split) can end up appearing after later nodes on
the "main" spine, once the spine's own history is exhausted.

**Discriminating a node's kind in the response** — no explicit `type` field
on the parent node; the UI infers it from `children.length`, or reads
`children[0].info.action` directly:
- `0` → issuance (root, `info` is on the node itself, not a child)
- `1` → whole-block transition (`children[0].info.action` is `TRANSFER`,
  `RETIRE`, or `ITMO_AUTH`)
- `2` → split (`children[0].info.action` is always `RETAIN`; the `high`
  child's `action` — the split's actual `TRANSFER`/`RETIRE`/`ITMO_AUTH` —
  is `children[1].info.action`)

## Full worked example

Project P, vintage 2024, serial prefix `CA0032-NG-XX-32`. Ids are named by
which range they were first created with (`B0`..`B4`) — remember a
retained/low block's id never changes even as its range narrows. Companies:
Riverbend Power (`companyId 12`), Project Developer 1 (`45`), Buyer Y
(`501`), Buyer W (`733`).

| # | Time | Action | Ledger effect |
|---|---|---|---|
| 1 | 2024-01-05 09:12 | Issue 1000 to **Riverbend Power** | New block `B0` (`...-32-1`), range `1-1000`, `ISSUE` |
| 2 | 2024-02-10 14:30 | Riverbend **partially transfers 400** to **Project Developer 1** | Split: `B0` narrows to `1-600` (retained). New `B1` (`...-32-601`), range `601-1000`, owner PD1, `TRANSFER` |
| 3 | 2024-03-14 11:05 | Riverbend **partially retires 300** of `B0`'s remaining 600 | Split: `B0` narrows to `1-300` (retained). New `B2` (`...-32-301`), range `301-600`, owner `0`, `RETIRE` |
| 4 | 2024-04-02 09:00 | Riverbend **whole-block transfers** the remaining 300 (`B0`) to **Buyer Y** | No split — same id, same range `1-300`, owner → Buyer Y, `TRANSFER` |
| 5 | 2024-05-20 10:22 | Buyer Y **partially retires 150** of `B0`'s remaining 300 | Split: `B0` narrows to `1-150` (retained). New `B3` (`...-32-151`), range `151-300`, owner `0`, `RETIRE` |
| 6 | 2024-06-01 / 06-02 | Buyer Y requests to retire 50 more; DNA **rejects** it | No split, no owner change — `RETIRE_REQ` then `RETIRE`(rejected) versions on `B0`, same range `1-150` |
| 7 | 2024-07-09 08:41 | Buyer Y **whole-block retires** the remaining 150 (`B0`) | No split — same id, same range `1-150`, owner → `0`, `RETIRE` |
| 8 | 2024-03-01 09:33 | PD1 **partially retires 200** of `B1`'s 400 | Split: `B1` narrows to `601-800` (retained). New `B4` (`...-32-801`), range `801-1000`, owner `0`, `RETIRE` |
| 9 | 2024-03-22 12:47 | PD1 **whole-block transfers** the remaining 200 (`B1`) to **Buyer W** | No split — same id, same range `601-800`, owner → Buyer W |

### Request

```
POST /national/creditTransactionsManagement/creditBlockHistory
Authorization: Bearer <DNA-user JWT>
Content-Type: application/json

{ "blockId": "CA0032-NG-XX-32-151" }
```

(`B3`'s id — any of `B0`..`B4` returns the identical tree.)

### Response

`timestamp` is shown here as `"YYYY-MM-DD HH:mm"` purely for readability
against the table above — the real field is raw epoch ms (see the interface
above), formatted client-side.

```json
{
  "statusCode": 200,
  "data": {
    "history": [
      {
        "range": "1-1000",
        "info": { "companyId": 12, "companyName": "Riverbend Power", "timestamp": "2024-01-05 09:12", "amount": 1000, "action": "ISSUE" },
        "children": []
      },
      {
        "range": "1-1000",
        "children": [
          { "range": "1-600", "info": { "companyId": 12, "companyName": "Riverbend Power", "timestamp": "2024-02-10 14:30", "amount": 600, "action": "RETAIN" } },
          { "range": "601-1000", "info": { "companyId": 45, "companyName": "Project Developer 1", "timestamp": "2024-02-10 14:30", "amount": 400, "action": "TRANSFER" } }
        ]
      },
      {
        "range": "1-600",
        "children": [
          { "range": "1-300", "info": { "companyId": 12, "companyName": "Riverbend Power", "timestamp": "2024-03-14 11:05", "amount": 300, "action": "RETAIN" } },
          { "range": "301-600", "info": { "companyId": 12, "companyName": "Riverbend Power", "timestamp": "2024-03-14 11:05", "amount": 300, "action": "RETIRE" } }
        ]
      },
      {
        "range": "1-300",
        "children": [
          { "range": "1-300", "info": { "companyId": 501, "companyName": "Buyer Y", "timestamp": "2024-04-02 09:00", "amount": 300, "action": "TRANSFER" } }
        ]
      },
      {
        "range": "1-300",
        "children": [
          { "range": "1-150", "info": { "companyId": 501, "companyName": "Buyer Y", "timestamp": "2024-05-20 10:22", "amount": 150, "action": "RETAIN" } },
          { "range": "151-300", "info": { "companyId": 501, "companyName": "Buyer Y", "timestamp": "2024-05-20 10:22", "amount": 150, "action": "RETIRE" } }
        ]
      },
      {
        "range": "1-150",
        "children": [
          { "range": "1-150", "info": { "companyId": 501, "companyName": "Buyer Y", "timestamp": "2024-07-09 08:41", "amount": 150, "action": "RETIRE" } }
        ]
      },
      {
        "range": "601-1000",
        "children": [
          { "range": "601-800", "info": { "companyId": 45, "companyName": "Project Developer 1", "timestamp": "2024-03-01 09:33", "amount": 200, "action": "RETAIN" } },
          { "range": "801-1000", "info": { "companyId": 45, "companyName": "Project Developer 1", "timestamp": "2024-03-01 09:33", "amount": 200, "action": "RETIRE" } }
        ]
      },
      {
        "range": "601-800",
        "children": [
          { "range": "601-800", "info": { "companyId": 733, "companyName": "Buyer W", "timestamp": "2024-03-22 12:47", "amount": 200, "action": "TRANSFER" } }
        ]
      }
    ]
  }
}
```

### Reading the response against the timeline

- **Node 1** — issuance (event 1). `children.length === 0`; `info.action === "ISSUE"`.
- **Node 2** — split from event 2. `children.length === 2`; `low.info.action === "RETAIN"` (Riverbend, unchanged), `high.info.action === "TRANSFER"` to Project Developer 1.
- **Node 3** — split from event 3. `high.info.action === "RETIRE"`, attributed to **Riverbend Power** — the company that performed the retirement, not a null/zero company.
- **Node 4** — whole-block transition from event 4 (Riverbend → Buyer Y). `children.length === 1`, `action: "TRANSFER"`, `companyId: 501`. Sits between nodes 3 and 5, its correct chronological slot on the `B0` lineage.
- **Node 5** — split from event 5. The `RETAIN` child now correctly attributes to **Buyer Y** — that's how event 4's ownership change surfaces, even though it got its own dedicated node (node 4) too.
- **Node 6** — whole-block transition from event 7 (Buyer Y's final retirement). `action: "RETIRE"`, `companyId: 501` (Buyer Y, the retiring company) — `B0`'s terminal state.
- **Event 6** (the rejected retire request) produces **no node** — `ownerCompanyId` never changed for that pair, so it's correctly invisible; it wasn't a completed transaction.
- **Node 7** — split from event 8, on the `B1` branch. Appears *after* node 6 even though event 8 (`2024-03-01`) happened chronologically *before* events 4–7 — because the `B1` branch (spawned by node 2's split) is only visited once the `B0` spine's own chain is exhausted.
- **Node 8** — whole-block transition from event 9 (PD1 → Buyer W), `action: "TRANSFER"`, `companyId: 733`, closing out the `B1` branch.

## ITMO authorization example (real local-dev seed data)

Unlike the worked example above, this one is drawn straight from the ledger
of the local dev stack's seed data (project `0002`) — every id, amount, and
timestamp below is real and reproducible by calling the endpoint against a
freshly-seeded environment. It's the scenario that motivated this doc's
ITMO_AUTH/`isItmo` additions: an authorization split, followed by two
retirements of the resulting ITMO credits.

Companies: Org 2 (`companyId 1`), Org 3 (`companyId 3`). Ids again named by
which range they were first created with.

| # | Time (UTC) | Action | Ledger effect |
|---|---|---|---|
| 1 | 11:50 | Issue 4916 to **Org 2** | New block `B0` (`...-2-1`), range `1-4916`, `ISSUE` |
| 2 | 11:52 | Org 2 **partially transfers 1000** to **Org 3** | Split: `B0` narrows to `1-3916` (retained). New `B1` (`...-2-3917`), range `3917-4916`, owner Org 3, `TRANSFER` |
| 3 | 11:53 | Org 3 **partially transfers 800 back** to **Org 2** | Split: `B1` narrows to `3917-4116` (retained). New `B2` (`...-2-4117`), range `4117-4916`, owner Org 2, `TRANSFER` |
| 4 | 11:53 | Org 3 **partially retires 100** of `B1`'s remaining 200 (`Voluntary Cancellations`) | Split: `B1` narrows to `3917-4016` (retained). New `B3` (`...-2-4017`), range `4017-4116`, owner `0`, `RETIRE` |
| 5 | 11:54 | Org 2 **partially authorizes 1500 as ITMO** of `B0`'s remaining 3916 (purpose `Use Towards NDC`) | Split: `B0` narrows to `1-2416` (retained, still MO). New `B4` (`...-2-2417`), range `2417-3916`, owner **unchanged** (Org 2), `ITMO_AUTH` |
| 6 | 12:01 | Org 2 **partially retires 1000** of `B4`'s remaining 1500 ITMO credits (`First Transfer Towards NDC`) | Split: `B4` narrows to `2417-2916` (retained, still ITMO). New `B5` (`...-2-2917`), range `2917-3916`, owner `0`, `RETIRE` |
| 7 | 16:18 | Org 2 **partially retires 10** of `B4`'s remaining 500 ITMO credits (`Voluntary Cancellations`) | Split: `B4` narrows to `2417-2906` (retained, still ITMO). New `B6` (`...-2-2907`), range `2907-2916`, owner `0`, `RETIRE` |

### Response (`{ "blockId": "CA0NNN-NG-XX-2-2417" }` — `B4`, or any of `B0`..`B6`)

```json
{
  "statusCode": 200,
  "data": {
    "history": [
      { "range": "1-4916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449015477, "amount": 4916, "action": "ISSUE" }, "children": [] },
      { "range": "1-4916", "children": [
        { "range": "1-3916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449128321, "amount": 3916, "action": "RETAIN" } },
        { "range": "3917-4916", "info": { "companyId": 3, "companyName": "Org 3", "timestamp": 1786449128321, "amount": 1000, "action": "TRANSFER" } }
      ]},
      { "range": "1-3916", "children": [
        { "range": "1-2416", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449269467, "amount": 2416, "action": "RETAIN" } },
        { "range": "2417-3916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449269467, "amount": 1500, "action": "ITMO_AUTH", "isItmo": true, "itmoSerial": "CA0001-NG-NG-2-2417-3916-2026", "authorizationPurpose": "UseTowardsNDC" } }
      ]},
      { "range": "3917-4916", "children": [
        { "range": "3917-4116", "info": { "companyId": 3, "companyName": "Org 3", "timestamp": 1786449187834, "amount": 200, "action": "RETAIN" } },
        { "range": "4117-4916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449187834, "amount": 800, "action": "TRANSFER" } }
      ]},
      { "range": "3917-4116", "children": [
        { "range": "3917-4016", "info": { "companyId": 3, "companyName": "Org 3", "timestamp": 1786449199949, "amount": 100, "action": "RETAIN" } },
        { "range": "4017-4116", "info": { "companyId": 3, "companyName": "Org 3", "timestamp": 1786449199949, "amount": 100, "action": "RETIRE", "retireSubType": "Voluntary Cancellations" } }
      ]},
      { "range": "2417-3916", "children": [
        { "range": "2417-2916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449716703, "amount": 500, "action": "RETAIN", "isItmo": true, "itmoSerial": "CA0001-NG-NG-2-2417-2916-2026" } },
        { "range": "2917-3916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786449716703, "amount": 1000, "action": "RETIRE", "isItmo": true, "itmoSerial": "CA0001-NG-NG-2-2917-3916-2026", "retireSubType": "First Transfer Towards NDC" } }
      ]},
      { "range": "2417-2916", "children": [
        { "range": "2417-2906", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786465096240, "amount": 490, "action": "RETAIN", "isItmo": true, "itmoSerial": "CA0001-NG-NG-2-2417-2906-2026" } },
        { "range": "2907-2916", "info": { "companyId": 1, "companyName": "Org 2", "timestamp": 1786465096240, "amount": 10, "action": "RETIRE", "isItmo": true, "itmoSerial": "CA0001-NG-NG-2-2907-2916-2026", "retireSubType": "Voluntary Cancellations" } }
      ]}
    ]
  }
}
```

### Before this fix

The `2417-3916` node above (event 5's split, `B4`'s birth) was silently
mislabelled and its whole subtree dropped:

- `B4`'s ledger row copies its parent `B0`'s `previousOwnerCompanyId`
  ([programme-ledger.service.ts:1246](../programme-ledger/programme-ledger.service.ts#L1246))
  — `null`, since `B0` was never itself transferred or retired.
- `childIndex` only registered groups with `previousOwnerCompanyId != null`,
  so `B4`'s group was never indexed.
- The split lookup for event 5 missed, fell back to labelling the child from
  `B0`'s own post-split version — `ownerCompanyId: 1`, not `0` — so it read
  as `"action": "TRANSFER", "companyId": 1, "companyName": "Org 2"`: a
  transfer to the company that already owned it.
- `pendingChildBranches.push(...)` was skipped for that miss, so `B4`'s
  entire subtree — nodes 6 and 7 above, **including both real retirements of
  1000 and 10 ITMO credits** — never appeared in the response at all.
