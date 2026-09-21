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
// Estimation  ·  /v2/estimation  ·  primary key: cadTrustEstimationId
// NOTE: Child of Project. Forward-looking projected credit volume before verification/issuance.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/estimation` (stages a new Estimation record). */
export interface EstimationCreateInput {
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Start date of the estimation period (ISO 8601 format: YYYY-MM-DD) (ISO 8601 date, e.g. "2022-03-12") */
  estimationStartDate: string;
  /** End date of the estimation period (ISO 8601 format: YYYY-MM-DD). Must be after estimationStartDate (ISO 8601 date, e.g. "2022-03-12") */
  estimationEndDate: string;
  /** Estimated unit count (max 6 decimal places) */
  estimationUnitCount: number;
  /** Reference number for the estimation (max 255 characters) */
  estimationReferenceNo?: string;
}

/**
 * Request body for `PUT /v2/estimation/{cadTrustEstimationId}` (stages an update to an existing Estimation record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type EstimationUpdateInput = EstimationCreateInput;

/** Shape of a Estimation record as returned by `GET /v2/estimation` / `GET /v2/estimation/{id}`. */
export interface EstimationRecord extends EstimationCreateInput {
  cadTrustEstimationId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/estimation`. */
export interface EstimationCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustEstimationId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/estimation/{id}` and `DELETE /v2/estimation/{id}`. */
export interface EstimationMutationResponse {
  message: string;
  success: boolean;
}

