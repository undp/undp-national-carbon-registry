/**
 * Controlled values from the UNFCCC "List of common nomenclatures under Article
 * 6, paragraph 2, of the Paris Agreement", dated 17 February 2026.
 *
 * Transcribed verbatim, including the source's own spelling. Values are what
 * CARP accepts, so "correcting" one here would produce a rejected submission;
 * where the source is visibly wrong it carries a `SOURCE TYPO` note instead.
 *
 * These are *defaults*. Read them through a {@link ControlledValueProvider} so a
 * nomenclature revision needs configuration rather than a release.
 */

/** Date of the nomenclature these defaults were taken from. */
export const NOMENCLATURE_DATE = '2026-02-17';

export type ControlledValueKey =
  | 'cooperativeApproachId'
  | 'metric'
  | 'sectors'
  | 'purposeForAuthorization'
  | 'firstTransferDefnForOimp'
  | 'actionType'
  | 'actionSubtype'
  | 'underlyingUnitRegistryId'
  | 'mitigationType'
  | 'activityType'
  | 'accountType'
  | 'unitType'
  | 'firstTransfer';

/** Table 12(b). */
export const METRICS = ['GHG', 'non-GHG'] as const;

/**
 * Table 15(b).
 *
 * REGISTRY EXTENSION: `Other` is not in the source table. This registry's own
 * sector vocabulary is wider than the nomenclature's nine values, so sectors
 * with no confident counterpart need somewhere to land rather than being
 * forced onto an ill-fitting one. Pending confirmation with CARP, after which
 * the sectors currently routed here should get their exact mappings — see
 * AEF_V2_SECTOR in libs/shared/src/aef-v2-registry/mappers/aef-code.maps.ts.
 */
export const SECTORS = [
  'Agriculture',
  'Building and construction',
  'Cross-sectoral mechanisms',
  'Energy generation',
  'Forestry and land use',
  'Industrial processes',
  'Transportation',
  'Urban development',
  'Waste management',
  'Other',
] as const;

/** Table 16(b). */
export const PURPOSES_FOR_AUTHORIZATION = [
  'NDC',
  'OIMP',
  'IMP',
  'OP',
  'NDC and OIMP',
  'NDC and IMP',
  'NDC and OP',
] as const;

/** Table 22(b). Note the source spells this "Authorisation" here. */
export const FIRST_TRANSFER_DEFINITIONS_FOR_OIMP = [
  'Authorisation',
  'Issuance',
  'Use or Cancellation',
] as const;

/**
 * Table 25(b).
 *
 * SOURCE QUIRK: "First transfer" and "Transfer" carry identical descriptions in
 * the source, as do "Cancellation" and "Voluntary Cancellation". The values are
 * still distinct and must not be collapsed.
 */
export const ACTION_TYPES = [
  'Authorization',
  'First transfer',
  'Transfer',
  'Acquisition',
  'Use',
  'Cancellation',
  'Voluntary Cancellation',
] as const;

/** Table 26(b). */
export const ACTION_SUBTYPES = [
  'First transfer to another Party',
  'Authorization',
  'Issuance',
  'Use or cancellation',
  'Mandatory transfer to the Adaptation Fund (A6.4 ERs)',
  'Voluntary transfer to the Adaptation Fund (A6.4 ERs)',
  'Mandatory cancellation to deliver OMGE',
  'Voluntary cancellation to deliver OMGE',
  'Other cancellations',
  'Not yet defined',
] as const;

/**
 * Which subtypes belong to which action type, per Table 26(b)'s descriptions.
 * "Not yet defined" is listed as an open catch-all, so it is allowed anywhere.
 */
export const ACTION_SUBTYPES_BY_TYPE: Readonly<Record<string, readonly string[]>> = {
  'First transfer': [
    'First transfer to another Party',
    'Authorization',
    'Issuance',
    'Use or cancellation',
    // Table 26(b) files the OMGE subtypes under "cancellation (or first
    // transfer for cancellation)", so they are valid here too.
    'Mandatory cancellation to deliver OMGE',
    'Voluntary cancellation to deliver OMGE',
    'Other cancellations',
    'Not yet defined',
  ],
  Transfer: [
    'Mandatory transfer to the Adaptation Fund (A6.4 ERs)',
    'Voluntary transfer to the Adaptation Fund (A6.4 ERs)',
    'Not yet defined',
  ],
  Cancellation: [
    'Mandatory cancellation to deliver OMGE',
    'Voluntary cancellation to deliver OMGE',
    'Other cancellations',
    'Not yet defined',
  ],
  'Voluntary Cancellation': [
    'Mandatory cancellation to deliver OMGE',
    'Voluntary cancellation to deliver OMGE',
    'Other cancellations',
    'Not yet defined',
  ],
};

/**
 * Table 31(b).
 *
 * SOURCE TYPO: the source describes FCPF as "Forest Carbon Parnership Facility".
 * Only the description is misspelled; the value `FCPF` is correct.
 */
export const UNDERLYING_UNIT_REGISTRY_IDS = [
  'VCS', 'GS', 'CAR', 'ACR', 'ART', 'GCC',
  'Cercarbono', 'Isometric', 'ISFL', 'FCPF', 'T-VER', 'JCM',
] as const;

/** Table 36(b). */
export const MITIGATION_TYPES = [
  'Emission reductions',
  'Removals',
  'Emission reductions and removals',
] as const;

/**
 * Table 51(b).
 *
 * SOURCE TYPO, PRESERVED: `C02 usage` uses a digit zero, not a letter O. Kept
 * verbatim because the value list must match what CARP accepts — correcting it
 * would be the bug.
 */
// REGISTRY EXTENSION: `Other` (last entry) is not in the source table — see
// the SECTORS docblock above for why this registry adds one; same reasoning
// applies to activity types via AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE.
export const ACTIVITY_TYPES = [
  'Afforestation',
  'Agriculture',
  'Biogas',
  'Biomass Energy',
  'Cement',
  'C02 usage',
  'Coal bed/mine methane',
  'Energy distribution',
  'Energy Efficiency households',
  'Energy Efficiency Industry',
  'Energy Efficiency own generation',
  'Energy Efficiency service',
  'Energy Efficiency supply side',
  'Fossil fuel switch',
  'Fugitive',
  'Geothermal',
  'Hydro',
  'Landfill gas',
  'Methane avoidance',
  'N2O',
  'PFCs and SF6',
  'Reforestation',
  'Solar',
  'Tidal',
  'Transport',
  'Waste',
  'Wind',
  'Other',
] as const;

/**
 * Table 52(b). Integers, held as strings so every controlled list has one shape.
 *
 * SOURCE TYPO: account type 200 is described as "Use towards NCD" — NDC.
 */
export const ACCOUNT_TYPES = ['100', '200', '210', '300', '310', '320', '330'] as const;

/** Table 53(b). Integers, held as strings for the same reason. */
export const UNIT_TYPES = ['1', '2', '3', '4', '5', '6'] as const;

/** Table 49(b). Not an AEF column; used to describe first-transfer semantics. */
export const FIRST_TRANSFER_DEFINITIONS = [
  'First international transfer',
  'Authorisation',
  'Issuance',
  'Use or Cancellation',
] as const;

/**
 * Defaults for every key whose list is fixed by the nomenclature.
 *
 * `cooperativeApproachId` is deliberately **absent**. Cooperative approaches are
 * registry data — they are agreed continuously and this deployment will hold
 * them in its own table — so hardcoding CA0001…CA00nn here would be stale on
 * arrival and wrong for any other registry. Supply them through a
 * {@link ControlledValueProvider}; until one does, the value is checked against
 * {@link COOPERATIVE_APPROACH_ID_PATTERN} only.
 */
export const DEFAULT_CONTROLLED_VALUES: Readonly<Partial<Record<ControlledValueKey, readonly string[]>>> = {
  metric: METRICS,
  sectors: SECTORS,
  purposeForAuthorization: PURPOSES_FOR_AUTHORIZATION,
  firstTransferDefnForOimp: FIRST_TRANSFER_DEFINITIONS_FOR_OIMP,
  actionType: ACTION_TYPES,
  actionSubtype: ACTION_SUBTYPES,
  underlyingUnitRegistryId: UNDERLYING_UNIT_REGISTRY_IDS,
  mitigationType: MITIGATION_TYPES,
  activityType: ACTIVITY_TYPES,
  accountType: ACCOUNT_TYPES,
  unitType: UNIT_TYPES,
  firstTransfer: FIRST_TRANSFER_DEFINITIONS,
};

/**
 * Party identifiers have `List of values: Not available` in the nomenclature —
 * they are ISO 3166-1 alpha-3 plus exceptionally reserved codes such as `EUE`,
 * so they are format-checked rather than enumerated.
 */
export const PARTY_CODE_PATTERN = /^[A-Z]{3}$/;

/** Table 9(a): `CANNNN`. */
export const COOPERATIVE_APPROACH_ID_PATTERN = /^CA\d{4}$/;

/** Table 2: `X.Y`, X a non-zero integer. First version is always `1.0`. */
export const SUBMISSION_VERSION_PATTERN = /^[1-9]\d*\.\d+$/;

/** Table 28: alpha-3 Party code plus a two-digit registry identifier. */
export const PARTY_ITMO_REGISTRY_ID_PATTERN = /^[A-Z]{3}\d{2}$/;

/** Table 20: `dddd - dddd`. */
export const AUTHORIZED_TIMEFRAME_PATTERN = /^\d{4}\s-\s\d{4}$/;

/** Table 7: alphanumeric, space and hyphen only. */
export const AUTHORIZATION_ID_PATTERN = /^[A-Za-z0-9 -]+$/;
