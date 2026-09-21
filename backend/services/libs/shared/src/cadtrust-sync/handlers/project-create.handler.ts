import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustProjectResourceService } from "../cadtrust-project-resource.service";
import { CadTrustProjectCreateSnapshot } from "../cadtrust-sync.enqueue.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

/**
 * Stages a newly created project into CAD Trust, along with everything that
 * only makes sense once the project exists: its program/methodology link, its
 * owning stakeholder and stakeholder-project link, and its site location.
 *
 * Five independent, individually-idempotent steps — `ensureStakeholder` /
 * `ensureProject` / `ensureProjectMethodology` / `ensureStakeholderProject` /
 * `ensureLocation`, all on `CadTrustProjectResourceService` — followed by a
 * single inline commit if anything was staged. Mirrors `CadTrustBootstrapHandler`'s
 * shape. `CadTrustProjectUpdateHandler` reuses the same five methods to re-drive
 * a child that failed here; see its class doc.
 *
 * ## Commit is inline, not queued
 *
 * Unlike the original single-project design, this handler stages up to five
 * resources itself — that is already a batch worth publishing together
 * immediately. `CadTrustCommitHandler.handle()` is called directly rather than
 * through `CadTrustSyncEnqueueService.enqueueCommit()`, the same change already
 * made for `CadTrustBootstrapHandler` and for the same reason: it already
 * satisfies the never-throw contract on its own, so calling it in-process is
 * safe, and queueing it here would only add latency with no meaningful
 * batching benefit left at this handler's level.
 */
@Injectable()
export class CadTrustProjectCreateHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2ProjectCreate;

  constructor(
    private readonly resources: CadTrustProjectResourceService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(props: CadTrustProjectCreateSnapshot): Promise<void> {
    const refId = props?.refId;
    if (!refId) {
      this.logger.error("CAD Trust project create action received without a refId", props);
      return;
    }

    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        // AddAction already gates this; belt and braces for anything replayed
        // from the queue after the flag was turned off.
        this.logger.log(`Skipping CAD Trust sync for project ${refId} — CADT_V2_ENABLE is off`);
        return;
      }

      const infContent = await this.resources.getLatestInfContent(refId);

      const stakeholder = await this.resources.ensureStakeholder(props.companyId);
      const project = await this.resources.ensureProject(refId, props, infContent);

      let commitOwed = (stakeholder?.commitOwed ?? false) || (project?.commitOwed ?? false);

      if (project) {
        const methodologyLinked = await this.resources.ensureProjectMethodology(
          refId,
          project.cadTrustId,
          props.createTime
        );
        const stakeholderLinked = stakeholder
          ? await this.resources.ensureStakeholderProject(refId, project.cadTrustId, stakeholder.cadTrustId)
          : false;
        const locationStaged = await this.resources.ensureLocation(refId, project.cadTrustId, infContent);

        commitOwed = commitOwed || methodologyLinked || stakeholderLinked || locationStaged;
      }

      if (commitOwed) {
        await this.commitHandler.handle();
      }
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor
      // and stops every queued action in the system, email included. Every
      // ensureX step in CadTrustProjectResourceService already catches its own
      // errors; this is a backstop.
      this.logger.error(`Unexpected error syncing project ${refId} to CAD Trust`, error);
    }
  }
}
