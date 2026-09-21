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
// Project  ·  /v2/project  ·  primary key: cadTrustProjectId
// NOTE: Central entity. Create before any project-level child record (validation, verification, location, estimation, rating, co-benefit, project-methodology, stakeholder-projects).
// NOTE: Also supports: PUT /v2/project/transfer (change owning organization), POST /v2/project/batch (CSV batch create/update), PUT /v2/project/xlsx (multi-sheet XLSX import), GET /v2/project?xls=true (XLSX export). See actions/projectActions.ts.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/project` (stages a new Project record). */
export interface ProjectCreateInput {
  /** Name of the project registry */
  projectRegistryName: string;
  /** Unique identifier for the project */
  projectId: string;
  /** Name of the project */
  projectName: string;
  /** Name of the crediting program */
  projectCreditingProgram?: string;
  /** URL link to the project. Must be a valid URI */
  projectLink: string;
  /** Description of the project */
  projectDescription?: string;
  /** Array of project sectors. Each value must be from the projectSector picklist (submit as an array even for a single value) Picklist "project_sector" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  projectSector: string[];
  /** Array of project types. Each value must be from the projectType picklist (submit as an array even for a single value) Picklist "project_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  projectType: string[];
  /** Subtype of the project */
  projectSubtype?: string;
  /** Project status. Must be from the projectStatus picklist Picklist "project_status" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  projectStatus: string;
  /** Date when the project status was set (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  projectStatusDate: string;
  /** Unit metric for the project Picklist "unit_metric" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  projectUnitMetric: string;
  /** CAD Trust reference project identifier */
  cadTrustReferenceProjectId?: string;
  /** CAD Trust program identifier. Must be a valid UUID */
  cadTrustProgramId?: string;
}

/**
 * Request body for `PUT /v2/project/{cadTrustProjectId}` (stages an update to an existing Project record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 * (Exception: POST /v2/project/batch (CSV) and PUT /v2/project/xlsx DO merge
 * partial fields into the existing/staged record instead of requiring all fields —
 * see actions/projectActions.ts.)
 */
export type ProjectUpdateInput = ProjectCreateInput;

/** Shape of a Project record as returned by `GET /v2/project` / `GET /v2/project/{id}`. */
export interface ProjectRecord extends ProjectCreateInput {
  cadTrustProjectId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/project`. */
export interface ProjectCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustProjectId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/project/{id}` and `DELETE /v2/project/{id}`. */
export interface ProjectMutationResponse {
  message: string;
  success: boolean;
}

