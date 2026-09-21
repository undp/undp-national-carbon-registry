import {
  LocationCountryValue,
  MethodologyTypeValue,
  ProjectSectorValue,
  ProjectStatusValue,
  ProjectTypeValue,
  StakeholderTypeValue,
  UnitMetricValue,
  ValidationTypeValue,
} from "@app/cadtrust";

import { AccountType } from "../../enum/account.type.enum";
import { CreditTransactionSubTypesEnum } from "../../enum/credit.transaction.sub.types.enum";
import { InfSectorEnum } from "../../enum/inf.sector.enum";
import { InfSectoralScopeEnum } from "../../enum/inf.sectoral.scope.enum";
import { ProjectProposalStage } from "../../enum/projectProposalStage.enum";

/**
 * This registry's controlled vocabularies -> CAD Trust picklist values.
 *
 * ## Values are typed against a live-node snapshot, not guaranteed for all time
 *
 * Every value below is typed as a member of the corresponding union in
 * `@app/cadtrust`'s `interfaces/picklistValues.ts` — a snapshot of
 * `GET /v2/governance/meta/pickList` fetched against a real node. That gives a compile-time
 * guarantee against a typo or an invented string (both have happened in this file's history — see
 * the corrections below), but CAD Trust's Technical Committee can still add or remove values after
 * the snapshot was taken. `CadTrustPicklistService` fetches the live lists (cached ~1h) and **logs a
 * warning** for any mapped value that is not in them. It never blocks a sync — a stale local mapping
 * is not a good enough reason to stop real data reaching CAD Trust, and the node's own rejection
 * message is more useful than anything guessed here. **Watch the logs on the first real sync** and
 * regenerate `picklistValues.ts` from what they say if the node has moved on.
 *
 * The picklist keys named below (`projectSector`, `projectType`, `projectStatus`, `unit_metric`) are
 * what the API guide's own example response uses. If a warning says the key itself is missing, the
 * key changed, not the value.
 */

/** Picklist keys, as used by GET /v2/governance/meta/pickList. */
export const PICKLIST_KEYS = {
  projectSector: "projectSector",
  projectType: "projectType",
  projectStatus: "projectStatus",
  unitMetric: "unit_metric",
  /** `methodologyType` is optional on MethodologyCreateInput — see program.ts. */
  methodologyType: "methodology_type",
  /** Required on StakeholderCreateInput — see stakeholder.ts. */
  stakeholderType: "stakeholder_type",
  /** Required on LocationCreateInput — see location.ts. */
  locationCountry: "location_country",
  /** Required on ValidationCreateInput — see validation.ts. */
  validationType: "validation_type",
  /** Required on ValidationCreateInput — see validation.ts. Deliberately not a typed union — see picklistValues.ts. */
  validationBody: "validation_body",
  /**
   * Required on VerificationCreateInput — see verification.ts. Same closed-VVB-list situation as
   * `validationBody` (a national body will essentially never be on it by name) — deliberately not
   * a typed union, and always resolved through `CadTrustRegistryProfileService.getVerificationBodyDefault()`,
   * never the real verifying body's name. See `verification.mapper.ts`'s class doc.
   */
  verificationBody: "verification_body",
  /**
   * Required on UnitCreateInput — see unit.ts. **Not authoritatively known**: nothing in this repo
   * beyond a test fixture (`['Held', 'Retired']`) and unit.ts's own NOTE that v2 renamed "Active" to
   * "Held". Deliberately not a typed union until captured from a live node — see picklistValues.ts's
   * header comment for the convention this follows.
   */
  unitStatus: "unit_status",
  /**
   * Required on UnitCreateInput — see unit.ts. **Not authoritatively known** — nothing in this repo
   * names a single real value. Deliberately not a typed union until captured from a live node.
   */
  unitType: "unit_type",
} as const;

/**
 * `stakeholderType` this registry always stages the owning PD company as.
 * Fixed, not derived from a registry enum — matches this registry's own
 * "Project Developer" terminology. CAD Trust's documented sample values also
 * include "Owner" and "Consultant"; "Developer" was chosen deliberately, not
 * defaulted to. Confirmed against a live node: `stakeholderType` is exactly
 * `["Consultant", "Developer", "Owner"]` — an exact match, no correction needed.
 */
export const STAKEHOLDER_TYPE_DEVELOPER: StakeholderTypeValue = "Developer";

/**
 * Both DNA-approval events this registry syncs to CAD Trust's `validation` resource
 * (`APPROVE_PDD_BY_DNA`, `APPROVE_VALIDATION`) use this same value. Confirmed against a live node:
 * `validation_type` is exactly `["Validation of Post Registration Change", "Validation of Project
 * Design Document", "Validation of Renewal of Credit Period"]` — neither registry event is a
 * post-registration change or a credit-period renewal, so both collapse onto CAD Trust's one
 * initial-validation value. That is a fact about CAD Trust's vocabulary, not a mapping error.
 */
export const VALIDATION_TYPE_PDD_APPROVAL: ValidationTypeValue = "Validation of Project Design Document";

/**
 * `project_entity.sectoralScope` (`InfSectoralScopeEnum`) -> CAD Trust `projectSector`.
 *
 * Confirmed against a live node: `InfSectoralScopeEnum` is, member for member, the UNFCCC/CDM
 * sectoral-scopes list, and so is CAD Trust's real `projectSector` picklist — 15 of 16 members match
 * exactly, `WASTE_FROM_FUELS` plausibly (UNFCCC scope 8, "fugitive emissions from fuels", under a
 * different string). This is the source field CAD Trust's `projectSector` should read from — a prior
 * version of this file read `sector` (`InfSectorEnum`, a much coarser field: ENERGY/AGRICULTURE/
 * HEALTH/EDUCATION/TRANSPORT/MANUFACTURING/HOSPITALITY/FORESTRY/WASTE/OTHER) instead, which had
 * almost no honest overlap with either real CAD Trust list (HEALTH/EDUCATION/HOSPITALITY have no
 * equivalent in `projectSector` or `projectType` at all). `sector` now feeds `projectType` instead —
 * see `PROJECT_TYPE_MAP` below.
 */
export const PROJECT_SECTOR_MAP: Partial<Record<InfSectoralScopeEnum, ProjectSectorValue>> = {
  [InfSectoralScopeEnum.ENERGY_INDUSTRIES]: "Energy industries (renewable-/ non renewable sources)",
  [InfSectoralScopeEnum.ENERGY_DISTRIBUTION]: "Energy distribution",
  [InfSectoralScopeEnum.ENERGY_DEMAND]: "Energy demand",
  [InfSectoralScopeEnum.AGRICULTURE]: "Agriculture",
  [InfSectoralScopeEnum.AFFORESTATION_AND_REFORESTATION]: "Afforestation and reforestation",
  [InfSectoralScopeEnum.MANUFACTURING_INDUSTRIES]: "Manufacturing industries",
  [InfSectoralScopeEnum.CHEMICAL_INDUSTRIES]: "Chemical industries",
  [InfSectoralScopeEnum.METAL_PRODUCTION]: "Metal production",
  [InfSectoralScopeEnum.TRANSPORT]: "Transport",
  [InfSectoralScopeEnum.WASTE_FROM_FUELS]: "Fugitive emissions from fuel (solid, oil and gas)",
  [InfSectoralScopeEnum.WASTE_HANDLING_AND_DISPOSAL]: "Waste handling and disposal",
  [InfSectoralScopeEnum.CONSTRUCTION]: "Construction",
  [InfSectoralScopeEnum.MINING_MINERAL_PRODUCTION]: "Mining/mineral production",
  [InfSectoralScopeEnum.FUGITIVE_EMISSIONS_PRODUCTION]:
    "Fugitive emissions from the production and consumption of halocarbons and sulfur hexafluoride",
  [InfSectoralScopeEnum.SOLVENT_USE]: "Solvent use",
  // NOT_APPLICABLE ("N/A") has no CAD Trust equivalent — falls through to PROJECT_SECTOR_FALLBACK.
};

/**
 * `project_entity.sector` (`InfSectorEnum`) -> CAD Trust `projectType`.
 *
 * CAD Trust's `projectType` is a specific-technology taxonomy (Hydro vs. Solar vs. Wind, Landfill
 * gas, Biogas, ...) that this registry doesn't collect at either `sector`'s or `sectoralScope`'s
 * granularity — this is a best-effort category-level mapping, not a precise one. Only three members
 * have an honest match; the rest (including the coarse `ENERGY` category, which spans several
 * distinct real `projectType` technologies with no single generic value to pick) fall through to
 * `PROJECT_TYPE_FALLBACK`.
 */
export const PROJECT_TYPE_MAP: Partial<Record<InfSectorEnum, ProjectTypeValue>> = {
  [InfSectorEnum.AGRICULTURE]: "Agriculture",
  [InfSectorEnum.TRANSPORT]: "Transport",
  [InfSectorEnum.WASTE]: "Waste",
  // "Afforestation" fits equally well; picked "Reforestation" as the generic single value —
  // both are equally coarse compared to this registry's undifferentiated FORESTRY category.
  [InfSectorEnum.FORESTRY]: "Reforestation",
  // ENERGY, MANUFACTURING, HOSPITALITY, HEALTH, EDUCATION, OTHER: no honest match in the real
  // projectType list (all specific-technology values) — falls through to PROJECT_TYPE_FALLBACK.
};

/** Used when a source value has no mapping. Confirmed real CAD Trust values, not invented strings. */
export const PROJECT_SECTOR_FALLBACK: ProjectSectorValue = "Others";
export const PROJECT_TYPE_FALLBACK: ProjectTypeValue = "Any combination of the above";

/**
 * `project_entity.projectProposalStage` -> CAD Trust `projectStatus`.
 *
 * Only the three stages this registry actually syncs to CAD Trust (`APPROVED`/`REJECTED`/
 * `AUTHORISED`, from `APPROVE_INF`/`REJECT_INF`/`APPROVE_VALIDATION` — see
 * `handlers/project-update.handler.ts`) have a target confirmed against a live node:
 *
 *  - `APPROVED` -> `"Registered"` — INF approval visibly registers the project.
 *  - `REJECTED` -> `"Rejected"` — the only true dead end among the rejection-class stages (no
 *    re-open transition exists); a prior version of this map used `"Withdrawn"`, which reads as "the
 *    developer pulled out" rather than "the authority declined it."
 *  - `AUTHORISED`/`AUTHORIZED` -> `"Authorized"` — CAD Trust's real picklist has a value with this
 *    exact name, distinct from `"Registered"`. A prior version of this map used `"Registered"` here
 *    out of caution that `"Authorized"` might instead mean this registry's separate, later Article 6
 *    host-country-authorization concept (`authorizationPurpose`, `corresponding-adjustment` module)
 *    — that caution was wrong; `"Authorized"` is the intended, confirmed mapping for this stage.
 *
 * Every other member below is either a stage this registry does not sync (the remaining 8
 * transitions in `updateProposalStage`'s funnel are intentionally ignored — see
 * `handlers/project-update.handler.ts`) or the value staged once at project creation
 * (`PENDING -> "Listed"`, `handlers/project-create.handler.ts`). Kept mapped for completeness and
 * map-internal consistency, not because anything currently calls a PUT for them.
 *
 * CAD Trust's own status vocabulary (confirmed): `Authorized, Certified, Completed, Inactive,
 * Listed, Registered, Rejected, Validated, Verified, Withdrawn`.
 */
export const PROJECT_STATUS_MAP: Partial<Record<ProjectProposalStage, ProjectStatusValue>> = {
  [ProjectProposalStage.PENDING]: "Listed",
  [ProjectProposalStage.APPROVED]: "Registered",
  [ProjectProposalStage.PDD_SUBMITTED]: "Listed",
  [ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER]: "Listed",
  [ProjectProposalStage.PDD_APPROVED_BY_DNA]: "Listed",
  [ProjectProposalStage.VALIDATION_REPORT_SUBMITTED]: "Listed",
  [ProjectProposalStage.VALIDATION_DNA_APPROVED]: "Validated",
  [ProjectProposalStage.AUTHORISED]: "Authorized",
  [ProjectProposalStage.AUTHORIZED]: "Authorized",

  [ProjectProposalStage.REJECTED]: "Rejected",
  [ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER]: "Rejected",
  [ProjectProposalStage.PDD_REJECTED_BY_DNA]: "Rejected",
  [ProjectProposalStage.VALIDATION_DNA_REJECTED]: "Rejected",
};

export const PROJECT_STATUS_FALLBACK: ProjectStatusValue = "Listed";

/**
 * CAD Trust requires `projectUnitMetric` on create. This registry issues in
 * tonnes of CO2 equivalent throughout (see the serial-number format and the
 * credit-block model), and has no per-project metric to read from. Confirmed against a live node:
 * `unit_metric` is exactly `["gCO2eq/kWh", "kt (Kiloton)", "tCO2e"]` — an exact match.
 */
export const PROJECT_UNIT_METRIC: UnitMetricValue = "tCO2e";

/**
 * The latest retirement's `CreditTransactionsEntity.subType` -> CAD Trust `unitStatusReason`.
 *
 * Preferred over `UNIT_STATUS_REASON_MAP` below: `accountType` alone cannot tell a domestic MO
 * `USE_TOWARDS_NDC` retirement from an international ITMO `FIRST_TRANSFER_TOWARDS_NDC` one —
 * `mapSubTypeToAccountType` (`programme-ledger.service.ts`) collapses both into
 * `RETIREMENT_NDC`, so keying on `accountType` publishes the identical reason for a domestic use
 * and an Article 6 first transfer. `credit-unit.mapper.ts` reads this first and only falls back to
 * the `accountType` map for a retirement row that carries no `subType` (legacy rows). Free-form
 * text, not picklist-constrained.
 */
export const UNIT_STATUS_REASON_BY_SUBTYPE: Partial<Record<CreditTransactionSubTypesEnum, string>> = {
  [CreditTransactionSubTypesEnum.USE_TOWARDS_NDC]: "Retired for use towards the host Party's NDC",
  [CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC]:
    "First transfer - retired towards the acquiring Party's NDC",
  [CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP]:
    "First transfer - retired for other international mitigation purposes",
  [CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION]: "Voluntarily cancelled",
  [CreditTransactionSubTypesEnum.OMGE_CANCELLATION]:
    "Cancelled for overall mitigation in global emissions (OMGE)",
};

/**
 * `credit.blocks.entity.ts`'s `accountType` -> CAD Trust `unitStatusReason`.
 *
 * Fallback for retirement rows with no `subType` (legacy) — `UNIT_STATUS_REASON_BY_SUBTYPE` above
 * is the primary source. Unlike every map above, `unit_status` itself is **not confirmed** against
 * a live node — see `PICKLIST_KEYS.unitStatus`'s doc — so this only maps the *reason* text, which
 * is free-form (not picklist-constrained) on `UnitCreateInput`. `HOLDING` never reaches this map:
 * a held unit's `unitStatusReason` is only ever set at issuance/transfer time, not through this
 * retirement/ITMO-authorization path — see `credit-unit.mapper.ts`.
 */
export const UNIT_STATUS_REASON_MAP: Partial<Record<AccountType, string>> = {
  [AccountType.RETIREMENT_NDC]: "Retired for use towards NDC",
  [AccountType.RETIREMENT_OIMP]: "Retired for other international mitigation purposes",
  [AccountType.CANCELLATION_VOLUNTARY]: "Voluntarily cancelled",
  [AccountType.CANCELLATION_OMGE]: "Cancelled for overall mitigation in global emissions (OMGE)",
  // CANCELLATION_SOP is declared in AccountType but never produced by mapSubTypeToAccountType
  // (credit-transactions-management.service.ts) — no registry flow reaches it today, so it falls
  // through to UNIT_STATUS_REASON_FALLBACK like any other unmapped member would.
};

export const UNIT_STATUS_REASON_FALLBACK = "Retired";

/**
 * CAD Trust's `unit_status` values, required on every `UnitCreateInput`/`UnitUpdateInput`.
 * **Not confirmed against a live node** — the only evidence in this repo is `unit.ts`'s own NOTE
 * that v2 renamed "Active" to "Held", and a `@app/cadtrust` test fixture exercising `['Held',
 * 'Retired']` as a fake transport response, not a captured real one. Deliberately not typed as a
 * union in `picklistValues.ts` (see its header) — capture `GET /v2/governance/meta/pickList`'s
 * real `unit_status` list before trusting these further; `CadTrustPicklistService` will warn in
 * the logs if either has drifted.
 */
export const UNIT_STATUS_HELD = "Held";
export const UNIT_STATUS_RETIRED = "Retired";

/**
 * CAD Trust requires `unitType` on every unit create/update. **No value has ever been confirmed
 * against a live node or found documented anywhere in this repo** — unlike every other required
 * picklist field in this module, there is no safe default to fall back to here. Set
 * `CADT_V2_UNIT_TYPE` before enabling credit sync; `CadTrustRegistryProfileService.getUnitType()`
 * reads it with no fallback, and `warnOnUnknownValues` will flag it as unrecognized until the real
 * `unit_type` list is captured and this file is updated — that is the deliberate warn-only outcome
 * for an unset or wrong value, not a code error.
 */

// Re-exported so callers of this file don't need a separate import from @app/cadtrust just to
// annotate a `systemCountryName` / `CADT_V2_METHODOLOGY_TYPE` config value.
export type { LocationCountryValue, MethodologyTypeValue };
