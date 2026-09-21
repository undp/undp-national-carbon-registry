/**
 * Project actions beyond plain CRUD: cross-organization transfer, CSV batch
 * upload, and XLSX import/export. Plain create/update/delete/read live on
 * `client.project` (see ../resources/entities.ts).
 *
 * All of these stage — none of them publishes. Commit separately.
 */

import { CadTrustContext } from '../config';
import { FileUpload } from '../http/multipart';
import { BinaryResponse, request, requestBinary } from '../http/request';
import { asQuery } from '../http/query';
import type { ApiResult, ListQueryParams } from '../interfaces/common';
import type {
  ProjectBatchUploadResponse,
  ProjectTransferInput,
  ProjectXlsxImportResponse,
} from '../interfaces/actions/projectActions';

/** Filters accepted alongside an XLSX export. `xls` is supplied by the client; pagination does not apply. */
export type XlsxExportQuery = Omit<ListQueryParams, 'page' | 'limit' | 'xls'>;

export interface ProjectActionsClient {
  /**
   * `PUT /project/transfer` — stages the transfer of a project owned by ANOTHER
   * organization into this node's home organization. This is the offer maker's
   * first step; see ./offer.ts for the rest of the handshake.
   */
  transfer(input: ProjectTransferInput): Promise<ApiResult>;

  /**
   * `POST /project/batch` (multipart, field `csv`) — flat parent rows only; child
   * records are not created here.
   *
   * Two success modes, and the difference matters:
   *  - Every row staged, or SOME rows staged: HTTP 200. This method RETURNS the
   *    body — inspect `errorCount` and `errors[]` for the skipped rows. A partial
   *    failure is not an exception.
   *  - No row staged: HTTP 400, which surfaces as a CadTrustValidationError whose
   *    `body` is this same shape, `errors[]` included.
   *
   * Unlike the REST PUT (full replace), CSV update rows are MERGED into current
   * state plus any already-staged edits.
   */
  batchUploadCsv(file: FileUpload): Promise<ProjectBatchUploadResponse>;

  /**
   * `PUT /project/xlsx` (multipart, field `xlsx`) — multi-sheet import covering
   * projects and their child records.
   *
   * Prerequisites enforced by the node: a home organization must exist and there
   * must be no still-propagating commit. Do NOT check the latter via
   * `client.staging.hasPendingCommits()` / `hasUncommittedStagedRows()` — on v2 those report
   * whether there are staged-but-uncommitted rows, not whether a commit is propagating (see
   * `StagingV2PendingResponse`'s doc comment); this endpoint enforces the real
   * precondition server-side and rejects if it's violated. Use `NEW-<n>`
   * placeholder ids to create records and to link parent/child rows across
   * sheets. Max 25 MB.
   */
  importXlsx(file: FileUpload): Promise<ProjectXlsxImportResponse>;

  /**
   * `GET /project?xls=true` — binary XLSX of all projects and child records.
   * Bypasses pagination. Returns the bytes; writing them anywhere is the caller's job.
   */
  exportXlsx(query?: XlsxExportQuery): Promise<BinaryResponse>;
}

export function createProjectActionsClient(ctx: CadTrustContext): ProjectActionsClient {
  return {
    transfer(input) {
      return request<ApiResult>(ctx, { method: 'PUT', path: '/project/transfer', body: input });
    },

    batchUploadCsv(file) {
      return request<ProjectBatchUploadResponse>(ctx, {
        method: 'POST',
        path: '/project/batch',
        multipart: { field: 'csv', file },
      });
    },

    importXlsx(file) {
      return request<ProjectXlsxImportResponse>(ctx, {
        method: 'PUT',
        path: '/project/xlsx',
        multipart: { field: 'xlsx', file },
      });
    },

    exportXlsx(query) {
      return requestBinary(ctx, {
        method: 'GET',
        path: '/project',
        query: { ...asQuery(query), xls: true },
      });
    },
  };
}
