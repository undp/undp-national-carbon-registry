/**
 * Endpoint path and primary-key field for every CRUD resource.
 *
 * Every row here is transcribed from the header comment of the matching file in
 * `../interfaces` (e.g. `// Unit · /v2/unit · primary key: cadTrustUnitId`).
 * Those comments are the authority — do not re-derive a path from an entity name.
 *
 * Order below follows the API guide's documented INSERT ORDER, which an adaptor
 * must honour when staging records so foreign keys resolve. This package does not
 * enforce that order; enforcing it is adaptor business logic.
 */

export interface ResourceDefinition {
  /** Path relative to the /v2 base URL. */
  path: string;
  /** The field the API returns as this resource's UUID, and that goes in the URL on PUT/DELETE. */
  primaryKey: string;
}

export const RESOURCES = {
  // --- Baseline tables, in insert order -------------------------------------
  program: { path: '/program', primaryKey: 'cadTrustProgramId' },
  methodology: { path: '/methodology', primaryKey: 'cadTrustMethodologyId' },
  stakeholder: { path: '/stakeholder', primaryKey: 'cadTrustStakeholderId' },
  label: { path: '/label', primaryKey: 'cadTrustLabelId' },
  project: { path: '/project', primaryKey: 'cadTrustProjectId' },
  projectMethodology: { path: '/project-methodology', primaryKey: 'cadTrustProjectMethodologyId' },
  stakeholderProject: { path: '/stakeholder-projects', primaryKey: 'cadTrustStakeholderProjectId' },
  validation: { path: '/validation', primaryKey: 'cadTrustValidationId' },
  verification: { path: '/verification', primaryKey: 'cadTrustVerificationId' },
  location: { path: '/location', primaryKey: 'cadTrustLocationId' },
  estimation: { path: '/estimation', primaryKey: 'cadTrustEstimationId' },
  rating: { path: '/rating', primaryKey: 'cadTrustRatingId' },
  coBenefit: { path: '/co-benefit', primaryKey: 'cadTrustCoBenefitId' },
  issuance: { path: '/issuance', primaryKey: 'cadTrustIssuanceId' },
  unit: { path: '/unit', primaryKey: 'cadTrustUnitId' },
  unitLabel: { path: '/unit-label', primaryKey: 'cadTrustUnitLabelId' },

  // --- Article 6.2 AEF tables (optional; only for AEF-reporting registries) --
  aefT1Submission: { path: '/aef-t1-submission', primaryKey: 'cadTrustAefT1SubmissionId' },
  aefT2Authorizations: { path: '/aef-t2-authorizations', primaryKey: 'cadTrustAefT2AuthorizationsId' },
  aefT3Actions: { path: '/aef-t3-actions', primaryKey: 'cadTrustAefT3ActionsId' },
  aefT4Holdings: { path: '/aef-t4-holdings', primaryKey: 'cadTrustAefT4HoldingsId' },
  aefT5AuthorizedEntities: {
    path: '/aef-t5-authorized-entities',
    primaryKey: 'cadTrustAefT5AuthorizedEntitiesId',
  },
} as const;

export type ResourceName = keyof typeof RESOURCES;

/**
 * Insert order for the baseline tables, straight from the API guide's "Data Model
 * Overview". Exposed so an adaptor can drive a dependency-ordered write without
 * re-typing the chain; this package never walks it itself.
 */
export const INSERT_ORDER: ResourceName[] = [
  'program',
  'methodology',
  'stakeholder',
  'label',
  'project',
  'projectMethodology',
  'stakeholderProject',
  'validation',
  'verification',
  'location',
  'estimation',
  'rating',
  'coBenefit',
  'issuance',
  'unit',
  'unitLabel',
];

/**
 * AEF insert order: t5 and/or t1 first, then t2, then t3 and t4 (both of which
 * need a t2 authorization to already exist).
 */
export const AEF_INSERT_ORDER: ResourceName[] = [
  'aefT5AuthorizedEntities',
  'aefT1Submission',
  'aefT2Authorizations',
  'aefT3Actions',
  'aefT4Holdings',
];
