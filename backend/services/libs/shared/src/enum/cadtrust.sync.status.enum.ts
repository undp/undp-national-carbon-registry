/**
 * Lifecycle of one local record's sync into CAD Trust.
 *
 * String-valued on purpose. `AsyncActionType` is a numeric enum whose Postgres
 * labels are ordinals, which makes every addition a migration and every reorder
 * a data corruption. These enums avoid that entirely.
 */
export enum CadTrustSyncStatus {
  /** A row exists but nothing has been sent yet. */
  PENDING = "PENDING",
  /** Written to the CADT node's private staging table. Not yet public. */
  STAGED = "STAGED",
  /** Published to the network by a staging commit. */
  COMMITTED = "COMMITTED",
  /** The last attempt failed; see lastError. Safe to re-drive. */
  FAILED = "FAILED",
}
