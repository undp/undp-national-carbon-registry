/**
 * The Chia DataLayer offer flow — cross-registry transfer of project ownership.
 *
 * Two roles, and every method below is labelled with which one it belongs to:
 *
 *  - Offer MAKER: wants a project moved INTO its own registry. Stages the intent
 *    with `client.projectActions.transfer(...)`, then generates an offer file and
 *    sends it (out of band) to the other registry.
 *  - Offer TAKER: currently owns the project. Imports the offer file, reviews the
 *    proposed changes, then commits — at which point the project leaves the
 *    taker's organization and joins the maker's.
 *
 * How the file gets from maker to taker is not CAD Trust's problem and not this
 * package's either.
 */

import { CadTrustContext } from '../config';
import { FileUpload } from '../http/multipart';
import { BinaryResponse, request, requestBinary } from '../http/request';
import type {
  OfferCancelResponse,
  OfferCommitResponse,
  OfferDetails,
  OfferImportResponse,
} from '../interfaces/actions/offer';

export interface OfferClient {
  /**
   * MAKER · `GET /offer/` — generates and downloads the datalayer offer file.
   * A download stream, not JSON; returned as raw bytes.
   */
  generate(): Promise<BinaryResponse>;

  /** MAKER · `DELETE /offer/` — cancels the currently active outgoing offer. */
  cancel(): Promise<OfferCancelResponse>;

  /**
   * TAKER · `GET /offer/accept` — read-only preview of the offer file already
   * uploaded, and the staged record changes accepting it would imply.
   */
  getImportedDetails(): Promise<OfferDetails>;

  /** TAKER · `POST /offer/accept/import` (multipart, field `file`) — uploads and parses an offer file. */
  importOffer(file: FileUpload): Promise<OfferImportResponse>;

  /**
   * TAKER · `POST /offer/accept/commit` — the step that actually moves the project
   * record out of this organization and into the maker's. No request body.
   */
  commitImported(): Promise<OfferCommitResponse>;

  /** TAKER · `DELETE /offer/accept/cancel` — rejects the imported incoming offer. */
  rejectImported(): Promise<OfferCancelResponse>;
}

export function createOfferClient(ctx: CadTrustContext): OfferClient {
  return {
    generate() {
      return requestBinary(ctx, { method: 'GET', path: '/offer/' });
    },

    cancel() {
      return request<OfferCancelResponse>(ctx, { method: 'DELETE', path: '/offer/' });
    },

    getImportedDetails() {
      return request<OfferDetails>(ctx, { method: 'GET', path: '/offer/accept' });
    },

    importOffer(file) {
      return request<OfferImportResponse>(ctx, {
        method: 'POST',
        path: '/offer/accept/import',
        multipart: { field: 'file', file },
      });
    },

    commitImported() {
      return request<OfferCommitResponse>(ctx, { method: 'POST', path: '/offer/accept/commit' });
    },

    rejectImported() {
      return request<OfferCancelResponse>(ctx, { method: 'DELETE', path: '/offer/accept/cancel' });
    },
  };
}
