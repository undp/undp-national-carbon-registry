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
// ProjectMethodology  ·  /v2/project-methodology  ·  primary key: cadTrustProjectMethodologyId
// NOTE: Join table (project <-> methodology, many-to-many). Both records must already exist (staged or committed).
// NOTE: Required before creating an Issuance — issuance.cadTrustProjectMethodologyId references this table, not the project or methodology table directly.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/project-methodology` (stages a new ProjectMethodology record). */
export interface ProjectMethodologyCreateInput {
  /** CAD Trust project identifier. Must be a valid UUID (UUID) */
  cadTrustProjectId: string;
  /** CAD Trust methodology identifier. Must be a valid UUID (UUID) */
  cadTrustMethodologyId: string;
  /** Date of the project-methodology relationship (YYYY-MM-DD format) (ISO 8601 date (YYYY-MM-DD)) */
  projectMethodologyDate?: string;
  /** Description of the project-methodology relationship (max 10000 characters) */
  projectMethodologyDescription?: string;
}

/**
 * Request body for `PUT /v2/project-methodology/{cadTrustProjectMethodologyId}` (stages an update to an existing ProjectMethodology record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type ProjectMethodologyUpdateInput = ProjectMethodologyCreateInput;

/** Shape of a ProjectMethodology record as returned by `GET /v2/project-methodology` / `GET /v2/project-methodology/{id}`. */
export interface ProjectMethodologyRecord extends ProjectMethodologyCreateInput {
  cadTrustProjectMethodologyId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/project-methodology`. */
export interface ProjectMethodologyCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustProjectMethodologyId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/project-methodology/{id}` and `DELETE /v2/project-methodology/{id}`. */
export interface ProjectMethodologyMutationResponse {
  message: string;
  success: boolean;
}

