import { AuthorizationPurpose } from "../../enum/authorization.purpose.enum";
import { CreditTransactionSubTypesEnum } from "../../enum/credit.transaction.sub.types.enum";
import { InfSectorEnum } from "../../enum/inf.sector.enum";
import { InfSectoralScopeEnum } from "../../enum/inf.sectoral.scope.enum";

// Translates this registry's own controlled vocabularies to the AEF V2
// Common Nomenclature values (@app/aef-v2 controlled-values/nomenclature.ts).
// Deliberately separate from libs/shared/src/aef-report-management's
// INF_SECTOR/INF_SECTORAL_SCOPE, which target the V1 report's own display
// strings, not the AEF nomenclature's SECTORS list.

// ProjectEntity.sector (InfSectorEnum keys) -> SECTORS (nomenclature.ts).
// HEALTH/EDUCATION/HOSPITALITY route to "Urban development" and OTHER to the
// registry-extension "Other" value (see nomenclature.ts's SECTORS docblock)
// rather than the earlier blanket "Cross-sectoral mechanisms" — pending
// confirmation with CARP, after which these four may get exact mappings.
export const AEF_V2_SECTOR: Readonly<Record<InfSectorEnum, string>> = {
  [InfSectorEnum.ENERGY]: "Energy generation",
  [InfSectorEnum.AGRICULTURE]: "Agriculture",
  [InfSectorEnum.HEALTH]: "Urban development",
  [InfSectorEnum.EDUCATION]: "Urban development",
  [InfSectorEnum.TRANSPORT]: "Transportation",
  [InfSectorEnum.MANUFACTURING]: "Industrial processes",
  [InfSectorEnum.HOSPITALITY]: "Urban development",
  [InfSectorEnum.FORESTRY]: "Forestry and land use",
  [InfSectorEnum.WASTE]: "Waste management",
  [InfSectorEnum.OTHER]: "Other",
};

// AuthorizationPurpose -> PURPOSES_FOR_AUTHORIZATION (nomenclature.ts).
// AuthorizationPurpose.OTHER has no clean nomenclature counterpart; mapped to
// "OP" (Other purposes) as the closest fit — flag if this proves wrong
// against a live CARP template, per the field spec's specConflict pattern.
export const AEF_V2_AUTHORIZATION_PURPOSE: Readonly<
  Record<AuthorizationPurpose, string>
> = {
  [AuthorizationPurpose.NDC]: "NDC",
  [AuthorizationPurpose.OIMP]: "OIMP",
  [AuthorizationPurpose.OTHER]: "OP",
};

// CreditTransactionSubTypesEnum -> { AefT3ActionsType, AefT3ActionsSubtype }.
// USE_TOWARDS_NDC is intentionally absent: it is MO-only (never an ITMO) and
// never crosses a border, so it is not an AEF action at all — see the
// CreditTransactionSubTypesEnum docblock.
export const AEF_V2_ACTION_BY_SUBTYPE: Readonly<
  Partial<Record<CreditTransactionSubTypesEnum, { type: string; subtype: string }>>
> = {
  [CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC]: {
    type: "First transfer",
    subtype: "First transfer to another Party",
  },
  [CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP]: {
    type: "First transfer",
    subtype: "Use or cancellation",
  },
  [CreditTransactionSubTypesEnum.OMGE_CANCELLATION]: {
    type: "Cancellation",
    subtype: "Voluntary cancellation to deliver OMGE",
  },
  [CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION]: {
    type: "Voluntary Cancellation",
    subtype: "Other cancellations",
  },
};

// Partial override of AEF_V2.defaultMitigationType, for the sectoral scopes
// this registry can place with confidence. ProjectEntity has no dedicated
// mitigation-type field; everything not listed here falls back to the
// configured default.
export const AEF_V2_SECTORAL_SCOPE_MITIGATION_TYPE: Readonly<Record<string, string>> = {
  AFFORESTATION_AND_REFORESTATION: "Removals",
};

// ProjectEntity.sectoralScope (InfSectoralScopeEnum keys) -> ACTIVITY_TYPES
// (nomenclature.ts). Total over every scope: the registry's sectoral scopes
// outnumber the nomenclature's activity types, so scopes with no confident
// 1:1 fit (e.g. ENERGY_INDUSTRIES could be Hydro, Solar, Wind, Geothermal or
// Biomass Energy — this registry has no data to disambiguate) route to the
// registry-extension "Other" value instead of exporting blank — pending
// confirmation with CARP on the exact mapping.
export const AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE: Readonly<
  Record<InfSectoralScopeEnum, string>
> = {
  [InfSectoralScopeEnum.ENERGY_INDUSTRIES]: "Energy Efficiency own generation",
  [InfSectoralScopeEnum.ENERGY_DISTRIBUTION]: "Energy distribution",
  [InfSectoralScopeEnum.ENERGY_DEMAND]: "Energy Efficiency households",
  [InfSectoralScopeEnum.AGRICULTURE]: "Agriculture",
  [InfSectoralScopeEnum.AFFORESTATION_AND_REFORESTATION]: "Afforestation",
  [InfSectoralScopeEnum.MANUFACTURING_INDUSTRIES]: "Cement",
  [InfSectoralScopeEnum.CHEMICAL_INDUSTRIES]: "N2O",
  [InfSectoralScopeEnum.METAL_PRODUCTION]: "C02 usage", // digit zero — see nomenclature.ts SOURCE TYPO note
  [InfSectoralScopeEnum.TRANSPORT]: "Transport",
  [InfSectoralScopeEnum.WASTE_FROM_FUELS]: "Fugitive",
  [InfSectoralScopeEnum.WASTE_HANDLING_AND_DISPOSAL]: "Waste",
  [InfSectoralScopeEnum.CONSTRUCTION]: "Energy Efficiency service",
  [InfSectoralScopeEnum.MINING_MINERAL_PRODUCTION]: "Fossil fuel switch",
  [InfSectoralScopeEnum.FUGITIVE_EMISSIONS_PRODUCTION]: "PFCs and SF6",
  [InfSectoralScopeEnum.SOLVENT_USE]: "Energy Efficiency Industry",
  [InfSectoralScopeEnum.NOT_APPLICABLE]: "Other",
};

export const GHG_METRIC = "GHG";

// The literal string the AEF nomenclature reads as "Not applicable" — see
// isProvided() in @app/aef-v2/spec/conditions.ts, which treats this value
// (case/whitespace-insensitively) as equivalent to an absent field, so it is
// safe to write into any optional, CARP-populated, or conditionally
// inapplicable column without tripping validation.
export const NOT_APPLICABLE = "NA";

// Static Table 2 labels. This registry does not resolve a Cooperative
// Approach's actual party/entity lists into the AEF's authorized-party /
// authorized-entity identifier fields — those are reported as a fixed
// descriptive label instead. Named constants so a re-wording only touches
// this file.
export const COOPERATIVE_APPROACH_PARTIES_LABEL = "Cooperative Approach Parties";
export const COOPERATIVE_APPROACH_ENTITIES_LABEL = "Cooperative Approach Entities";
export const TOWARDS_COOPERATIVE_APPROACH_ENTITIES_LABEL =
  "Towards Cooperative Approach Entities";
export const AUTHORIZATION_TERMS_LABEL =
  "Cannot make modifications to authorization conditions";
export const FIRST_TRANSFER_DEFINITION_OIMP_LABEL = "Use or Cancellation";

// Table 5's ChangeConditions — this registry's actual revocation mechanism
// (CaAuthorizedEntity.status, flipped via the deactivate endpoint), stated
// as a fixed sentence since there are no per-entity conditions to report.
export const AUTHORIZED_ENTITY_CHANGE_CONDITIONS_LABEL =
  "Entity can be set to Active/Inactive by authorities.";

// Table 3 Actions fields this registry structurally never produces a value
// for — no underlying-unit-registry concept, always the GHG metric, never
// emits an "Acquisition" action (the only action type TransferringPartyId
// applies to), and (AdditionalInformation) never has anything further to
// add beyond the other fields on any row. Spread into every recordAction()
// payload in aef-v2-write.service.ts, both Authorization and
// retirement-derived rows, so every Table 3 row reports these as NA rather
// than leaving them blank. (aefT3ActionsUnitFirstId/UnitLastId are the same
// "never relevant" category but are integer-typed columns that can't hold
// the string "NA" — those stay unset here and get an NA *display* fallback
// in the frontend's reportingColumns.ts instead.)
export const AEF_V2_T3_ACTIONS_ALWAYS_NA = {
  aefT3ActionsUnitRegistryId: NOT_APPLICABLE,
  aefT3ActionsGwpValue: NOT_APPLICABLE,
  aefT3ActionsApplicableNonGhgMetric: NOT_APPLICABLE,
  aefT3ActionsQuantityNonGhg: NOT_APPLICABLE,
  aefT3ActionsTransferringPartyId: NOT_APPLICABLE,
  aefT3ActionsAdditionalInformation: NOT_APPLICABLE,
};

// Table 3 Actions fields that only apply to transfer/use/cancellation
// actions, never to a plain "Authorization" action row. Spread only into
// recordAuthorizationAndAction's recordAction() payload — recordRetirementAction
// keeps populating these conditionally per retirement subtype where they do
// apply (aefT3ActionsItmoUsedYear is the exception: dead on every row today,
// so it gets the same frontend NA-display fallback as the two Underlying
// Unit ID fields above rather than a write here).
export const AEF_V2_T3_AUTHORIZATION_ACTION_NA = {
  aefT3ActionsAcquiringPartyId: NOT_APPLICABLE,
  aefT3ActionsUsingParticipatingPartyId: NOT_APPLICABLE,
  aefT3ActionsUsingAuthorizedEntityId: NOT_APPLICABLE,
  aefT3ActionsPurposeOfUseOimp: NOT_APPLICABLE,
};

// Table 4 Holdings fields this registry structurally never produces a value
// for — same reasoning as AEF_V2_T3_ACTIONS_ALWAYS_NA (no underlying-unit-
// registry concept, always the GHG metric). Table 4 has no TransferringPartyId
// field, so there's no fifth entry mirroring that one. Spread into the row
// object RegistryHoldingsProvider.getHoldings pushes. (aefT4HoldingsUnitFirstId/
// UnitLastId are the same "never relevant" category but integer-typed columns
// that can't hold the string "NA" — those stay unset and get an NA *display*
// fallback in the frontend's reportingColumns.ts instead.)
export const AEF_V2_T4_HOLDINGS_ALWAYS_NA = {
  aefT4HoldingsUnitRegistryId: NOT_APPLICABLE,
  aefT4HoldingsGwpValue: NOT_APPLICABLE,
  aefT4HoldingsApplicableNonGhgMetric: NOT_APPLICABLE,
  aefT4HoldingsQuantityNonGhg: NOT_APPLICABLE,
};
