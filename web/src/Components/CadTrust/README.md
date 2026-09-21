# CAD Trust sync badge + popup

An in-registry, **read-only** window onto how each project / credit block is syncing to the
Climate Action Data Trust (CAD Trust) v2 node. It does not call CAD Trust — it reads the registry's
own sync bookkeeping (`cadtrust_sync_record`) through the national API.

For what the records *mean* and which registry events drive them, see
`docs/business/cadtrust-v2-sync.md`. For the backend, see
`backend/services/libs/shared/src/cadtrust-sync/`.

## Pieces

| File | Role |
|---|---|
| `CadTrustSyncBadge.tsx` | The per-row badge — a CAD Trust logo mark with a status dot (synced / in progress / failed). Renders nothing until at least one sync record exists for the row. Opens the modal on click. |
| `CadTrustSyncModal.tsx` | The detail popup — summary banner, the shared "Registry setup" records shown once, then one card per derived record type with one section per record (state, CAD Trust id, attempts, last error, expandable field data). |
| `cadTrustSync.types.ts` | String-union mirrors of the backend enums, the entity display order / labels, the `cadt.*` table-name map, and the payload-field lists used to derive a human label per section. |
| `cadTrustSync.scss` | All styling. |

## Where it is mounted

Three tables host the badge, each passing `scope` and the id the overview endpoint keys on:

| Host | `scope` | id prop | `title` (header chip) |
|---|---|---|---|
| `Components/ProgrammeManagement/ProgrammeManagementComponent.tsx` | `"project"` | `refId` | project title |
| `Pages/CreditPages/Components/creditBalanceByProjectTable.tsx` | `"credit"` | `creditBlockId` | serial number |
| `Pages/CreditPages/Components/creditRetirementsTable.tsx` | `"credit"` | `creditBlockId` | serial number |

Each host first calls the batch **statuses** endpoint (`CADTRUST_SYNC_PROJECT_STATUSES` /
`CADTRUST_SYNC_CREDIT_STATUSES`) for the visible page of rows and feeds each row's
`overallStatus` into its badge — that is the gate that decides whether a badge shows at all. The
modal then calls the per-record **overview** endpoint (`CADTRUST_SYNC_PROJECT_OVERVIEW` /
`CADTRUST_SYNC_CREDIT_OVERVIEW`) when it opens.

The retirements table only mounts the badge on `ACCEPTED` rows — a pending/rejected retirement has
no CAD Trust unit update.

## Two things not to "simplify" away

- **The `stopPropagation` wrapper in `CadTrustSyncBadge`.** The Ant Design `Modal` renders through
  a portal, so its DOM sits on `document.body`, but React events still bubble through the component
  tree — i.e. through the table cell that hosts the badge, which in
  `ProgrammeManagementComponent` has an `onCell.onClick` that navigates to the project. The
  wrapping `<span onClick={e => e.stopPropagation()}>` around **both** the badge and the modal is
  what stops a click on the modal's mask / close / copy buttons / disclosure toggles from
  navigating the row away.
- **`credit` scope needs `creditBlockId`, not the serial number.** The retirements view exposes
  `creditBlockId` (added in migration `1788000000000-AddCreditBlockIdToRetirementsView`) precisely
  because the serial number is not a stable key into `cadtrust_sync_record` (whose `UNIT` records
  are keyed by `creditBlockId`).

## Section labels and field data

The overview endpoint returns ids and the exact CAD Trust payload last sent per record. The modal
derives a readable section label from that payload (`SECTION_LABEL_FIELDS` — e.g. `projectName`,
`stakeholderName`), falling back to the record's local id, and flattens the payload into a
key / value table for the "Show table data" disclosure (scalars as-is, `null`/empty as `—`,
objects/arrays as compact JSON). No syntax highlighting, no raw JSON block.
