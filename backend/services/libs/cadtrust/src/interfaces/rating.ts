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
// Rating  ·  /v2/rating  ·  primary key: cadTrustRatingId
// NOTE: Child of Project. ratingType is constrained to a small fixed set per the current docs (CDP, CCQI) — confirm current values via GET /v2/governance/meta/pickList.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/rating` (stages a new Rating record). */
export interface RatingCreateInput {
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Name of the rating (max 255 characters) */
  ratingName: string;
  /** Value of the rating (max 255 characters) */
  ratingValue: string;
  /** Type of rating. Must be one of: CDP, CCQI */
  ratingType: string;
  /** URL link to the rating. Must be a valid URI */
  ratingLink?: string;
}

/**
 * Request body for `PUT /v2/rating/{cadTrustRatingId}` (stages an update to an existing Rating record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type RatingUpdateInput = RatingCreateInput;

/** Shape of a Rating record as returned by `GET /v2/rating` / `GET /v2/rating/{id}`. */
export interface RatingRecord extends RatingCreateInput {
  cadTrustRatingId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/rating`. */
export interface RatingCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustRatingId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/rating/{id}` and `DELETE /v2/rating/{id}`. */
export interface RatingMutationResponse {
  message: string;
  success: boolean;
}

