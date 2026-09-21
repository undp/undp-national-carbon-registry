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
// StakeholderProject  ·  /v2/stakeholder-projects  ·  primary key: cadTrustStakeholderProjectId
// NOTE: Join table (stakeholder <-> project, many-to-many). Both records must already exist (staged or committed).
// NOTE: NOTE: the JSON machine-readable schema (cadtrust-schema-v2.0.2.json) does not list this table and instead describes a direct cadTrustProjectId FK on stakeholder. The live markdown API guide documents this join-table endpoint with working curl examples; this file follows the markdown guide. Verify against a live /v2 node before relying on either shape.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/stakeholder-projects` (stages a new StakeholderProject record). */
export interface StakeholderProjectCreateInput {
  /** CAD Trust stakeholder identifier. Must be a valid UUID (UUID) */
  cadTrustStakeholderId: string;
  /** CAD Trust project identifier. Must be a valid UUID (UUID) */
  cadTrustProjectId: string;
}

/**
 * Request body for `PUT /v2/stakeholder-projects/{cadTrustStakeholderProjectId}` (stages an update to an existing StakeholderProject record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type StakeholderProjectUpdateInput = StakeholderProjectCreateInput;

/** Shape of a StakeholderProject record as returned by `GET /v2/stakeholder-projects` / `GET /v2/stakeholder-projects/{id}`. */
export interface StakeholderProjectRecord extends StakeholderProjectCreateInput {
  cadTrustStakeholderProjectId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/stakeholder-projects`. */
export interface StakeholderProjectCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustStakeholderProjectId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/stakeholder-projects/{id}` and `DELETE /v2/stakeholder-projects/{id}`. */
export interface StakeholderProjectMutationResponse {
  message: string;
  success: boolean;
}

