# CAD Trust v2 — Sync Event Data Interfaces

TypeScript data contracts for every record type a registry can sync into CAD Trust
via the CADT v2 RPC API, extracted directly from Chia-Network's own API guide and
schema — not from the DBML, not from the Technical Report, and not inferred.

This package is **Step 1 only**: data interfaces for each supported sync event.
It does not implement any HTTP calls, retry logic, or an adaptor. That's Step 2.

---

## Sources, and why two of them disagree with each other

Two documents were pulled from `Chia-Network/cadt` (develop branch) and used as the
ground truth for every field in this package:

1. **`docs/cadt_rpc_api_v2.md`** — the "living" API guide: real endpoint paths, real
   curl requests/responses, a `Fields:` table per resource listing every field with
   its type, required flag, and picklist status. This document is explicitly marked
   `[DRAFT]` in its own title.
2. **`docs/cadtrust-schema-v2.0.2.json`** — a machine-readable schema the same repo
   publishes specifically *for AI mapping agents and ETL pipelines*, with a
   `source: user_input | system | api_generated` classification per field, a
   `validation_rules` section listing known integrator mistakes, and a
   `migration_from_v1` guide.

**Where they agree**, both are cited implicitly (the field simply appears).
**Where they disagree**, the conflict is called out in a `NOTE:` comment at the top
of the relevant file, and this package follows whichever source has a *working,
concrete curl example* — because an example that runs is harder to get wrong than a
hand-maintained field list. The two confirmed conflicts, both worth re-checking
against a live node before you ship:

| File | Conflict |
|---|---|
| `src/coBenefit.ts` | The guide's own `Fields:` table says `coBenefitId`. The schema's own `validation_rules.common_enum_mistakes` says that's wrong and silently ignored — the real field is `cobenefit`. This package uses `cobenefit`. |
| `src/program.ts` | The schema says the field is `programRegistryId`. The guide's actual curl example has no such field — it uses `programRegistryActivityId` (required) + `programRegistryProgramId` (optional) instead. This package follows the guide. |

Treat both of these as **unverified until you've hit a real CADT `/v2` instance**.
Everything else in this package is a direct, unmodified transcription of the guide's
field tables — no field was added, renamed, or guessed.

---

## The mental model you need before using any of this

### 1. Every sync event only *stages* a change

`POST`, `PUT`, and `DELETE` against any resource in this package write to a private,
local staging table on the registry's own CADT node. **Nothing is visible to the
rest of the CAD Trust network — no other registry, no CAD Trust dashboard — until a
separate commit step runs.** See `src/actions/staging.ts`:

```
POST /v2/staging/commit   → publishes staged changes to the Chia blockchain / DataLayer
```

An adaptor that calls `POST /v2/project` and stops has not synced anything yet. It
has queued a change. Decide up front whether your adaptor commits after every
mutation, batches commits on a schedule, or leaves commit to a human review step —
this package supports all three, but doesn't pick one for you.

### 2. Update means full replace, everywhere

Confirmed identically worded across all 20 resource sections of the guide: *"Update
requests must include ALL fields, not just the ones being changed."* `PUT` is not
`PATCH`. Every `*UpdateInput` type in this package is therefore just an alias for
its matching `*CreateInput` — if your adaptor only has three changed fields, it
still has to re-send the full record, which means your adaptor needs read access to
the current record (or its own last-known state) before it can update anything.

**The one exception**: CSV batch upload (`POST /v2/project/batch`,
`POST /v2/unit/batch`) and XLSX import (`PUT /v2/project/xlsx`, `PUT /v2/unit/xlsx`)
genuinely merge — fields present overwrite, fields absent are left alone. These live
in `src/actions/projectActions.ts` and `src/actions/unitActions.ts`.

### 3. `orgUid` is never something you send

Every record is owned by the CADT instance's own organization identity (`org_uid`),
assigned once during onboarding (`src/actions/organizations.ts`) and applied
server-side to everything you create. Some of the guide's own field tables
(`methodology`, `program`, `stakeholder`, `label`, `aef-t1-submission`) list `orgUid`
as an optional input field anyway — that's a documentation slip in the source;
every one of those same sections has a prose note underneath saying it's rejected
if provided. `orgUid` is omitted from every `*CreateInput` in this package on that
basis.

### 4. Insert order is a hard dependency chain, not a suggestion

Records reference each other by UUID. Create parents before children, in this
order (from the guide's "Data Model Overview," also reproduced at the top of
`src/index.ts`):

```
program → methodology → stakeholder → label → project →
project_methodology → stakeholder_projects → validation → verification →
location → estimation → rating → co_benefit → issuance → unit → unit_label
```

A few dependencies are easy to miss because they're not simple parent→child:

- **`issuance`** requires `cadTrustVerificationId` **and**
  `cadTrustProjectMethodologyId` — not a direct link to the project. The
  project-methodology join record must exist first, specifically so an issuance can
  point at "the methodology this project was using at the time," not just "a
  methodology this project has ever used."
- **`unit`** requires `cadTrustIssuanceId` — the full chain
  `program → methodology → project → project_methodology → verification → issuance`
  must already be staged or committed before you can create a single unit.
- AEF `aef_t3_actions` and `aef_t4_holdings` both require a corresponding
  `aef_t2_authorizations` record to already exist.

### 5. Picklist fields are typed as `string`, deliberately

Fields flagged `PICK` in the guide (project sector/type/status, unit type/status,
validation/verification body, stakeholder type, label type, and more) are governed
by CAD Trust's Technical Committee and change over time via a formal change-request
process (documented in the Technical Report — 24 requests processed as of October
2025, mostly picklist additions). Hardcoding a union type here would silently go
stale. Fetch current values at runtime:

```
GET /v2/governance/meta/pickList
```

and validate against those before submitting. Each field's JSDoc in this package
names the specific picklist key where it's known (e.g. `"unit_status"`), so you know
which key to request.

### 6. AEF tables are optional

The five `aef_t*` tables (`src/aef/`) only matter if your registry, or a government
partner you work with, needs Article 6.2 reporting. If that's not your registry,
skip that whole insert-order branch and the corresponding directory.

---

## Package layout

```
src/
  common.ts                    Shared types + the six rules above, as code comments
  index.ts                     Barrel export, insert order reference

  program.ts                   Baseline entities, one file each, in insert order
  methodology.ts
  stakeholder.ts
  label.ts
  project.ts
  projectMethodology.ts
  stakeholderProject.ts
  validation.ts
  verification.ts
  location.ts
  estimation.ts
  rating.ts
  coBenefit.ts
  issuance.ts
  unit.ts
  unitLabel.ts

  aef/                         Article 6.2 AEF tables (optional)
    aefT1Submission.ts
    aefT2Authorizations.ts
    aefT3Actions.ts
    aefT4Holdings.ts
    aefT5AuthorizedEntities.ts

  actions/                     Non-CRUD but necessary for a working adaptor
    organizations.ts           One-time onboarding: create/upgrade the org identity
    staging.ts                 List/edit/delete staged records; commit = publish
    projectActions.ts          Cross-org transfer, CSV batch, XLSX import/export
    unitActions.ts             Split (partial transfer/retirement), tokenize, CSV, XLSX
    offer.ts                   Cross-registry ownership transfer via Chia offer files
```

## Interface shapes, per entity

Every entity file (e.g. `unit.ts`) exports the same five shapes:

| Type | Corresponds to | Notes |
|---|---|---|
| `{X}CreateInput` | `POST /v2/{resource}` request body | Only `user_input` fields; excludes the entity's own primary key and `orgUid` |
| `{X}UpdateInput` | `PUT /v2/{resource}/{id}` request body | Alias of `CreateInput` — full replace, ID goes in the URL path, not the body |
| `{X}Record` | `GET /v2/{resource}` / `GET /v2/{resource}/{id}` response item | `CreateInput` + primary key + `orgUid` + `createdAt`/`updatedAt` |
| `{X}CreateResponse` | `POST` response | `{ message, uuid, cadTrust{X}Id?, success }` |
| `{X}MutationResponse` | `PUT` / `DELETE` response | `{ message, success }` |
| `{X}ReferentialIntegrityError` | `DELETE` response when blocked | Only generated for entities the guide documents this for (program, methodology, stakeholder) — other entities may have the same behavior undocumented; verify before assuming its absence means unrestricted delete |

## What Step 2 will need from this package

The plan described for Step 2 — an adaptor layer so multiple source systems can
target CAD Trust without touching Step 1 — will presumably want:

- A per-entity **mapper** (source-system record → `{X}CreateInput`), which is where
  your own registry's field names get translated to these exact CAD Trust field
  names.
- A **picklist resolver** that calls `GET /v2/governance/meta/pickList` once per
  sync run and validates/maps your source values against it, per the picklist keys
  named in this package's JSDoc.
- A **dependency-ordered writer** that respects the insert order above — likely by
  walking `src/index.ts`'s documented order and only advancing to child entities
  once parent UUIDs are known (from each `{X}CreateResponse`).
- A **commit strategy** built on `actions/staging.ts`, decoupled from the per-entity
  create/update calls.

None of that is implemented here by design — this package is only the typed
contract for what CAD Trust will accept, per its own documentation, as of the date
these files were generated.
