import { Inject, Injectable, Logger } from "@nestjs/common";

import { CadTrustSyncHandler } from "./handlers/cadtrust-sync.handler";

/** DI token for the handler collection, so the module owns registration. */
export const CADTRUST_SYNC_HANDLERS = "CADTRUST_SYNC_HANDLERS";

/**
 * Routes a queued action to its handler.
 *
 * This exists so `async-operations-handler.service.ts` — a file shared with
 * email, registry sync and the legacy v1 CADT integration — needs exactly one
 * edit ever, rather than a new `case` per synced entity. Adding an entity is a
 * change inside this module.
 */
@Injectable()
export class CadTrustSyncDispatcherService {
  private readonly handlers: Map<string, CadTrustSyncHandler>;

  constructor(
    @Inject(CADTRUST_SYNC_HANDLERS) handlers: CadTrustSyncHandler[],
    private readonly logger: Logger
  ) {
    // Keyed on the stringified ordinal: the database consumer reads the enum
    // column back as a string and SQS message attributes are strings too, so the
    // actionType arriving at dispatch is "17", not 17.
    this.handlers = new Map(handlers.map((handler) => [handler.actionType.toString(), handler]));
  }

  canHandle(actionType: unknown): boolean {
    return actionType !== undefined && actionType !== null && this.handlers.has(String(actionType));
  }

  /**
   * Never throws — see the contract on {@link CadTrustSyncHandler}. A handler
   * that somehow throws anyway is caught here as a backstop, because letting it
   * escape would stall every async operation in the system.
   */
  async handle(actionType: unknown, props: any): Promise<void> {
    const handler = this.handlers.get(String(actionType));
    if (!handler) {
      this.logger.warn(`No CAD Trust sync handler registered for action type ${actionType}`);
      return;
    }

    try {
      await handler.handle(props);
    } catch (error) {
      this.logger.error(
        `CAD Trust sync handler for action type ${actionType} threw; swallowing so the async queue keeps draining`,
        error
      );
    }
  }
}
