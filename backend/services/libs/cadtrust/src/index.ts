/**
 * `@app/cadtrust` — a typed transport client for a CAD Trust (CADT) v2 node.
 *
 * This package speaks HTTP to CADT and nothing else. It does not know what a
 * carbon project is in THIS registry's data model, when a record should be
 * created, or which picklist value to send. That is adaptor work, and it lives
 * somewhere else on purpose — see README.md.
 */

export * from './client';
export * from './config';

// Transport internals — exported because they are the seams a consumer or a test
// legitimately needs (custom transport, error handling, file uploads).
export * from './http/errors';
export * from './http/multipart';
export * from './http/query';
export * from './http/retry';
export * from './http/transport';
export type { BinaryResponse, RequestOptions } from './http/request';

// Generic CRUD, the resource table, and the documented insert order.
export * from './resources/crud';
export * from './resources/registry';
export type { CadTrustResources } from './resources/entities';

// Action clients.
export type { StagingClient } from './actions/staging';
export type { OrganizationsClient, WaitForCreationOptions } from './actions/organizations';
export type { ProjectActionsClient, XlsxExportQuery } from './actions/project';
export type { UnitActionsClient } from './actions/unit';
export type { OfferClient } from './actions/offer';
export type { GovernanceClient } from './actions/governance';
export type { SystemClient } from './actions/system';

// Test support: a recording, scriptable transport, so consumers can test their
// own mapping logic against this client without a live CADT node.
export * from './testing/fake-transport';
// Test support: a recording PASSTHROUGH transport, for capturing real request/response
// shapes from a live node — see live/*.capture.spec.ts.
export * from './testing/recording-transport';

// Optional NestJS wrapper. Non-Nest consumers can ignore these.
export * from './nest/cadtrust.module';
export * from './nest/cadtrust-v2.service';

/**
 * The full data contract, re-exported so consumers depend on this package alone.
 * These types are vendored verbatim from `cadtrust-sync-interfaces` — see
 * `src/interfaces/README.md` for the staging model, the insert-order chain, and
 * the two known conflicts between CAD Trust's own source documents.
 */
export * from './interfaces';
