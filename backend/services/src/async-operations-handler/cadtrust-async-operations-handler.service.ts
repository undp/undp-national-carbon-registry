import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AsyncActionEntity } from "@app/shared/entities/async.action.entity";
import { Counter } from "@app/shared/entities/counter.entity";
import { AsyncActionType } from "@app/shared/enum/async.action.type.enum";
import { CADTRUST_V2_ACTION_TYPES } from "@app/shared/enum/cadtrust.async.action.types";
import { CadTrustSyncDispatcherService } from "@app/shared/cadtrust-sync/cadtrust-sync.dispatcher.service";
import { CounterType } from "@app/shared/util/counter.type.enum";

import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";

/**
 * The CAD Trust-only async-operations consumer — a second, independent lane over the same
 * `async_action_entity` table `AsyncOperationsDatabaseHandlerService` reads, filtered to just
 * `CADTRUST_V2_ACTION_TYPES` and walking its own cursor (`CounterType.CADTRUST_ASYNC_OPERATIONS`).
 *
 * ## Why a second lane, not just the never-throw contract
 *
 * Every CAD Trust handler already catches its own errors (see `CadTrustSyncHandler`'s doc), so a
 * CAD Trust failure was never able to permanently stall the shared cursor. But the shared loop
 * still processes one action at a time, synchronously, in order — so a *slow* (not failing) CAD
 * Trust HTTP call (already observed live: 504s from an overloaded node, see
 * `libs/cadtrust/LIVE_VALIDATION.md`) sat inline ahead of whatever email or registry-sync action
 * was queued right after it. This lane removes that: CAD Trust actions are excluded from the
 * shared query entirely (see `AsyncOperationsDatabaseHandlerService`'s doc), so their latency
 * never delays anything else, in either direction.
 *
 * ## Dispatch goes straight to `CadTrustSyncDispatcherService`
 *
 * Every action this lane's query can possibly return is a CAD Trust one by construction, so there
 * is no need to route through the generic `AsyncOperationsHandlerService` switch (which exists to
 * also reach Email/RegistryClient/legacy-CADT-v1 — none of which this lane ever sees).
 *
 * ## The reconcile timer
 *
 * Alongside the cursor-drain loop, this service also starts a second, fully independent
 * self-rescheduling timer that calls `CadTrustReconcileHandler` (via the dispatcher, keyed on
 * `AsyncActionType.CADTV2Reconcile`) every `cadTrustV2.reconcileIntervalMs`. This is what actually
 * retries a staging/commit call that failed because a previous commit was still propagating on
 * CAD Trust's side — see the module README's "Re-driving children on update, and reconciling on a
 * schedule" section for why re-running reconcile frequently is enough, with no need to detect that
 * specific error: reconcile already re-drives every `FAILED` project-scoped sync record
 * unconditionally. Deliberately bypasses the queue/cursor entirely (an in-process call, not an
 * enqueued action) so it can run on its own short cadence without competing with, or waiting
 * behind, anything else — including this lane's own cursor-drain loop.
 */
@Injectable()
export class CadTrustAsyncOperationsHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private cadTrustSyncDispatcher: CadTrustSyncDispatcherService
  ) {}

  async asyncHandler(event: any): Promise<any> {
    this.logger.log("CAD Trust async handler started", JSON.stringify(event));

    this.startReconcileTimer();
    await this.startCursorLoop();
  }

  /**
   * Same cursor-and-backoff shape as `AsyncOperationsDatabaseHandlerService`, deliberately —
   * that pattern (per-action cursor save, exponential backoff on throw, self-reschedule via
   * `setTimeout`) is already proven. The only structural differences: a different cursor
   * (`CADTRUST_ASYNC_OPERATIONS`, not `ASYNC_OPERATIONS`), a query filtered to CAD Trust action
   * types only, and dispatch straight to `CadTrustSyncDispatcherService` instead of the generic
   * switch. In practice a throw here should never happen — the dispatcher itself never throws
   * (see its own doc) — so the backoff branch below is a backstop, not a load-bearing path.
   */
  private async startCursorLoop(): Promise<void> {
    const seqObj = await this.counterRepo.findOneBy({
      id: CounterType.CADTRUST_ASYNC_OPERATIONS,
    });
    let lastSeq = seqObj?.counter ?? 0;
    let retryCount = 0;
    const retryLimit = 50;
    const baseDelay = 5000;

    const doActions = async () => {
      const notExecutedActions = await this.asyncActionRepo
        .createQueryBuilder("asyncAction")
        .where("asyncAction.actionId > :lastExecuted", { lastExecuted: lastSeq })
        .andWhere("asyncAction.actionType IN (:...cadTrustActionTypes)", {
          cadTrustActionTypes: CADTRUST_V2_ACTION_TYPES,
        })
        .orderBy('"actionId"', "ASC")
        .select(['"actionId"', '"actionType"', '"actionProps"'])
        .getRawMany();

      if (notExecutedActions.length !== 0) {
        try {
          for (const action of notExecutedActions) {
            await this.cadTrustSyncDispatcher.handle(action.actionType, JSON.parse(action.actionProps));
            lastSeq = action.actionId;
            await this.counterRepo.save({
              id: CounterType.CADTRUST_ASYNC_OPERATIONS,
              counter: lastSeq,
            });
            retryCount = 0;
          }
        } catch (exception) {
          this.logger.error("CAD Trust async handler failed", exception);
          if (retryCount >= retryLimit) {
            this.logger.error("CAD Trust async handler terminated");
            return;
          }
          const delay = baseDelay * Math.pow(2, retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
          return doActions();
        }
      }
      setTimeout(doActions, baseDelay);
    };

    await doActions();
  }

  /**
   * Independent of the cursor loop above — a plain self-rescheduling timer, not backed by
   * `async_action_entity` or any counter row. Runs `CadTrustReconcileHandler.handle()` via the
   * dispatcher on every tick; the handler itself is idempotent and never throws (see its own
   * class doc), so this timer needs no error handling beyond a defensive log.
   */
  private startReconcileTimer(): void {
    const intervalMs = this.configService.get<number>("cadTrustV2.reconcileIntervalMs");
    console.log(`CAD Trust reconcile timer started, interval ${intervalMs}ms`);

    const runReconcile = async () => {
      try {
        console.log("CAD Trust reconcile timer tick");
        await this.cadTrustSyncDispatcher.handle(AsyncActionType.CADTV2Reconcile, {});
      } catch (error) {
        // Backstop only — CadTrustSyncDispatcherService.handle() already never throws.
        this.logger.error("CAD Trust reconcile timer tick failed unexpectedly", error);
      } finally {
        setTimeout(runReconcile, intervalMs);
      }
    };

    setTimeout(runReconcile, intervalMs);
  }
}
