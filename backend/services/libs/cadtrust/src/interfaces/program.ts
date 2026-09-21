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
// Program  ·  /v2/program  ·  primary key: cadTrustProgramId
// NOTE: Insert order position 1 (no parent). Create before any project that references it via cadTrustProgramId.
// NOTE: DELETE is blocked with 409 Conflict while any project still references this program.
// NOTE: KNOWN DOCUMENTATION CONFLICT: the machine-readable schema (cadtrust-schema-v2.0.2.json) lists a single required field "programRegistryId", but the markdown API guide's POST "Fields:" table and curl example use two different fields instead: "programRegistryActivityId" (required) and "programRegistryProgramId" (optional) — there is no "programRegistryId" in the live guide at all. This interface follows the markdown guide (the one with working curl examples). Verify against a live /v2 node before relying on this.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/program` (stages a new Program record). */
export interface ProgramCreateInput {
  /** Name of the program */
  programName: string;
  /** Registry name for the program */
  programRegistry: string;
  /** Registry activity identifier */
  programRegistryActivityId: string;
  /** Registry program identifier */
  programRegistryProgramId?: string;
  /** Description of the program */
  programDescription?: string;
}

/**
 * Request body for `PUT /v2/program/{cadTrustProgramId}` (stages an update to an existing Program record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type ProgramUpdateInput = ProgramCreateInput;

/**
 * Shape of a Program record as returned by `GET /v2/program` / `GET /v2/program/{id}`.
 *
 * Only the pagination envelope has been confirmed against a real node (2026-08-21, via
 * `live/program.capture.spec.ts`) — the node had zero *committed* programs at capture time, so this
 * record shape itself remains guide-only/unverified. See `live/program.capture.spec.ts`'s staging
 * check for a real, uncommitted program's payload instead.
 */
export interface ProgramRecord extends ProgramCreateInput {
  cadTrustProgramId: string;
  orgUid?: string;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/program`. */
export interface ProgramCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustProgramId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/program/{id}` and `DELETE /v2/program/{id}`. */
export interface ProgramMutationResponse {
  message: string;
  success: boolean;
}

/** Error response shape for `DELETE /v2/program/{id}` when other records still reference it (HTTP 409). */
export interface ProgramReferentialIntegrityError {
  success: false;
  message: string;
  error: string;
  references: Array<{ table: string; count: number }>;
}

