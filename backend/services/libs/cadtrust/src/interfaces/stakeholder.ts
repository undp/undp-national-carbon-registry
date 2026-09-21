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
// Stakeholder  ·  /v2/stakeholder  ·  primary key: cadTrustStakeholderId
// NOTE: New in v2. Standalone record; link to projects via StakeholderProject.
// NOTE: DELETE is blocked with 409 Conflict while any stakeholder_projects record references this stakeholder.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/stakeholder` (stages a new Stakeholder record). */
export interface StakeholderCreateInput {
  /** Stakeholder name (max 255 characters) */
  stakeholderName: string;
  /** Stakeholder type. Must be one of: Owner, Developer, Consultant Picklist "stakeholder_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  stakeholderType: string;
  /** URL link to the stakeholder. Must be a valid URI */
  stakeholderLink?: string;
}

/**
 * Request body for `PUT /v2/stakeholder/{cadTrustStakeholderId}` (stages an update to an existing Stakeholder record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type StakeholderUpdateInput = StakeholderCreateInput;

/** Shape of a Stakeholder record as returned by `GET /v2/stakeholder` / `GET /v2/stakeholder/{id}`. */
export interface StakeholderRecord extends StakeholderCreateInput {
  cadTrustStakeholderId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/stakeholder`. */
export interface StakeholderCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustStakeholderId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/stakeholder/{id}` and `DELETE /v2/stakeholder/{id}`. */
export interface StakeholderMutationResponse {
  message: string;
  success: boolean;
}

/** Error response shape for `DELETE /v2/stakeholder/{id}` when other records still reference it (HTTP 409). */
export interface StakeholderReferentialIntegrityError {
  success: false;
  message: string;
  error: string;
  references: Array<{ table: string; count: number }>;
}

