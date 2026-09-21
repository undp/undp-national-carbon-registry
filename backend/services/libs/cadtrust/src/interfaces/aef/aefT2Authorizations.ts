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
// AefT2Authorizations  ·  /v2/aef-t2-authorizations  ·  primary key: cadTrustAefT2AuthorizationsId
// NOTE: Central AEF linking table. Optionally links back to Submission, Unit, Project, and AefT5AuthorizedEntities.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/aef-t2-authorizations` (stages a new AefT2Authorizations record). */
export interface AefT2AuthorizationsCreateInput {
  /** Authorization identifier (max 255 characters) */
  aefT2AuthorizationsId: string;
  /** Authorization date (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  aefT2AuthorizationsDate: string;
  /** Cooperative approach identifier (max 255 characters) */
  aefT2AuthorizationsCooperativeApproachId: string;
  /** Authorized party identifier (max 255 characters) */
  aefT2AuthorizationsAuthorizedPartyId: string;
  /** Version (max 255 characters, can be null) */
  aefT2AuthorizationsVersion?: string;
  /** Quantity (max 2 decimal places, can be null) */
  aefT2AuthorizationsQuantity?: number;
  /** Metric (can be null) Picklist "aef_t2_authorizations_metric" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT2AuthorizationsMetric?: string;
  /** GWP value (max 255 characters, can be null) */
  aefT2AuthorizationsGwpValue?: string;
  /** Applicable non-GHG metric (max 255 characters, can be null) */
  aefT2AuthorizationsApplicableNonGhgMetric?: string;
  /** Sector (can be null) Picklist "aef_t2_authorizations_sector" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT2AuthorizationsSector?: string;
  /** Activity type (can be null) Picklist "aef_t2_authorizations_activity_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT2AuthorizationsActivityType?: string;
  /** Purposes for authorization (can be null) Picklist "aef_t2_authorizations_purposes_for_authorization" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT2AuthorizationsPurposesForAuthorization?: string;
  /** Authorized entity identifier (max 255 characters, can be null) */
  aefT2AuthorizationsAuthoziedEntityId?: string;
  /** OIMP authorized party (max 255 characters, can be null) */
  aefT2AuthorizationsOimpAuthorizedParty?: string;
  /** Authorized timeframe (max 255 characters, can be null) */
  aefT2AuthorizationsAuthorizedTimeframe?: string;
  /** Authorization terms (max 255 characters, can be null) */
  aefT2AuthorizationsAuthorizationTerms?: string;
  /** Authorization documentation (can be null) */
  aefT2AuthorizationsAuthorizationDocumentation?: string;
  /** First transfer definition OIMP (can be null) */
  aefT2AuthorizationsFirstTransferDefinitionOimp?: string;
  /** Additional information (can be null) */
  aefT2AuthorizationsAdditionalInformation?: string;
  /** CAD Trust AEF T1 submission identifier. Must be a valid UUID (can be null) */
  cadTrustAefT1SubmissionId?: string;
  /** CAD Trust unit identifier. Must be a valid UUID (can be null) */
  cadTrustUnitId?: string;
  /** CAD Trust project identifier. Must be a valid UUID (can be null) */
  cadTrustProjectId?: string;
  /** CAD Trust AEF T5 authorized entities identifier. Must be a valid UUID (can be null) */
  cadTrustAefT5AuthorizedEntitiesId?: string;
}

/**
 * Request body for `PUT /v2/aef-t2-authorizations/{cadTrustAefT2AuthorizationsId}` (stages an update to an existing AefT2Authorizations record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type AefT2AuthorizationsUpdateInput = AefT2AuthorizationsCreateInput;

/** Shape of a AefT2Authorizations record as returned by `GET /v2/aef-t2-authorizations` / `GET /v2/aef-t2-authorizations/{id}`. */
export interface AefT2AuthorizationsRecord extends AefT2AuthorizationsCreateInput {
  cadTrustAefT2AuthorizationsId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/aef-t2-authorizations`. */
export interface AefT2AuthorizationsCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustAefT2AuthorizationsId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/aef-t2-authorizations/{id}` and `DELETE /v2/aef-t2-authorizations/{id}`. */
export interface AefT2AuthorizationsMutationResponse {
  message: string;
  success: boolean;
}

