/**
 * Shared types used across the CAD Trust v2 sync interfaces.
 * Source: Chia-Network/cadt docs/cadt_rpc_api_v2.md (develop branch, [DRAFT] as of
 * the date these files were generated) + docs/cadtrust-schema-v2.0.2.json.
 *
 * IMPORTANT — read before wiring an adaptor to these types:
 *
 * 1. The v2 API itself is marked [DRAFT] in its own source doc. Treat every
 *    interface here as "best known contract, verify against a live node,"
 *    not as a frozen spec.
 *
 * 2. Every entity's PUT (update) endpoint requires the FULL object, not a
 *    partial patch — confirmed identically worded across all 20 resource
 *    sections in the source doc ("Update requests must include ALL fields,
 *    not just the ones being changed"). The one exception is CSV batch
 *    upload and XLSX import, which DO merge partial fields into the
 *    existing/staged record — see actions/projectActions.ts and actions/unitActions.ts.
 *
 * 3. `orgUid` is never sent by the client on create/update. It is set
 *    server-side from the home organization. Some resource sections list it
 *    as an optional field in their POST "Fields:" table anyway (methodology,
 *    program, stakeholder, label, aef-t1-submission) — that's a documentation
 *    inconsistency in the source; the explicit prose note on every one of
 *    those sections says the same thing project/unit say outright: it cannot
 *    be set via the API. It is omitted from every *CreateInput here.
 *
 * 4. Every mutation (create/update/delete) is staged locally first and only
 *    becomes visible to the rest of the network after a separate
 *    POST /v2/staging/commit call. See actions/staging.ts. An adaptor that
 *    "syncs" a record to CAD Trust has not actually published anything until
 *    it also drives the commit step (or a human/scheduled job does).
 *
 * 5. Picklist-typed fields are deliberately typed as `string` here, not as
 *    TypeScript string-literal unions. Picklist values are governed by CAD
 *    Trust's Technical Committee and change over time (see the Technical
 *    Report's change-request process). Hardcoding them risks silent drift.
 *    Fetch current values from GET /v2/governance/meta/pickList at runtime
 *    and validate against those before submitting.
 *
 * 6. Two confirmed conflicts between this repo's own "living" API doc and its
 *    own machine-readable schema file are called out inline where they occur
 *    (co-benefit.ts and program.ts). Both should be verified against a live
 *    /v2 node — do not trust either source blindly for those two fields.
 */

/** A CAD Trust-generated UUID primary key. */
export type Guid = string;

/** ISO 8601 date string, e.g. "2022-03-12" (date) or with a time component for timestamps. */
export type IsoDateString = string;

/**
 * Standard paginated list envelope returned by every GET .../v2/<resource> list endpoint.
 * `page` and `limit` are REQUIRED query parameters on nearly every list endpoint
 * (min 1, max limit 1000) — the API does not default them for you.
 */
export interface PagedResponse<T> {
  page: number;
  pageCount: number;
  data: T[];
}

/** Generic success/failure envelope shared by most non-list responses. */
export interface ApiResult {
  message: string;
  success: boolean;
}

/** Shape returned when a DELETE (or occasionally POST/PUT) is blocked by a referencing child record. */
export interface ReferentialIntegrityError {
  success: false;
  message: string;
  error: string;
  references: Array<{ table: string; count: number }>;
}

/**
 * The set of CRUD verbs every core/AEF resource in this package supports, mapped onto
 * the CADT staging model: every one of these STAGES a change; none of them publishes
 * to the network on their own. See actions/staging.ts for the commit step.
 */
export type StagingAction = 'create' | 'update' | 'delete';

/**
 * Query parameters accepted by (most) GET list endpoints, per the "Organization Filtering",
 * "Creator Provenance Filtering", and "Pagination" sections of the API guide.
 * Not every field applies to every resource — see per-entity notes.
 */
export interface ListQueryParams {
  /** Required. 1-based page number, min 1. */
  page: number;
  /** Required. Records per page, min 1, max 1000. */
  limit: number;
  /** Filter by organization UID. Use 'me' for home-org-owned records. Supported on tables with a direct orgUid column and, via JOIN, on their child tables. */
  orgUid?: string;
  /**
   * Filter by the org that originally CREATED the record (relevant once records sync from peers).
   * Server-managed; cannot be set on create/update. Supported on child/relationship tables only
   * (validation, verification, issuance, location, co_benefit, estimation, rating,
   * project_methodology, stakeholder_projects, unit_label, aef_t2-t5).
   */
  createdByOrgUid?: string;
  /** Case-insensitive free-text search. Supported on project and unit. */
  search?: string;
  /** Limit/select columns; repeatable. Can also pull in associated child models, e.g. columns=issuance. */
  columns?: string | string[];
  /** Generic filter, e.g. "unitVintageYear:2014:eq". */
  filter?: string;
  /** Sort order, e.g. "unitCurrentOwner:ASC". */
  order?: string;
  /** If true, bypass pagination and stream an XLSX export. Supported on project and unit. */
  xls?: boolean;
}
