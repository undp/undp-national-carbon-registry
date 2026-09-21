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
// AefT1Submission  ·  /v2/aef-t1-submission  ·  primary key: cadTrustAefT1SubmissionId
// NOTE: Root AEF record. Article 6.2 AEF tables are optional — only needed by registries/governments submitting AEF reports. Insert order: aef_t5_authorized_entities and/or aef_t1_submission first, then aef_t2_authorizations, then aef_t3_actions and aef_t4_holdings.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/aef-t1-submission` (stages a new AefT1Submission record). */
export interface AefT1SubmissionCreateInput {
  /** Party submitting the AEF (max 255 characters) */
  aefT1SubmissionParty: string;
  /** Version of the submission (max 255 characters) */
  aefT1SubmissionVersion: string;
  /** Report year (must be between 1900 and 2100) */
  aefT1SubmissionReportYear: number;
  /** Submission date (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  aefT1SubmissionSubmissionDate: string;
  /** Review status (can be null) */
  aefT1SubmissionReviewStatus?: string;
  /** Result check (can be null) */
  aefT1SubmissionResultCheck?: string;
  /** NDC first year (must be between 1900 and 2100, can be null) */
  aefT1SubmissionNdcFirstYear?: number;
  /** NDC last year (must be between 1900 and 2100, can be null) */
  aefT1SubmissionNdcLastYear?: number;
  /** Reference review report URL. Must be a valid URI (can be null) */
  aefT1SubmissionReferenceReviewReport?: string;
}

/**
 * Request body for `PUT /v2/aef-t1-submission/{cadTrustAefT1SubmissionId}` (stages an update to an existing AefT1Submission record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type AefT1SubmissionUpdateInput = AefT1SubmissionCreateInput;

/** Shape of a AefT1Submission record as returned by `GET /v2/aef-t1-submission` / `GET /v2/aef-t1-submission/{id}`. */
export interface AefT1SubmissionRecord extends AefT1SubmissionCreateInput {
  cadTrustAefT1SubmissionId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/aef-t1-submission`. */
export interface AefT1SubmissionCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustAefT1SubmissionId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/aef-t1-submission/{id}` and `DELETE /v2/aef-t1-submission/{id}`. */
export interface AefT1SubmissionMutationResponse {
  message: string;
  success: boolean;
}

