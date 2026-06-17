# Article 6.2 Compliance — Remediation Plan

**Scope:** Article 6.2 (cooperative approaches / ITMOs) only. Article 6.4 mechanism and 6.8
non-market approaches are out of scope.

**Status:** Audit complete. All 14 findings below were verified against the current code
(file:line evidence cited). Items marked 🔒 are interpretation-sensitive and must be confirmed by
an Article 6.2 subject-matter expert (SME) **before** code changes; everything else is an
unambiguous wiring/validation gap and can be implemented directly.

**Governing decisions** (in `docs/a6/`):

- `cma2021_10a01E.pdf` → **Decision 2/CMA.3** (A6.2 guidance + annex) — the substantive rulebook.
- `cma2022_10a02_adv.pdf` → **Decision 6/CMA.4** (A6.2 matters + Annex "Actions"/"Holdings" tables).

---

## Priority overview

| #   | Finding                                  | Change?     | Effort            | SME gate | Phase |
|-----|------------------------------------------|-------------|-------------------|----------|-------|
| F1  | Emissions-balance formula wrong          | Yes         | 1-line            | 🔒       | 2     |
| F2  | Single vs multi-year not applied         | Yes         | Large             | 🔒       | 3     |
| F3  | OMGE/SOP auto-deducted as mandatory      | Yes         | Small             | 🔒       | 2     |
| F4  | `authorizationPurpose` never set         | Yes         | Small/Med         | No       | 1     |
| F5  | No "NDC and OIMP" dual purpose           | Yes         | Small + migration | 🔒       | 2     |
| F6  | First-transfer definition not per-auth   | Yes         | Med + migration   | 🔒       | 2     |
| F7  | Authorized entities not linked to CA     | Yes         | Med + migration   | No       | 1     |
| F8  | Annual Information is a placeholder       | Yes         | Large             | No       | 1     |
| F9  | Exports drop 3 columns                   | Yes         | Small             | No       | 1     |
| F10 | Non-GHG metrics unsupported              | Conditional | Large             | 🔒       | 3     |
| F11 | Initial report missing sections          | Yes         | Med + migration   | No       | 1     |
| F12 | CA-adjustment status workflow incomplete | Yes         | Small/Med         | No       | 1     |
| F13 | Safeguard check silent-passes            | Yes         | 1-line            | No       | 1     |
| F14 | Vintage unvalidated; dead enum           | Yes         | Small             | No       | 1     |
| F15 | First transfers lost on partial/split    | Yes         | Small/Med         | No       | 1     |

**Phase 1 (no gate, do now):** F4, F7, F8, F9, F11, F12, F13, F14, F15
**Phase 2 (post-SME, accounting/financial-equivalent values, needs data migration plan):** F1, F3, F5, F6
**Phase 3 (post-SME, conditional on host NDC):** F2, F10

---

## F1 — Corresponding-adjustment emissions-balance formula 🔒

**Severity:** High · **Decision basis:** Dec 2/CMA.3 para 8

**Decision text** (Dec 2/CMA.3, annex, para 8):

> **8.** Each participating Party with an NDC measured in t CO2 eq shall apply corresponding
> adjustments pursuant to paragraph 7 above, resulting in an emissions balance … by applying
> corresponding adjustments in the following manner …:
> **(a)** **Adding** the quantity of ITMOs authorized and first transferred, for the calendar year
> in which the mitigation outcomes occurred …;
> **(b)** **Subtracting** the quantity of ITMOs used pursuant to paragraph 7 above for the calendar
> year in which the mitigation outcomes are used towards the implementation and achievement of
> the NDC …

The text defines exactly two terms — `+ first transferred`, `− used` — and **no `acquired` term**.
(Note: para 9(a)/(b), the non-GHG case, flip these signs, so the SME should confirm the registry
isn't conflating the GHG and non-GHG sign conventions.)

**Current code:** `corresponding-adjustment.service.ts:105-106`

```ts
const emissionsBalance =
  firstTransferredItmos - acquiredItmos + usedTowardsNdcItmos;
```

The comment immediately above (`:102-104`) states the correct rule — *add* ITMOs authorized and
first transferred, *subtract* ITMOs used towards the NDC — but the expression contradicts it: it
includes a spurious `- acquiredItmos` term and *adds* (rather than subtracts) `usedTowardsNdcItmos`.

**What to do:** Align to para 8:

```ts
const emissionsBalance =
  firstTransferredItmos - usedTowardsNdcItmos;
```

Drop the `acquired` term (acquisition is *recorded* as a reported quantity but is not itself an
adjustment trigger — *use* is) and flip the sign on `used`.

**Considerations / SME questions:**
- Confirm whether ITMOs *authorized but not yet first-transferred* should be counted in the balance,
  or only those actually first-transferred (the code currently uses first-transferred).
- This changes a financial-equivalent quantity → existing corresponding-adjustment records must be
  recomputed. Needs a backfill/migration plan and a worked-example regression test from para 8.

**Related:** the `firstTransferredItmos` input to this formula is itself under-counted by **F15**
(partial/split first transfers are dropped). Fixing the formula without fixing F15 still yields a
wrong balance — address both together.

---

## F2 — Single-year vs multi-year accounting not applied 🔒

**Severity:** High · **Decision basis:** Dec 2/CMA.3 para 7(a)(i),(ii),(b); para 12

**Decision text** (Dec 2/CMA.3, annex, paras 7 and 12):

> **7.** … Each participating Party shall apply **one of the following methods** consistently
> throughout the NDC period:
> **(a)** Where the participating Party has a **single-year NDC**:
> **(i)** Providing an indicative multi-year emissions trajectory … and annually applying
> corresponding adjustments for the total amount of ITMOs first transferred and used for each year …;
> **(ii)** Calculating the **average annual amount** of ITMOs first transferred and used over the
> NDC implementation period, **by taking the cumulative amount of ITMOs and dividing by the number
> of elapsed years** … and applying corresponding adjustments equal to this average amount in the
> NDC year;
> **(b)** Where the participating Party has a **multi-year NDC**, calculating a multi-year emissions
> trajectory … and annually applying corresponding adjustments … **and cumulatively at the end of
> the NDC implementation period.**

> **12.** Additions and subtractions for an NDC implementation period shall be considered **final,
> prior to the initiation of the review of the first biennial transparency report** that contains
> information on the end year or end of the period of the NDC …

Three distinct computation paths (trajectory, averaging-by-elapsed-years, multi-year cumulative)
plus a finalization state are mandated.

**Current code:** `NdcType {SingleYear, MultiYear}` (`ndc.type.enum.ts:1-4`) and
`CaMethod {Trajectory, Averaging, MultiYear}` (`ca.method.enum.ts:1-5`) are accepted into
`calculateCA` (`corresponding-adjustment.service.ts:37-38`) and persisted (`:142-143`), but they
appear in **no** `if`/`switch`/arithmetic anywhere in the computation. The math is identical
regardless of method.

**What to do:** Branch the computation on `caMethod`:
- Single-year + trajectory → annual adjustments.
- Single-year + averaging → cumulative ÷ elapsed years across the NDC period.
- Multi-year → trajectory + annual + **cumulative at period end**.
- Add a finalization state (para 12: adjustments become final before the relevant BTR review).

This requires replacing the single-year transaction window (`:49-50`) with a period-aware
aggregation and adding multi-year cumulative tracking. Non-trivial domain logic.

**Considerations / SME questions:**
- Confirm the exact averaging denominator (elapsed years vs full NDC period years).
- Confirm the finalization trigger and whether finalized adjustments are immutable.
- Only fully required if host Parties actually use multi-year NDCs / averaging.

---

## F3 — OMGE/SOP auto-deducted as mandatory 🔒

**Severity:** High · **Decision basis:** Dec 2/CMA.3 Ch VII–VIII (A6.2 = *encouraged*, voluntary —
mandatory deduction is an Article 6.4 mechanism rule)

**Decision text** (Dec 2/CMA.3, annex, chapter VII, paras 37 and 39):

> **37.** Participating Parties and stakeholders using cooperative approaches are **strongly
> encouraged to commit to contribute resources for adaptation**, in particular through
> contributions to the Adaptation Fund …

> **39.** Participating Parties and stakeholders are **strongly encouraged to cancel ITMOs** that
> are not counted towards any Party's NDC … **to deliver overall mitigation in global emissions** …

For Article 6.2, share-of-proceeds-for-adaptation (SOP, 5%) and overall mitigation in global
emissions (OMGE, 2%) are *"strongly encouraged"* — voluntary. Mandatory levies live in the
**separate** Article 6.4 mechanism (Decision 3/CMA.3, which immediately follows this chapter in the
same PDF). The registry's `autoDeductAtIssuance = true` default treats them as mandatory 6.4-style
deductions: of every 100 ITMOs issued it would skim 5 (SOP, to the Adaptation Fund) + 2 (OMGE,
cancelled outright) = 7.

**Current code:**
- Config default is opt-out (true): `configuration.ts:140-145` (`autoDeductAtIssuance` defaults true).
- Service reader `getDeductionConfig` (`programme-ledger.service.ts:2894-2905`) defaults true via `!== false`.

**The deduction is currently cosmetic — it changes no credit amounts.** This is the most important
thing to understand about F3:

- At issuance (`programme-ledger.service.ts:491-496`), when auto-deduct is on, the code only sets two
  boolean flags — `omgeDeductedAtIssuance = true` and `sopDeductedAtIssuance = true`. The block's
  `creditAmount` is left **unchanged**.
- `calculateDeductions` (`:2911-2928`), the function that would actually subtract the 2% + 5%, is
  **dead code** — it has no production callers (only `admin.controller.ts:50` reads the *config*).
- Net effect: every issued block is **labelled** "OMGE/SOP deducted" (when default-on) while **no
  ITMOs are actually removed**. The data is misleading in both directions — the flags claim a
  deduction that the amounts don't reflect.

**Provenance / data impact:** the entire OMGE/SOP mechanism is new — introduced by the recent
Article 6 work in commit `3e9481436` ("feat: Add OMGE/SOP deduction configuration and calculation
(Phase 3)"). There was **no deduction concept in the registry before** that work (a history search
finds no prior share-of-proceeds / levy mechanism). Because the post-Phase-3 implementation is
cosmetic, **no real OMGE/SOP deduction has ever executed** — not before the A6 work, and not after.
F3 is therefore about a *new, half-wired, default-on* feature to correct, not about unwinding
deductions that genuinely occurred. No data backfill is required for credit amounts; at most the
misleading boolean flags on existing rows need resetting.

**What to do:**
- Flip the default to opt-in: `configuration.ts:143-144` default `false`;
  `programme-ledger.service.ts:2902-2903` change `!== false` to `=== true`.
- Decide between (a) removing the misleading flag-set at `:491-496`, or (b) wiring real
  per-CA voluntary opt-in behavior that actually adjusts amounts via `calculateDeductions`.

**Considerations / SME questions:**
- Confirm A6.2 treats OMGE and share-of-proceeds-for-adaptation as voluntary/encouraged for this
  registry's use case (vs. a host-Party policy that mandates them).
- If voluntary deductions are kept, define them as an explicit opt-in *action*, not an automatic
  issuance deduction.

---

## F4 — `authorizationPurpose` never populated in production

**Severity:** High · **Decision basis:** Dec 2/CMA.3 para 1, 23(d); 6/CMA.4 Annex · **No gate**

**Current code:** The `authorizationPurpose` column exists on `projects.entity.ts:94-100`,
`credit.blocks.entity.ts:75`, `credit.transactions.entity.ts:80`, `aef.actions.table.entity.ts:62`,
but `grep` for `.authorizationPurpose =` outside tests returns nothing. It is only ever *read* and
propagated from `project.authorizationPurpose` (always null — e.g.
`credit-blocks-management.service.ts:270`). No DTO captures it
(`programme.auth.ts` / `programme.approve.ts` / `project.create.dto.ts` have no such field).
Result: the AEF "Purposes for authorization" column is empty in real data.

**What to do:**
- Add `authorizationPurpose?: AuthorizationPurpose` to the authorization DTO (`programme.auth.ts`,
  and/or `programme.approve.ts` per which step authorizes ITMOs).
- Set `project.authorizationPurpose` from that DTO in the APPROVE_VALIDATION / authorization write
  path in `programme-ledger.service.ts` so it cascades to blocks/transactions/AEF rows that already
  read it.
- Surface the field in the authorization UI.

**Considerations:** Ties to F5 — if "NDC and OIMP" is added, the DTO/UI should offer it.

---

## F5 — No "NDC and OIMP" dual purpose 🔒

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 18(d–e); 6/CMA.4 Annex ("NDC and OIMP")

**Decision text** (6/CMA.4 Annex, Actions table "Purposes for authorization" column + note o):

> *(column rows)* … **OIMP** … **NDC and OIMP** … Use or cancellation
> **o** To be completed when "Purposes for authorization" is "**OIMP**" or "**NDC and OIMP**".

The official AEF reporting table enumerates **NDC / OIMP / NDC and OIMP** as three distinct
authorization purposes; the registry enum has only `NDC | OIMP | OTHER` and cannot express the
combined value.

**Current code:** `authorization.purpose.enum.ts:1-5` is single-value
(`NDC = "UseTowardsNDC"`, `OIMP = "OtherInternationalMitigationPurposes"`, `OTHER = "OtherPurposes"`),
stored as a Postgres `enum` column on five entities. It cannot represent the combined "NDC and OIMP"
option that the 6/CMA.4 Annex enumerates. The code already references the gap:
`annualreport/annual.report.gen.ts:506` reads `... when "Purposes for authorization" is "OIMP" or "NDC and OIMP"`.

**What to do:** Add a fourth member (e.g. `NDC_AND_OIMP = "UseTowardsNDCandOIMP"`) and a TypeORM
migration that runs `ALTER TYPE ... ADD VALUE` for each affected enum column. No column-shape change.

**Considerations / SME questions:**
- Confirm whether purposes should be a single enum (adding one combined value) or modelled as a set
  (multi-value). A set is more faithful but a larger schema change.

---

## F6 — First-transfer definition not per-authorization 🔒

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 2(b); 6/CMA.4 Annex note p

**Decision text** (Dec 2/CMA.3, annex, para 2(b); 6/CMA.4 Annex note p):

> **2.** A "first transfer" is:
> **(b)** For a mitigation outcome authorized … for **other international mitigation purposes**,
> **(1) the authorization, (2) the issuance or (3) the use or cancellation** of the mitigation
> outcome, **as specified by the participating Party.**

> *(6/CMA.4 Annex, note p, attached to the "First transfer definition" column):* **p** If OIMP is
> authorized, **the first transferring participating Party** definition of "first transfer" as per
> decision 2/CMA.3, annex, para. 2(b).

The choice among authorization/issuance/use is made *per OIMP authorization by the Party*, and the
AEF table has a dedicated per-row "First transfer definition" column; the registry uses one global
env var for all authorizations.

**Current code:** `firstTransferDefinition` is a single global env value
(`configuration.ts:157-158`, default `"Authorization"`), consumed flatly in AEF generation
(`aef-report-management.service.ts:320, 355, 364`). There is no per-CA / per-authorization column
(`cooperative.approach.entity.ts` has none). Para 2(b) lets the first transferring Party specify,
per OIMP authorization, which event (authorization / issuance / use-or-cancellation) is the first
transfer.

**What to do:** Add a nullable `firstTransferDefinition` column to `CooperativeApproach` + the
create/update DTOs + a migration; have AEF generation prefer the per-CA value and fall back to the
config default.

**Considerations / SME questions:**
- Confirm the allowed set of first-transfer events and whether it applies only to OIMP authorizations.

---

## F7 — Authorized entities not linked to the cooperative approach (nor reported)

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 18(g), 23(d) · **No gate**

**The entities already exist — this is NOT a missing entity model.** Project developers and other
actors are first-class records: `CompanyRole.PROJECT_DEVELOPER = "PD"` (`company.role.enum.ts`,
alongside DNA, certifier, ministry, etc.); they hold ITMO accounts keyed by `companyId`
(`itmo.account.entity.ts:10-18`); and credit blocks carry `ownerCompanyId` and are transferred
between companies (`programme-ledger.service.ts`). So the trading entities are in the system. The
finding is narrower than "no authorized entities exist."

**The actual gap — two parts:**

1. **No authorization linkage (entity ↔ cooperative approach).** `cooperative.approach.entity.ts`
   references **no company at all** — only `participatingParties`/`hostParty` (country codes,
   `:13-14`) and a single `authorizationDocumentUrl` (`:45-46`); the create/update DTOs expose only
   those. A repo-wide search for `authorizedEntit*` returns zero hits. The only entity↔CA connection
   is indirect and backwards: a credit *block* carries `cooperativeApproachId` and also has an
   `ownerCompanyId` — but *owning a CA-tagged block* is not the same as *the Party having authorized
   that company under that CA*. "Has an account and can trade" ≠ "is authorized": authorization is the
   Party formally naming **which** entities are empowered **for a given cooperative approach**, and
   that fact is never recorded.

2. **AEF reports identify holders by Party, not entity.** The Actions/Holdings tables emit
   country-level identifiers — `aquiringParty`, `acquiringPartyCountryCode`, `transferingParty` — and
   the acquiring party is pulled from a **config default** (`AEF.defaultAquiringParty`,
   `aef-report-management.service.ts:137`), not the owning company. `ownerCompanyId` is never mapped
   into any AEF output column, so the para 23(d) "entities authorized to use such mitigation outcomes"
   cannot be populated even though the entity is present on the block. (`companyId`/`companyName`
   appear only in the non-Article-6 company/user/transfer exports.)

**What to do** (link existing companies + surface them — *not* build a new entity model):
- Record, at authorization time, **which existing `Company` records are authorized under the
  cooperative approach** — a join between `CooperativeApproach` (or the authorization record) and
  `Company`, rather than a free-text blob, since the companies already exist. Add to the relevant DTOs
  + a migration.
- Map the holder/acquirer **company** (not just country) into the AEF Actions/Holdings output (ties
  into F8/F9).
- Include the authorized-entity list in the initial report (ties into F11).

**Considerations:** Prefer a normalized link (CA ↔ Company join) over a jsonb blob precisely because
the entities are existing records you'll want to reference and report per entity. If a CA can
authorize entities with different roles (e.g. developer vs. user), capture the role on the link.

---

## F8 — Annual Information report is a placeholder

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 20, 23(c–k) · **No gate**

**Current code:** `AefReportTypeEnum.ANNUAL_INFORMATION`
(`aef-report-management.service.ts:263-266`) just calls `prepareActionsData(resp)` — the same
per-action row dump as ACTIONS, with no aggregation. There is no structured para-23 summary
(first transferred, OIMP-authorized, used-towards-NDC, net, corresponding adjustments, cumulative,
emissions balance, broken down per CA/sector/Party/vintage). Additional bug: the XLSX branch
(`:412-435`) has no `ANNUAL_INFORMATION` case, so XLSX exports of this type write **no rows**.

**What to do:** Add a real `prepareAnnualInformationData(resp)` that aggregates AEF action rows into
the para-23 structured summary (group by CA/sector/Party/vintage; sum first-transferred,
OIMP-authorized, used-towards-NDC; compute net, corresponding adjustments, cumulative via
`cumulativeAmount`, emissions balance), wire it into the switch, and add a matching XLSX case +
template.

**Considerations:** This depends on F9 (cumulative/CA-id columns) and overlaps F1/F2 for the
balance math. Sequence after F9.

---

## F9 — Exports drop `reportingYear`, `cumulativeAmount`, `cooperativeApproachId`

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 20(b); 6/CMA.4 Annex columns · **No gate**

**Current code:** In `queryAefRecords` the records carry the entity columns (spread as
`{ ...record, ... }`, `:214-218`), but `prepareActionsData` (`:328-370`) and `prepareHoldingsData`
(`:293-326`) hand-copy a fixed field list and never assign `reportingYear`, `cumulativeAmount`, or
`cooperativeApproachId`. (`reportingYear`/`cooperativeApproachId` are declared on
`data.export.actions.dto.ts`; `cumulativeAmount` is on the entity but not even on the DTO.)

**What to do:**
- `prepareActionsData`: add `dto.reportingYear = report.reportingYear;`
  `dto.cooperativeApproachId = report.cooperativeApproachId;`, add `cumulativeAmount` to
  `DataExportActions` and assign it.
- `prepareHoldingsData`: add `dto.cooperativeApproachId = report.cooperativeApproachId;`.
- Add matching template columns in `fillTemplate` (fixed header order — new keys are ignored without
  template columns).

---

## F10 — Non-GHG metrics unsupported (conditional) 🔒

**Severity:** Medium\* · **Decision basis:** Dec 2/CMA.3 para 9, 22(d), 23(k)(ii)
· \*only if the host Party's NDC uses non-GHG metrics

**Decision text** (Dec 2/CMA.3, annex, paras 9, 22(d), 23(k)(ii)):

> **9.** Each participating Party with an NDC containing **non-GHG metrics** … shall apply
> corresponding adjustments … **on the basis of ITMOs recorded in a metric-specific registry
> account**, resulting in an **annual adjusted indicator** …

> **22(d).** Where a mitigation outcome is measured and first transferred in a non-GHG metric …,
> ensures that **the method for converting the non-GHG metric into t CO2 eq is appropriate** …
> including a demonstration of how the selection of the conversion method and **conversion
> factor(s)** applied take into consideration the specific scenario …

> **23(k)(ii).** Non-GHGs, for each non-GHG metric determined by participating Parties, **annual
> adjustments resulting in an annual adjusted indicator**, consistently with paragraph 9 …

Non-GHG ITMOs require a *metric-specific account*, *conversion factors/methods*, and an
*adjusted-indicator* path — none of which the registry has.

**Current code:** `itmoType` can name a non-GHG metric (`serial-number-management.service.ts:142-167`),
but there is no metric machinery: `conversionFactor` in AEF output is the static literal `"NA"`
(`configuration.ts:153`), `metric` is a single global config value (`EMISSION_METRIC || "tCO2"`,
`:151`), `creditAmount` is a plain number summed/transferred with no conversion, and there is no
metric-specific account. Para 9 requires non-GHG ITMOs in a metric-specific account with an annual
adjusted indicator; para 22(d)/23(k)(ii) require conversion methods.

**What to do (only if non-GHG metrics are in scope):** add metric + conversionFactor to the
CA/credit-block model, populate AEF `metric`/`conversionFactor`/`quantityInMetric` per block, and
apply conversion in aggregation (relevant to F8's net/cumulative). Otherwise: no change — for a
pure-GHG (tCO2e) host NDC the current hardcoding is correct.

**Considerations / SME questions:** Confirm whether any participating host NDC uses non-GHG metrics.

---

## F11 — Initial report missing sections

**Severity:** Medium · **Decision basis:** Dec 2/CMA.3 para 18(d), 18(g–i) · **No gate**

**Current code:** `initial.report.entity.ts:21-37` has six content buckets
(`participationDemonstration`, `itmoMetrics`, `caMethodDescription`, `ndcQuantification`,
`cooperativeApproachDetails`, `environmentalIntegrity`) — **no** SD / human-rights / gender /
safeguards section (para 18(i)) and no authorized-entities list. Confirmed across the entity and
both DTOs. Worse: `ndcQuantification` is typed `any`, `@IsOptional()`, defaults all-null
(`initial-report.service.ts:86-92`), and `submitReport` (`:225`) only checks the object is truthy —
so submission passes with empty quantification.

**What to do:**
1. Add a `sustainableDevelopment` (SD/human-rights/gender/safeguards) jsonb field and an
   `authorizedEntities` field to the entity + both DTOs + a migration.
2. Include both in the `generateDraft` defaults and the `update` merge block.
3. Add them (at least the SD section) to the `submitReport` completeness check (`:222-234`).
4. Optionally replace the `any` NDC-quantification typing with a validated nested DTO so submission
   enforces real values instead of truthiness.

**Considerations:** `authorizedEntities` should reuse the F7 shape.

---

## F12 — CorrespondingAdjustment status workflow incomplete

**Severity:** Low/Med · **Decision basis:** internal integrity · **No gate**

**Current code:** **Note** — this concerns the `CaStatus` enum on the *CorrespondingAdjustment*
feature, **not** the cooperative-approach service (which already has terminal-state and
revert-to-Draft guards in `cooperative-approach.service.ts:142-176`). For CorrespondingAdjustment:
`ca.status.enum.ts:1-5` defines `DRAFT/SUBMITTED/APPROVED`, but `APPROVED` is never assigned (only
DRAFT at `corresponding-adjustment.service.ts:154` and SUBMITTED at `:219`); `submit` (`:208-223`)
sets SUBMITTED unconditionally from any state (not idempotent-safe, no Draft-only guard); the
controller (`corresponding-adjustment.controller.ts`) exposes only `calculate/query/get/submit`, no
`approve`.

**What to do:**
- Add a Draft-only guard in `submit` (reject with BAD_REQUEST if `status !== DRAFT`).
- Add an `approve` service method (`SUBMITTED → APPROVED`, guarded) + a controller endpoint with the
  appropriate approver policy — or remove the dead `APPROVED` state if no approval gate is intended.

---

## F13 — Safeguard check silent-passes on missing data

**Severity:** Low/Med · **Decision basis:** Dec 2/CMA.3 para 7 ("no net increase") · **No gate**

**Current code:** `corresponding-adjustment.service.ts:123` inits `safeguardCheckPassed = true`; the
missing-data `else` branch (`:132-135`) only sets `safeguardNotes` ("could not be performed") and
never flips the boolean. The record is persisted with `safeguardCheckPassed = true` while the notes
say the check could not run. (The entity default at `corresponding.adjustment.entity.ts:59` is
`false`, but the service always overwrites it at `:152`.)

**What to do:** In the `else` branch set `safeguardCheckPassed = false`. If "indeterminate" must be
distinguished from "failed," change the column to `boolean | null` and set it `null` here.

---

## F14 — Vintage unvalidated; `HOLDINGS_SNAPSHOT` dead enum

**Severity:** Low · **Decision basis:** Dec 2/CMA.3 para 23(j) (vintage required) · **No gate**

**Current code:**
- `vintage` input DTO `activty.vintage.credits.dto.ts:10-12` is only `@IsString()` + `@IsNotEmpty()`;
  stored as plain text (`credit.blocks.entity.ts:51-52`, `aef.actions.table.entity.ts:26-27`). The
  only sanity check anywhere is a `> currentYear` guard in document-management
  (`document-management.service.ts:516, 722`), not on the DTO/entity and not a format check.
- `HOLDINGS_SNAPSHOT` (`aef.action.type.enum.ts:12`) is defined but referenced nowhere — never
  produced (`handleAefRecord` never emits it) and never filtered on (HOLDINGS export filters on
  `actionType = "authorization"`).

**What to do:**
- Add a vintage format validator on `ActivityVintageCreditsDto` — `@Matches(/^\d{4}$/)` (or
  `@IsInt` + min/max year), ideally also where AEF/credit-block vintage is persisted.
- Either remove the unused `HOLDINGS_SNAPSHOT` member or implement a holdings-snapshot action type if
  one is intended.

---

## F15 — First transfers lost on partial/split transfers

**Severity:** High · **Decision basis:** Dec 2/CMA.3 para 1(a), para 2, para 8 · **No gate**

**Model is correct in principle.** "First transfer" is tracked as a persistent, one-time property of
the credit block via `CreditBlocksEntity.isNotTransferred` (`credit.blocks.entity.ts:57`): a block is
issued `true`, the first transfer flips it to `false`, and it is never reset. The first-transfer
classification is derived from the block's *pre-update* flag, not per-transaction or per-country-pair
(`credit-transactions-management.service.ts:483-485`; `aef-report-management.service.ts:113-116`).
Full transfers and all subsequent re-transfers (B→C→D) are therefore classified correctly, and there
is no per-country-pair logic anywhere. So far, compliant.

**The bug:** when a transfer is *partial* (less than the block's full amount, or the block has a
reserved portion), the code does not flip the existing block — it splits off a **new block with a new
`creditBlockId`** and **hard-codes `isNotTransferred: false`** on the child
(`credit-blocks-management.service.ts:99-120`, mirror at `:177-198`). Because the child is born
stamped "already transferred":

- The replicator finds no prior row for the new `creditBlockId` (`previousCreditBlock = null`), so the
  first-transfer predicate evaluates `false`. The transaction is typed `TRANSFERED` /
  `isFirstTransfer = false` and the AEF action is `TRANSFER`, not `FIRST_TRANSFER`.
- **Result:** a genuine first transfer executed as a partial transfer is silently demoted to a regular
  transfer. Its quantity drops out of both the AEF "first transfer" action row **and**
  `firstTransferredItmos` in the corresponding-adjustment computation
  (`corresponding-adjustment.service.ts:73-99`).

**Why it matters:** `firstTransferredItmos` is the `+` term in the para-8 emissions balance (see F1).
Losing partial first transfers means the originating Party fails to add those tonnes back — the exact
double-counting hole the corresponding-adjustment mechanism exists to close. Per Dec 2/CMA.3 para 1(a)
and para 2, a partial first transfer is still a first transfer; this is an unambiguous correctness bug
(no SME interpretation required).

**What to do:** Derive the split child's first-transfer status from the **parent block's pre-split
`isNotTransferred`** value instead of hard-coding `false` — i.e. the child inherits "not yet
transferred," and the transfer of that child is then correctly detected as the first transfer (after
which the child's flag flips to `false`). Add a regression test: partial first transfer of a
never-transferred block must produce a `FIRST_TRANSFER` action and contribute to `firstTransferredItmos`.

**Related:** corrupts the same `firstTransferred` quantity as **F1**; fix and verify the two together.

---

## Verification approach

- **Per PR:** `cd web && npx tsc --noEmit` + backend unit tests; targeted tests for CA computation
  (F1/F2) using worked examples from para 8 and para 7(a)(ii) averaging.
- **End-to-end (seeded stack):** authorize → first transfer → use-towards-NDC → run the CA
  calculation and assert the emissions balance equals the para-8 hand calculation; export AEF
  Actions / Annual Information and diff columns against the 6/CMA.4 Annex tables.
- Schema-changing items (F5, F6, F7, F11) need migrations; value-changing items (F1, F3) need a
  data backfill/reprocessing plan for existing records.
