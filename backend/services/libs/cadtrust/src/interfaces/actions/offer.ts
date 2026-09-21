/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, `offer` section.
 *
 * The Chia DataLayer "offer" mechanism for transferring ownership of a project
 * (and its records) from one CAD Trust organization to another. Two roles:
 *
 *  - Offer Maker: the party REQUESTING that a project be transferred INTO its
 *    own organization/registry.
 *  - Offer Taker: the party ACCEPTING an offer, transferring a project OUT of
 *    its own organization/registry into the maker's.
 *
 * Workflow: maker stages the transfer intent -> maker generates an offer file
 * -> taker uploads that file -> taker reviews the proposed changes -> taker
 * commits acceptance, at which point the project record moves from the
 * taker's org to the maker's org.
 *
 * Compare with actions/projectActions.ts `ProjectTransferInput` (PUT /v2/project/transfer),
 * which is the maker-side "stage the transfer" step referenced above.
 */

// ---------------------------------------------------------------------------
// Generate and download a datalayer offer file  ·  GET /v2/offer/          (offer maker)
// ---------------------------------------------------------------------------
// Binary/text file download stream — no typed JSON response body.

// ---------------------------------------------------------------------------
// Get details of the currently uploaded offer file  ·  GET /v2/offer/accept   (offer taker)
// NOTE: Read-only preview — makes no changes.
// ---------------------------------------------------------------------------

export interface OfferDetails {
  offer: {
    tradeId: string;
    maker: Array<{ store_id: string; inclusions: unknown[] }>;
    taker: Array<{ store_id: string; inclusions: unknown[] }>;
  };
  /** Staged record changes implied by accepting this offer, if any. */
  stagingRecords: unknown[];
}

// ---------------------------------------------------------------------------
// Upload an offer file  ·  POST /v2/offer/accept/import   (offer taker)
// multipart/form-data, field name "file"
// ---------------------------------------------------------------------------

export interface OfferImportResponse {
  message: string;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Commit imported offer  ·  POST /v2/offer/accept/commit   (offer taker)
// NOTE: This is the step that actually moves the project record out of the
// taker's org and into the maker's org. No request body.
// ---------------------------------------------------------------------------

export interface OfferCommitResponse {
  message: string;
  success: boolean;
}

// ---------------------------------------------------------------------------
// Cancel the currently active (outgoing) offer  ·  DELETE /v2/offer/    (offer maker)
// Reject the currently imported (incoming) offer  ·  DELETE /v2/offer/accept/cancel   (offer taker)
// Neither takes a request body.
// ---------------------------------------------------------------------------

export interface OfferCancelResponse {
  message: string;
  success: boolean;
}
