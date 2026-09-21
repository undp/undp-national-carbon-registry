/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `staging` section.
 *
 * Every create/update/delete call against a core or AEF resource (../*.ts) only
 * writes to this local, private staging table. Nothing is visible to the rest of
 * the CAD Trust network until a commit is driven through these endpoints. An
 * adaptor's "sync" is incomplete without a strategy for calling commit — whether
 * that's immediately after every mutation, on a schedule, or after human review.
 */

import type { Guid } from '../common';

// ---------------------------------------------------------------------------
// List staged records  ·  GET /v2/staging
// ---------------------------------------------------------------------------

export interface StagingListQueryParams {
  /** Filter by staging status. */
  type?: 'staged' | 'pending' | 'failed';
  /** Filter by table name, e.g. "project", "unit", "methodology". */
  table?: string;
  /** Required. Min 1. */
  page: number;
  /** Required. Min 1. */
  limit: number;
}

/**
 * CORRECTED against a real node (2026-08-21, live-captured against a staged `program` AND a staged
 * `methodology` record — same structure on both, not a one-off) — two things the guide got wrong:
 *
 *  - `is_transfer` was missing entirely, despite `resetCommitted`'s own doc comment already naming
 *    it ("Transfer records (is_transfer:true) are excluded server-side").
 *  - `diff.change` is an ARRAY of one object, not a single object as previously typed. Code trusting
 *    the old type (`record.diff.change.someField`) needs `record.diff.change[0].someField` instead.
 *
 * Also worth knowing, confirmed on both captures: `diff.change`'s keys are the table's own
 * snake_case DB column names (e.g. `program_name`, `program_registry_activity_id`,
 * `cad_trust_program_id`), NOT the camelCase used by that resource's `*CreateInput`/`*Record` types
 * elsewhere in this package (`programName`, `programRegistryActivityId`). Do not assume
 * `diff.change[0]` matches a resource's `CreateInput` field-for-field.
 */
export interface StagingRecord {
  id: number;
  uuid: Guid;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  committed: boolean;
  failed_commit: boolean;
  /** Excluded from `resetCommitted`'s server-side sweep when true. Confirmed present on every record. */
  is_transfer: boolean;
  createdAt: string;
  updatedAt: string;
  diff: {
    /** The record's prior state. Confirmed `{}` for an INSERT; shape for UPDATE/DELETE unconfirmed. */
    original: Record<string, unknown>;
    /** The staged field values — an array (see this interface's doc comment), snake_case keys. */
    change: Record<string, unknown>[];
  };
}

// ---------------------------------------------------------------------------
// Check for pending commits  ·  GET /v2/staging/pending
// ---------------------------------------------------------------------------

/**
 * CORRECTED against the CADT v2 source (2026-08-21) — this is NOT the same check as v1. The
 * name and shape are unchanged from the guide, but the meaning of `confirmed` inverted between
 * versions:
 *
 *  - v1 (`assertNoPendingCommits`): counts records with `commited:true, failedCommit:false` —
 *    i.e. already-pushed changes still awaiting blockchain confirmation. `confirmed:false`
 *    means "a previous commit is still propagating, don't commit again yet."
 *  - v2 (`hasPendingCommits` in `staging-v2.controller.js`, per its own doc comment): counts
 *    records with `committed:false` — i.e. staged rows that still need to be committed.
 *    `confirmed:false` means "you have staged rows waiting to be committed" — precisely the
 *    state in which a commit SHOULD be attempted, not skipped. `confirmed:true` means the
 *    opposite: nothing is staged, so there is nothing to commit.
 *
 * Do NOT gate a v2 commit on the v1 reading of `confirmed` (`!confirmed => skip`) — that
 * deadlocks every commit the moment anything is staged, which is exactly what happened here
 * before this was corrected. Gating on the v2 reading (`confirmed => nothing to commit => skip`)
 * is fine — see `StagingClient.hasUncommittedStagedRows()`, which wraps this call so the call
 * site can't misread `confirmed` again. The propagation precondition v1's check was guarding
 * (no still-propagating commit) is enforced server-side by `POST /staging/commit` itself, which
 * rejects with an error if violated — that's the reliable signal for that condition, surfaced as
 * a thrown/rejected call.
 *
 * Also confirmed: `GET /staging?type=pending` uses the v1 meaning
 * (`committed:true, failed_commit:false`) even on this same v2 node/controller file — the two
 * "pending" endpoints do not agree with each other.
 */
export interface StagingV2PendingResponse {
  /**
   * v2 meaning: `true` = the node has NO rows with `committed:false`, i.e. nothing is waiting
   * to be committed. `false` = staged rows are owed a commit. NOT v1's meaning ("no
   * previously-pushed commit still propagating") — see the interface doc comment above.
   */
  confirmed: boolean;
  /** e.g. "There are no pending commits" / "There are currently pending commits". */
  message: string;
  success: boolean;
}

/** @deprecated Ambiguous between v1 and v2 semantics — use {@link StagingV2PendingResponse}. */
export type StagingPendingResponse = StagingV2PendingResponse;

// ---------------------------------------------------------------------------
// Commit staged records  ·  POST /v2/staging/commit
// NOTE: This is the step that actually publishes staged changes to the Chia
// blockchain / DataLayer, making them publicly visible to the network.
// ---------------------------------------------------------------------------

export interface StagingCommitInput {
  /** Optional. Author name recorded against the commit. */
  author?: string;
  /** Optional. Free-text comment describing the commit. */
  comment?: string;
  /** Optional. Specific staging UUIDs to commit (max 10000). Omit to commit everything currently staged. */
  ids?: Guid[];
  /** Optional. Documented as "currently not used in V2" — included for completeness only. */
  table?: 'Projects' | 'Units';
}

// ---------------------------------------------------------------------------
// Retry a failed commit  ·  POST /v2/staging/retry
// ---------------------------------------------------------------------------

export interface StagingRetryInput {
  uuid: Guid;
}

// ---------------------------------------------------------------------------
// Reset committed records that are blocking new commits  ·  POST /v2/staging/reset-committed
// NOTE: Resets records with committed:true, failed_commit:false back to committed:false.
// Transfer records (is_transfer:true) are excluded from this reset.
// No request body.
// ---------------------------------------------------------------------------

export interface StagingResetCommittedResponse {
  message: string;
  affectedRows: number;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Edit a staged (not yet committed) record  ·  PUT /v2/staging
// ---------------------------------------------------------------------------

export interface StagingEditInput {
  uuid: Guid;
  /** Replacement field values for the staged record — shape matches the relevant entity's *CreateInput. */
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Delete a specific staged record  ·  DELETE /v2/staging
// ---------------------------------------------------------------------------

export interface StagingDeleteInput {
  uuid: Guid;
}

// DELETE /v2/staging/clean — no request body; deletes ALL staged records.
