import {
  CadTrustV2Service,
  LocationCreateInput,
  ProjectCreateInput,
  ProjectMethodologyCreateInput,
  StakeholderCreateInput,
  StakeholderProjectCreateInput,
  ValidationCreateInput,
} from "@app/cadtrust";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Company } from "../entities/company.entity";
import { DocumentEntity } from "../entities/document.entity";
import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import {
  CadTrustProjectCreateSnapshot,
  CadTrustValidationSyncProps,
} from "./cadtrust-sync.enqueue.service";
import { toCadTrustIsoDate } from "./iso-date";
import { CadTrustSyncKey, CadTrustSyncRecordService } from "./cadtrust-sync-record.service";
import { CadTrustLocationMapper } from "./mappers/location.mapper";
import { CadTrustProjectMapper } from "./mappers/project.mapper";
import { CadTrustStakeholderMapper } from "./mappers/stakeholder.mapper";
import { CadTrustValidationMapper } from "./mappers/validation.mapper";

/** `undefined` means "nothing synced yet, stage now"; otherwise the resolved CAD Trust id. */
export type EnsureResult = { cadTrustId: string; commitOwed: boolean } | undefined;

/**
 * Shared "ensure this local record exists on CAD Trust" logic for a project and everything
 * that hangs off it (stakeholder, project-methodology link, stakeholder-project link,
 * location), plus the generic staged/committed/orphan bookkeeping those five all share.
 *
 * Originally lived only inside `CadTrustProjectCreateHandler`. Extracted so
 * `CadTrustProjectUpdateHandler` can re-drive a child that failed at create time (see its
 * class doc), and so `CadTrustValidationCreateHandler` can reuse `existingSync()` /
 * `adoptOrphanedStagedRow()` instead of the STAGED/COMMITTED-collapsing `isAlreadySynced()`
 * check it used to rely on. No behaviour changed in the move — every doc comment below is
 * carried over from where the logic used to live.
 */
@Injectable()
export class CadTrustProjectResourceService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepo: Repository<DocumentEntity>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly syncRecords: CadTrustSyncRecordService,
    private readonly projectMapper: CadTrustProjectMapper,
    private readonly stakeholderMapper: CadTrustStakeholderMapper,
    private readonly locationMapper: CadTrustLocationMapper,
    private readonly validationMapper: CadTrustValidationMapper,
    private readonly cadTrustV2Service: CadTrustV2Service,
    private readonly logger: Logger
  ) {}

  /**
   * The status check every `ensureX` method (and now `CadTrustValidationCreateHandler`)
   * shares. Returns whether an existing sync record means the caller can skip staging —
   * `undefined` means stage now, and callers should check `failedBefore` first (see
   * `adoptOrphanedStagedRow`) before doing so.
   *
   * `isAlreadySynced()` can't be used for this: it collapses STAGED and COMMITTED into one
   * `true`, which is exactly what let a resource staged-but-never-committed by a prior run
   * suppress the inline commit forever — the bug that stuck the bootstrap commit, fixed the
   * same way in `bootstrap.handler.ts`.
   */
  async existingSync(
    key: CadTrustSyncKey,
    label: string
  ): Promise<{ cadTrustId?: string; commitOwed: boolean } | { failedBefore: boolean }> {
    const existing = await this.syncRecords.find(key);
    if (existing?.syncStatus === CadTrustSyncStatus.COMMITTED) {
      return { cadTrustId: existing.cadTrustId, commitOwed: false };
    }
    if (existing?.syncStatus === CadTrustSyncStatus.STAGED) {
      // Staged on a previous run whose commit never went through. Don't re-stage — that would
      // duplicate the record on the node — just signal that a commit is still owed.
      this.logger.log(`${label} is already staged but not yet committed; retrying the commit.`);
      return { cadTrustId: existing.cadTrustId, commitOwed: true };
    }
    return { failedBefore: existing?.syncStatus === CadTrustSyncStatus.FAILED };
  }

  /**
   * A staging POST that fails with a 504/timeout is ambiguous: the origin may have created the
   * row before it stopped answering in time (seen live 2026-08-24 on `/stakeholder` and
   * `/project` — Cloudflare 504s from an overloaded origin). Staging POSTs are single-attempt by
   * design (see `@app/cadtrust`'s `http/retry.ts` — a blind retry after an ambiguous mutation
   * failure risks double-staging), so an ambiguous failure surfaces here, on the next delivery,
   * as a FAILED sync record. Re-staging blindly in that state would duplicate the row on the
   * node, and a later commit would then publish it twice. Look for the orphan first and adopt
   * it instead of creating a new one.
   *
   * `type: 'staged'` on the list query is deliberately NOT used to narrow this search — that
   * filter's semantics carry the same v1/v2 ambiguity documented on `StagingV2PendingResponse`
   * (see `libs/cadtrust/README.md` "Known gaps" §17), confirmed to disagree with itself across
   * endpoints on this exact node. Filtering on the `StagingRecord` booleans directly is
   * unambiguous: `committed` and `failed_commit` mean exactly what they say.
   */
  async adoptOrphanedStagedRow(
    key: CadTrustSyncKey,
    table: string,
    primaryKeyColumn: string,
    matches: (change: Record<string, unknown>) => boolean
  ): Promise<{ cadTrustId: string; commitOwed: true } | undefined> {
    try {
      const client = this.cadTrustV2Service.getClient();
      for await (const record of client.staging.listAll({ table, limit: 100 })) {
        if (record.committed || record.failed_commit) {
          continue;
        }
        const change = record.diff?.change?.[0] ?? {};
        if (!matches(change)) {
          continue;
        }

        const cadTrustId = (change[primaryKeyColumn] as string | undefined) ?? record.uuid;
        await this.syncRecords.markStaged(key, { cadTrustId, stagingUuid: record.uuid }, change);
        this.logger.warn(
          `Adopted an orphaned CAD Trust staging row on "${table}" (uuid ${record.uuid}) left over ` +
            `from a prior ambiguous failure, instead of re-staging a duplicate.`
        );
        return { cadTrustId, commitOwed: true };
      }
      return undefined;
    } catch (error) {
      this.logger.error(`Failed to check for an orphaned CAD Trust staging row on "${table}"`, error);
      return undefined;
    }
  }

  /**
   * Stages the owning PD company as a CAD Trust stakeholder, once per company
   * — reused across every project that company creates. `Company`, unlike
   * `project_entity`, is read live via the repository: a PD company is
   * registered long before any project of theirs is created, and `Company`
   * rows are written directly and synchronously (`UserService.create`) — the
   * ledger replicator only ever UPDATEs balance/counter fields on an
   * already-existing row, never INSERTs one. There is no replicator-lag race
   * here, unlike `ensureProject` below.
   */
  async ensureStakeholder(companyId: number): Promise<EnsureResult> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.STAKEHOLDER,
      localId: String(companyId),
      cadTrustEntityType: CadTrustResourceType.STAKEHOLDER,
    };

    const existing = await this.existingSync(key, `CAD Trust stakeholder for company ${companyId}`);
    if ("commitOwed" in existing) {
      return existing.cadTrustId ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed } : undefined;
    }

    let input: StakeholderCreateInput | undefined;
    try {
      const company = await this.companyRepo.findOne({ where: { companyId } });
      if (!company) {
        const message = `Company ${companyId} not found; cannot stage CAD Trust stakeholder`;
        this.logger.error(message);
        await this.syncRecords.markFailed(key, new Error(message));
        return undefined;
      }

      input = await this.stakeholderMapper.toCreateInput(company);

      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "stakeholder",
          "cad_trust_stakeholder_id",
          (change) => change.stakeholder_name === input?.stakeholderName
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().stakeholder.stageCreate(input);
      const cadTrustId = staged.response.cadTrustStakeholderId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust stakeholder for company ${companyId} as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust stakeholder for company ${companyId}`, error);
      return undefined;
    }
  }

  /**
   * Stages the project itself, linking it to the bootstrapped program when one is synced.
   *
   * Deliberately does not read `project_entity` — `props` already carries everything
   * `CadTrustProjectMapper` needs (see `CadTrustProjectCreateSnapshot`). `project_entity` is
   * the operational-DB table populated asynchronously by the ledger replicator, which polls
   * independently of (and with no ordering guarantee relative to) the async-operations
   * consumer that runs this. A prior version of this code read it directly and, when the
   * replicator hadn't caught up yet, logged an error and returned WITHOUT calling
   * `markFailed` — so nothing recorded the miss and the project silently never synced. Do
   * not reintroduce a `project_entity` read here to "simplify" this.
   */
  async ensureProject(
    refId: string,
    props: CadTrustProjectCreateSnapshot,
    infContent: any
  ): Promise<EnsureResult> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.PROJECT,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.PROJECT,
    };

    // The async queue is at-least-once, and the database consumer re-runs the
    // whole action if anything after it in the same pass fails. Re-delivery is
    // routine, so this check is what stops a duplicate project being staged.
    const existing = await this.existingSync(key, `Project ${refId}`);
    if ("commitOwed" in existing) {
      this.logger.log(`Project ${refId} is already synced to CAD Trust; skipping`);
      return existing.cadTrustId ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed } : undefined;
    }

    let input: ProjectCreateInput | undefined;
    try {
      input = await this.projectMapper.toCreateInput(props, infContent);

      const programCadTrustId = await this.syncRecords.getSyncedCadTrustId(
        CadTrustLocalEntityType.PROGRAM,
        CadTrustResourceType.PROGRAM
      );
      if (programCadTrustId) {
        input.cadTrustProgramId = programCadTrustId;
      }

      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "project",
          "cad_trust_project_id",
          (change) => change.project_id === refId
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().project.stageCreate(input);
      // The guide documents cadTrustProjectId on the create response but does
      // not guarantee it on every resource, so fall back to uuid.
      const cadTrustId = staged.response.cadTrustProjectId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged project ${refId} to CAD Trust as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage project ${refId} to CAD Trust`, error);
      return undefined;
    }
  }

  /**
   * Links the project to this registry's one bootstrapped methodology. Marked
   * FAILED (visible, diagnosable) rather than silently skipped when bootstrap
   * hasn't run yet — that's a deployment-configuration problem worth surfacing.
   */
  async ensureProjectMethodology(
    refId: string,
    projectCadTrustId: string,
    projectCreateTime: number
  ): Promise<boolean> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.PROJECT_METHODOLOGY,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.PROJECT_METHODOLOGY,
    };

    const existing = await this.existingSync(key, `CAD Trust methodology link for project ${refId}`);
    if ("commitOwed" in existing) {
      return existing.commitOwed;
    }

    let input: ProjectMethodologyCreateInput | undefined;
    try {
      const methodologyCadTrustId = await this.syncRecords.getSyncedCadTrustId(
        CadTrustLocalEntityType.METHODOLOGY,
        CadTrustResourceType.METHODOLOGY
      );
      if (!methodologyCadTrustId) {
        const message =
          `No synced CAD Trust methodology found; cannot link project ${refId} to a methodology. ` +
          `Has CADTV2Bootstrap run and succeeded?`;
        this.logger.error(message);
        await this.syncRecords.markFailed(key, new Error(message));
        return false;
      }

      input = {
        cadTrustProjectId: projectCadTrustId,
        cadTrustMethodologyId: methodologyCadTrustId,
        projectMethodologyDate:
          toCadTrustIsoDate(projectCreateTime) ?? new Date().toISOString().split("T")[0],
      };

      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "projectMethodology",
          "cad_trust_project_methodology_id",
          (change) =>
            change.cad_trust_project_id === projectCadTrustId &&
            change.cad_trust_methodology_id === methodologyCadTrustId
        );
        if (orphan) {
          return true;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().projectMethodology.stageCreate(input);
      const cadTrustId = staged.response.cadTrustProjectMethodologyId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Linked project ${refId} to CAD Trust methodology as ${cadTrustId}`);
      return true;
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to link project ${refId} to a CAD Trust methodology`, error);
      return false;
    }
  }

  /** Links the project to its owning stakeholder (the PD company). */
  async ensureStakeholderProject(
    refId: string,
    projectCadTrustId: string,
    stakeholderCadTrustId: string
  ): Promise<boolean> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.STAKEHOLDER_PROJECT,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.STAKEHOLDER_PROJECT,
    };

    const existing = await this.existingSync(key, `CAD Trust stakeholder link for project ${refId}`);
    if ("commitOwed" in existing) {
      return existing.commitOwed;
    }

    const input: StakeholderProjectCreateInput = {
      cadTrustStakeholderId: stakeholderCadTrustId,
      cadTrustProjectId: projectCadTrustId,
    };

    try {
      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "stakeholderProject",
          "cad_trust_stakeholder_project_id",
          (change) =>
            change.cad_trust_stakeholder_id === stakeholderCadTrustId &&
            change.cad_trust_project_id === projectCadTrustId
        );
        if (orphan) {
          return true;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().stakeholderProject.stageCreate(input);
      const cadTrustId = staged.response.cadTrustStakeholderProjectId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Linked project ${refId} to its CAD Trust stakeholder as ${cadTrustId}`);
      return true;
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to link project ${refId} to its CAD Trust stakeholder`, error);
      return false;
    }
  }

  /**
   * Stages the project's site location. Returns false — not a failure — when
   * the INF has no location data at all; see `CadTrustLocationMapper`.
   */
  async ensureLocation(refId: string, projectCadTrustId: string, infContent: any): Promise<boolean> {
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.LOCATION,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.LOCATION,
    };

    const existing = await this.existingSync(key, `CAD Trust location for project ${refId}`);
    if ("commitOwed" in existing) {
      return existing.commitOwed;
    }

    let input: LocationCreateInput | undefined;
    try {
      input = await this.locationMapper.toCreateInput(projectCadTrustId, infContent);
      if (!input) {
        this.logger.log(`No location data on the INF for project ${refId}; skipping location sync`);
        return false;
      }

      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "location",
          "cad_trust_location_id",
          (change) => change.cad_trust_project_id === projectCadTrustId
        );
        if (orphan) {
          return true;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().location.stageCreate(input);
      const cadTrustId = staged.response.cadTrustLocationId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust location for project ${refId} as ${cadTrustId}`);
      return true;
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust location for project ${refId}`, error);
      return false;
    }
  }

  /**
   * Stages a CAD Trust validation record for a DNA-approved PDD or validation report. `localId` is
   * `${refId}-${documentType}-v${documentVersion}` — see `CadTrustLocalEntityType.VALIDATION`'s doc
   * for why the document version is part of the key.
   *
   * Lifted out of `CadTrustValidationCreateHandler` (which is now a thin shell, like
   * `CadTrustVerificationCreateHandler`) so `CadTrustReconcileHandler` can re-drive a FAILED
   * validation record too. `existingSync()` distinguishes COMMITTED (skip), STAGED (commit owed,
   * don't re-stage — see its doc for the historical bug) and FAILED (look for an orphaned staged
   * row via `adoptOrphanedStagedRow` before re-staging, to survive an ambiguous 504).
   *
   * Records `props` onto the sync row via `recordSyncProps` *before* the "project not yet synced"
   * check — that path marks the record FAILED without ever building an outbound payload, and the
   * snapshot is what lets reconcile rebuild the request later.
   */
  async ensureValidation(props: CadTrustValidationSyncProps): Promise<EnsureResult> {
    const { refId, documentType, documentVersion } = props;
    const localId = `${refId}-${documentType}-v${documentVersion}`;
    const key: CadTrustSyncKey = {
      localEntityType: CadTrustLocalEntityType.VALIDATION,
      localId,
      cadTrustEntityType: CadTrustResourceType.VALIDATION,
    };

    const existing = await this.existingSync(key, `Validation record ${localId}`);
    if ("commitOwed" in existing) {
      return existing.cadTrustId
        ? { cadTrustId: existing.cadTrustId, commitOwed: existing.commitOwed }
        : undefined;
    }

    await this.syncRecords.recordSyncProps(key, props as unknown as Record<string, unknown>);

    const cadTrustProjectId = await this.syncRecords.getCadTrustId({
      localEntityType: CadTrustLocalEntityType.PROJECT,
      localId: refId,
      cadTrustEntityType: CadTrustResourceType.PROJECT,
    });
    if (!cadTrustProjectId) {
      const message =
        `Project ${refId} is not yet synced to CAD Trust; cannot attach a validation ` +
        `record for ${localId}`;
      this.logger.error(message);
      await this.syncRecords.markFailed(key, new Error(message));
      return undefined;
    }

    let input: ValidationCreateInput | undefined;
    try {
      input = await this.validationMapper.toCreateInput(props, localId, cadTrustProjectId);

      if (existing.failedBefore) {
        const orphan = await this.adoptOrphanedStagedRow(
          key,
          "validation",
          "cad_trust_validation_id",
          (change) => change.validation_id === localId
        );
        if (orphan) {
          return orphan;
        }
      }

      const staged = await this.cadTrustV2Service.getClient().validation.stageCreate(input);
      // The guide documents cadTrustValidationId on the create response but does not guarantee it
      // on every resource, so fall back to uuid — same convention as every other handler here.
      const cadTrustId = staged.response.cadTrustValidationId ?? staged.response.uuid;

      await this.syncRecords.markStaged(
        key,
        { cadTrustId, stagingUuid: staged.response.uuid },
        input as unknown as Record<string, unknown>
      );
      this.logger.log(`Staged CAD Trust validation record ${localId} as ${cadTrustId}`);
      return { cadTrustId, commitOwed: true };
    } catch (error) {
      await this.syncRecords.markFailed(key, error, input as unknown as Record<string, unknown>);
      this.logger.error(`Failed to stage CAD Trust validation record ${localId}`, error);
      return undefined;
    }
  }

  /**
   * The INF document holds every project field that has no column on
   * `project_entity` — description, dates, location, contacts. Read via the
   * repository rather than `DocumentManagementService`, to keep this module free of
   * a dependency cycle with the module that enqueues these actions. Shared by
   * `CadTrustProjectCreateHandler` and `CadTrustProjectUpdateHandler`, which used
   * to each carry an identical private copy of this method.
   */
  async getLatestInfContent(refId: string): Promise<any | undefined> {
    const document = await this.documentRepo.findOne({
      where: {
        programmeId: refId,
        type: DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
      },
      order: { version: "DESC" },
    });
    return document?.content;
  }
}
