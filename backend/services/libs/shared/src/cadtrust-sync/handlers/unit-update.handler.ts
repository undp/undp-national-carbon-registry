import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustCreditResourceService } from "../cadtrust-credit-resource.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

/** Queue payload — a bare identifier, safe per `CadTrustCreditResourceService`'s class doc. */
export interface CadTrustUnitUpdateProps {
  creditBlockId: string;
}

/**
 * Full-replace update to an existing CAD Trust unit, or — for the newly-materialized side of a
 * split — its first-ever create. Covers four distinct registry events uniformly, because all four
 * reduce to the same question: "what does this `creditBlockId`'s current state look like on CAD
 * Trust?" — see `CadTrustCreditUnitMapper`'s class doc for why one mapper method answers that for
 * every case:
 *
 *  - a whole-block transfer (owner changes, same `creditBlockId`)
 *  - a `COMPLETED` retirement (status changes to Retired, same or split-off `creditBlockId`)
 *  - a `COMPLETED` ITMO authorization (an Article 6 label gets attached — see below)
 *  - the retained/shrunken side of any partial split (`TxType.CREDIT_BLOCK_SPLIT`)
 *
 * All four are enqueued from `CreditTransactionsManagementService.handleTransactionRecords`, in
 * the replicator. Retirement and ITMO-authorization are enqueued **only** when the underlying
 * request was actually approved — `handleTransactionRecords`'s own `RETIRE`/`ITMO_AUTH` branches
 * already gate on `CreditTransactionStatusEnum.COMPLETED` before this handler is ever reached, so
 * a rejected or cancelled request never reaches CAD Trust at all.
 *
 * ## The ITMO-authorization label link
 *
 * `CadTrustCreditResourceService.ensureUnitUpdate` alone doesn't know an ITMO authorization just
 * happened — it only sees the resulting `CreditBlocksEntity` state. This handler additionally
 * checks `creditBlock.itmoAuthorizationRecord` after a successful unit update and, when set, calls
 * `ensureLabel()` (the singleton "Article 6 - Authorisation" label, bootstrapped on first use) and
 * `ensureUnitLabel()` to link this specific unit to it — idempotent, so re-delivery or an
 * already-linked unit is a no-op.
 *
 * Commit is inline, not queued — matches every other handler in this module.
 */
@Injectable()
export class CadTrustUnitUpdateHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2UnitUpdate;

  constructor(
    private readonly resources: CadTrustCreditResourceService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(props: CadTrustUnitUpdateProps): Promise<void> {
    const creditBlockId = props?.creditBlockId;
    if (!creditBlockId) {
      this.logger.error("CAD Trust unit-update action received without a creditBlockId", props);
      return;
    }

    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        this.logger.log(
          `Skipping CAD Trust unit update for block ${creditBlockId} — CADT_V2_ENABLE is off`
        );
        return;
      }

      const unitCommitOwed = await this.resources.ensureUnitUpdate(creditBlockId);
      const labelCommitOwed = await this.resources.ensureItmoLabelIfAuthorized(creditBlockId);

      if (unitCommitOwed || labelCommitOwed) {
        await this.commitHandler.handle();
      }
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor and stops every
      // queued action in the system, email included.
      this.logger.error(`Unexpected error updating CAD Trust unit for block ${creditBlockId}`, error);
    }
  }
}
