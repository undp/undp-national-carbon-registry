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
// Issuance  ·  /v2/issuance  ·  primary key: cadTrustIssuanceId
// NOTE: Child of Project, but its two hard FK requirements are Verification and ProjectMethodology (not Project directly). cadTrustLocationId is optional at the field-validation level but is listed under the schema's own "required_for_data_activation" field set, so treat it as required for any issuance you intend to be usable downstream.
// NOTE: Creating an issuance requires the parent project's Verification, ProjectMethodology, and (recommended) Location records to already exist.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/issuance` (stages a new Issuance record). */
export interface IssuanceCreateInput {
  /** Unique identifier for the issuance */
  issuanceId: string;
  /** CAD Trust verification identifier. Must be a valid UUID */
  cadTrustVerificationId: string;
  /** CAD Trust project methodology identifier. Must be a valid UUID referencing the project_methodology table */
  cadTrustProjectMethodologyId: string;
  /** Date of the issuance (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  issuanceDate?: string;
  /** CAD Trust location identifier. Must be a valid UUID */
  cadTrustLocationId?: string;
}

/**
 * Request body for `PUT /v2/issuance/{cadTrustIssuanceId}` (stages an update to an existing Issuance record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type IssuanceUpdateInput = IssuanceCreateInput;

/** Shape of a Issuance record as returned by `GET /v2/issuance` / `GET /v2/issuance/{id}`. */
export interface IssuanceRecord extends IssuanceCreateInput {
  cadTrustIssuanceId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/issuance`. */
export interface IssuanceCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustIssuanceId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/issuance/{id}` and `DELETE /v2/issuance/{id}`. */
export interface IssuanceMutationResponse {
  message: string;
  success: boolean;
}

