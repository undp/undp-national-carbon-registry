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
// Methodology  ·  /v2/methodology  ·  primary key: cadTrustMethodologyId
// NOTE: Standalone, versioned record. Link to projects via ProjectMethodology, not by embedding methodology data on the project.
// NOTE: DELETE is blocked with 409 Conflict while any project_methodology record references this methodology.
// ---------------------------------------------------------------------------

/** Request body for `POST /v2/methodology` (stages a new Methodology record). */
export interface MethodologyCreateInput {
  /** Code identifying the methodology */
  methodologyCode: string;
  /** Name of the methodology */
  methodologyName: string;
  /** Version of the methodology */
  methodologyVersion?: string;
  /** Date of the methodology (ISO 8601 format) (ISO 8601 date, e.g. "2022-03-12") */
  methodologyDate?: string;
  /** URL link to the methodology. Must be a valid URI */
  methodologyLink?: string;
  /** Type of methodology Picklist "methodology_type" — fetch current values via GET /v2/governance/meta/pickList; do not hardcode. */
  methodologyType?: string;
}

/**
 * Request body for `PUT /v2/methodology/{cadTrustMethodologyId}` (stages an update to an existing Methodology record).
 * The API requires the FULL object on every update — this is NOT a partial patch.
 */
export type MethodologyUpdateInput = MethodologyCreateInput;

/**
 * Shape of a Methodology record as returned by `GET /v2/methodology` / `GET /v2/methodology/{id}`.
 *
 * CORRECTED against a real node (2026-08-21, live-captured via
 * `live/methodology.capture.spec.ts` against 36 real methodologies) — `methodologyVersion`,
 * `methodologyDate`, `methodologyLink`, `methodologyType` and `orgUid` are `?: string` on
 * `MethodologyCreateInput` (meaning "may be absent"), but on a real record every one of these five
 * keys is ALWAYS present, with `null` when unset rather than the key being omitted. `field?: string`
 * doesn't type-check `null`, only `undefined` — a real gap between what this said and what the wire
 * actually sends. `MethodologyCreateInput`'s own optionality is unconfirmed (this capture only
 * exercised reads), so it isn't touched — only `MethodologyRecord` widens these five to
 * required-but-nullable. The same optional-vs-nullable question likely applies to every other
 * `*Record` type in this package with optional fields (e.g. `ProgramRecord.orgUid`,
 * `ProjectRecord.orgUid`) — not fixed there yet, just flagged so it isn't re-derived from scratch.
 */
export interface MethodologyRecord
  extends Omit<
    MethodologyCreateInput,
    'methodologyVersion' | 'methodologyDate' | 'methodologyLink' | 'methodologyType'
  > {
  cadTrustMethodologyId: string;
  methodologyVersion: string | null;
  methodologyDate: string | null;
  methodologyLink: string | null;
  methodologyType: string | null;
  orgUid: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Response shape for `POST /v2/methodology`. */
export interface MethodologyCreateResponse {
  message: string;
  uuid: string;
  /** Present on most (not confirmed on every) create response — cross-check per resource; falls back to `uuid` if absent. */
  cadTrustMethodologyId?: string;
  success: boolean;
}

/** Response shape for `PUT /v2/methodology/{id}` and `DELETE /v2/methodology/{id}`. */
export interface MethodologyMutationResponse {
  message: string;
  success: boolean;
}

/** Error response shape for `DELETE /v2/methodology/{id}` when other records still reference it (HTTP 409). */
export interface MethodologyReferentialIntegrityError {
  success: false;
  message: string;
  error: string;
  references: Array<{ table: string; count: number }>;
}

