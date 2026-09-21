/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md (develop branch)
 * and cross-checked against docs/cadtrust-schema-v2.0.2.json.
 * Field names, required/optional flags, and payload shapes are taken verbatim
 * from the POST "Fields:" tables and curl examples in the live API guide —
 * nothing here is inferred from the DBML or the Technical Report.
 *
 * Do not hand-edit field lists without re-checking the source doc; re-generate instead.
 */

// ---------------------------------------------------------------------------
// AefT3Actions  ·  /v2/aef-t3-actions  ·  primary key: cadTrustAefT3ActionsId
// NOTE: Requires a corresponding AefT2Authorizations record to exist (hard FK dependency per validation_rules.conditional_requirements).
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/aef-t3-actions` (stages a new AefT3Actions record). */
export interface AefT3ActionsCreateInput {
  /** Action date (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  aefT3ActionsDate: string;
  /** Cooperative approach identifier (max 255 characters) */
  aefT3ActionsCooperativeApproachId: string;
  /** Authorization identifier (max 255 characters) */
  aefT3ActionsAuthorizationId: string;
  /** First transferring party identifier (max 255 characters) */
  aefT3ActionsFirstTransferringPartyId: string;
  /** Party ITMO registry identifier (max 255 characters) */
  aefT3ActionsPartyItmoRegistryId: string;
  /** ITMO first identifier (max 255 characters) */
  aefT3ActionsItmoFirstId: string;
  /** ITMO last identifier (max 255 characters) */
  aefT3ActionsItmoLastId: string;
  /** Unit registry identifier (max 255 characters) */
  aefT3ActionsUnitRegistryId: string;
  /** Unit first identifier (max 255 characters) */
  aefT3ActionsUnitFirstId: string;
  /** Unit last identifier (max 255 characters) */
  aefT3ActionsUnitLastId: string;
  /** Quantity in tCO2 (max 2 decimal places) */
  aefT3ActionsQuantityTCo2: number;
  /** Vintage year (must be between 1900 and 2100) */
  aefT3ActionsVintageYear: number;
  /** Transferring party identifier (max 255 characters) */
  aefT3ActionsTransferringPartyId: string;
  /** Acquiring party identifier (max 255 characters) */
  aefT3ActionsAcquiringPartyId: string;
  /** Action type (can be null) Picklist "aef_t3_actions_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT3ActionsType?: string;
  /** Action subtype (max 255 characters, can be null) */
  aefT3ActionsSubtype?: string;
  /** Metric (can be null) Picklist "aef_t2_authorizations_metric" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT3ActionsMetric?: string;
  /** GWP value (max 255 characters, can be null) */
  aefT3ActionsGwpValue?: string;
  /** Applicable non-GHG metric (max 255 characters, can be null) */
  aefT3ActionsApplicableNonGhgMetric?: string;
  /** Quantity non-GHG (max 255 characters, can be null) */
  aefT3ActionsQuantityNonGhg?: string;
  /** Mitigation type (can be null) Picklist "aef_t3_actions_mitigation_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT3ActionsMitigationType?: string;
  /** Purpose of use OIMP (max 255 characters, can be null) */
  aefT3ActionsPurposeOfUseOimp?: string;
  /** Using participating party identifier (max 255 characters, can be null) */
  aefT3ActionsUsingParticipatingPartyId?: string;
  /** Using authorized entity identifier (max 255 characters, can be null) */
  aefT3ActionsUsingAuthorizedEntityId?: string;
  /** ITMO used year (must be between 1900 and 2100, can be null) */
  aefT3ActionsItmoUsedYear?: number;
  /** Consistency check result (max 255 characters, can be null) */
  aefT3ActionsConsistencyCheckResult?: string;
  /** Additional information (max 255 characters, can be null) */
  aefT3ActionsAdditionalInformation?: string;
  /** CAD Trust AEF T1 submission identifier. Must be a valid UUID (can be null) */
  cadTrustAefT1SubmissionId?: string;
  /** CAD Trust unit identifier. Must be a valid UUID (can be null) */
  cadTrustUnitId?: string;
  /** CAD Trust project identifier. Must be a valid UUID (can be null) */
  cadTrustProjectId?: string;
  /** CAD Trust AEF T2 authorizations identifier. Must be a valid UUID (can be null) */
  cadTrustAefT2AuthorizationsId?: string;
}

/**
 * Request body for `PUT /v2/aef-t3-actions/{cadTrustAefT3ActionsId}` (stages an update to an existing AefT3Actions record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type AefT3ActionsUpdateInput = AefT3ActionsCreateInput;

/** Shape of a AefT3Actions record as returned by `GET /v2/aef-t3-actions` / `GET /v2/aef-t3-actions/{id}`. */
export interface AefT3ActionsRecord extends AefT3ActionsCreateInput {
  cadTrustAefT3ActionsId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/aef-t3-actions`. */
export interface AefT3ActionsCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustAefT3ActionsId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/aef-t3-actions/{id}` and `DELETE /v2/aef-t3-actions/{id}`. */
export interface AefT3ActionsMutationResponse {
  message: string;
  success: boolean;
}

