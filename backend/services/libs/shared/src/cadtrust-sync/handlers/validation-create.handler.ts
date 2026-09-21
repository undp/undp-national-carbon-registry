import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustProjectResourceService } from "../cadtrust-project-resource.service";
import { CadTrustValidationSyncProps } from "../cadtrust-sync.enqueue.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

/**
 * Stages a CAD Trust validation record for a DNA-approved PDD or validation report.
 *
 * A thin shell over `CadTrustProjectResourceService.ensureValidation()` — same split as
 * `CadTrustVerificationCreateHandler` / `ensureVerification()`, and for the same reason: the
 * staging logic (`existingSync()`'s three-way COMMITTED/STAGED/FAILED gate, `adoptOrphanedStagedRow`
 * 504 recovery, the request-side snapshot capture via `recordSyncProps`) now needs to run from
 * `CadTrustReconcileHandler` too, so it lives in the resource service rather than here.
 *
 * `props` carries a fuller snapshot than most payloads in this module — see
 * `CadTrustValidationSyncProps`'s doc (the validating actor's identity would be a replicator race
 * if re-derived here instead).
 *
 * Commit is inline, not queued — matches every other handler in this module.
 */
@Injectable()
export class CadTrustValidationCreateHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2ValidationCreate;

  constructor(
    private readonly resources: CadTrustProjectResourceService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(props: CadTrustValidationSyncProps): Promise<void> {
    const refId = props?.refId;
    if (!refId) {
      this.logger.error("CAD Trust validation sync action received without a refId", props);
      return;
    }

    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        // AddAction already gates this; belt and braces for anything replayed from the queue after
        // the flag was turned off.
        this.logger.log(
          `Skipping CAD Trust validation sync for project ${refId} — CADT_V2_ENABLE is off`
        );
        return;
      }

      const result = await this.resources.ensureValidation(props);
      if (result?.commitOwed) {
        await this.commitHandler.handle();
      }
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor and stops every
      // queued action in the system, email included.
      this.logger.error(`Unexpected error syncing a CAD Trust validation record for project ${refId}`, error);
    }
  }
}
