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
// AefT5AuthorizedEntities  ·  /v2/aef-t5-authorized-entities  ·  primary key: cadTrustAefT5AuthorizedEntitiesId
// NOTE: Can be created before or alongside AefT1Submission — both sit at the root of the AEF insert order.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/aef-t5-authorized-entities` (stages a new AefT5AuthorizedEntities record). */
export interface AefT5AuthorizedEntitiesCreateInput {
  /** Authorization date (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  aefT5AuthorizedEntitiesAuthorizationDate: string;
  /** Name of the authorized entity (max 255 characters) */
  aefT5AuthorizedEntitiesName: string;
  /** Identifier of the authorized entity (max 255 characters) */
  aefT5AuthorizedEntitiesId: string;
  /** Cooperative approach identifier (max 255 characters) */
  aefT5AuthorizedEntitiesCooperativeApproachId: string;
  /** Incorporation country (can be null) Picklist "aef_t5_authorized_entities_incorporation_country" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  aefT5AuthorizedEntitiesIncorporationCountry?: string;
  /** Conditions (can be null) */
  aefT5AuthorizedEntitiesConditions?: string;
  /** Change conditions (can be null) */
  aefT5AuthorizedEntitiesChangeConditions?: string;
  /** Additional information (can be null) */
  aefT5AuthorizedEntitiesAdditionalInformation?: string;
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
 * Request body for `PUT /v2/aef-t5-authorized-entities/{cadTrustAefT5AuthorizedEntitiesId}` (stages an update to an existing AefT5AuthorizedEntities record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type AefT5AuthorizedEntitiesUpdateInput = AefT5AuthorizedEntitiesCreateInput;

/** Shape of a AefT5AuthorizedEntities record as returned by `GET /v2/aef-t5-authorized-entities` / `GET /v2/aef-t5-authorized-entities/{id}`. */
export interface AefT5AuthorizedEntitiesRecord extends AefT5AuthorizedEntitiesCreateInput {
  cadTrustAefT5AuthorizedEntitiesId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/aef-t5-authorized-entities`. */
export interface AefT5AuthorizedEntitiesCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustAefT5AuthorizedEntitiesId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/aef-t5-authorized-entities/{id}` and `DELETE /v2/aef-t5-authorized-entities/{id}`. */
export interface AefT5AuthorizedEntitiesMutationResponse {
  message: string;
  success: boolean;
}

