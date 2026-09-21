import { Injectable } from "@nestjs/common";
import { AsyncActionType } from "../../enum/async.action.type.enum";

/**
 * One CAD Trust sync action.
 *
 * ## The contract that matters: `handle` must never throw
 *
 * The database-backed async consumer
 * (`src/async-operations-handler/async-operations-database-handler.service.ts`)
 * keeps a SINGLE GLOBAL CURSOR for all async operations, in the `counter` table.
 * When a handler throws, that cursor does not advance and the same action is
 * retried forever with `5000 * 2^retryCount` backoff — which very quickly means
 * never. Nothing behind it in the queue is ever processed again, including every
 * outgoing email in the system.
 *
 * So a CAD Trust node being down must not be able to take email with it. Every
 * implementation catches its own errors, records them on the sync record, and
 * returns normally. Failures are visible in `cadtrust_sync_record.syncStatus`,
 * not by blocking the queue.
 *
 * ## Adding a new synced entity
 *
 * Subclass this, add an `AsyncActionType` member (append only), register the
 * handler in `CadTrustSyncModule`, and enqueue it from a producer. The
 * dispatcher and the shared consumer switch need no changes.
 */
@Injectable()
export abstract class CadTrustSyncHandler {
  /** The queued action this handler answers to. */
  abstract readonly actionType: AsyncActionType;

  /**
   * @param props The deserialized `actionProps` from the queue. Payloads are
   *   minimal identifiers by convention — the handler re-reads current state, so
   *   a queued action can never publish a stale snapshot.
   */
  abstract handle(props: any): Promise<void>;
}
