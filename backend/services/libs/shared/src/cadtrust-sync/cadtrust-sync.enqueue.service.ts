import { Injectable, Logger } from "@nestjs/common";

import { AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";

/** Queue payload for the project handlers. */
export interface CadTrustProjectSyncProps {
  refId: string;
  /** Which lifecycle transition triggered this, for logging and future filtering. */
  txType?: TxType;
}

/**
 * Queue payload for `CADTV2ProjectCreate` — a snapshot, not just an id.
 *
 * This is the one deliberate exception to "payloads are identifiers, not
 * entities" below, and it exists for a specific reason: `project_entity` (the
 * table a create handler would otherwise re-read) is populated asynchronously
 * by the ledger replicator, which polls independently of — and with no
 * ordering guarantee relative to — the async-operations consumer that runs
 * this handler. Re-reading it at sync time is a race that can silently drop
 * the sync entirely, not a simplification. See
 * `handlers/project-create.handler.ts` for the full reasoning and why it's
 * safe specifically for a *create* snapshot.
 *
 * Every field is exactly what `CadTrustProjectMapper.toCreateInput` needs, and
 * every field is already set on `ProjectEntity` well before the ledger write
 * that triggers this enqueue — see `DocumentManagementService.addDocument()`.
 */
export interface CadTrustProjectCreateSnapshot {
  refId: string;
  title: string;
  sector: string;
  sectoralScope: string;
  projectProposalStage: ProjectProposalStage;
  createTime: number;
  updateTime?: number;
  /**
   * The owning PD company's id — just an identifier, not a snapshot. `Company`
   * (unlike `project_entity`) is never written by the ledger replicator, so a
   * live `companyRepo.findOne({ companyId })` read at sync time is safe; only
   * the id itself needs to ride the payload.
   */
  companyId: number;
}

/**
 * Queue payload for `CADTV2ValidationCreate` — a snapshot, not just an id, and for a different
 * reason than `CadTrustProjectCreateSnapshot`'s: the validating body's identity
 * (`certifiedByUserDetails.Organisation.name` / `vrSubmittedIC.Organisation.name` in
 * `DocumentManagementService`) is resolved via `document.lastActionByUserId`, which is correct read
 * synchronously in-request (the current actor, before this transition's own write) but would be a
 * race if re-derived later inside the async handler — `document_entity.status` and
 * `.lastActionByUserId` are themselves written asynchronously by the ledger replicator
 * (`process.event.service.ts`'s call into `modifyDocumentEntity`), the same lag class as
 * `project_entity`. `document_entity.content`/`.type`/`.version`/`.createdTime` ARE safe to re-read
 * anytime (written synchronously, once, at document creation) — but rather than split the read
 * across two different safety classes, every field travels on the payload together.
 */
export interface CadTrustValidationSyncProps {
  refId: string;
  /** Which document this validation record is for — drives the sync-record localId and the CAD Trust validationId. */
  documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT | DocumentTypeEnum.VALIDATION;
  documentVersion: number;
  /**
   * The validating Independent Certifier's company name. Carried for local context/audit
   * (visible on the stored `cadtrust_sync_record.payload`) only — `CadTrustValidationMapper` does
   * NOT send this to CAD Trust's `validationBody` field; that field is always the configured
   * default instead, since this name is never a match against CAD Trust's closed `validation_body`
   * picklist. See `CadTrustValidationMapper`'s class doc.
   */
  validationBodyName: string;
  /** ISO date. From the PDD's/validation report's crediting-period fields, when present. */
  creditPeriodStartDate?: string;
  creditPeriodEndDate?: string;
  /** ISO date — the DNA-approval instant, captured request-side. No real user-entered validation date exists in either document. */
  validationDate: string;
}

/**
 * Queue payload for `CADTV2VerificationCreate` — a snapshot, not just an id, for the same reason
 * `CadTrustValidationSyncProps` carries one: the verifying body's identity is resolved via
 * `document.lastActionByUserId` in-request (correct, current) but would race the ledger
 * replicator's own asynchronous write to that same column if re-derived later. See
 * `CadTrustValidationSyncProps`'s doc for the full reasoning — this is the identical pattern,
 * applied to `performVerificationAction` instead of the PDD/validation-report approval handlers.
 */
export interface CadTrustVerificationSyncProps {
  refId: string;
  documentVersion: number;
  /**
   * The approving DNA's/verifying body's name. Carried for local context/audit (visible on the
   * stored `cadtrust_sync_record.payload`) only — `CadTrustVerificationMapper` does NOT send this
   * to CAD Trust's `verificationBody` field; that field is always the configured default instead,
   * for the same reason `validationBodyName` never reaches `validationBody`. See
   * `verification.mapper.ts`'s class doc.
   */
  verificationBodyName: string;
  /** ISO dates, when the monitoring/verification report structurally captures a period — both optional on CAD Trust's side. */
  verificationStartDate?: string;
  verificationEndDate?: string;
}

/**
 * Producer-side helper: the only thing domain services call.
 *
 * Two deliberate properties:
 *
 * 1. **Payloads are identifiers, not entities** — with one documented
 *    exception, `CadTrustProjectCreateSnapshot` above. Everywhere else, the
 *    handler re-reads current state, so a queued action can never publish a
 *    snapshot that was already stale when it was enqueued. (The legacy v1
 *    CADT actions enqueue whole `programme` objects unconditionally and have
 *    exactly that problem — the exception here is narrower and justified, not
 *    a reversion to that pattern.)
 *
 * 2. **Enqueueing never fails the caller.** These are called from inside the
 *    request path of a project submission. A CAD Trust bookkeeping problem must
 *    not turn into a 500 for someone filing an INF, so every call is wrapped.
 */
@Injectable()
export class CadTrustSyncEnqueueService {
  constructor(
    private readonly asyncOperationsInterface: AsyncOperationsInterface,
    private readonly logger: Logger
  ) {}

  /**
   * Stages a project-creation snapshot captured at the moment it's guaranteed
   * complete — before the ledger write, not after — because `project_entity`
   * cannot be trusted to exist yet by the time the handler runs. See
   * `CadTrustProjectCreateSnapshot`.
   */
  async enqueueProjectCreate(project: CadTrustProjectCreateSnapshot): Promise<void> {
    // Destructured into an explicit, minimal shape rather than forwarding
    // `project` as-is, so the wire payload can't silently grow if the entity
    // gains fields later.
    const {
      refId,
      title,
      sector,
      sectoralScope,
      projectProposalStage,
      createTime,
      updateTime,
      companyId,
    } = project;
    await this.enqueue(AsyncActionType.CADTV2ProjectCreate, {
      refId,
      title,
      sector,
      sectoralScope,
      projectProposalStage,
      createTime,
      updateTime,
      companyId,
    });
  }

  async enqueueProjectUpdate(refId: string, txType?: TxType): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2ProjectUpdate, { refId, txType });
  }

  /**
   * Stages a CAD Trust validation record for a DNA-approved PDD or validation report. See
   * `CadTrustValidationSyncProps` for why this carries a fuller snapshot than most payloads here.
   */
  async enqueueValidation(props: CadTrustValidationSyncProps): Promise<void> {
    const {
      refId,
      documentType,
      documentVersion,
      validationBodyName,
      creditPeriodStartDate,
      creditPeriodEndDate,
      validationDate,
    } = props;
    await this.enqueue(AsyncActionType.CADTV2ValidationCreate, {
      refId,
      documentType,
      documentVersion,
      validationBodyName,
      creditPeriodStartDate,
      creditPeriodEndDate,
      validationDate,
    });
  }

  /**
   * Asks for a staging commit via the queue. Currently unused: every business handler in this
   * module (bootstrap, project-create, project-update, validation-create) calls
   * `CadTrustCommitHandler.handle()` directly in-process instead, since this registry's sync
   * volume (roughly one event per day) leaves no real batching benefit to protect by queueing.
   * Kept — and the dispatcher still routes `CADTV2Commit` to `CadTrustCommitHandler` — as a valid
   * path for a future caller that does want commits driven off the queue instead.
   */
  async enqueueCommit(): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2Commit, {});
  }

  /**
   * Verifies the CAD Trust home organization and stages the registry's program
   * and methodology if they are not already synced. Called once per national-api
   * start (see main.ts) — the handler is idempotent, so a repeat enqueue on
   * every restart just costs one no-op row once bootstrap has succeeded.
   */
  async enqueueBootstrap(): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2Bootstrap, {});
  }

  /**
   * Retries a staged-but-uncommitted batch and re-drives any project with a FAILED sync record.
   * Called once per national-api start (see main.ts), alongside `enqueueBootstrap()` — the handler
   * is idempotent and cheap when there is nothing to reconcile, so a repeat enqueue on every
   * restart just costs one no-op row on a healthy deployment.
   */
  async enqueueReconcile(): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2Reconcile, {});
  }

  /**
   * Stages a CAD Trust verification record for a DNA-approved verification report — the
   * request-path half of credit-issuance sync. See `CadTrustVerificationSyncProps` for why this
   * carries a fuller snapshot, and `cadtrust-sync/README.md`'s "Two different producer-side
   * hooks" for why verification is enqueued here while issuance/unit are enqueued from the
   * replicator instead.
   */
  async enqueueVerification(props: CadTrustVerificationSyncProps): Promise<void> {
    const { refId, documentVersion, verificationBodyName, verificationStartDate, verificationEndDate } =
      props;
    await this.enqueue(AsyncActionType.CADTV2VerificationCreate, {
      refId,
      documentVersion,
      verificationBodyName,
      verificationStartDate,
      verificationEndDate,
    });
  }

  /**
   * Ensures the verification + issuance records for one newly-issued credit block, then creates
   * its unit. Enqueued from `CreditTransactionsManagementService.handleTransactionRecords`'s
   * `ISSUE` branch — one call per vintage block (`issueCredits()` writes one `CreditBlocksEntity`
   * row per vintage, each an independent ledger/replicator event), not one per DNA-approval
   * event. `creditBlockId` alone is enough: `CreditBlocksEntity` is written synchronously by the
   * same replicator code that enqueues this, so re-reading it later is safe — see
   * `cadtrust-credit-resource.service.ts`'s class doc.
   */
  async enqueueCreditIssuance(creditBlockId: string): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2CreditIssuance, { creditBlockId });
  }

  /**
   * Full-replace update to an existing unit's owner/status/amount. Enqueued from
   * `handleTransactionRecords` for a whole-block transfer, a `COMPLETED` retirement, a
   * `COMPLETED` ITMO authorization, and the retained/shrunken side of any partial split
   * (`TxType.CREDIT_BLOCK_SPLIT`) — see `cadtrust-sync/README.md`'s event-by-event design.
   */
  async enqueueUnitUpdate(creditBlockId: string): Promise<void> {
    await this.enqueue(AsyncActionType.CADTV2UnitUpdate, { creditBlockId });
  }

  private async enqueue(actionType: AsyncActionType, actionProps: any): Promise<void> {
    try {
      // AddAction drops the action itself when cadTrustV2.enable is off.
      await this.asyncOperationsInterface.AddAction({ actionType, actionProps });
    } catch (error) {
      this.logger.error(
        `Failed to enqueue CAD Trust sync action ${AsyncActionType[actionType]} for ${JSON.stringify(
          actionProps
        )}`,
        error
      );
    }
  }
}
