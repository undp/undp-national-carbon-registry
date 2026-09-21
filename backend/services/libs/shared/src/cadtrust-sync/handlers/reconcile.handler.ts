import { CadTrustV2Service } from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { CadTrustSyncRecordEntity } from "../../entities/cadtrust.sync.record.entity";
import { AsyncActionType } from "../../enum/async.action.type.enum";
import { CadTrustLocalEntityType } from "../../enum/cadtrust.local.entity.type.enum";
import { ProgrammeLedgerService } from "../../programme-ledger/programme-ledger.service";
import { CadTrustCreditResourceService } from "../cadtrust-credit-resource.service";
import { toCadTrustIsoDate } from "../iso-date";
import { CadTrustProjectResourceService } from "../cadtrust-project-resource.service";
import {
  CadTrustValidationSyncProps,
  CadTrustVerificationSyncProps,
} from "../cadtrust-sync.enqueue.service";
import { CadTrustSyncRecordService } from "../cadtrust-sync-record.service";
import { CadTrustSyncHandler } from "./cadtrust-sync.handler";
import { CadTrustCommitHandler } from "./commit.handler";

const VERIFICATION_LOCAL_ID_MARKER = "-VERIFICATION-v";
const VALIDATION_LOCAL_ID_RE = /^(.+)-(PDD|VALIDATION)-v(\d+)$/;

/**
 * Re-drives everything CAD Trust sync left behind: a batch that got staged but whose commit never
 * went through, and any sync record left FAILED by a transient error (a 504, a network blip,
 * bootstrap not having run yet, or a dependency that hadn't synced yet).
 *
 * ## Why this exists
 *
 * Before this handler, nothing ever revisited a FAILED `cadtrust_sync_record`.
 * `CadTrustCommitHandler`'s own doc says "a later commit will still pick them up" for the
 * staged-but-uncommitted case, but nothing scheduled that later commit; a FAILED create/update was
 * permanent unless an unrelated later project/credit event happened to touch the exact same sync
 * record. This handler is that scheduled later pass.
 *
 * ## Enqueued once per national-api start, like bootstrap
 *
 * Same rationale as `CadTrustBootstrapHandler`: idempotent (a clean run with nothing FAILED and
 * nothing staged is two cheap read-only calls and a no-op), and cheap enough to run unconditionally
 * on every start rather than needing its own trigger. It is also re-run on a short timer — see
 * `CadTrustAsyncOperationsHandlerService.startReconcileTimer()`.
 *
 * ## Three sweeps, one per `CadTrustReconcilePass` that reconcile owns
 *
 * `reconcile-scope.ts` assigns every `CadTrustLocalEntityType` to a pass; a spec pins the
 * partition. The three sweeps run in dependency order so a single tick can heal a whole broken
 * chain — project → validation → verification → issuance → unit:
 *
 *  1. **Project sweep** — `findFailedProjectRefIds()` → `reconcileProject()`. Re-runs the full
 *     create-time `ensureX` sequence for every project with a FAILED PROJECT / PROJECT_METHODOLOGY /
 *     STAKEHOLDER_PROJECT / LOCATION record, reading current state from the ledger (never
 *     `project_entity` — same reasoning as `CadTrustProjectCreateHandler`). Each `ensureX` checks
 *     `existingSync()` first, so an already-COMMITTED resource is untouched. A FAILED `STAKEHOLDER`
 *     is re-driven as a side effect here (`ensureStakeholder` runs for the company).
 *  2. **Snapshot sweep** — `findFailedSnapshotRecords()` → `reconcileSnapshots()`. Re-drives every
 *     FAILED VALIDATION / VERIFICATION / ISSUANCE record from the `syncProps` snapshot captured
 *     request-side (see `CadTrustSyncRecordService.recordSyncProps`), or — for a row that failed
 *     before that column existed — best-effort from the stored outbound `payload`. Processed
 *     VALIDATION → VERIFICATION → ISSUANCE so each stage's CAD Trust dependency has just been
 *     re-staged by the group before it.
 *  3. **Credit-block sweep** — `findFailedCreditBlockIds()` → `reconcileCreditBlock()`. Re-runs
 *     `ensureUnitUpdate()` (an upsert) and `ensureItmoLabelIfAuthorized()` for every credit block
 *     with a FAILED UNIT / UNIT_LABEL record. A FAILED `LABEL` is re-driven as a side effect here.
 *
 * `ORGANIZATION` / `PROGRAM` / `METHODOLOGY` are `BOOTSTRAP_ONLY` in `reconcile-scope.ts` — this
 * handler never touches them; they recover on the next `enqueueBootstrap()` (i.e. next start).
 */
@Injectable()
export class CadTrustReconcileHandler extends CadTrustSyncHandler {
  readonly actionType = AsyncActionType.CADTV2Reconcile;

  constructor(
    private readonly syncRecords: CadTrustSyncRecordService,
    private readonly resources: CadTrustProjectResourceService,
    private readonly creditResources: CadTrustCreditResourceService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly commitHandler: CadTrustCommitHandler,
    private readonly cadTrustV2Service: CadTrustV2Service,
    private readonly configService: ConfigService,
    private readonly logger: Logger
  ) {
    super();
  }

  async handle(): Promise<void> {
    try {
      if (!this.configService.get<boolean>("cadTrustV2.enable")) {
        // AddAction already gates this; belt and braces for anything replayed from the queue after
        // the flag was turned off.
        return;
      }

      const client = this.cadTrustV2Service.getClient();
      if (await client.staging.hasUncommittedStagedRows()) {
        this.logger.log("CAD Trust reconcile: retrying a commit for a staged-but-uncommitted batch");
        await this.commitHandler.handle();
      }

      // Records that have already failed this many times are left alone — see
      // cadTrustV2.reconcileMaxAttempts's doc.
      const maxAttempts = this.configService.get<number>("cadTrustV2.reconcileMaxAttempts");

      // Dependency order: project → validation/verification/issuance → unit. Each sweep commits its
      // own staged rows before the next runs, so a chain broken at several links can heal in one tick.
      await this.reconcileProjects(maxAttempts);
      await this.reconcileSnapshots(maxAttempts);
      await this.reconcileCreditBlocks(maxAttempts);
    } catch (error) {
      // Must not rethrow: a throw here stalls the global async-operations cursor and stops every
      // queued action in the system, email included. Every sweep and every ensureX behind it
      // already catches its own errors; this is a backstop only.
      this.logger.error("Unexpected error during CAD Trust reconcile", error);
    }
  }

  private async reconcileProjects(maxAttempts: number): Promise<void> {
    const refIds = await this.syncRecords.findFailedProjectRefIds(maxAttempts);
    if (refIds.length === 0) {
      this.logger.log("CAD Trust reconcile: no FAILED project sync records to re-drive");
      return;
    }

    this.logger.log(
      `CAD Trust reconcile: re-driving ${refIds.length} project(s) with a FAILED sync record`
    );
    let commitOwed = false;
    for (const refId of refIds) {
      commitOwed = (await this.reconcileProject(refId)) || commitOwed;
    }
    if (commitOwed) {
      await this.commitHandler.handle();
    }
  }

  private async reconcileCreditBlocks(maxAttempts: number): Promise<void> {
    const creditBlockIds = await this.syncRecords.findFailedCreditBlockIds(maxAttempts);
    if (creditBlockIds.length === 0) {
      this.logger.log("CAD Trust reconcile: no FAILED credit sync records to re-drive");
      return;
    }

    this.logger.log(
      `CAD Trust reconcile: re-driving ${creditBlockIds.length} credit block(s) with a FAILED sync record`
    );
    let commitOwed = false;
    for (const creditBlockId of creditBlockIds) {
      commitOwed = (await this.reconcileCreditBlock(creditBlockId)) || commitOwed;
    }
    if (commitOwed) {
      await this.commitHandler.handle();
    }
  }

  /**
   * Re-runs the create-time `ensureX` sequence for one project. Reads the project from the ledger,
   * never `project_entity` — see the class doc. `ProjectEntity` structurally satisfies
   * `CadTrustProjectCreateSnapshot`, the same reuse `CadTrustProjectUpdateHandler` relies on.
   *
   * Never throws on its own — every `ensureX` call is already self-catching, and this method adds a
   * per-project backstop so one bad refId can't abort the whole reconcile pass.
   */
  private async reconcileProject(refId: string): Promise<boolean> {
    try {
      const project = await this.programmeLedgerService.getProjectById(refId);
      if (!project) {
        this.logger.warn(
          `CAD Trust reconcile: project ${refId} not found in the ledger; leaving its FAILED sync record as-is`
        );
        return false;
      }

      const infContent = await this.resources.getLatestInfContent(refId);

      const stakeholder = await this.resources.ensureStakeholder(project.companyId);
      const projectResult = await this.resources.ensureProject(refId, project, infContent);

      let commitOwed = (stakeholder?.commitOwed ?? false) || (projectResult?.commitOwed ?? false);

      if (projectResult) {
        const methodologyLinked = await this.resources.ensureProjectMethodology(
          refId,
          projectResult.cadTrustId,
          project.createTime
        );
        const stakeholderLinked = stakeholder
          ? await this.resources.ensureStakeholderProject(
              refId,
              projectResult.cadTrustId,
              stakeholder.cadTrustId
            )
          : false;
        const locationStaged = await this.resources.ensureLocation(refId, projectResult.cadTrustId, infContent);

        commitOwed = commitOwed || methodologyLinked || stakeholderLinked || locationStaged;
      }

      return commitOwed;
    } catch (error) {
      this.logger.error(`CAD Trust reconcile failed unexpectedly for project ${refId}`, error);
      return false;
    }
  }

  /**
   * The snapshot sweep: re-drives every FAILED VALIDATION / VERIFICATION / ISSUANCE record, grouped
   * and ordered VALIDATION → VERIFICATION → ISSUANCE so each group's CAD Trust dependency is
   * re-staged (and committed) before the next group references it. Each group commits its own
   * staged rows.
   */
  private async reconcileSnapshots(maxAttempts: number): Promise<void> {
    const records = await this.syncRecords.findFailedSnapshotRecords(maxAttempts);
    if (records.length === 0) {
      this.logger.log(
        "CAD Trust reconcile: no FAILED validation/verification/issuance sync records to re-drive"
      );
      return;
    }

    this.logger.log(
      `CAD Trust reconcile: re-driving ${records.length} validation/verification/issuance record(s) with a FAILED sync record`
    );

    const order = [
      CadTrustLocalEntityType.VALIDATION,
      CadTrustLocalEntityType.VERIFICATION,
      CadTrustLocalEntityType.ISSUANCE,
    ];
    for (const entityType of order) {
      const group = records.filter((record) => record.localEntityType === entityType);
      let commitOwed = false;
      for (const record of group) {
        commitOwed = (await this.reconcileSnapshotRecord(record)) || commitOwed;
      }
      if (commitOwed) {
        await this.commitHandler.handle();
      }
    }
  }

  /**
   * Re-drives one FAILED snapshot record via the same `ensureX` it went through in steady state.
   * Never throws on its own — the `ensureX` calls are already self-catching, and this adds a
   * per-record backstop so one bad row can't abort the sweep.
   */
  private async reconcileSnapshotRecord(record: CadTrustSyncRecordEntity): Promise<boolean> {
    try {
      switch (record.localEntityType) {
        case CadTrustLocalEntityType.VALIDATION: {
          const props = this.validationPropsFor(record);
          if (!props) {
            return false;
          }
          const result = await this.resources.ensureValidation(props);
          return result?.commitOwed ?? false;
        }
        case CadTrustLocalEntityType.VERIFICATION: {
          const props = this.verificationPropsFor(record);
          if (!props) {
            return false;
          }
          const result = await this.creditResources.ensureVerification(props);
          return result?.commitOwed ?? false;
        }
        case CadTrustLocalEntityType.ISSUANCE: {
          const refId = this.refIdForIssuance(record);
          if (!refId) {
            return false;
          }
          const result = await this.creditResources.ensureIssuance(refId);
          return result?.commitOwed ?? false;
        }
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(
        `CAD Trust reconcile failed unexpectedly for ${record.localEntityType} record ${record.localId}`,
        error
      );
      return false;
    }
  }

  /**
   * `CadTrustValidationSyncProps` for a FAILED validation record: the request-side `syncProps`
   * snapshot when present, otherwise best-effort from the stored outbound `ValidationCreateInput`
   * `payload` plus the composite `localId`. The validating body's name is not recoverable from
   * `payload` and does not matter — `CadTrustValidationMapper` always sends the configured default,
   * never `props.validationBodyName` (see its class doc). Returns undefined (and warns) when
   * neither source is usable.
   */
  private validationPropsFor(record: CadTrustSyncRecordEntity): CadTrustValidationSyncProps | undefined {
    const snapshot = record.syncProps as Partial<CadTrustValidationSyncProps> | undefined;
    if (snapshot?.refId && snapshot.documentType && snapshot.documentVersion !== undefined) {
      return snapshot as CadTrustValidationSyncProps;
    }

    const match = VALIDATION_LOCAL_ID_RE.exec(record.localId);
    const payload = record.payload as Record<string, unknown> | undefined;
    if (!match || !payload) {
      this.logger.warn(
        `CAD Trust reconcile: FAILED validation record ${record.localId} has no syncProps and no ` +
          `usable payload to rebuild it from; leaving it as-is`
      );
      return undefined;
    }

    return {
      refId: match[1],
      documentType: match[2] as unknown as CadTrustValidationSyncProps["documentType"],
      documentVersion: Number(match[3]),
      validationBodyName: "",
      validationDate:
        (payload.validationDate as string) ??
        toCadTrustIsoDate(record.createTime) ??
        new Date().toISOString().split("T")[0],
      creditPeriodStartDate: payload.validationCreditPeriodStartDate as string | undefined,
      creditPeriodEndDate: payload.validationCreditPeriodEndDate as string | undefined,
    };
  }

  /**
   * `CadTrustVerificationSyncProps` for a FAILED verification record — the `syncProps` snapshot, or
   * best-effort from the stored `VerificationCreateInput` `payload` plus the composite `localId`.
   * `verificationBodyName` is not recoverable and does not matter, for the same reason as
   * `validationBodyName`. Returns undefined (and warns) when neither source is usable.
   */
  private verificationPropsFor(
    record: CadTrustSyncRecordEntity
  ): CadTrustVerificationSyncProps | undefined {
    const snapshot = record.syncProps as Partial<CadTrustVerificationSyncProps> | undefined;
    if (snapshot?.refId && snapshot.documentVersion !== undefined) {
      return snapshot as CadTrustVerificationSyncProps;
    }

    const parsed = this.parseVerificationLocalId(record.localId);
    const payload = record.payload as Record<string, unknown> | undefined;
    if (!parsed || !payload) {
      this.logger.warn(
        `CAD Trust reconcile: FAILED verification record ${record.localId} has no syncProps and no ` +
          `usable payload to rebuild it from; leaving it as-is`
      );
      return undefined;
    }

    return {
      refId: parsed.refId,
      documentVersion: parsed.version,
      verificationBodyName: "",
      verificationStartDate: payload.verificationStartDate as string | undefined,
      verificationEndDate: payload.verificationEndDate as string | undefined,
    };
  }

  /**
   * The project `refId` for a FAILED issuance record. `ensureIssuance` re-derives everything else
   * from other sync records, so this is all it needs — from `syncProps.refId`, or by splitting the
   * composite `localId` on the literal `-VERIFICATION-v` marker (never on `-`: refIds contain
   * hyphens, e.g. `CA0004-VU-CH-356`).
   */
  private refIdForIssuance(record: CadTrustSyncRecordEntity): string | undefined {
    const snapshotRefId = (record.syncProps as { refId?: string } | undefined)?.refId;
    if (snapshotRefId) {
      return snapshotRefId;
    }

    const refId = this.parseVerificationLocalId(record.localId)?.refId;
    if (!refId) {
      this.logger.warn(
        `CAD Trust reconcile: FAILED issuance record ${record.localId} has no syncProps and an ` +
          `unparseable localId; leaving it as-is`
      );
    }
    return refId;
  }

  /** Splits a `${refId}-VERIFICATION-v${n}` composite localId. */
  private parseVerificationLocalId(localId: string): { refId: string; version: number } | undefined {
    const markerAt = localId.lastIndexOf(VERIFICATION_LOCAL_ID_MARKER);
    if (markerAt <= 0) {
      return undefined;
    }
    const refId = localId.slice(0, markerAt);
    const version = Number(localId.slice(markerAt + VERIFICATION_LOCAL_ID_MARKER.length));
    if (!refId || !Number.isFinite(version)) {
      return undefined;
    }
    return { refId, version };
  }

  /**
   * Re-runs `ensureUnitUpdate` (an upsert — see `CadTrustCreditResourceService`'s class doc) and
   * the ITMO-label follow-up for one credit block. `ensureUnitUpdate` re-reads current
   * `CreditBlocksEntity` state itself, so this is safe to call unconditionally, the same as every
   * other `ensureX` in this adaptor.
   *
   * Never throws on its own — `ensureUnitUpdate`/`ensureItmoLabelIfAuthorized` are already
   * self-catching, and this method adds a per-block backstop so one bad `creditBlockId` can't
   * abort the whole reconcile pass.
   */
  private async reconcileCreditBlock(creditBlockId: string): Promise<boolean> {
    try {
      // A block whose unit was never created because its issuance failed with no ISSUANCE row to
      // re-drive (see ensureIssuanceForUncreatedUnit) — a no-op for every other FAILED credit
      // block, which ensureUnitUpdate already covers.
      const issuanceCommitOwed = await this.creditResources.ensureIssuanceForUncreatedUnit(creditBlockId);
      const unitCommitOwed = await this.creditResources.ensureUnitUpdate(creditBlockId);
      const labelCommitOwed = await this.creditResources.ensureItmoLabelIfAuthorized(creditBlockId);
      return issuanceCommitOwed || unitCommitOwed || labelCommitOwed;
    } catch (error) {
      this.logger.error(`CAD Trust reconcile failed unexpectedly for credit block ${creditBlockId}`, error);
      return false;
    }
  }
}
