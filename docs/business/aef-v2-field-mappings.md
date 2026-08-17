# AEF V2 — Field Mapping Reference

**Purpose**: this document explains, in business terms, how data already held in the registry
becomes each field of the Agreed Electronic Format (AEF) — the standard reporting template
Parties file with the CARP (Common Analysis and Reporting Platform) under Article 6.2 of the
Paris Agreement. For every AEF field it states what registry data feeds it, the mapping rule
used where a translation is needed, and — just as importantly — which fields this registry
reports as **not applicable** and why. It is a mapping reference, not an implementation guide;
no code or file paths appear below.

**Decision references**: 4/CMA.6 Annex II (the AEF template and its five tables), the "List of
common nomenclatures under Article 6, paragraph 2, of the Paris Agreement" (17 February 2026 —
the controlled vocabularies referenced throughout, e.g. the fixed list of AEF sectors).

---

## 0. How to read this document

The AEF has five tables — **Submission**, **Authorizations**, **Actions**, **Holdings**, and
**Authorized entities**. Each section below covers one table. Two labels recur throughout,
explained once here rather than repeated in every row:

- **NA** — the field genuinely does not apply to this registry's data. Examples: a field that
  only means something for a different kind of underlying unit registry, which this registry
  doesn't have; or a field that only applies to a different type of action than the one being
  reported. The registry writes the literal text "NA" into the filed record, and the on-screen
  report renders it in grey italics so it reads as an intentional "not applicable" rather than a
  gap.
- **Populated by CARP** — the field is deliberately left blank by the registry, because it is
  the CARP's job to fill it in once the AEF is reviewed, not the reporting Party's. The
  on-screen report shows the same grey-italic treatment with that label instead of "NA".

A third, smaller category appears in a few places: **registry extension**. This registry's own
data (sectors, sectoral scopes) is more detailed than the AEF's fixed vocabularies allow for, so
a small number of values are routed to an "Other" option added specifically for this purpose,
pending confirmation of the exact mapping with CARP. These are flagged individually below and
summarised in Section 7.

---

## 1. Table 1 — Submission

One row per Party per reporting year, filed once and revised in place if amended.

| AEF field | Registry source |
|---|---|
| Party | The registry's configured host country, converted to its ISO 3166-1 alpha-3 code. |
| Version | The submission revision number for the year (starts at 1.0). |
| Reported year | The reporting year the row covers. |
| First / last year of the NDC implementation period | The registry's configured NDC period (defaults to 2021–2030, overridable). |
| Date of submission | Blank until the year is actually filed — there is nothing to report before that moment. The on-screen report shows **"Not Submitted"** (same grey-italic treatment as NA) rather than a blank cell. |

**Populated by CARP**: Review status of the initial report, Result of the consistency check of
this AEF submission, Reference to the Article 6 technical expert review report.

---

## 2. Table 2 — Authorizations

One row per ITMO authorization — the point at which a domestic Mitigation Outcome becomes
eligible for international use under a Cooperative Approach.

### 2.1 Sector

Every authorized project has a registry sector; the AEF's own sector vocabulary is shorter, so
several registry sectors are mapped onto AEF sectors that don't have an exact one-to-one match.

| Registry sector | AEF sector |
|---|---|
| Energy | Energy generation |
| Agriculture | Agriculture |
| Health | Urban development *(registry extension — see Section 7)* |
| Education | Urban development *(registry extension — see Section 7)* |
| Transport | Transportation |
| Manufacturing | Industrial processes |
| Hospitality | Urban development *(registry extension — see Section 7)* |
| Forestry | Forestry and land use |
| Waste | Waste management |
| Other | Other *(registry extension — see Section 7)* |

### 2.2 Activity type

Every project also has a sectoral scope (a finer-grained classification than sector). The AEF's
activity-type list doesn't have a slot for every registry sectoral scope, so scopes with no
confident match are routed to "Other", pending exact mapping with CARP.

| Registry sectoral scope | AEF activity type |
|---|---|
| Energy Industries (Renewable / Non Renewable sources) | Energy Efficiency own generation |
| Energy Distribution | Energy distribution |
| Energy Demand | Energy Efficiency households |
| Agriculture | Agriculture |
| Afforestation and Reforestation | Afforestation |
| Manufacturing Industries | Cement |
| Chemical Industries | N2O |
| Metal Production | C02 usage *(the source nomenclature itself spells this with a digit zero, not the letter O — preserved exactly, since the value has to match what CARP accepts)* |
| Transport | Transport |
| Fugitive Emissions from Fuels (Solid, Oil and Gas) | Fugitive |
| Waste Handling and Disposal | Waste |
| Construction | Energy Efficiency service |
| Mining/Mineral Production | Fossil fuel switch |
| Fugitive Emissions from Production and Consumption of Halocarbons and Sulphur Hexafluoride | PFCs and SF6 |
| Solvent Use | Energy Efficiency Industry |
| N/A (no sectoral scope recorded) | Other *(registry extension — see Section 7)* |

### 2.3 Other Table 2 fields

| AEF field | Registry source / rule |
|---|---|
| Purposes for authorization | Registry authorization purpose → **NDC** stays NDC, **OIMP** stays OIMP, **Other** maps to **OP** (registry extension — see Section 7). |
| Authorized party(ies) ID / Authorized entity(ies) ID | Reported as fixed descriptive text ("Cooperative Approach Parties" / "Cooperative Approach Entities") rather than an individually resolved list — this registry does not (yet) break an authorization down to specific counterpart Parties or entities. |
| OIMP authorized by the Party | Fixed text ("Towards Cooperative Approach Entities") when the purpose is OIMP; **NA** otherwise. |
| Authorized timeframe | The start/end year entered when the authorization was requested, if both were given; otherwise blank. |
| Authorization terms and conditions | A fixed sentence stating the authorization's conditions may not be modified. |
| First transfer definition for OIMP | Fixed text ("Use or Cancellation") when the purpose is OIMP; **NA** otherwise. |

**Populated by CARP**: Authorization documentation.

**NA on every Table 2 row**: Applicable GWP value(s), Applicable non-GHG metric — this registry
always reports in the GHG metric, so a GWP value or a non-GHG metric never applies.

---

## 3. Table 3 — Actions

One row per action taken on an ITMO: its authorization, or its later first transfer / use /
cancellation.

### 3.1 Action type and subtype

An ITMO authorization event is always reported as **Authorization / Authorization**. A later
retirement is mapped from its registry subtype:

| Registry retirement subtype | AEF action type | AEF action subtype |
|---|---|---|
| First Transfer Towards NDC | First transfer | First transfer to another Party |
| First Transfer For OIMP | First transfer | Use or cancellation |
| OMGE Cancellation | Cancellation | Voluntary cancellation to deliver OMGE |
| Voluntary Cancellation | Voluntary Cancellation | Other cancellations |

*(Use Towards NDC — a domestic retirement of an unauthorized Mitigation Outcome — never appears
here: it stays entirely within the host country's own accounting and is not an ITMO action.)*

### 3.2 Mitigation type (emission reductions vs. removals)

| Registry sectoral scope | AEF mitigation type |
|---|---|
| Afforestation and Reforestation | Removals |
| Every other sectoral scope | Emission reductions *(the registry's configured default)* |

Afforestation/reforestation is the one activity in this registry's portfolio that removes carbon
already in the atmosphere rather than reducing new emissions, so it's the only sectoral scope
mapped to Removals; every other project is reported as an emission reduction.

### 3.3 Party ITMO registry ID

Derived automatically from the reporting Party's code plus a fixed two-digit suffix (e.g.
`NGA01`) — there is no separate registry-assigned identifier for this yet, so the derived value
is used unless a real CARP-assigned one is configured to override it.

### 3.4 NA on every Table 3 row

Regardless of whether the row is an Authorization or a later action:

| AEF field | Why NA |
|---|---|
| Underlying unit registry ID | This registry has no underlying-unit-registry concept — an ITMO here doesn't derive from a unit issued in a separate external registry. |
| First / Last unit ID | Same reason — there is no underlying unit to identify. |
| Applicable GWP value(s) | Always the GHG metric. |
| Applicable non-GHG metric | Always the GHG metric. |
| Quantity (in non-GHG metric) | Always the GHG metric. |
| Transferring participating Party ID | Only applies to an "Acquisition" action, which this registry never performs. |
| Additional explanatory information | Nothing further to add beyond the other fields on any row. |

### 3.5 NA by action and retirement subtype

The remaining four fields depend on what kind of action the row represents:

| AEF field | Authorization row | Voluntary / OMGE cancellation | First Transfer Towards NDC | First Transfer For OIMP |
|---|---|---|---|---|
| Acquiring participating Party ID | NA | NA | the acquiring Party | the acquiring Party |
| Using/cancelling participating Party ID | NA | NA | the acquiring Party *(the same Party is doing the "using")* | NA |
| Using/cancelling authorized entity ID | NA | NA | NA | the authorized entity used, if one was specified |
| Purpose for which the ITMO has been used towards or cancelled for OIMP | NA | NA | NA | a note naming the authorized entity the ITMO was transferred to |

A cancellation never crosses a border, so none of these four fields describe it. A domestic
first transfer towards NDC has an acquiring/using Party but no authorized entity. An OIMP first
transfer has an acquiring Party and (optionally) an authorized entity, but no separate
"using Party" — the authorized entity fills that role instead. An Authorization event describes
none of these — it isn't a transfer or cancellation at all.

**Populated by CARP**: Result of the consistency checks.

---

## 4. Table 4 — Holdings

One row per ITMO block still held (or held as at a past instant, for a filed year). Table 4
shares the same underlying block data as Table 3 — cooperative approach, authorization ID,
first transferring Party, Party ITMO registry ID, the block's first/last ID, metric, quantity,
mitigation type (Section 3.2 applies identically here), and vintage year.

**Live vs. filed**: for the current, still-open reporting year, Holdings is computed fresh from
the registry's live records every time it is viewed or exported — marked **provisional**,
because the figure can still change as blocks move. Once a year is closed, its Holdings are
frozen as a snapshot at that moment (typically 31 December) and no longer change.

**NA on every Table 4 row**: Underlying unit registry ID, First / Last unit ID, Applicable GWP
value(s), Applicable non-GHG metric, Quantity (in non-GHG metric) — same reasons as Table 3
(Section 3.4); Table 4 has no Transferring participating Party ID field, so there is nothing
equivalent to NA there.

---

## 5. Table 5 — Authorized entities

One row per organisation named as authorized to act under a Cooperative Approach.

| AEF field | Registry source |
|---|---|
| Date of authorization | The date the entity was authorized. |
| Name | The entity's legal name. |
| Country of incorporation | The entity's country of incorporation, converted to its ISO alpha-3 code. |
| Identification number | The entity's registry identifier, or an internal reference if none has been assigned yet (see Section 7). |
| Cooperative approach ID | The Cooperative Approach the entity is authorized under. |
| Conditions | The entity's current status (Active or Inactive). |
| Change and revocation conditions | A fixed sentence describing that authorities can set an entity to Active or Inactive. |
| Additional explanatory information | **Always NA** — nothing further to add beyond the fields above; a deactivation is already visible in Conditions. |

**Live vs. filed**: same as Table 4 — the current year's list is computed live from the
registry's authorized-entity records (provisional), and is frozen as a snapshot once the year is
closed.

---

## 6. Quick reference — every NA field, by table

| Table | Field | Scope |
|---|---|---|
| Authorizations | Applicable GWP value(s) | Every row |
| Authorizations | Applicable non-GHG metric | Every row |
| Authorizations | OIMP authorized by the Party | Non-OIMP purpose only |
| Authorizations | First transfer definition for OIMP | Non-OIMP purpose only |
| Actions | Underlying unit registry ID | Every row |
| Actions | First / Last unit ID | Every row |
| Actions | Applicable GWP value(s) | Every row |
| Actions | Applicable non-GHG metric | Every row |
| Actions | Quantity (in non-GHG metric) | Every row |
| Actions | Transferring participating Party ID | Every row |
| Actions | Additional explanatory information | Every row |
| Actions | Acquiring participating Party ID | Authorization rows and cancellations |
| Actions | Using/cancelling participating Party ID | Authorization rows, cancellations, and OIMP first transfers |
| Actions | Using/cancelling authorized entity ID | Authorization rows, cancellations, and NDC first transfers |
| Actions | Purpose for which the ITMO has been used towards or cancelled for OIMP | Authorization rows, cancellations, and NDC first transfers |
| Holdings | Underlying unit registry ID | Every row |
| Holdings | First / Last unit ID | Every row |
| Holdings | Applicable GWP value(s) | Every row |
| Holdings | Applicable non-GHG metric | Every row |
| Holdings | Quantity (in non-GHG metric) | Every row |
| Authorized entities | Additional explanatory information | Every row |

---

## 7. Open items / pending CARP confirmation

- **Sectors and activity types routed to "Other"** (Health, Education, Hospitality, and the
  registry's own "Other" sector; several sectoral scopes with no confident activity-type match).
  This registry's controlled vocabularies are more detailed than the AEF's, so these are placed
  in a registry-added "Other" option rather than forced onto an ill-fitting AEF value. The exact
  mapping is to be agreed with CARP.
- **"Other" authorization purpose mapped to "OP"** — the closest available fit in the AEF's
  purpose list; to be confirmed against a live CARP template.
- **Authorized-entity identification number** — where CARP has not assigned one, the registry's
  own internal reference is reported instead, so every entity remains exportable. Flagged in
  case this proves the wrong convention once CARP assigns real identifiers.
- **Holdings reconstruction for a past instant** is an approximation, not an exact replay: a
  block that moved after the requested instant is shown at its current position rather than its
  position at that instant (a sibling block from the same movement makes the overall total
  correct even so), and the exact moment a block became an ITMO can become unavailable once a
  later movement overwrites it. Both are edge cases inherent to how block history is currently
  stored, not reporting errors.
