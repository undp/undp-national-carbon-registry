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
// Validation  ·  /v2/validation  ·  primary key: cadTrustValidationId
// NOTE: Child of Project. A Verification record may optionally reference a Validation via cadTrustValidationId — if set, that Validation must already exist.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/validation` (stages a new Validation record). */
export interface ValidationCreateInput {
  /** Unique identifier for the validation */
  validationId: string;
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Type of validation Picklist "validation_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  validationType: string;
  /** Validation body Picklist "validation_body" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  validationBody: string;
  /** Date of the validation (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  validationDate?: string;
  /** Start date of the credit period (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  validationCreditPeriodStartDate?: string;
  /** End date of the credit period (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  validationCreditPeriodEndDate?: string;
}

/**
 * Request body for `PUT /v2/validation/{cadTrustValidationId}` (stages an update to an existing Validation record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type ValidationUpdateInput = ValidationCreateInput;

/** Shape of a Validation record as returned by `GET /v2/validation` / `GET /v2/validation/{id}`. */
export interface ValidationRecord extends ValidationCreateInput {
  cadTrustValidationId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/validation`. */
export interface ValidationCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustValidationId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/validation/{id}` and `DELETE /v2/validation/{id}`. */
export interface ValidationMutationResponse {
  message: string;
  success: boolean;
}

