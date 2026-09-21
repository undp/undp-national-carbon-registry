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
// UnitLabel  ·  /v2/unit-label  ·  primary key: cadTrustUnitLabelId
// NOTE: Join table (unit <-> label, many-to-many).
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/unit-label` (stages a new UnitLabel record). */
export interface UnitLabelCreateInput {
  /** CAD Trust label identifier. Must be a valid UUID */
  cadTrustLabelId: string;
  /** CAD Trust unit identifier. Must be a valid UUID */
  cadTrustUnitId: string;
  /** Date of the unit-label relationship (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  labelUnitDate: string;
  /** Description of the relationship (can be null) */
  labelUnitDescription?: string;
}

/**
 * Request body for `PUT /v2/unit-label/{cadTrustUnitLabelId}` (stages an update to an existing UnitLabel record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type UnitLabelUpdateInput = UnitLabelCreateInput;

/** Shape of a UnitLabel record as returned by `GET /v2/unit-label` / `GET /v2/unit-label/{id}`. */
export interface UnitLabelRecord extends UnitLabelCreateInput {
  cadTrustUnitLabelId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/unit-label`. */
export interface UnitLabelCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustUnitLabelId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/unit-label/{id}` and `DELETE /v2/unit-label/{id}`. */
export interface UnitLabelMutationResponse {
  message: string;
  success: boolean;
}

