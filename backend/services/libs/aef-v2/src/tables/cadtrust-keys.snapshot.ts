/**
 * CAD Trust's own AEF field keys, per table.
 *
 * Transcribed from the CADT RPC API V2 guide's `POST /v2/aef-*` field tables.
 *
 * Why a snapshot rather than a type import: `@app/cadtrust` exists only on the
 * `UNCR-465` branch, so a compile-time check against its `AefT*CreateInput`
 * types is not available here. This is the next best guard, and it is the only
 * thing standing between the two field sets now that no mapper absorbs a
 * divergence.
 *
 * **Replace this with a type-only import of `@app/cadtrust` once that branch
 * merges** — it is strictly stronger, costs nothing at runtime, and cannot fall
 * out of date the way a snapshot can.
 *
 * Keys are listed in the CAD Trust guide's order, which is *not* the CMA.6 CSV
 * order the library uses; only membership is compared.
 */
export const CADTRUST_AEF_KEYS: Readonly<Record<string, readonly string[]>> = {
  t1Submission: [
    'aefT1SubmissionParty',
    'aefT1SubmissionVersion',
    'aefT1SubmissionReportYear',
    'aefT1SubmissionSubmissionDate',
    'aefT1SubmissionReviewStatus',
    'aefT1SubmissionResultCheck',
    'aefT1SubmissionNdcFirstYear',
    'aefT1SubmissionNdcLastYear',
    'aefT1SubmissionReferenceReviewReport',
  ],
  t2Authorizations: [
    'aefT2AuthorizationsId',
    'aefT2AuthorizationsDate',
    'aefT2AuthorizationsCooperativeApproachId',
    'aefT2AuthorizationsAuthorizedPartyId',
    'aefT2AuthorizationsVersion',
    'aefT2AuthorizationsQuantity',
    'aefT2AuthorizationsMetric',
    'aefT2AuthorizationsGwpValue',
    'aefT2AuthorizationsApplicableNonGhgMetric',
    'aefT2AuthorizationsSector',
    'aefT2AuthorizationsActivityType',
    'aefT2AuthorizationsPurposesForAuthorization',
    // SOURCE TYPO, PRESERVED: CAD Trust spells this "Authozied".
    'aefT2AuthorizationsAuthoziedEntityId',
    'aefT2AuthorizationsOimpAuthorizedParty',
    'aefT2AuthorizationsAuthorizedTimeframe',
    'aefT2AuthorizationsAuthorizationTerms',
    'aefT2AuthorizationsAuthorizationDocumentation',
    'aefT2AuthorizationsFirstTransferDefinitionOimp',
    'aefT2AuthorizationsAdditionalInformation',
  ],
  t3Actions: [
    'aefT3ActionsDate',
    'aefT3ActionsCooperativeApproachId',
    'aefT3ActionsAuthorizationId',
    'aefT3ActionsFirstTransferringPartyId',
    'aefT3ActionsPartyItmoRegistryId',
    'aefT3ActionsItmoFirstId',
    'aefT3ActionsItmoLastId',
    'aefT3ActionsUnitRegistryId',
    'aefT3ActionsUnitFirstId',
    'aefT3ActionsUnitLastId',
    'aefT3ActionsQuantityTCo2',
    'aefT3ActionsVintageYear',
    'aefT3ActionsTransferringPartyId',
    'aefT3ActionsAcquiringPartyId',
    'aefT3ActionsType',
    'aefT3ActionsSubtype',
    'aefT3ActionsMetric',
    'aefT3ActionsGwpValue',
    'aefT3ActionsApplicableNonGhgMetric',
    'aefT3ActionsQuantityNonGhg',
    'aefT3ActionsMitigationType',
    'aefT3ActionsPurposeOfUseOimp',
    'aefT3ActionsUsingParticipatingPartyId',
    'aefT3ActionsUsingAuthorizedEntityId',
    'aefT3ActionsItmoUsedYear',
    'aefT3ActionsConsistencyCheckResult',
    'aefT3ActionsAdditionalInformation',
  ],
  t4Holdings: [
    'aefT4HoldingsCooperativeApproachId',
    'aefT4HoldingsAuthorizationId',
    'aefT4HoldingsFirstTransferringPartyId',
    'aefT4HoldingsPartyItmoRegistryId',
    'aefT4HoldingsItmoFirstId',
    'aefT4HoldingsItmoLastId',
    'aefT4HoldingsUnitRegistryId',
    'aefT4HoldingsUnitFirstId',
    'aefT4HoldingsUnitLastId',
    'aefT4HoldingsQuantityTCo2',
    'aefT4HoldingsVintageYear',
    'aefT4HoldingsMetric',
    'aefT4HoldingsGwpValue',
    'aefT4HoldingsApplicableNonGhgMetric',
    'aefT4HoldingsQuantityNonGhg',
    'aefT4HoldingsMitigationType',
  ],
  t5AuthorizedEntities: [
    'aefT5AuthorizedEntitiesAuthorizationDate',
    'aefT5AuthorizedEntitiesName',
    'aefT5AuthorizedEntitiesId',
    'aefT5AuthorizedEntitiesCooperativeApproachId',
    'aefT5AuthorizedEntitiesIncorporationCountry',
    'aefT5AuthorizedEntitiesConditions',
    'aefT5AuthorizedEntitiesChangeConditions',
    'aefT5AuthorizedEntitiesAdditionalInformation',
  ],
};
