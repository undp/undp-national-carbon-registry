import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustCreditResourceService } from "../cadtrust-credit-resource.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

/** Queue payload — a bare identifier, safe per `CadTrustCreditResourceService`'s class doc. */
export interface CadTrustCreditIssuanceProps {
  creditBlockId: string;
}

/**
 * Ensures the verification + issuance records for one newly-issued credit block, then creates
 * its unit — the second of two independent halves of credit-issuance sync (see
 * `CadTrustVerificationCreateHandler`'s class doc for the first half and why the split exists).
 *
 * ## One call per vintage block, not per DNA-approval event
 *
 * `ProgrammeLedgerService.issueCredits()` writes one `CreditBlocksEntity` row per vintage
 * (`ActivityVintageCreditsDto`), each an independent ledger/replicator event — so a single
 * verification-report approval that issues credits across three vintages enqueues this handler
 * three times, once per resulting `creditBlockId`. `ensureVerification`/`ensureIssuance` are
 * idempotent (via `existingSync()`), so the first of the three runs stages both records and the
 * other two find them already staged/committed — no batching logic needed here at all.
 *
 * Enqueued from `CreditTransactionsManagementService.handleTransactionRecords`'s `ISSUE` branch,
 * in the replicator — see `CadTrustCreditResourceService`'s class doc for why a bare
 * `creditBlockId` payload is safe here, unlike `CadTrustProjectCreateSnapshot`.
 *
 * Commit is inline, not queued — matches every other handler in this module.
 */
@Injectable()
export class CadTrustCreditIssuanceHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2CreditIssuance;

  constructor(
    private readonly resources: CadTrustCreditResourceService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(props: CadTrustCreditIssuanceProps): Promise<void> {
    const creditBlockId = props?.creditBlockId;
    if (!creditBlockId) {
      this.logger.error("CAD Trust credit-issuance action received without a creditBlockId", props);
      return;
    }

    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        this.logger.log(
          `Skipping CAD Trust credit-issuance sync for block ${creditBlockId} — CADT_V2_ENABLE is off`
        );
        return;
      }

      const commitOwed = await this.resources.ensureCreditIssuance(creditBlockId);
      if (commitOwed) {
        await this.commitHandler.handle();
      }
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor and stops every
      // queued action in the system, email included.
      this.logger.error(`Unexpected error syncing CAD Trust credit issuance for block ${creditBlockId}`, error);
    }
  }
}
