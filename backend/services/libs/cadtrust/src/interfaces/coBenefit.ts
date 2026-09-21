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
// CoBenefit  ·  /v2/co-benefit  ·  primary key: cadTrustCoBenefitId
// NOTE: Child of Project.
// NOTE: KNOWN DOCUMENTATION CONFLICT: the markdown API guide's own POST "Fields:" table names this field "coBenefitId", but the same repo's machine-readable schema (validation_rules.common_enum_mistakes) explicitly warns that the real API field is "cobenefit" (lowercase, no "Id" suffix) and that sending "coBenefitId" is SILENTLY IGNORED rather than rejected or erroring. This interface uses "cobenefit" per that explicit warning, overriding the field table. This is exactly the kind of thing to verify empirically against a live /v2 node before shipping — a silently-ignored field fails with no error message.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/co-benefit` (stages a new CoBenefit record). */
export interface CoBenefitCreateInput {
  /** CAD Trust project identifier. Must be a valid UUID */
  cadTrustProjectId: string;
  /** Co-benefit identifier. Must be one of the valid SDG values: SDG 1 - No poverty, SDG 2 - Zero hunger, SDG 3 - Good health and well-being, SDG 4 - Quality education, SDG 5 - Gender equality, SDG 6 - Clean water and sanitation, SDG 7 - Affordable and clean energy, SDG 8 - Decent work and economic growth, SDG 9 - Industry, innovation, and infrastructure, SDG 10 - Reduced inequalities, SDG 11 - Sustainable cities and communities, SDG 12 - Responsible consumption and production, SDG 13 - Climate action, SDG 14 - Life below water, SDG 15 - Life on land, SDG 16 - Peace and justice strong institutions, SDG 17 - Partnerships for the goals */
  cobenefit: string;
}

/**
 * Request body for `PUT /v2/co-benefit/{cadTrustCoBenefitId}` (stages an update to an existing CoBenefit record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type CoBenefitUpdateInput = CoBenefitCreateInput;

/** Shape of a CoBenefit record as returned by `GET /v2/co-benefit` / `GET /v2/co-benefit/{id}`. */
export interface CoBenefitRecord extends CoBenefitCreateInput {
  cadTrustCoBenefitId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/co-benefit`. */
export interface CoBenefitCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustCoBenefitId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/co-benefit/{id}` and `DELETE /v2/co-benefit/{id}`. */
export interface CoBenefitMutationResponse {
  message: string;
  success: boolean;
}

