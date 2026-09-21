/**
 * `@app/aef-v2` — Article 6.2 Agreed Electronic Format (AEF) V2.
 *
 * The five tables of Decision 4/CMA.6 Annex II — Submission, Authorizations,
 * Actions, Holdings, Authorized entities — as a movable library: types, the
 * field spec, validation, controlled values, per-table export, and the two
 * stateful operations a reporting year needs.
 *
 * ## What it is not
 *
 * It does not decide *when* to write a row, does not know what a credit block
 * is, does not submit to CARP and has no UI. Everything external arrives through
 * one of four ports — `AefStore`, `HoldingsProvider`, `RefResolver`,
 * `ControlledValueProvider`.
 *
 * ## Curated on purpose
 *
 * Only what a consumer is meant to touch is exported. `toXlsxBuffer` and the
 * TypeORM adapter are reachable by subpath (`@app/aef-v2/export/xlsx`,
 * `@app/aef-v2/typeorm`) so importing this barrel never pulls in ExcelJS,
 * TypeORM or Nest.
 *
 * ```ts
 * await ensureSubmissionForYear(store, defaults);
 * await snapshotHoldingsForYear(store, holdingsProvider, defaults, 2025);
 * const issues = validateSubmission(bundle);
 * const csv = toCsv('t3Actions', actions);
 * ```
 */

// ---- Contract -------------------------------------------------------------
export * from './tables';
export * from './spec';
export * from './controlled-values';
export * from './refs/resolver';
export * from './clock';

// ---- Ports the host implements -------------------------------------------
export type { AefStore, AefQuery, AefPage, AefSortOrder } from './store/aef-store.port';
export { AEF_STORE, DEFAULT_PAGE_SIZE } from './store/aef-store.port';
export type { HoldingsProvider } from './holdings/snapshot';
export type { AuthorizedEntitiesProvider } from './authorized-entities/provider';

// ---- Operations the host calls -------------------------------------------
export * from './validation';
export * from './submission/bootstrap';
export * from './submission/rollover';
export * from './submission/bundle';
export * from './submission/submit';
export * from './records/write';
export * from './holdings/snapshot';
export * from './authorized-entities/snapshot';
export * from './export';

// ---- Test support --------------------------------------------------------
export * from './testing';
