/**
 * Unit actions beyond plain CRUD: block split, CSV batch upload, XLSX
 * import/export. Plain create/update/delete/read live on `client.unit`.
 *
 * All of these stage — none of them publishes. Commit separately.
 *
 * There is deliberately no `tokenize()` method here. Tokenizing a unit on Chia is
 * not a separate endpoint: it is an ordinary `POST /v2/unit` with
 * `marketplace: "Tokenized on Chia"` and a non-empty `marketplaceIdentifier`
 * (see UnitTokenizationFields in ../interfaces/actions/unitActions.ts). Inventing
 * a method for it would imply an endpoint that does not exist.
 */

import { CadTrustContext } from '../config';
import { FileUpload } from '../http/multipart';
import { BinaryResponse, request, requestBinary } from '../http/request';
import { asQuery } from '../http/query';
import type {
  UnitBatchUploadResponse,
  UnitSplitInput,
  UnitSplitResponse,
  UnitXlsxImportResponse,
} from '../interfaces/actions/unitActions';
import type { XlsxExportQuery } from './project';

export interface UnitActionsClient {
  /**
   * `POST /unit/split` — splits one unit block into several.
   *
   * Each new record inherits every field of the original and overrides only what
   * is supplied. The FIRST record keeps the original `cadTrustUnitId`; the rest
   * get new UUIDs. The sum of all `unitCount` values must equal the original's.
   * This is the mechanism for partial transfers and partial retirements.
   */
  split(input: UnitSplitInput): Promise<UnitSplitResponse>;

  /**
   * `POST /unit/batch` (multipart, field `csv`) — flat unit rows only; unit
   * labels are not created here. Same two-mode result as the project batch upload:
   * partial success returns HTTP 200 with `errors[]` populated, total failure is
   * a 400 that surfaces as CadTrustValidationError carrying the same body.
   */
  batchUploadCsv(file: FileUpload): Promise<UnitBatchUploadResponse>;

  /**
   * `PUT /unit/xlsx` (multipart, field `xlsx`) — units plus unit-label sheets.
   * Same prerequisites as the project import: a home organization must exist and
   * there must be no pending commits.
   */
  importXlsx(file: FileUpload): Promise<UnitXlsxImportResponse>;

  /** `GET /unit?xls=true` — binary XLSX of all units and their labels. */
  exportXlsx(query?: XlsxExportQuery): Promise<BinaryResponse>;
}

export function createUnitActionsClient(ctx: CadTrustContext): UnitActionsClient {
  return {
    split(input) {
      return request<UnitSplitResponse>(ctx, { method: 'POST', path: '/unit/split', body: input });
    },

    batchUploadCsv(file) {
      return request<UnitBatchUploadResponse>(ctx, {
        method: 'POST',
        path: '/unit/batch',
        multipart: { field: 'csv', file },
      });
    },

    importXlsx(file) {
      return request<UnitXlsxImportResponse>(ctx, {
        method: 'PUT',
        path: '/unit/xlsx',
        multipart: { field: 'xlsx', file },
      });
    },

    exportXlsx(query) {
      return requestBinary(ctx, {
        method: 'GET',
        path: '/unit',
        query: { ...asQuery(query), xls: true },
      });
    },
  };
}
