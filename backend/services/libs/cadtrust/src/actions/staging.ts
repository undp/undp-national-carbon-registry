/**
 * The staging lifecycle — the half of CAD Trust that actually publishes.
 *
 * Every create/update/delete elsewhere in this package writes to the node's
 * private staging table and stops there. `commit()` below is the only call that
 * pushes anything to the Chia DataLayer and makes it visible to the rest of the
 * network. This package deliberately never calls it for you: whether to commit
 * per mutation, on a schedule, or after human review is an adaptor's decision.
 */

import { CadTrustContext } from '../config';
import { asQuery } from '../http/query';
import { request } from '../http/request';
import { assertPagination } from '../resources/crud';
import type { ApiResult, PagedResponse } from '../interfaces/common';
import type {
  StagingCommitInput,
  StagingDeleteInput,
  StagingEditInput,
  StagingListQueryParams,
  StagingRecord,
  StagingResetCommittedResponse,
  StagingRetryInput,
  StagingV2PendingResponse,
} from '../interfaces/actions/staging';

export interface StagingClient {
  /** `GET /staging` — one page of staged records. `page` and `limit` are required. */
  list(query: StagingListQueryParams): Promise<PagedResponse<StagingRecord>>;
  /** `GET /staging` — walks every page. */
  listAll(query: Omit<StagingListQueryParams, 'page'>): AsyncGenerator<StagingRecord, void, undefined>;
  /**
   * `GET /staging/pending` — on v2, whether there are staged rows still needing a commit, NOT
   * whether a previous commit is still propagating. `confirmed:false` means a commit is owed,
   * not that one should be skipped. See `StagingV2PendingResponse`'s doc comment before using
   * this to gate anything — or prefer `hasUncommittedStagedRows()` below, which removes the
   * ambiguity from the call site.
   */
  hasPendingCommits(): Promise<StagingV2PendingResponse>;
  /**
   * Convenience over `hasPendingCommits()` that removes the v1/v2 `confirmed` ambiguity from
   * the call site: `true` = the node has staged rows still owed a commit (safe to attempt a
   * commit); `false` = nothing staged, a commit would be a no-op.
   */
  hasUncommittedStagedRows(): Promise<boolean>;
  /**
   * `POST /staging/commit` — PUBLISHES staged changes to the blockchain.
   * Pass `ids` to commit a subset (max 10000), or omit to commit everything staged.
   */
  commit(input?: StagingCommitInput): Promise<ApiResult>;
  /** `POST /staging/retry` — re-stages one failed record so a later commit can pick it up. */
  retry(input: StagingRetryInput): Promise<ApiResult>;
  /**
   * `POST /staging/reset-committed` — unblocks new commits after a commit
   * partially succeeded and left records stuck at committed:true. Transfer
   * records (is_transfer:true) are excluded server-side.
   */
  resetCommitted(): Promise<StagingResetCommittedResponse>;
  /** `PUT /staging` — replaces the payload of a not-yet-committed staged record. */
  edit(input: StagingEditInput): Promise<ApiResult>;
  /** `DELETE /staging` — discards one staged record. The uuid goes in the BODY, not the path. */
  remove(input: StagingDeleteInput): Promise<ApiResult>;
  /** `DELETE /staging/clean` — discards ALL staged records. */
  clean(): Promise<ApiResult>;
}

export function createStagingClient(ctx: CadTrustContext): StagingClient {
  // `async` matters: assertPagination throws, and callers expect a rejected
  // promise rather than a synchronous throw.
  const list = async (query: StagingListQueryParams): Promise<PagedResponse<StagingRecord>> => {
    assertPagination(query);
    return request<PagedResponse<StagingRecord>>(ctx, {
      method: 'GET',
      path: '/staging',
      query: asQuery(query),
    });
  };

  return {
    list,

    async *listAll(query) {
      let page = 1;
      let pageCount = 1;

      do {
        const result = await list({ ...query, page });
        const rows = result?.data ?? [];
        if (rows.length === 0) {
          return;
        }
        for (const row of rows) {
          yield row;
        }
        pageCount = result.pageCount ?? 1;
        page += 1;
      } while (page <= pageCount);
    },

    hasPendingCommits() {
      return request<StagingV2PendingResponse>(ctx, { method: 'GET', path: '/staging/pending' });
    },

    async hasUncommittedStagedRows() {
      const pending = await request<StagingV2PendingResponse>(ctx, {
        method: 'GET',
        path: '/staging/pending',
      });
      return !pending.confirmed;
    },

    commit(input = {}) {
      return request<ApiResult>(ctx, { method: 'POST', path: '/staging/commit', body: input });
    },

    retry(input) {
      return request<ApiResult>(ctx, { method: 'POST', path: '/staging/retry', body: input });
    },

    resetCommitted() {
      // Documented as taking no request body.
      return request<StagingResetCommittedResponse>(ctx, {
        method: 'POST',
        path: '/staging/reset-committed',
      });
    },

    edit(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/staging', body: input });
    },

    remove(input) {
      return request<ApiResult>(ctx, { method: 'DELETE', path: '/staging', body: input });
    },

    clean() {
      return request<ApiResult>(ctx, { method: 'DELETE', path: '/staging/clean' });
    },
  };
}
