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
// Label  ·  /v2/label  ·  primary key: cadTrustLabelId
// NOTE: Standalone certification/eligibility record (e.g. CORSIA, CCP, Article 6). Assign to units via UnitLabel.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/label` (stages a new Label record). */
export interface LabelCreateInput {
  /** Name of the label (max 255 characters) */
  labelName: string;
  /** Type of label. Must be one of: Certification, Article 6 - Endorsement, Article 6 - Letter of Qualification, Article 6 - Authorisation, Article 6 - Letter of Approvals */
  labelType: string;
  /** URL link to the label. Must be a valid URI */
  labelLink?: string;
  /** Date of the label (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  labelDate?: string;
}

/**
 * Request body for `PUT /v2/label/{cadTrustLabelId}` (stages an update to an existing Label record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type LabelUpdateInput = LabelCreateInput;

/** Shape of a Label record as returned by `GET /v2/label` / `GET /v2/label/{id}`. */
export interface LabelRecord extends LabelCreateInput {
  cadTrustLabelId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/label`. */
export interface LabelCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustLabelId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/label/{id}` and `DELETE /v2/label/{id}`. */
export interface LabelMutationResponse {
  message: string;
  success: boolean;
}

