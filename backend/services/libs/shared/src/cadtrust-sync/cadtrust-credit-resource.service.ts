import { CadTrustV2Service, IssuanceCreateInput, LabelCreateInput, VerificationCreateInput } from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { Company } from "../entities/company.entity";
import { Country } from "../entities/country.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { AccountType } from "../enum/account.type.enum";
import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { RetirementUseData } from "../dto/credit.transaction.data.types";
import { CadTrustProjectResourceService, EnsureResult } from "./cadtrust-project-resource.service";
import { CadTrustRegistryProfileService } from "./cadtrust-registry-profile.service";
import { CadTrustVerificationSyncProps } from "./cadtrust-sync.enqueue.service";
import { CadTrustSyncKey, CadTrustSyncRecordService } from "./cadtrust-sync-record.service";
import { CadTrustCreditUnitMapper, CadTrustUnitParties } from "./mappers/credit-unit.mapper";
import { CadTrustUnitLabelMapper } from "./mappers/unit-label.mapper";
import { CadTrustVerificationMapper } from "./mappers/verification.mapper";

/** This registry stages exactly one "Article 6 - Authorisation" label, bootstrapped on first use. */
const ARTICLE_6_LABEL_LOCAL_ID = "ARTICLE_6_AUTHORISATION";
const ARTICLE_6_LABEL_NAME = "Article 6 Authorisation";
const ARTICLE_6_LABEL_TYPE = "Article 6 - Authorisation";

/**
 * The credit-side counterpart to `CadTrustProjectResourceService`: `ensureX` methods for
 * verification, issuance, unit, label and unit-label, sharing that service's
 * `existingSync()`/`adoptOrphanedStagedRow()` bookkeeping (composed, not duplicated — see the
 * constructor) rather than reimplementing it.
 *
 * ## `unit` is this module's first upsert resource
 *
 * Every other synced resource in this adaptor is create-once (a project, a validation record, ...).
 * A CAD Trust unit is not: the same registry `creditBlockId` gets created once
 * (`ensureUnitCreate`, from a fresh issuance) and then kept in sync via full-replace `stageUpdate`
 * for the rest of its life (`ensureUnitUpdate`, from every later transfer/retirement/
 * ITMO-authorization/split). See `credit-unit.mapper.ts`'s class doc for why one mapper method
 * builds the identical body for both.
 *
 * ## Re-reading `CreditBlocksEntity`/`CreditTransactionsEntity` here is safe
 *
 * Unlike `project_entity` (populated asynchronously and racily by an independent replicator
 * pass), these two tables are written *synchronously*, in the same transaction, by the very
 * code — `CreditTransactionsManagementService.handleTransactionRecords` — that enqueues the
 * actions this service's methods respond to. By the time any of these methods runs, that
 * transaction has already committed. So payloads carrying just a `creditBlockId` (see
 * `CadTrustSyncEnqueueService`) are safe, with no snapshot exception needed the way
 * `CadTrustProjectCreateSnapshot` was for project creation.
 */
@Injectable()
export class CadTrustCreditResourceService {
  constructor(
    @InjectRepository(CreditBlocksEntity)
    private readonly creditBlocksRepo: Repository<CreditBlocksEntity>,
    @InjectRepository(CreditTransactionsEntity)
    private readonly creditTransactionsRepo: Repository<CreditTransactionsEntity>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Country)
    private readonly countryRepo: Repository<Country>,
    @InjectRepository(CaAuthorizedEntity)
    private readonly caAuthorizedEntityRepo: Repository<CaAuthorizedEntity>,
    private readonly syncRecords: CadTrustSyncRecordService,
    private readonly projectResources: CadTrustProjectResourceService,
    private readonly verificationMapper: CadTrustVerificationMapper,
    private readonly unitMapper: CadTrustCreditUnitMapper,
    private readonly unitLabelMapper: CadTrustUnitLabelMapper,
    private readonly registryProfile: CadTrustRegistryProfileService,
    private readonly cadTrustV2Service: CadTrustV2Service,
    private readonly logger: Logger
  ) {}

  // ---------------------------------------------------------------------------------------------
  // Verification (request-path — see CadTrustVerificationSyncProps's doc)
  // ---------------------------------------------------------------------------------------------

  /**
   * Stages a verification record for one DNA-approved verification report. `localId` is
   * `${refId}-VERIFICATION-v${documentVersion}` — see `CadTrustLocalEntityType.VERIFICATION`'s doc.
   */
  async ensureVerification(props: CadTrustVerificationSyncProps): Promise<EnsureResult> {
    const { refId, documentVersion } = props;
    const localId = `${refId}-VERIFICATION-v${documentVersion}`;
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.VERIFICATION,
      localId,
      cadTrustEntityType: CadTrustResourceType.VERIFICATION,
    };

    const existing = await this.projectResources.existingSync(key, `Verification record ${localId}`);
    if ("commitOwed" in existing) {
      return existing.cadTrustId ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed } : undefined;
    }

    // Snapshot captured before anything can fail, so CadTrustReconcileHandler can re-drive a FAILED
    // verification record after the queued action that carried this snapshot is gone.
    await this.syncRecords.recordSyncProps(key, props as unknown as Record<string, unknown>);

    const cadTrustProjectId = await this.syncRecords.getCadTrustId({
      localEntityType: CadTrustLocalEntityType.PROJECT,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.PROJECT,
    });
    if (!cadTrustProjectId) {
      const message = `Project ${refId} is not yet synced to CAD Trust; cannot stage a verification record`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return undefined;
    }

    // Best-effort, optional link — a validation report isn't guaranteed to have synced. See
    // verification.mapper.ts.
    const cadTrustValidationId = await this.syncRecords.getLatestSyncedCadTrustId(
      CadTrustLocalEntityType.VALIDATION,
      refId
    );

    let input: VerificationCreateInput | undefined;
    try {
      input = await this.verificationMapper.toCreateInput(props, localId, cadTrustProjectId, cadTrustValidationId);

      if (existing.failedBefore) {
        const orphan = await this.projectResources.adoptOrphanedStagedRow(
          key,
          "verification",
          "cad_trust_verification_id",
          (change) => change.verification_id === localId
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().verification.stageCreate(input);
      const cadTrustId = staged.response.cadTrustVerificationId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust verification record ${localId} as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust verification record ${localId}`, error);
      return undefined;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Issuance (replicator-side — see enqueueCreditIssuance's doc)
  // ---------------------------------------------------------------------------------------------

  /**
   * Stages an issuance record for the project a newly-issued credit block belongs to. 1:1 with
   * `VERIFICATION` and keyed identically — reuses that record's own `localId` (via
   * `findLatestSynced`) rather than trying to reconstruct it, since `CreditBlocksEntity` carries
   * no document/activity reference back to the verification event that produced it.
   */
  async ensureIssuance(refId: string): Promise<EnsureResult> {
    const verificationRecord = await this.syncRecords.findLatestSynced(
      CadTrustLocalEntityType.VERIFICATION,
      refId
    );
    if (!verificationRecord?.cadTrustId) {
      // No sync record to key a FAILED issuance row on yet either — this is a deployment-ordering
      // problem (verification is always enqueued before the ledger write that leads here), not a
      // per-record failure. Logged, not silently dropped.
      this.logger.error(
        `No synced CAD Trust verification found for project ${refId}; cannot stage an issuance record`
      );
      return undefined;
    }

    const localId = verificationRecord.localId;
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.ISSUANCE,
      localId,
      cadTrustEntityType: CadTrustResourceType.ISSUANCE,
    };

    const existing = await this.projectResources.existingSync(key, `Issuance record ${localId}`);
    if ("commitOwed" in existing) {
      return existing.cadTrustId ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed } : undefined;
    }

    // `refId` is all ensureIssuance needs to rebuild itself — everything else is re-derived from
    // other sync records. Stored so CadTrustReconcileHandler's snapshot sweep can re-drive a FAILED
    // issuance record without parsing it back out of the composite localId.
    await this.syncRecords.recordSyncProps(key, { refId });

    const cadTrustProjectMethodologyId = await this.syncRecords.getCadTrustId({
      localEntityType: CadTrustLocalEntityType.PROJECT_METHODOLOGY,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.PROJECT_METHODOLOGY,
    });
    if (!cadTrustProjectMethodologyId) {
      const message =
        `No synced CAD Trust project-methodology link for project ${refId}; cannot stage an ` +
        `issuance record. Has the project fully synced?`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return undefined;
    }

    // Optional but recommended — see issuance.ts's NOTE on "required_for_data_activation".
    const cadTrustLocationId = await this.syncRecords.getCadTrustId({
      localEntityType: CadTrustLocalEntityType.LOCATION,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.LOCATION,
    });

    let input: IssuanceCreateInput | undefined;
    try {
      input = {
        issuanceId: localId,
        cadTrustVerificationId: verificationRecord.cadTrustId,
        cadTrustProjectMethodologyId,
      };
      if (cadTrustLocationId) {
        input.cadTrustLocationId = cadTrustLocationId;
      }

      if (existing.failedBefore) {
        const orphan = await this.projectResources.adoptOrphanedStagedRow(
          key,
          "issuance",
          "cad_trust_issuance_id",
          (change) => change.issuance_id === localId
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().issuance.stageCreate(input);
      const cadTrustId = staged.response.cadTrustIssuanceId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust issuance record ${localId} as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust issuance record ${localId}`, error);
      return undefined;
    }
  }

  /**
   * The full create-time orchestration for `CadTrustCreditIssuanceHandler`: resolve which project
   * this block belongs to, ensure its issuance record, then create its unit. One method rather
   * than three separate handler-side calls, so the handler itself never needs direct repository
   * access — it only needs `creditBlockId`, matching every other payload in this module.
   */
  async ensureCreditIssuance(creditBlockId: string): Promise<boolean> {
    const creditBlock = await this.creditBlocksRepo.findOne({ where: { creditBlockId } });
    if (!creditBlock) {
      this.logger.error(
        `Credit block ${creditBlockId} not found; cannot sync its CAD Trust issuance/unit`
      );
      return false;
    }

    const issuance = await this.ensureIssuance(creditBlock.projectRefId);
    if (!issuance) {
      // ensureIssuance already logged, and — on the paths where it could key a row — marked the
      // ISSUANCE record FAILED. The UNIT record is keyed by `creditBlockId` and lives in a
      // different reconcile pass (CREDIT_BLOCK, not SNAPSHOT — see reconcile-scope.ts), so it
      // needs its own FAILED breadcrumb here. Without it the credit-block sweep has nothing to
      // find and this block never gets its unit, even once the issuance itself reconciles.
      await this.syncRecords.markFailed(
        this.unitKey(creditBlockId),
        new Error(
          `No synced CAD Trust issuance for project ${creditBlock.projectRefId}; ` +
            `cannot stage the unit for block ${creditBlockId} yet`
        )
      );
      return false;
    }

    const unitCommitOwed = await this.ensureUnitCreate(creditBlockId, issuance.cadTrustId);
    return issuance.commitOwed || unitCommitOwed;
  }

  /**
   * Reconcile-only: re-drives the ISSUANCE record a never-created unit is still waiting on.
   * `ensureIssuance` has one early-return path — no synced VERIFICATION yet
   * (`ensureIssuance`, "No synced CAD Trust verification found") — that leaves *no* ISSUANCE row at
   * all, so `CadTrustReconcileHandler`'s snapshot sweep can never see it. The FAILED UNIT row left
   * by `ensureCreditIssuance` is this method's way in: the credit-block sweep calls it before
   * `ensureUnitUpdate` so a chain broken at the issuance link still heals in one tick.
   *
   * A no-op (returns false, touches nothing) for a unit that has already been staged, a block
   * that no longer exists, or a project whose issuance is already synced — those are handled by
   * `ensureUnitUpdate` on the same sweep exactly as before. Self-catching like every other
   * `ensureX` here.
   */
  async ensureIssuanceForUncreatedUnit(creditBlockId: string): Promise<boolean> {
    try {
      const unit = await this.syncRecords.find(this.unitKey(creditBlockId));
      if (unit?.cadTrustId) {
        // Already staged/committed once — ensureUnitUpdate's normal upsert path owns this block.
        return false;
      }

      const creditBlock = await this.creditBlocksRepo.findOne({ where: { creditBlockId } });
      if (!creditBlock) {
        // ensureUnitUpdate logs and marks this case on the same sweep; nothing to add here.
        return false;
      }

      const syncedIssuanceId = await this.syncRecords.getLatestSyncedCadTrustId(
        CadTrustLocalEntityType.ISSUANCE,
        creditBlock.projectRefId
      );
      if (syncedIssuanceId) {
        // The issuance is fine; only the unit create failed. ensureUnitUpdate re-drives that.
        return false;
      }

      const issuance = await this.ensureIssuance(creditBlock.projectRefId);
      return issuance?.commitOwed ?? false;
    } catch (error) {
      this.logger.error(
        `Failed to re-drive the CAD Trust issuance for uncreated unit ${creditBlockId}`,
        error
      );
      return false;
    }
  }

  /**
   * Creates the unit for one newly-issued credit block. Always a create — `issueCredits()` writes
   * one brand-new `CreditBlocksEntity` row per vintage, so a `creditBlockId` reaching here has
   * never been synced before (re-delivery aside, handled by the usual `existingSync()` check).
   */
  async ensureUnitCreate(creditBlockId: string, cadTrustIssuanceId: string): Promise<boolean> {
    const key = this.unitKey(creditBlockId);

    const existing = await this.projectResources.existingSync(key, `CAD Trust unit ${creditBlockId}`);
    if ("commitOwed" in existing) {
      return existing.commitOwed;
    }

    const creditBlock = await this.creditBlocksRepo.findOne({ where: { creditBlockId } });
    if (!creditBlock) {
      const message = `Credit block ${creditBlockId} not found; cannot stage its CAD Trust unit`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return false;
    }

    return this.stageUnit(key, creditBlock, cadTrustIssuanceId, existing.failedBefore, undefined);
  }

  // ---------------------------------------------------------------------------------------------
  // Unit update (replicator-side — transfer / retirement / ITMO authorization / split)
  // ---------------------------------------------------------------------------------------------

  /**
   * Full-replace update to an existing unit, or — for the newly-materialized side of a split —
   * its first-ever create. Unlike every other `ensureX` in this adaptor, `unit` is an upsert
   * resource: a `COMMITTED` sync record here means "update it," not "skip it." See the class doc.
   */
  async ensureUnitUpdate(creditBlockId: string): Promise<boolean> {
    const key = this.unitKey(creditBlockId);

    const creditBlock = await this.creditBlocksRepo.findOne({ where: { creditBlockId } });
    if (!creditBlock) {
      const message = `Credit block ${creditBlockId} not found; cannot sync its CAD Trust unit`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return false;
    }

    const existing = await this.syncRecords.find(key);

    if (existing?.syncStatus === CadTrustSyncStatus.STAGED && existing.cadTrustId) {
      // Staged on a previous run whose commit never went through — don't re-stage, just retry
      // the commit. Same three-way logic every other ensureX in this module uses, via
      // existingSync() — reimplemented directly here rather than reusing that helper, because its
      // COMMITTED branch means "skip, nothing to do" everywhere else, and here it means "stage an
      // update" instead (see the class doc: unit is this module's first upsert resource).
      this.logger.log(
        `CAD Trust unit ${creditBlockId} is already staged but not yet committed; retrying the commit.`
      );
      return true;
    }

    if (existing?.syncStatus === CadTrustSyncStatus.COMMITTED && existing.cadTrustId) {
      // A real upsert: stage a full-replace update, reusing the cadTrustIssuanceId this unit was
      // originally created with (stored in its own payload — the one place in this adaptor that
      // reads `payload` back for something other than diagnostics, deliberately: it is the only
      // reliable source for "which issuance did this specific unit's create use," since
      // re-resolving "the project's latest issuance" could silently point an older block's update
      // at the wrong issuance once a project has had more than one monitoring cycle).
      const cadTrustIssuanceId = existing.payload?.cadTrustIssuanceId as string | undefined;
      if (!cadTrustIssuanceId) {
        const message = `CAD Trust unit ${creditBlockId}'s original payload has no cadTrustIssuanceId to reuse on update`;
        this.logger.error(message);
        await this.syncRecords.markFailed(key, new Error(message));
        return false;
      }
      return this.stageUnit(key, creditBlock, cadTrustIssuanceId, false, existing.cadTrustId);
    }

    // Never synced (or FAILED) — this is either a genuinely new split-off block, or a retry of a
    // create that failed earlier. Attribute it to the project's most recently synced issuance —
    // CAD Trust's issuance record carries almost no per-unit-binding semantics (see
    // credit-unit.mapper.ts), and this registry doesn't store which historical issuance event a
    // split fragment "really" descends from either, so this is a deliberate simplification, not
    // an attempt at precise lineage tracking.
    const cadTrustIssuanceId = await this.syncRecords.getLatestSyncedCadTrustId(
      CadTrustLocalEntityType.ISSUANCE,
      creditBlock.projectRefId
    );
    if (!cadTrustIssuanceId) {
      const message = `No synced CAD Trust issuance found for project ${creditBlock.projectRefId}; cannot create a unit for block ${creditBlockId}`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return false;
    }

    const failedBefore = existing?.syncStatus === CadTrustSyncStatus.FAILED;
    return this.stageUnit(key, creditBlock, cadTrustIssuanceId, failedBefore, undefined);
  }

  // ---------------------------------------------------------------------------------------------
  // Label / unit-label (ITMO authorization)
  // ---------------------------------------------------------------------------------------------

  /**
   * The orchestration `CadTrustUnitUpdateHandler` needs for the ITMO-authorization case: if this
   * block has been ITMO-authorized (`itmoAuthorizationRecord` set), ensure the singleton Article 6
   * label and link this unit to it. A no-op — not a failure — for every other unit-update event
   * (transfer, retirement, split-retained), and idempotent for a re-delivered or already-linked
   * authorization.
   *
   * Requires the unit's own CAD Trust id, which only exists once `ensureUnitUpdate`/
   * `ensureUnitCreate` has actually staged or committed it — callers must run this after that, not
   * before.
   */
  async ensureItmoLabelIfAuthorized(creditBlockId: string): Promise<boolean> {
    const creditBlock = await this.creditBlocksRepo.findOne({ where: { creditBlockId } });
    if (!creditBlock?.itmoAuthorizationRecord) {
      return false;
    }

    const cadTrustUnitId = await this.syncRecords.getCadTrustId(this.unitKey(creditBlockId));
    if (!cadTrustUnitId) {
      // ensureUnitUpdate/ensureUnitCreate already logged and marked this FAILED if it couldn't
      // resolve a unit id — nothing new to report here.
      return false;
    }

    const label = await this.ensureLabel();
    if (!label) {
      return false;
    }

    const linked = await this.ensureUnitLabel(creditBlockId, cadTrustUnitId, label.cadTrustId);
    return label.commitOwed || linked;
  }

  /** This registry's one "Article 6 - Authorisation" label — bootstrapped once, on first use. */
  async ensureLabel(): Promise<EnsureResult> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.LABEL,
      localId: ARTICLE_6_LABEL_LOCAL_ID,
      cadTrustEntityType: CadTrustResourceType.LABEL,
    };

    const existing = await this.projectResources.existingSync(key, "CAD Trust Article 6 authorisation label");
    if ("commitOwed" in existing) {
      return existing.cadTrustId ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed } : undefined;
    }

    let input: LabelCreateInput | undefined;
    try {
      input = { labelName: ARTICLE_6_LABEL_NAME, labelType: ARTICLE_6_LABEL_TYPE };

      if (existing.failedBefore) {
        const orphan = await this.projectResources.adoptOrphanedStagedRow(
          key,
          "label",
          "cad_trust_label_id",
          (change) => change.label_type === ARTICLE_6_LABEL_TYPE
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().label.stageCreate(input);
      const cadTrustId = staged.response.cadTrustLabelId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust Article 6 authorisation label as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error("Failed to stage the CAD Trust Article 6 authorisation label", error);
      return undefined;
    }
  }

  /** Links one ITMO-authorized unit to the singleton Article 6 label. */
  async ensureUnitLabel(creditBlockId: string, cadTrustUnitId: string, cadTrustLabelId: string): Promise<boolean> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.UNIT_LABEL,
      localId: creditBlockId,
      cadTrustEntityType: CadTrustResourceType.UNIT_LABEL,
    };

    const existing = await this.projectResources.existingSync(key, `CAD Trust unit-label link for ${creditBlockId}`);
    if ("commitOwed" in existing) {
      return existing.commitOwed;
    }

    const today = new Date().toISOString().split("T")[0];
    const input = this.unitLabelMapper.toCreateInput(cadTrustLabelId, cadTrustUnitId, today);

    try {
      if (existing.failedBefore) {
        const orphan = await this.projectResources.adoptOrphanedStagedRow(
          key,
          "unitLabel",
          "cad_trust_unit_label_id",
          (change) => change.cad_trust_unit_id === cadTrustUnitId && change.cad_trust_label_id === cadTrustLabelId
        );
        if (orphan) {
          return true;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().unitLabel.stageCreate(input);
      const cadTrustId = staged.response.cadTrustUnitLabelId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Linked CAD Trust unit ${cadTrustUnitId} to the Article 6 label as ${cadTrustId}`);
      return true;
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to link CAD Trust unit for block ${creditBlockId} to the Article 6 label`, error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Shared helpers
  // ---------------------------------------------------------------------------------------------

  private unitKey(creditBlockId: string): CadTrustSyncKey {
    return {
      localEntityType: CadTrustLocalEntityType.UNIT,
      localId: creditBlockId,
      cadTrustEntityType: CadTrustResourceType.UNIT,
    };
  }

  /**
   * Builds the unit body and stages either a create or an update, depending on whether
   * `existingCadTrustId` was supplied. Shared by `ensureUnitCreate` and `ensureUnitUpdate`, since
   * both ultimately do the same thing: build the current full unit shape from `creditBlock` and
   * send it.
   */
  private async stageUnit(
    key: CadTrustSyncKey,
    creditBlock: CreditBlocksEntity,
    cadTrustIssuanceId: string,
    failedBefore: boolean,
    existingCadTrustId: string | undefined
  ): Promise<boolean> {
    let input: Awaited<ReturnType<CadTrustCreditUnitMapper["toUnitInput"]>> | undefined;
    try {
      const latestRetirement =
        creditBlock.accountType !== AccountType.HOLDING
          ? await this.resolveLatestRetirement(creditBlock.creditBlockId)
          : undefined;
      const parties = await this.resolveUnitParties(creditBlock, latestRetirement);

      // cadTrustIssuanceId travels as part of `input` itself (the mapper sets it directly on the
      // UnitCreateInput/UnitUpdateInput body), so the stored payload below needs no extra merging.
      input = await this.unitMapper.toUnitInput(creditBlock, cadTrustIssuanceId, parties, latestRetirement);

      if (!existingCadTrustId && failedBefore) {
        const orphan = await this.projectResources.adoptOrphanedStagedRow(
          key,
          "unit",
          "cad_trust_unit_id",
          (change) => change.unit_serial_id === creditBlock.serialNumber
        );
        if (orphan) {
          return true;
        }
      }

      const client = this.cadTrustV2Service.getClient();
      if (existingCadTrustId) {
        await client.unit.stageUpdate(existingCadTrustId, input);
        await this.syncRecords.markStaged(
          key,
          { cadTrustId: existingCadTrustId },
          input as unknown as Record<string, unknown>
        );
        this.logger.log(`Staged CAD Trust unit update for block ${creditBlock.creditBlockId}`);
      } else {
        const staged = await client.unit.stageCreate(input);
        const cadTrustId = staged.response.cadTrustUnitId ?? staged.response.uuid;
        await this.syncRecords.markStaged(
          key,
          { cadTrustId, stagingUuid: staged.response.uuid },
          input as unknown as Record<string, unknown>
        );
        this.logger.log(`Staged CAD Trust unit for block ${creditBlock.creditBlockId} as ${cadTrustId}`);
      }
      return true;
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust unit for block ${creditBlock.creditBlockId}`, error);
      return false;
    }
  }

  /**
   * The `unitCurrentOwner` / `unitRetirementBeneficiary` / `unitRetirementBeneficiaryId` trio for
   * a unit body, keyed on the latest retirement's `subType` — the only field that tells a domestic
   * MO NDC use from an international ITMO first transfer (see `credit.transaction.sub.types.enum.ts`;
   * `accountType` collapses both into `RETIREMENT_NDC`).
   *
   * A retirement parks `creditBlock.ownerCompanyId` at the `0` sentinel and moves the real former
   * owner into `previousOwnerCompanyId` — the "last real holder" lookup below uses whichever field
   * names a company. `currentOwner` then follows the credit's *destination*; `beneficiaryId` is
   * always an externally-resolvable id (an ISO alpha-2 country code, a tax id, or an AEF
   * `CaAuthorizedEntity.entityIdentifier`), never a bare internal UUID.
   *
   *  - held / retirement row with no `subType` (legacy): owner = last real holder; beneficiary
   *    fields fall back to the pre-change behaviour (straight off `data`).
   *  - `USE_TOWARDS_NDC` (MO, domestic): host Party.
   *  - `FIRST_TRANSFER_TOWARDS_NDC` (ITMO): the acquiring Party (`data.country`).
   *  - `FIRST_TRANSFER_FOR_OIMP` (ITMO): the authorized entity (`data.entityName` /
   *    `CaAuthorizedEntity.entityIdentifier`).
   *  - `VOLUNTARY_CANCELLATION`: the retiring company (no ownership change occurred).
   *  - `OMGE_CANCELLATION`: the retiring company as owner, but no beneficiary — OMGE benefits the
   *    atmosphere, not a party, and `unitStatusReason` already says so.
   */
  private async resolveUnitParties(
    creditBlock: CreditBlocksEntity,
    latestRetirement: CreditTransactionsEntity | undefined
  ): Promise<CadTrustUnitParties> {
    const heldCompanyId =
      creditBlock.accountType === AccountType.HOLDING
        ? creditBlock.ownerCompanyId
        : creditBlock.previousOwnerCompanyId;
    const heldCompany = heldCompanyId
      ? await this.companyRepo.findOne({ where: { companyId: heldCompanyId } })
      : undefined;
    const heldCompanyName = heldCompany?.name;

    const data = (latestRetirement?.data ?? {}) as RetirementUseData;

    if (creditBlock.accountType === AccountType.HOLDING || !latestRetirement?.subType) {
      return {
        currentOwner: heldCompanyName,
        beneficiary: data.entityName,
        beneficiaryId: data.authorizedEntityId,
      };
    }

    switch (latestRetirement.subType) {
      case CreditTransactionSubTypesEnum.USE_TOWARDS_NDC: {
        const code = this.registryProfile.getHostCountryCode();
        // Host name from the same config `location.mapper.ts` uses for `locationCountry`, with the
        // Country table as a fallback if it is unset.
        const name =
          this.registryProfile.getHostCountryName() || (await this.countryName(code)) || code;
        return { currentOwner: name, beneficiary: name, beneficiaryId: code };
      }
      case CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC: {
        const code = data.country;
        const name = code ? (await this.countryName(code)) ?? code : undefined;
        return { currentOwner: name, beneficiary: name, beneficiaryId: code };
      }
      case CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP: {
        const externalId = data.authorizedEntityId
          ? await this.authorizedEntityIdentifier(data.authorizedEntityId)
          : undefined;
        return {
          currentOwner: data.entityName,
          beneficiary: data.entityName,
          beneficiaryId: externalId ?? data.authorizedEntityId,
        };
      }
      case CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION:
        return {
          currentOwner: heldCompanyName,
          beneficiary: heldCompanyName,
          beneficiaryId: heldCompany?.taxId ?? undefined,
        };
      case CreditTransactionSubTypesEnum.OMGE_CANCELLATION:
      default:
        return { currentOwner: heldCompanyName };
    }
  }

  /** ISO alpha-2 -> country display name; undefined (caller falls back to the raw code) on a miss. */
  private async countryName(alpha2: string | undefined): Promise<string | undefined> {
    if (!alpha2) {
      return undefined;
    }
    const row = await this.countryRepo.findOne({ where: { alpha2 } });
    return row?.name ?? undefined;
  }

  /** The AEF-modelled external identifier for an authorized entity, if it carries one. */
  private async authorizedEntityIdentifier(id: string): Promise<string | undefined> {
    const row = await this.caAuthorizedEntityRepo.findOne({ where: { id } });
    return row?.entityIdentifier ?? undefined;
  }

  /** The most recent completed retirement of this block, for retirement-detail/beneficiary fields. */
  private async resolveLatestRetirement(creditBlockId: string): Promise<CreditTransactionsEntity | undefined> {
    const record = await this.creditTransactionsRepo.findOne({
      where: {
        creditBlockId,
        type: CreditTransactionTypesEnum.RETIRED,
        status: CreditTransactionStatusEnum.COMPLETED,
      },
      order: { createTime: "DESC" },
    });
    return record ?? undefined;
  }
}
