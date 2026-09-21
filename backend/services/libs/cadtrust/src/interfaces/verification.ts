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
// Verification  ·  /v2/verification  ·  primary key: cadTrustVerificationId
// NOTE: Child of Project. Split out from Issuance in v2 (v1 held verification fields on the issuance record).
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/verification` (stages a new Verification record). */
export interface VerificationCreateInput {
  /** Unique identifier for the verification */
  verificationId: string;
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Start date of the verification (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  verificationStartDate?: string;
  /** End date of the verification (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  verificationEndDate?: string;
  /** Verification body Picklist "verification_body" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  verificationBody: string;
  /** CAD Trust validation identifier. Must be a valid UUID */
  cadTrustValidationId?: string;
}

/**
 * Request body for `PUT /v2/verification/{cadTrustVerificationId}` (stages an update to an existing Verification record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type VerificationUpdateInput = VerificationCreateInput;

/** Shape of a Verification record as returned by `GET /v2/verification` / `GET /v2/verification/{id}`. */
export interface VerificationRecord extends VerificationCreateInput {
  cadTrustVerificationId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/verification`. */
export interface VerificationCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustVerificationId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/verification/{id}` and `DELETE /v2/verification/{id}`. */
export interface VerificationMutationResponse {
  message: string;
  success: boolean;
}

