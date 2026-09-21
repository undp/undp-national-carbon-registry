# CAD Trust V2 Sync — What the Registry Publishes

**Purpose**: this document states, in business terms, which registry events —
project-lifecycle **and** credit-lifecycle — are synchronised to the Climate
Action Data Trust (CAD Trust) V2 data model, what data travels with each event,
what actions are taken on the CAD Trust side, and — just as importantly — which
events and data are deliberately **not** synced and why. It is a
scope-and-mapping reference, not an implementation guide; no code or file paths
appear below.

This covers the **V2** integration against CAD Trust's current data model. It is
separate from, and unrelated to, the earlier V1 integration, which targeted a
different data model and is not described here.

---

## 1. How to read this document

Four conventions recur throughout and are explained once here.

- **Staged vs. published.** The registry never writes directly to the CAD Trust
  network. Every record is first *staged* — written privately to the registry's
  CAD Trust node, invisible to other participants — and then *published* by a
  single commit step that releases a batch of staged records to the network
  together. Where this document says a record is "created" or "updated" on CAD
  Trust, it means staged and then published.

- **Configurable.** Values marked *configurable* are set per deployment by the
  operator. This document names each such value and what it is for; it does not
  state defaults, because those vary by deployment and a placeholder default is
  not a value any real deployment should publish.

- **Not synced.** Where an event or data item is described as not synced, that is
  a deliberate scope decision, distinguished in Section 6 from a genuine gap.

- **Full replacement.** Both a project update and a unit update on CAD Trust
  replace the whole record, not just the changed fields. Every field listed for
  that record is therefore re-derived from the current registry state on every
  update.

The registry publishes to CAD Trust **one way only** — see Section 7. It never
reads CAD Trust records back into the registry. It does show each record's sync
*state* inside its own screens — a badge and a detail popup on the project,
credit-balance and retirement lists (Section 8) — but that surface reads the
registry's own sync bookkeeping, not CAD Trust, and does not change the
one-way-push rule.

---

## 2. One-time registry setup (bootstrap)

Before any project or credit can be synced, the registry establishes its own
identity and shared reference records on the CAD Trust node. This runs
automatically, is safe to repeat, and produces four things:

- **Home organisation** — *verified only, never created.* The registry checks
  that its organisation already exists on the node and stops with a recorded
  error if it does not. Provisioning the organisation is a one-time operator
  action carried out directly against the CAD Trust node during node onboarding;
  it is outside the scope of registry sync.

- **National crediting program** — one program record representing the
  host country's Article 6 crediting programme. Every project the registry
  publishes is linked to this one program. Its published fields — programme
  name, the registry it belongs to, its registry activity identifier, an
  optional registry programme identifier, and an optional description — are all
  configurable.

- **Methodology** — one methodology record that every published project is
  linked to. Its published fields — methodology code, name, and optional
  version, date, link, and type — are all configurable.

- **Article 6 "Authorisation" label** — one label record used to mark units that
  have been authorised as ITMOs. It is not published at start-up like the
  program and methodology; it is staged the first time a credit block is
  ITMO-authorised, and reused for every authorised unit after that.

The program, methodology and label are published once and reused for the life of
the deployment. A published programme cannot be withdrawn once a project
references it, so the registry refuses to publish the program or methodology
while any required configurable value is still unset.

---

## 3. Project lifecycle events that sync

Every project-lifecycle transition in the registry passes through a single
internal checkpoint. Of the eleven transitions that reach that checkpoint, only
the following are represented on CAD Trust:

| Registry event | Effect on CAD Trust |
|---|---|
| **Initial Notification Form (INF) submitted** — a new project is created | Project record **created**, together with its owning stakeholder, its methodology link, its stakeholder–project link, and its site location |
| **INF approved** | Project status → **Registered** |
| **INF rejected** | Project status → **Rejected** |
| **Project Design Document (PDD) approved by the DNA** | A **Validation** record is created (the project record itself is unchanged) |
| **Validation report approved** | Project status → **Authorized**, *and* a second **Validation** record is created |

The remaining transitions — PDD creation, PDD approval or rejection by the
Independent Certifier, PDD rejection by the DNA, validation-report creation,
validation-report rejection, and monitoring approval — are recognised but not
published. They are steps in the national assessment process with no
representation in CAD Trust's project model. They are logged as intentionally
skipped, not silently dropped.

When a validation report is approved, the two effects above (project status
becomes *Authorized*, and a validation record is created for the report) happen
as two independent updates from the same approval.

Opportunistically, whenever one of the three published transitions fires, the
registry also re-attempts any of the project's related records (stakeholder,
location, the two link records) that failed to publish at creation time. This is
a recovery mechanism, not a separate event — see Section 7.

---

## 4. Credit lifecycle events that sync

Once a project is authorised, its verified emission reductions are issued into
the registry as credit blocks, which then move through transfers, retirements,
and — for internationally authorised credits — ITMO authorisation. The following
credit events are represented on CAD Trust:

| Registry event | Effect on CAD Trust |
|---|---|
| **Verification report approved by the DNA** | A **Verification** record is created for that monitoring cycle |
| **Credits issued** | An **Issuance** record is created for the project's monitoring cycle (linked to the verification), then one **Unit** is created for each newly issued vintage block |
| **Whole-block domestic transfer** | The block's **Unit** is updated — new current owner |
| **Retirement completed** (any retirement or cancellation subtype) | The block's **Unit** is updated — status becomes *Retired*, with the reason and beneficiary that match the subtype |
| **ITMO authorization completed** | The block's **Unit** is updated with its ITMO reference identifier, *and* a **Unit ↔ Article 6 label** link is created |
| **Partial split of a block** | The retained (shrunken) side updates its existing **Unit**; the new counterparty side gets a brand-new **Unit** created |

Two points worth calling out for a business reader:

- **One registry credit block = one CAD Trust unit, for the life of the block.**
  CAD Trust offers a native "split a unit into fragments" operation; the registry
  does not use it. When a block is partially transferred or retired, the registry
  keeps the original owner's shrunken block and creates a new block for the
  counterparty's portion. Each of those blocks is its own CAD Trust unit —
  created once, then kept current by full-replacement updates — rather than one
  unit being split.

- **Only completed outcomes reach CAD Trust.** A retirement or ITMO-authorization
  request that is rejected or cancelled before completion is never published; the
  unit update is only staged once the request reaches its completed state.

Credit records are re-attempted by the same recovery mechanism as project
records (Section 7). If credit issuance itself fails, the registry records a
marker against the block so its units are picked up and retried later, rather
than being lost.

---

## 5. Data published per record

One table per CAD Trust record type. Each row is a CAD Trust field and the
registry data that supplies it.

### 5.1 Project

| CAD Trust field | Registry source |
|---|---|
| Project identifier | The project's registry reference identifier |
| Project name | The project title |
| Project registry name | The registry's published name (configurable) |
| Project link | A public URL to the project's page in this registry, built from the configured public host address |
| Project sector | The project's **sectoral scope**, translated to CAD Trust's sector vocabulary |
| Project type | The project's **sector** (the registry's coarser category field), translated to CAD Trust's project-type vocabulary, on a best-effort basis |
| Project status | The project's lifecycle stage, translated per the table in 5.2 |
| Project status date | The date the project last changed stage (its creation date if it has not changed since) |
| Project unit metric | Fixed as tonnes of CO₂ equivalent — the registry issues in this unit throughout and has no per-project metric |
| Project description | The project description captured on the INF, when present |
| Programme link | The one national crediting programme from bootstrap (Section 2) |

Two mapping choices are worth calling out for a business reader:

- The registry's **sectoral scope** feeds CAD Trust's **project sector**, and the
  registry's **sector** feeds CAD Trust's **project type**. This looks
  transposed against the field names but is not: the registry's sectoral-scope
  list is the UNFCCC/CDM sectoral-scopes taxonomy, which is what CAD Trust's
  project-sector vocabulary actually mirrors, while the registry's sector field
  has no clean equivalent and is used as the nearest available source for
  project type.
- A project update on CAD Trust is a **full replacement**, not a partial edit, so
  every field above is re-derived from the current project record on every
  update.

### 5.2 Project status translation

| Registry lifecycle stage | CAD Trust project status |
|---|---|
| Project pending / under initial assessment | Listed |
| INF approved (project registered) | Registered |
| PDD submitted or approved (any approver), validation report submitted | Listed |
| Validation report approved by the DNA | Validated |
| Project authorised | Authorized |
| INF rejected, PDD rejected (any approver), validation rejected | Rejected |
| Any stage not listed above | Listed (default) |

### 5.3 Stakeholder (the owning project developer)

| CAD Trust field | Registry source |
|---|---|
| Stakeholder name | The project developer company's name |
| Stakeholder type | Always **Developer** |
| Stakeholder link | The company's website, when set |

One stakeholder record is published per developer company and reused across every
project that company owns.

### 5.4 Location

| CAD Trust field | Registry source |
|---|---|
| Country | The deployment's configured host country name |
| Region | The province captured on the INF |
| Geographic coordinates | The geographic coordinates captured on the INF |

The location record is published only if the INF carried a province or
coordinates. A project with multiple sites still publishes a single location
record today; per-site locations are a possible future enhancement.

### 5.5 Validation

| CAD Trust field | Registry source |
|---|---|
| Validation identifier | Derived from the source document and its version, so a document that is rejected, resubmitted and re-approved produces its own distinct validation record |
| Project link | The project the validation belongs to |
| Validation type | Always **Validation of Project Design Document** — used for both the DNA PDD approval and the validation-report approval |
| Validation body | A **configurable default value**, not the name of the actual Independent Certifier — see below |
| Validation date | The approval date |
| Credit-period start and end | Taken from the PDD or validation report, when those dates are present |

**Validation body is published as a configured value, not the real certifier's
name.** CAD Trust's validation-body list is a closed international register of
accredited validation and verification bodies; a national Independent Certifier
will generally not appear on it, and the CAD Trust node rejects any name that is
not on the list. The certifier's real identity is retained in this registry's
own records; it is simply not the value published to this CAD Trust field.

### 5.6 Verification

| CAD Trust field | Registry source |
|---|---|
| Verification identifier | Derived from the project and the monitoring-cycle version, so each monitoring cycle has its own distinct verification record |
| Project link | The project the verification belongs to |
| Validation link | The project's validation record, when one has been published — omitted, not failed, if absent (e.g. a project authorised before validation sync existed) |
| Verification body | A **configurable default value**, not the name of the actual verifying body — the same closed international register as the validation body (5.5), for the same reason |
| Monitoring-period start and end | Taken from the verification report, when present |

### 5.7 Issuance

| CAD Trust field | Registry source |
|---|---|
| Issuance identifier | Shares the verification record's identifier for that monitoring cycle |
| Verification link | The verification record above |
| Project-methodology link | The project's methodology link record (5.10) |
| Location link | The project's location record, when one has been published — best-effort, omitted if absent |

One issuance record is created per project monitoring cycle. It carries no
credit volumes of its own; the amounts live on the units created against it.

### 5.8 Unit

| CAD Trust field | Registry source |
|---|---|
| Unit serial identifier | The block's registry serial number |
| Unit start block / end block | The numeric range within the serial number |
| Vintage year | The block's vintage |
| Unit count | The number of credits in the block |
| Unit metric | Fixed as tonnes of CO₂ equivalent |
| Issuance link | The issuance record the unit was created against |
| Unit status | **Held** while the block is in circulation; **Retired** once it has been retired or cancelled |
| Unit status reason | Business-readable text; while held it reads *Newly issued*, and on retirement it reflects the retirement subtype — see the translation in 5.9 |
| Unit status date | The instant the underlying block state was approved |
| Unit current owner | Follows the credit's destination — the holding company while held, and on retirement the party the credit was retired for (see 5.9) |
| ITMO reference identifier | The block's ITMO serial, once it has been ITMO-authorised |
| Unit retirement detail | The remarks captured on the retirement, when present |
| Unit retirement beneficiary | The party that benefits from the retirement (see 5.9) |
| Unit retirement beneficiary identifier | Always an externally-resolvable identifier — an ISO country code, a tax identifier, or an authorised-entity identifier — never an internal registry identifier |
| Unit type | A **configurable value with no safe default.** It is published empty until the operator sets it, deliberately, so the CAD Trust node rejects the record rather than the registry guessing a wrong value. **Set this before enabling credit sync.** |

A unit update on CAD Trust is a **full replacement**, exactly like a project
update — every field above is re-derived from the current block state on every
update.

### 5.9 Unit status reason and beneficiary translation

On retirement, the unit's status reason, current owner and beneficiary follow the
retirement subtype:

| Retirement subtype | Status reason | Current owner / beneficiary |
|---|---|---|
| Use towards the host Party's NDC (domestic MO) | "Retired for use towards the host Party's NDC" | The host Party (name and ISO country code) |
| First transfer towards the acquiring Party's NDC (ITMO) | "First transfer - retired towards the acquiring Party's NDC" | The acquiring Party (from the retirement's country) |
| First transfer for other international mitigation purposes (ITMO) | "First transfer - retired for other international mitigation purposes" | The authorised entity (name and authorised-entity identifier) |
| Voluntary cancellation | "Voluntarily cancelled" | The retiring company (with its tax identifier) |
| OMGE cancellation | "Cancelled for overall mitigation in global emissions (OMGE)" | The retiring company as owner; **no beneficiary** — OMGE benefits the atmosphere, not a party |
| A retirement with no recorded subtype (legacy) | "Retired" | The last real holder; beneficiary taken directly from the retirement record |

### 5.10 Relationship records

Three records carry no business data of their own — they only connect records
already described:

- **Project ↔ methodology** — links the project to the one methodology from
  bootstrap.
- **Stakeholder ↔ project** — links the project to its owning developer.
- **Unit ↔ Article 6 label** — links an ITMO-authorised unit to the one Article 6
  "Authorisation" label from bootstrap. It carries only the authorisation date.

---

## 6. What is not synced

- **Corresponding adjustments and cooperative-approach events.** Not synced.
- **Organisation creation.** Never performed by the registry — it is a node
  onboarding step carried out by an operator (Section 2).
- **The eight non-published lifecycle transitions** listed in Section 3.
- **Project-level Article 6.2 authorisation detail** — the authorisation
  identifier, letter-of-authorisation URL, authorisation purpose, acquiring-party
  country code and cooperative-approach identifier held against the *project*.
  The unit-level ITMO reference identifier (5.8) *is* published; this
  project-level detail is not.
- **Project credit estimates.**
- **Any inbound data from CAD Trust.** The integration is one-way (Section 7).

---

## 7. Direction, reliability, and operational behaviour

- **One-way push.** The registry publishes project and credit data to CAD Trust.
  It never reads CAD Trust records into the registry. The only inbound calls are
  control checks — confirming the organisation exists, checking whether a publish
  is still pending, and reading CAD Trust's controlled vocabularies to warn on
  drift.
- **Asynchronous and non-blocking.** No user action in the registry waits on CAD
  Trust. Someone filing an INF, approving a verification report or retiring a
  credit is never delayed or shown an error because of a CAD Trust problem; the
  sync happens in the background afterwards.
- **Isolated processing.** CAD Trust work runs on its own background lane. A slow
  or unavailable CAD Trust node cannot hold up registry email or any other
  queued work.
- **Repeat-safe.** Re-processing the same event does not create duplicate records
  on the network. Each record's sync state is tracked so an already-published
  record is left alone and an already-staged one is only re-committed.
- **Self-healing, within a limit.** A reconciliation pass runs on a configurable
  interval and also once at every service start. It re-attempts anything that
  failed and anything staged but never published, working in dependency order —
  project, then validation / verification / issuance, then unit — so a chain
  broken at several points can fully recover in a single cycle. A credit issuance
  that failed leaves a tracked marker against the block so its units are retried
  even after the issuance itself recovers. One specific failure — a publish that
  has become stuck on the node — is deliberately left for a human operator,
  because the documented fix for it affects every participant sharing that node
  and is too disruptive to trigger automatically. After a configurable number of
  consecutive failures the registry raises a clear warning naming that fix.
- **Authentication.** Every request to the CAD Trust node carries an API key,
  configured per deployment.
- **Per-record audit trail.** For every record, the registry retains its current
  sync state, the number of attempts, the last error message, and the exact
  payload last sent — available for support and audit, and surfaced in the UI
  (Section 8).
- **Vocabulary drift.** CAD Trust centrally governs its controlled vocabularies
  (sectors, project types, statuses, and so on) and can change them over time.
  The registry checks its translated values against the node's current lists and
  logs a warning on any mismatch, but never blocks a sync over a stale local
  list — the node's own response is the authority.

---

## 8. In-registry visibility

Operators do not need CAD Trust node access to see how sync is going. Every
project row (project list), credit-balance row and retirement row that has at
least one CAD Trust record shows a small **CAD Trust badge** in one of three
states — *synced*, *sync in progress*, or *sync failed*.

Opening the badge shows a detail popup for that project or credit block:

- a summary banner — total records, how many are committed (published), how many
  failed, and when sync last progressed;
- the **shared setup records** (home organisation, national programme,
  methodology, and — for credits — the Article 6 label) shown once, since they
  are common to every project;
- one card per derived record type, and within it one entry per record, each
  showing its published state, its CAD Trust identifier, the number of attempts,
  the last error if any, and — expandable — the exact field data last sent.

This surface is entirely read-only over the registry's own sync bookkeeping. It
does not call CAD Trust.

---

## 9. Configuration summary

Names and purposes only; defaults are deployment-specific and not listed.

| Setting | Purpose |
|---|---|
| Sync enable switch | Master on/off for the integration |
| Node address | Which CAD Trust node to sync to |
| Node API key | Authenticates every request to the node |
| Request timeout | How long to wait on any single CAD Trust call |
| Published registry name | The name this registry is published under on the network |
| Commit author | The author recorded against each publish |
| Organisation name | Used only for the verify-only bootstrap check and logging |
| Programme fields | Name, owning registry, registry activity identifier, optional registry programme identifier, optional description — the one national programme published at bootstrap |
| Methodology fields | Code, name, and optional version, date, link, type — the one methodology published at bootstrap |
| Validation body default | The value published on every validation record (5.5) |
| Verification body default | The value published on every verification record (5.6) |
| Unit type | The value published on every unit record (5.8) — **no default; must be set before enabling credit sync** |
| Reconciliation interval | How often the recovery pass runs |
| Stuck-publish warning threshold | Consecutive publish failures before an operator warning is raised |

The enable switch is read in two places — the service that queues sync work when
a registry event happens, and the service that performs the sync — so the
integration is only fully active when it is enabled for both.
