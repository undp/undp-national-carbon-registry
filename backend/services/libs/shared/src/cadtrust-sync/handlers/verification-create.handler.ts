import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustCreditResourceService } from "../cadtrust-credit-resource.service";
import { CadTrustVerificationSyncProps } from "../cadtrust-sync.enqueue.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

/**
 * Stages a CAD Trust verification record for a DNA-approved verification report.
 *
 * Request-path producer, replicator-side consumer — same split as `CadTrustValidationCreateHandler`,
 * and for the identical reason: the verifying body's identity and the report's period dates are
 * only safely readable synchronously, in-request (see `CadTrustVerificationSyncProps`'s doc).
 *
 * This is the first of two independent halves of credit-issuance sync — see
 * `cadtrust-sync/README.md`'s "Two different producer-side hooks." The second half,
 * `CadTrustCreditIssuanceHandler`, runs later, from the replicator, once the ledger write this
 * verification precedes has actually produced credit blocks — and depends on this handler having
 * already staged (or committed) its verification record by the time it runs, which causality
 * guarantees (see `CadTrustSyncRecordService.findLatestSynced`'s doc).
 *
 * Commit is inline, not queued — matches every other handler in this module.
 */
@Injectable()
export class CadTrustVerificationCreateHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2VerificationCreate;

  constructor(
    private readonly resources: CadTrustCreditResourceService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(props: CadTrustVerificationSyncProps): Promise<void> {
    const refId = props?.refId;
    if (!refId) {
      this.logger.error("CAD Trust verification sync action received without a refId", props);
      return;
    }

    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        // AddAction already gates this; belt and braces for anything replayed from the queue after
        // the flag was turned off.
        this.logger.log(
          `Skipping CAD Trust verification sync for project ${refId} — CADT_V2_ENABLE is off`
        );
        return;
      }

      const result = await this.resources.ensureVerification(props);
      if (result?.commitOwed) {
        await this.commitHandler.handle();
      }
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor and stops every
      // queued action in the system, email included.
      this.logger.error(`Unexpected error syncing a CAD Trust verification record for project ${refId}`, error);
    }
  }
}
