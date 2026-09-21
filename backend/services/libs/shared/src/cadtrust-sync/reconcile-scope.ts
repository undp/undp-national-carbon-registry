import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";

/**
 * Which of `CadTrustReconcileHandler`'s passes is responsible for re-driving a FAILED
 * `cadtrust_sync_record` of a given `CadTrustLocalEntityType` — the single place that answers
 * "does reconcile touch this entity type, and how?".
 *
 * Before this existed, that answer was spread across two hand-maintained `localEntityType IN (...)`
 * allow-lists in `CadTrustSyncRecordService` (`findFailedProjectRefIds` / `findFailedCreditBlockIds`),
 * and the deliberate omissions (`ORGANIZATION` / `PROGRAM` / `METHODOLOGY`, and — until this change —
 * `VALIDATION` / `VERIFICATION` / `ISSUANCE`) were recorded only as prose in doc comments. A newly
 * added entity type inherited that silence by default. `CADTRUST_RECONCILE_PASS` is a total map
 * (`Record<CadTrustLocalEntityType, …>`), so a new member does not compile until it is classified,
 * and `reconcile-scope.spec.ts` pins the partition at runtime — the same invariant-guard style as
 * `action-type-ordinals.spec.ts`.
 */
export enum CadTrustReconcilePass {
  /**
   * `CadTrustSyncRecordService.findFailedProjectRefIds()` → `CadTrustReconcileHandler.reconcileProject()`.
   * `localId` is a bare project `refId`, resolvable via `ProgrammeLedgerService.getProjectById()`.
   */
  PROJECT = "PROJECT",
  /**
   * `CadTrustSyncRecordService.findFailedCreditBlockIds()` → `CadTrustReconcileHandler.reconcileCreditBlock()`.
   * `localId` is a `creditBlockId`, re-readable directly from `CreditBlocksEntity`.
   */
  CREDIT_BLOCK = "CREDIT_BLOCK",
  /**
   * `CadTrustSyncRecordService.findFailedSnapshotRecords()` → `CadTrustReconcileHandler.reconcileSnapshots()`.
   * Re-driven from the `cadtrust_sync_record.syncProps` snapshot captured request-side (or, for a
   * row that failed before `syncProps` existed, best-effort from the stored outbound `payload`) —
   * by the time reconcile runs, the `async_action_entity` row that originally carried the snapshot
   * has long since been consumed.
   */
  SNAPSHOT = "SNAPSHOT",
  /**
   * Never queried by reconcile directly — recovered only as a side effect of another pass' `ensureX`.
   * `STAKEHOLDER` is keyed by `companyId`, not `refId`, and is re-driven whenever `ensureStakeholder`
   * runs for any project of that company; `LABEL` is the bootstrapped Article 6 singleton, re-driven
   * via `ensureItmoLabelIfAuthorized` → `ensureLabel` on the credit-block sweep.
   */
  INDIRECT = "INDIRECT",
  /**
   * Owned entirely by `CadTrustBootstrapHandler`; reconcile must never touch it. `ORGANIZATION` is
   * verified against the node, never staged by this registry (`verifyHomeOrganization()` /
   * `markCommitted`) — a FAILED row there means the node has no home organization, an out-of-band
   * operator task reconcile cannot fix. `PROGRAM` / `METHODOLOGY` are this registry's bootstrapped
   * singletons. All three are re-checked on every national-api start, when `enqueueBootstrap()` runs.
   */
  BOOTSTRAP_ONLY = "BOOTSTRAP_ONLY",
}

/**
 * Total map — a new `CadTrustLocalEntityType` member will not compile until it is classified here.
 * Declaration order is the order `entityTypesForPass` returns, and the order the two SQL finders
 * feed into their `IN (:...types)` clause.
 */
export const CADTRUST_RECONCILE_PASS: Record<CadTrustLocalEntityType, CadTrustReconcilePass> = {
  [CadTrustLocalEntityType.PROJECT]: CadTrustReconcilePass.PROJECT,
  [CadTrustLocalEntityType.PROJECT_METHODOLOGY]: CadTrustReconcilePass.PROJECT,
  [CadTrustLocalEntityType.STAKEHOLDER_PROJECT]: CadTrustReconcilePass.PROJECT,
  [CadTrustLocalEntityType.LOCATION]: CadTrustReconcilePass.PROJECT,

  [CadTrustLocalEntityType.UNIT]: CadTrustReconcilePass.CREDIT_BLOCK,
  [CadTrustLocalEntityType.UNIT_LABEL]: CadTrustReconcilePass.CREDIT_BLOCK,

  [CadTrustLocalEntityType.VALIDATION]: CadTrustReconcilePass.SNAPSHOT,
  [CadTrustLocalEntityType.VERIFICATION]: CadTrustReconcilePass.SNAPSHOT,
  [CadTrustLocalEntityType.ISSUANCE]: CadTrustReconcilePass.SNAPSHOT,

  [CadTrustLocalEntityType.STAKEHOLDER]: CadTrustReconcilePass.INDIRECT,
  [CadTrustLocalEntityType.LABEL]: CadTrustReconcilePass.INDIRECT,

  [CadTrustLocalEntityType.ORGANIZATION]: CadTrustReconcilePass.BOOTSTRAP_ONLY,
  [CadTrustLocalEntityType.PROGRAM]: CadTrustReconcilePass.BOOTSTRAP_ONLY,
  [CadTrustLocalEntityType.METHODOLOGY]: CadTrustReconcilePass.BOOTSTRAP_ONLY,
};

/** Every `CadTrustLocalEntityType` assigned to `pass`, in `CADTRUST_RECONCILE_PASS` declaration order. */
export function entityTypesForPass(pass: CadTrustReconcilePass): CadTrustLocalEntityType[] {
  return (Object.keys(CADTRUST_RECONCILE_PASS) as CadTrustLocalEntityType[]).filter(
    (type) => CADTRUST_RECONCILE_PASS[type] === pass
  );
}
