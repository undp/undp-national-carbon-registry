import {
  AUTHORIZATION_ID_PATTERN,
  AUTHORIZED_TIMEFRAME_PATTERN,
  COOPERATIVE_APPROACH_ID_PATTERN,
  ControlledValueKey,
  PARTY_CODE_PATTERN,
  PARTY_ITMO_REGISTRY_ID_PATTERN,
  SUBMISSION_VERSION_PATTERN,
} from '../controlled-values/nomenclature';
import { AefTableName } from '../tables';
import { FieldCondition, whenFieldIn, whenMetricIsNonGhg, whenPurposeCoversOimp } from './conditions';

/**
 * The machine-readable description of every AEF field.
 *
 * One source, three consumers: the table interfaces are checked against it, the
 * validator is driven entirely by it, and the exporter takes its column order
 * and headers from it. Adding a field means adding it here.
 *
 * **Declaration order is significant.** It is the order in
 * `AEF_CMA6_second_iteration.csv`, and it is what the exported CSV/XLSX column
 * order comes from. `field-spec.spec.ts` asserts it.
 */
export interface AefFieldSpec {
  /** CAD Trust key — the actual property name, e.g. `aefT3ActionsQuantityTCo2`. */
  key: string;
  /**
   * Common Nomenclature technical name, e.g. `QuantityCO2`. Recorded for
   * traceability back to the spec; never used as the property name.
   */
  technicalName: string;
  /** Label as printed in the AEF template. Used as the export column header. */
  aefLabel: string;
  type: 'string' | 'integer' | 'number' | 'date' | 'datetime';
  required: boolean;
  /**
   * CARP populates this. The registry must leave it empty on submission; the
   * column is still emitted on export, blank.
   */
  carpPopulated?: boolean;
  /** Key into the controlled-value registry, when the field is a picklist. */
  controlledValues?: ControlledValueKey;
  /** Format constraint, checked when a value is present. */
  pattern?: RegExp;
  /** Human-readable form of `pattern`, for messages. */
  format?: string;
  /** Applicability rule; absent means always applicable. */
  appliesWhen?: FieldCondition;
  /** Set where the two source documents disagree. See the README. */
  specConflict?: string;
  mandate?: string;
  /** Footnote from `AEF_CMA6_second_iteration.csv`. Surfaced as a UI tooltip. */
  footnote?: string;
}

const CMA4_17J = 'Decision 6/CMA.4 paragraph 17 (j)';
const CMA4_ANNEX_I_5 = 'Decision 6/CMA.4 Annex I, paragraph 5';

const NON_GHG_FOOTNOTE =
  'Type of non-GHG metric applied (e.g., "megawatt hours of renewable electricity generation"). ' +
  'This field should be reported as "Not applicable" (NA) if the ITMOs are in a GHG metric.';
const GWP_FOOTNOTE =
  'If the mitigation outcome involves a non-CO2 greenhouse gas(es), the global warming potential ' +
  '(GWP) value(s) applied, consistent with the relevant CMA decisions.';
const UNDERLYING_REGISTRY_FOOTNOTE =
  'Unique identifier of the underlying cooperative approach registry as per common nomenclatures. ' +
  'This field should be reported as "Not applicable" (NA) if the cooperative approach does not use ' +
  'an underlying cooperative approach registry.';

// ---------------------------------------------------------------------------
// Table 1 — Submission (9 fields)
// ---------------------------------------------------------------------------

const T1_SUBMISSION: readonly AefFieldSpec[] = [
  {
    key: 'aefT1SubmissionParty',
    technicalName: 'ParticipatingParty',
    aefLabel: 'Party',
    type: 'string',
    required: true,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    mandate: CMA4_17J,
    footnote: 'Reporting Party as per common nomenclatures.',
  },
  {
    key: 'aefT1SubmissionVersion',
    technicalName: 'SubmissionVersion',
    aefLabel: 'Version',
    type: 'string',
    required: true,
    pattern: SUBMISSION_VERSION_PATTERN,
    format: 'X.Y — the first version is always 1.0',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT1SubmissionReportYear',
    technicalName: 'ReportedYear',
    aefLabel: 'Reported year',
    type: 'integer',
    required: true,
    mandate: CMA4_17J,
    footnote:
      'The annual period from 1 January to 31 December during which actions occurred.',
  },
  {
    key: 'aefT1SubmissionSubmissionDate',
    technicalName: 'DateOfSubmission',
    aefLabel: 'Date of submission',
    type: 'date',
    required: true,
    format: 'dd/mm/yyyy',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT1SubmissionReviewStatus',
    technicalName: 'ReviewStatusOfInitialReport',
    aefLabel: 'Review status of the initial report',
    type: 'string',
    required: false,
    carpPopulated: true,
    footnote:
      'Review status as per paragraph 57. This field is populated by the CARP as a result of the ' +
      'review of the initial report.',
  },
  {
    key: 'aefT1SubmissionResultCheck',
    technicalName: 'ResultOfConsistencyCheck',
    aefLabel: 'Result of the consistency check of this AEF submission',
    type: 'string',
    required: false,
    carpPopulated: true,
    footnote:
      'Result of the consistency check as per paragraph 37. Information in this field is populated ' +
      'by the CARP as a result of the consistency check procedure.',
  },
  {
    key: 'aefT1SubmissionNdcFirstYear',
    technicalName: 'FirstYearOfNDCPeriod',
    aefLabel: 'First year of the NDC implementation period',
    type: 'integer',
    required: true,
    mandate: CMA4_17J,
  },
  {
    key: 'aefT1SubmissionNdcLastYear',
    technicalName: 'LastYearOfNDCPeriod',
    aefLabel: 'Last year of the NDC implementation period',
    type: 'integer',
    required: true,
    mandate: CMA4_17J,
  },
  {
    key: 'aefT1SubmissionReferenceReviewReport',
    technicalName: 'ReferenceToTerReport',
    aefLabel: 'Reference to the Article 6 technical expert review report of the initial report',
    type: 'string',
    required: false,
    carpPopulated: true,
    footnote:
      'Hyperlink to the Article 6 technical expert review report of the initial report. This field ' +
      'is populated by the CARP as a result of the review of the initial report.',
  },
];

// ---------------------------------------------------------------------------
// Table 2 — Authorizations (19 fields)
// ---------------------------------------------------------------------------

const T2_AUTHORIZATIONS: readonly AefFieldSpec[] = [
  {
    key: 'aefT2AuthorizationsId',
    technicalName: 'AuthorizationID',
    aefLabel: 'Authorization ID',
    type: 'string',
    required: true,
    pattern: AUTHORIZATION_ID_PATTERN,
    format: 'alphanumeric, space and hyphen only',
    mandate: CMA4_17J,
    footnote: 'Authorization ID as assigned by the reporting Party.',
  },
  {
    key: 'aefT2AuthorizationsDate',
    technicalName: 'DateOfAuthorization',
    aefLabel: 'Date of authorization',
    type: 'date',
    required: true,
    format: 'dd/mm/yyyy',
    mandate: CMA4_17J,
    footnote: 'Date on which the authorization was issued.',
  },
  {
    key: 'aefT2AuthorizationsCooperativeApproachId',
    technicalName: 'CooperativeApproachID',
    aefLabel: 'Cooperative approach ID',
    type: 'string',
    required: true,
    controlledValues: 'cooperativeApproachId',
    pattern: COOPERATIVE_APPROACH_ID_PATTERN,
    format: 'CANNNN',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Unique identifier of the cooperative approach as per common nomenclatures.',
  },
  {
    key: 'aefT2AuthorizationsVersion',
    technicalName: 'AuthorizationVersion',
    aefLabel: 'Version of the authorization',
    type: 'integer',
    required: true,
    mandate: CMA4_17J,
  },
  {
    key: 'aefT2AuthorizationsQuantity',
    technicalName: 'AuthorizedQuantity',
    aefLabel: 'Authorized quantity',
    type: 'integer',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'This field is optional. It may be used to specify the maximum quantity of mitigation ' +
      'outcomes that are authorized for use towards an NDC and/or OIMP.',
  },
  {
    key: 'aefT2AuthorizationsMetric',
    technicalName: 'Metric',
    aefLabel: 'Metric',
    type: 'string',
    required: true,
    controlledValues: 'metric',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT2AuthorizationsGwpValue',
    technicalName: 'GWPValues',
    aefLabel: 'Applicable GWP value(s)',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: GWP_FOOTNOTE,
  },
  {
    key: 'aefT2AuthorizationsApplicableNonGhgMetric',
    technicalName: 'Non-GHGMetric',
    aefLabel: 'Applicable non-GHG metric',
    type: 'string',
    required: false,
    appliesWhen: whenMetricIsNonGhg('aefT2AuthorizationsMetric'),
    mandate: CMA4_17J,
    footnote: NON_GHG_FOOTNOTE,
  },
  {
    key: 'aefT2AuthorizationsSector',
    technicalName: 'Sectors',
    aefLabel: 'Sector(s)',
    type: 'string',
    required: true,
    controlledValues: 'sectors',
    mandate: CMA4_17J,
    footnote:
      'Sector(s) in which the mitigation outcome occurred as per common nomenclatures.',
  },
  {
    key: 'aefT2AuthorizationsActivityType',
    technicalName: 'ActivityType',
    aefLabel: 'Activity type(s)',
    type: 'string',
    required: false,
    controlledValues: 'activityType',
    specConflict:
      'The CMA.6 table lists this as a Table 2 field; Common Nomenclature Table 51(a) marks it ' +
      'Required: true but "Naming in AEF: not applicable". CAD Trust ships it optional, which is ' +
      'what is implemented. Revisit against the live CARP template.',
    mandate: CMA4_17J,
    footnote:
      'Description of the mitigation activity type(s) as per common nomenclatures.',
  },
  {
    key: 'aefT2AuthorizationsPurposesForAuthorization',
    technicalName: 'PurposeForAuthorization',
    aefLabel: 'Purposes for authorization',
    type: 'string',
    required: true,
    controlledValues: 'purposeForAuthorization',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT2AuthorizationsAuthorizedPartyId',
    technicalName: 'AuthorizedPartyIDs',
    aefLabel: 'Authorized Party(ies) ID',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'Parties may authorize mitigation outcomes for use by any Party or for a specific Party(ies). ' +
      'Where a specific Party(ies) is specified, the unique identifier of that Party(ies) is entered here.',
  },
  {
    key: 'aefT2AuthorizationsAuthoziedEntityId',
    technicalName: 'AuthorizedEntityIDs',
    aefLabel: 'Authorized entity(ies) ID',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'Unique identifier of the entities that are authorized as per common nomenclatures, if applicable.',
  },
  {
    key: 'aefT2AuthorizationsOimpAuthorizedParty',
    technicalName: 'OIMPAuthorized',
    aefLabel: 'OIMP authorized by the Party',
    type: 'string',
    required: false,
    appliesWhen: whenPurposeCoversOimp('aefT2AuthorizationsPurposesForAuthorization'),
    mandate: CMA4_17J,
    footnote:
      'Only applicable if the authorization is for OIMP. Specifies the other international ' +
      'mitigation purpose, which may be an IMP or an OP (e.g. use under CORSIA).',
  },
  {
    key: 'aefT2AuthorizationsAuthorizedTimeframe',
    technicalName: 'AuthorizedTimeframe',
    aefLabel: 'Authorized timeframe',
    type: 'string',
    required: false,
    pattern: AUTHORIZED_TIMEFRAME_PATTERN,
    format: 'dddd - dddd',
    mandate: CMA4_17J,
    footnote:
      'This field is optional. It may be filled to specify the timeframe for which mitigation ' +
      'outcomes may occur and/or the timeframe in which they may be used.',
  },
  {
    key: 'aefT2AuthorizationsAuthorizationTerms',
    technicalName: 'AuthorizationT&Cs',
    aefLabel: 'Authorization terms and conditions',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'This field is optional. It may be completed to specify the terms and conditions under which ' +
      'the authorization is provided.',
  },
  {
    key: 'aefT2AuthorizationsAuthorizationDocumentation',
    technicalName: 'AuthorizationDocumentation',
    aefLabel: 'Authorization documentation',
    type: 'string',
    required: false,
    carpPopulated: true,
    footnote:
      'This field is automatically generated by the CARP and includes a hyperlink to the relevant ' +
      'documentation for this authorization.',
  },
  {
    key: 'aefT2AuthorizationsFirstTransferDefinitionOimp',
    technicalName: 'FirstTransferDefnForOIMP',
    aefLabel: 'First transfer definition for OIMP',
    type: 'string',
    required: false,
    controlledValues: 'firstTransferDefnForOimp',
    appliesWhen: whenPurposeCoversOimp('aefT2AuthorizationsPurposesForAuthorization'),
    mandate: CMA4_17J,
    footnote:
      'Only applicable to authorizations for use towards OIMP. Specifies the first transfer ' +
      'definition used by the Party pursuant to decision 2/CMA.3, annex, para. 2(b).',
  },
  {
    key: 'aefT2AuthorizationsAdditionalInformation',
    technicalName: 'AdditionalExplanatoryInformation',
    aefLabel: 'Additional explanatory information',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: 'This field is optional. The Party may use this field to provide any additional information.',
  },
];

// ---------------------------------------------------------------------------
// Table 3 — Actions (27 fields)
// ---------------------------------------------------------------------------

const ACQUISITION_ONLY = whenFieldIn(
  'aefT3ActionsType',
  ['Acquisition'],
  'only applicable to the action type "acquisition"',
);

const TRANSFER_LIKE_ONLY = whenFieldIn(
  'aefT3ActionsType',
  ['First transfer', 'Transfer'],
  'only applicable to the action types "first transfer" and "transfer"',
);

const USE_OR_CANCEL_ONLY = whenFieldIn(
  'aefT3ActionsType',
  ['Use', 'First transfer', 'Cancellation', 'Voluntary Cancellation'],
  'only applicable to the action types "use", "first transfer" and "cancellation"',
);

const USE_ONLY = whenFieldIn(
  'aefT3ActionsType',
  ['Use'],
  'only applicable for use of ITMOs towards the Party\'s NDC',
);

const T3_ACTIONS: readonly AefFieldSpec[] = [
  {
    key: 'aefT3ActionsDate',
    technicalName: 'ActionDateTime',
    aefLabel: 'Action date',
    type: 'datetime',
    required: true,
    format: 'ISO 8601 UTC — <yyyy-mm-dd>T<hh:mm:ss.sss>Z',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Date on which the action was executed in the Party ITMO registry.',
  },
  {
    key: 'aefT3ActionsType',
    technicalName: 'ActionType',
    aefLabel: 'Action type',
    type: 'string',
    required: true,
    controlledValues: 'actionType',
    mandate: CMA4_17J,
    footnote: 'Action type as per decision 2/CMA.3, annex, para. 20(a).',
  },
  {
    key: 'aefT3ActionsSubtype',
    technicalName: 'ActionSubtype',
    aefLabel: 'Action subtype',
    type: 'string',
    required: false,
    controlledValues: 'actionSubtype',
    mandate: CMA4_17J,
    footnote: 'Action subtypes depend on the action type.',
  },
  {
    key: 'aefT3ActionsCooperativeApproachId',
    technicalName: 'CooperativeApproachID',
    aefLabel: 'Cooperative approach ID',
    type: 'string',
    required: true,
    controlledValues: 'cooperativeApproachId',
    pattern: COOPERATIVE_APPROACH_ID_PATTERN,
    format: 'CANNNN',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Unique identifier of the cooperative approach as per common nomenclatures.',
  },
  {
    key: 'aefT3ActionsAuthorizationId',
    technicalName: 'AuthorizationID',
    aefLabel: 'Authorization ID',
    type: 'string',
    required: true,
    pattern: AUTHORIZATION_ID_PATTERN,
    format: 'alphanumeric, space and hyphen only',
    mandate: CMA4_17J,
    footnote: 'Authorization ID as assigned by the reporting Party.',
  },
  {
    key: 'aefT3ActionsFirstTransferringPartyId',
    technicalName: 'FirstTransferringPartyID',
    aefLabel: 'First transferring participating Party ID',
    type: 'string',
    required: true,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Unique identifier of the participating Party in which the authorized mitigation outcome occurred.',
  },
  {
    key: 'aefT3ActionsPartyItmoRegistryId',
    technicalName: 'PartyITMORegistryID',
    aefLabel: 'Party ITMO registry ID',
    type: 'string',
    required: true,
    pattern: PARTY_ITMO_REGISTRY_ID_PATTERN,
    format: 'alpha-3 Party code plus a two-digit registry identifier',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Unique identifier of the Party ITMO registry in which the reported action has been tracked.',
  },
  {
    key: 'aefT3ActionsItmoFirstId',
    technicalName: 'FirstID',
    aefLabel: 'First ID',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Refers to the first unique identifier of the ITMO block as per decision 6/CMA.4, annex I, para. 5.',
  },
  {
    key: 'aefT3ActionsItmoLastId',
    technicalName: 'LastID',
    aefLabel: 'Last ID',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Refers to the last unique identifier of the ITMO block as per decision 6/CMA.4, annex I, para. 5.',
  },
  {
    key: 'aefT3ActionsUnitRegistryId',
    technicalName: 'UnderlyingUnitRegistryID',
    aefLabel: 'Underlying unit registry ID',
    type: 'string',
    required: false,
    controlledValues: 'underlyingUnitRegistryId',
    mandate: CMA4_17J,
    footnote: UNDERLYING_REGISTRY_FOOTNOTE,
  },
  {
    key: 'aefT3ActionsUnitFirstId',
    technicalName: 'UnderlyingUnitFirstUnitID',
    aefLabel: 'First unit ID',
    type: 'integer',
    required: false,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'The first unique identifier of the underlying unit block from an underlying cooperative ' +
      'approach registry.',
  },
  {
    key: 'aefT3ActionsUnitLastId',
    technicalName: 'UnderlyingUnitLastUnitID',
    aefLabel: 'Last unit ID',
    type: 'integer',
    required: false,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'The last unique identifier of the underlying unit block from an underlying cooperative ' +
      'approach registry.',
  },
  {
    key: 'aefT3ActionsMetric',
    technicalName: 'Metric',
    aefLabel: 'Metric',
    type: 'string',
    required: true,
    controlledValues: 'metric',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT3ActionsGwpValue',
    technicalName: 'GWPValues',
    aefLabel: 'Applicable GWP value(s)',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: GWP_FOOTNOTE,
  },
  {
    key: 'aefT3ActionsApplicableNonGhgMetric',
    technicalName: 'Non-GHGMetric',
    aefLabel: 'Applicable non-GHG metric',
    type: 'string',
    required: false,
    appliesWhen: whenMetricIsNonGhg('aefT3ActionsMetric'),
    mandate: CMA4_17J,
    footnote: NON_GHG_FOOTNOTE,
  },
  {
    key: 'aefT3ActionsQuantityTCo2',
    technicalName: 'QuantityCO2',
    aefLabel: 'Quantity (t CO2 eq)',
    type: 'number',
    required: true,
    mandate: CMA4_17J,
    footnote: 'Quantity of ITMOs in tons of CO2 equivalent.',
  },
  {
    key: 'aefT3ActionsQuantityNonGhg',
    technicalName: 'QuantityNon-GHG',
    aefLabel: 'Quantity (in non-GHG metric)',
    type: 'string',
    required: false,
    appliesWhen: whenMetricIsNonGhg('aefT3ActionsMetric'),
    mandate: CMA4_17J,
    footnote:
      'Quantity of ITMOs in the respective non-GHG metric. Reported as "Not applicable" (NA) if the ' +
      'ITMOs are in a GHG metric.',
  },
  {
    key: 'aefT3ActionsMitigationType',
    technicalName: 'MitigationType',
    aefLabel: 'Mitigation type',
    type: 'string',
    required: true,
    controlledValues: 'mitigationType',
    mandate: '6.2/CMA15, Annex II, Table 3',
  },
  {
    key: 'aefT3ActionsVintageYear',
    technicalName: 'Vintage',
    aefLabel: 'Vintage',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Calendar year in which the mitigation outcome occurred.',
  },
  {
    key: 'aefT3ActionsTransferringPartyId',
    technicalName: 'TransferringPartyID',
    aefLabel: 'Transferring participating Party ID',
    type: 'string',
    required: false,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    appliesWhen: ACQUISITION_ONLY,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Unique identifier of the transferring participating Party. Only applicable to the action ' +
      'type "acquisition"; otherwise reported as "Not applicable" (NA).',
  },
  {
    key: 'aefT3ActionsAcquiringPartyId',
    technicalName: 'AcquiringPartyID',
    aefLabel: 'Acquiring participating Party ID',
    type: 'string',
    required: false,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    appliesWhen: TRANSFER_LIKE_ONLY,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Unique identifier of the acquiring participating Party. Applicable to the action types ' +
      '"first transfer" and "transfer"; otherwise reported as "Not applicable" (NA).',
  },
  {
    key: 'aefT3ActionsPurposeOfUseOimp',
    technicalName: 'PurposeITMOUsedForOIMP',
    aefLabel: 'Purpose for which the ITMO has been used towards or cancelled for OIMP',
    type: 'string',
    required: false,
    appliesWhen: USE_OR_CANCEL_ONLY,
    mandate: CMA4_17J,
    footnote:
      'Specifies the purpose for which the ITMO has been first transferred for use towards IMP, ' +
      'cancelled for OP, or cancelled for purposes referred to in paragraph 20(a), annex, ' +
      'decision 2/CMA.3.',
  },
  {
    key: 'aefT3ActionsUsingParticipatingPartyId',
    technicalName: 'Using/cancellingPartyID',
    aefLabel: 'Using/cancelling participating Party ID',
    type: 'string',
    required: false,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    appliesWhen: USE_OR_CANCEL_ONLY,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Only applicable to report a use for IMP or cancellation for OP; otherwise reported as "NA".',
  },
  {
    key: 'aefT3ActionsUsingAuthorizedEntityId',
    technicalName: 'Using/cancellingEntityID',
    aefLabel: 'Using/cancelling authorized entity ID',
    type: 'string',
    required: false,
    appliesWhen: USE_OR_CANCEL_ONLY,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Only applicable to report the use or cancellation of authorized mitigation outcomes or ITMOs ' +
      'by authorized entities.',
  },
  {
    key: 'aefT3ActionsItmoUsedYear',
    technicalName: 'YearITMOUsedTowardsNDC',
    aefLabel: "Calendar year for which the ITMOs are used towards the Party's NDC",
    type: 'integer',
    required: false,
    appliesWhen: USE_ONLY,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'The calendar year for which the ITMOs are used towards an NDC. Only applicable for use of ' +
      'ITMOs towards the Party\'s NDC.',
  },
  {
    key: 'aefT3ActionsConsistencyCheckResult',
    technicalName: 'ResultOfConsistencyChecks',
    aefLabel: 'Result of the consistency checks',
    type: 'string',
    required: false,
    carpPopulated: true,
    footnote:
      'Shows the result of the consistency check on the reported action as per decision 2/CMA.3, ' +
      'annex, para. 33(a). Populated by the CARP.',
  },
  {
    key: 'aefT3ActionsAdditionalInformation',
    technicalName: 'AdditionalExplanatoryInformation',
    aefLabel: 'Additional explanatory information',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: 'This field is optional. The Party may use this field to provide any additional information.',
  },
];

// ---------------------------------------------------------------------------
// Table 4 — Holdings (16 fields)
// ---------------------------------------------------------------------------

const T4_HOLDINGS: readonly AefFieldSpec[] = [
  {
    key: 'aefT4HoldingsCooperativeApproachId',
    technicalName: 'CooperativeApproachID',
    aefLabel: 'Cooperative approach ID',
    type: 'string',
    required: true,
    controlledValues: 'cooperativeApproachId',
    pattern: COOPERATIVE_APPROACH_ID_PATTERN,
    format: 'CANNNN',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Unique identifier of the cooperative approach as per common nomenclatures.',
  },
  {
    key: 'aefT4HoldingsAuthorizationId',
    technicalName: 'AuthorizationID',
    aefLabel: 'Authorization ID',
    type: 'string',
    required: true,
    pattern: AUTHORIZATION_ID_PATTERN,
    format: 'alphanumeric, space and hyphen only',
    mandate: CMA4_17J,
    footnote: 'Authorization ID as assigned by the reporting Party.',
  },
  {
    key: 'aefT4HoldingsFirstTransferringPartyId',
    technicalName: 'FirstTransferringPartyID',
    aefLabel: 'First transferring participating Party ID',
    type: 'string',
    required: true,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Unique identifier of the participating Party in which the authorized mitigation outcome occurred.',
  },
  {
    key: 'aefT4HoldingsPartyItmoRegistryId',
    technicalName: 'PartyITMORegistryID',
    aefLabel: 'Party ITMO registry ID',
    type: 'string',
    required: true,
    pattern: PARTY_ITMO_REGISTRY_ID_PATTERN,
    format: 'alpha-3 Party code plus a two-digit registry identifier',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Unique identifier of the Party ITMO registry in which the ITMOs are held.',
  },
  {
    key: 'aefT4HoldingsItmoFirstId',
    technicalName: 'FirstID',
    aefLabel: 'First ID',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Refers to the first unique identifier of the ITMO block as per decision 6/CMA.4, annex I, para. 5.',
  },
  {
    key: 'aefT4HoldingsItmoLastId',
    technicalName: 'LastID',
    aefLabel: 'Last ID',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'Refers to the last unique identifier of the ITMO block as per decision 6/CMA.4, annex I, para. 5.',
  },
  {
    key: 'aefT4HoldingsUnitRegistryId',
    technicalName: 'UnderlyingUnitRegistryID',
    aefLabel: 'Underlying unit registry ID',
    type: 'string',
    required: false,
    controlledValues: 'underlyingUnitRegistryId',
    mandate: CMA4_17J,
    footnote: UNDERLYING_REGISTRY_FOOTNOTE,
  },
  {
    key: 'aefT4HoldingsUnitFirstId',
    technicalName: 'UnderlyingUnitFirstUnitID',
    aefLabel: 'First unit ID',
    type: 'integer',
    required: false,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'The first unique identifier of the underlying unit block from an underlying cooperative ' +
      'approach registry.',
  },
  {
    key: 'aefT4HoldingsUnitLastId',
    technicalName: 'UnderlyingUnitLastUnitID',
    aefLabel: 'Last unit ID',
    type: 'integer',
    required: false,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote:
      'The last unique identifier of the underlying unit block from an underlying cooperative ' +
      'approach registry.',
  },
  {
    key: 'aefT4HoldingsMetric',
    technicalName: 'Metric',
    aefLabel: 'Metric',
    type: 'string',
    required: true,
    controlledValues: 'metric',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT4HoldingsGwpValue',
    technicalName: 'GWPValues',
    aefLabel: 'Applicable GWP value(s)',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: GWP_FOOTNOTE,
  },
  {
    key: 'aefT4HoldingsApplicableNonGhgMetric',
    technicalName: 'Non-GHGMetric',
    aefLabel: 'Applicable non-GHG metric',
    type: 'string',
    required: false,
    appliesWhen: whenMetricIsNonGhg('aefT4HoldingsMetric'),
    mandate: CMA4_17J,
    footnote: NON_GHG_FOOTNOTE,
  },
  {
    key: 'aefT4HoldingsQuantityTCo2',
    technicalName: 'QuantityCO2',
    aefLabel: 'Quantity (t CO2 eq)',
    type: 'number',
    required: true,
    mandate: CMA4_17J,
    footnote: 'Quantity of ITMOs in tons of CO2 equivalent.',
  },
  {
    key: 'aefT4HoldingsQuantityNonGhg',
    technicalName: 'QuantityNon-GHG',
    aefLabel: 'Quantity (in non-GHG metric)',
    type: 'string',
    required: false,
    appliesWhen: whenMetricIsNonGhg('aefT4HoldingsMetric'),
    mandate: CMA4_17J,
    footnote:
      'Quantity of ITMOs in the respective non-GHG metric. Reported as "Not applicable" (NA) if the ' +
      'ITMOs are in a GHG metric.',
  },
  {
    key: 'aefT4HoldingsMitigationType',
    technicalName: 'MitigationType',
    aefLabel: 'Mitigation type',
    type: 'string',
    required: true,
    controlledValues: 'mitigationType',
    mandate: '6.2/CMA15, Annex II, Table 3',
  },
  {
    key: 'aefT4HoldingsVintageYear',
    technicalName: 'Vintage',
    aefLabel: 'Vintage',
    type: 'integer',
    required: true,
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Calendar year in which the mitigation outcome occurred.',
  },
];

// ---------------------------------------------------------------------------
// Table 5 — Authorized entities (8 fields)
// ---------------------------------------------------------------------------

const T5_AUTHORIZED_ENTITIES: readonly AefFieldSpec[] = [
  {
    key: 'aefT5AuthorizedEntitiesAuthorizationDate',
    technicalName: 'DateOfAuthorization',
    aefLabel: 'Date of the authorization',
    type: 'date',
    required: true,
    format: 'dd/mm/yyyy',
    mandate: CMA4_17J,
    footnote: 'Date on which the authorization was issued.',
  },
  {
    key: 'aefT5AuthorizedEntitiesName',
    technicalName: 'AuthorizedEntityName',
    aefLabel: 'Name',
    type: 'string',
    required: true,
    mandate: CMA4_17J,
  },
  {
    key: 'aefT5AuthorizedEntitiesIncorporationCountry',
    technicalName: 'AuthorizedEntityCountryOfIncorporation',
    aefLabel: 'Country of incorporation',
    type: 'string',
    required: true,
    pattern: PARTY_CODE_PATTERN,
    format: 'ISO 3166-1 alpha-3',
    mandate: CMA4_17J,
  },
  {
    key: 'aefT5AuthorizedEntitiesId',
    technicalName: 'AuthorizedEntityID',
    aefLabel: 'Identification number',
    type: 'string',
    required: true,
    mandate: CMA4_17J,
    footnote: 'Identification number in the country of incorporation.',
  },
  {
    key: 'aefT5AuthorizedEntitiesCooperativeApproachId',
    technicalName: 'CooperativeApproachID',
    aefLabel: 'Cooperative approach ID',
    type: 'string',
    required: true,
    controlledValues: 'cooperativeApproachId',
    pattern: COOPERATIVE_APPROACH_ID_PATTERN,
    format: 'CANNNN',
    mandate: `${CMA4_ANNEX_I_5}; ${CMA4_17J}`,
    footnote: 'Unique identifier of the cooperative approach as per common nomenclatures.',
  },
  {
    key: 'aefT5AuthorizedEntitiesConditions',
    technicalName: 'AuthorizedEntityConditions',
    aefLabel: 'Conditions',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'This field is optional. The conditions under which the authorization was provided, as applicable.',
  },
  {
    key: 'aefT5AuthorizedEntitiesChangeConditions',
    technicalName: 'AuthorizedEntityChangeConditions',
    aefLabel: 'Change and revocation conditions',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote:
      'This field is optional. Whether the authorization could be changed or revoked and under ' +
      'which conditions.',
  },
  {
    key: 'aefT5AuthorizedEntitiesAdditionalInformation',
    technicalName: 'AdditionalExplanatoryInformation',
    aefLabel: 'Additional explanatory information',
    type: 'string',
    required: false,
    mandate: CMA4_17J,
    footnote: 'This field is optional. The Party may use this field to provide any additional information.',
  },
];

/**
 * Every AEF field, per table, **in CSV order**.
 *
 * Arrays rather than records: the order is part of the contract and an object's
 * key order is too easy to disturb.
 */
export const AEF_FIELD_SPECS: Readonly<Record<AefTableName, readonly AefFieldSpec[]>> = {
  t1Submission: T1_SUBMISSION,
  t2Authorizations: T2_AUTHORIZATIONS,
  t3Actions: T3_ACTIONS,
  t4Holdings: T4_HOLDINGS,
  t5AuthorizedEntities: T5_AUTHORIZED_ENTITIES,
};

/** Field count per table, as printed in `AEF_CMA6_second_iteration.csv`. */
export const AEF_FIELD_COUNTS: Readonly<Record<AefTableName, number>> = {
  t1Submission: 9,
  t2Authorizations: 19,
  t3Actions: 27,
  t4Holdings: 16,
  t5AuthorizedEntities: 8,
};

export function fieldSpecsFor(table: AefTableName): readonly AefFieldSpec[] {
  return AEF_FIELD_SPECS[table];
}

export function findFieldSpec(table: AefTableName, key: string): AefFieldSpec | undefined {
  return AEF_FIELD_SPECS[table].find((spec) => spec.key === key);
}

/** Fields CARP fills in. The registry must leave every one of these empty. */
export function carpPopulatedFields(table: AefTableName): readonly AefFieldSpec[] {
  return AEF_FIELD_SPECS[table].filter((spec) => spec.carpPopulated === true);
}
