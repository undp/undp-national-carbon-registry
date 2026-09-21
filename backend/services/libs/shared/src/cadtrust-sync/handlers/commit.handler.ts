import { CadTrustV2Service } from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustSyncRecordService } from "../cadtrust-sync-record.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";

/**
 * Publishes everything currently staged on the node.
 *
 * This is the only call in the whole adaptor that reaches the CAD Trust network:
 * every create/update elsewhere writes to the node's private staging table and
 * stops. Keeping commit as its own queued action means several staged records
 * naturally batch into one on-chain commit, and a slow or failing commit never
 * blocks staging the next one.
 *
 * ## A commit failure is usually transient, but not always
 *
 * CAD Trust's `assertNoPendingCommitsExcludingTransfers` guard rejects a commit while any staging
 * row sits at `committed:true, failed_commit:false` — normally a previous commit still
 * propagating on-chain, which clears itself within minutes. But it is also the state a row is
 * left in when its confirmation never lands, which does **not** self-resolve (observed live
 * 2026-08-24: a stuck `project` UPDATE row blocked an unrelated validation-report sync — see
 * `libs/cadtrust/README.md`'s notes on `POST /staging/reset-committed`, CAD Trust's own,
 * node-global fix for that state).
 *
 * This handler does not try to tell the two cases apart — see `cadtrust-sync/README.md`'s
 * "Re-driving children on update, and reconciling on a schedule" section for why the CAD
 * Trust-only async lane just retries on a short timer instead. What this handler *does* do is
 * escalate: once `cadtrust_sync_record.attemptCount` for any FAILED row crosses
 * `cadTrustV2.commitStuckThreshold`, it logs one loud warning pointing at `resetCommitted()` —
 * never calls it. That endpoint resets every tenant's stuck rows on a shared node and
 * re-publishes them; an operator has to make that call, this handler never does.
 */
@Injectable()
export class CadTrustCommitHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2Commit;

  constructor(
    private readonly syncRecords: CadTrustSyncRecordService,
    private readonly cadTrustV2Service: CadTrustV2Service,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(): Promise<void> {
    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        return;
      }

      const client = this.cadTrustV2Service.getClient();

      // v2 semantics — see StagingV2PendingResponse. `hasUncommittedStagedRows()` returning
      // false means the node has no rows with committed:false, i.e. nothing to commit. This is
      // the INVERSE of a guard that used to live here: that one read `confirmed` the v1 way
      // (`!confirmed => skip`), which deadlocked every commit the moment anything was staged
      // (confirmed via live testing, 2026-08-21). Skipping only when there is genuinely nothing
      // staged cannot deadlock the same way. The propagation precondition (no previous commit
      // still propagating on-chain) is still enforced server-side by POST /staging/commit itself
      // (`assertNoPendingCommitsExcludingTransfers`), which 400s into the catch block below.
      if (!(await client.staging.hasUncommittedStagedRows())) {
        // Reconcile before returning: if the node has nothing uncommitted but we still hold
        // STAGED sync records, those were committed (or cleared off the node) without us
        // recording it. Leaving them STAGED would make callers like the bootstrap handler's
        // three-way check re-enqueue a commit every run that this same guard then skips again —
        // a silent loop.
        const committed = await this.syncRecords.markAllStagedAsCommitted();
        this.logger.log(
          `CAD Trust commit skipped — nothing staged on the node; reconciled ${committed} sync record(s) to committed`
        );
        return;
      }

      const result = await client.staging.commit({
        author: this.commitAuthor(),
        comment: "National registry sync",
      });

      const committed = await this.syncRecords.markAllStagedAsCommitted();
      this.logger.log(
        `CAD Trust commit issued ("${result.message}"); marked ${committed} sync record(s) committed`
      );
    } catch (error) {
      // Must not rethrow — see CadTrustSyncHandler. The staged records are marked
      // failed so they are visible, but they remain staged on the node and a
      // later commit will still pick them up.
      const failed = await this.syncRecords.markAllStagedAsFailed(error);
      this.logger.error(
        `CAD Trust commit failed; marked ${failed} staged sync record(s) failed. ` +
          `The records are still staged on the node and a later commit will include them.`,
        error
      );
      await this.warnIfStuck();
    }
  }

  /**
   * Fires every time this commit handler runs while at least one FAILED sync record has crossed
   * `cadTrustV2.commitStuckThreshold` — not just once — so a still-unresolved condition keeps
   * showing up in the logs rather than being logged once and missed. Logging only; see the class
   * doc for why `resetCommitted()` is never called from here.
   */
  private async warnIfStuck(): Promise<void> {
    const threshold = this.configService.get<number>("cadTrustV2.commitStuckThreshold");
    const stuck = await this.syncRecords.findStuckFailures(threshold);
    if (stuck.length === 0) {
      return;
    }

    this.logger.warn(
      `CAD TRUST COMMIT STUCK — ${stuck.length} staging record(s) have failed ${threshold}+ times ` +
        `in a row. If this is a commit still propagating on-chain it will resolve on its own; if a ` +
        `confirmation never landed, an operator must run POST /staging/reset-committed on the node ` +
        `to clear it — this resets every tenant's stuck rows on a shared node, so read ` +
        `libs/cadtrust/README.md's notes on it before running it. Affected records: ` +
        `${stuck.map((record) => `${record.localEntityType}:${record.localId}`).join(", ")}`
    );
  }

  private commitAuthor(): string {
    return (
      this.configService.get<string>("cadTrustV2.commitAuthor") ||
      this.configService.get<string>("systemName")
    );
  }
}
