import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import {
  CadTrustSyncOverallStatus,
  CadTrustSyncOverviewDto,
  CadTrustSyncRecordView,
  CadTrustSyncStatusSummary,
} from "../dto/cadtrust.sync.dto";
import { CadTrustSyncRecordEntity } from "../entities/cadtrust.sync.record.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";

/** CAD Trust resources this registry bootstraps exactly one of, shared by every project. */
const SINGLETON_ENTITY_TYPES: CadTrustLocalEntityType[] = [
  CadTrustLocalEntityType.ORGANIZATION,
  CadTrustLocalEntityType.PROGRAM,
  CadTrustLocalEntityType.METHODOLOGY,
];

/**
 * Rolls a set of `cadtrust_sync_record` statuses into the single badge state the UI shows.
 * Pure — exported for direct unit testing.
 */
export function rollUpSyncStatus(statuses: CadTrustSyncStatus[]): CadTrustSyncOverallStatus {
  if (statuses.length === 0) {
    return CadTrustSyncOverallStatus.NONE;
  }
  if (statuses.includes(CadTrustSyncStatus.FAILED)) {
    return CadTrustSyncOverallStatus.FAILED;
  }
  if (statuses.every((status) => status === CadTrustSyncStatus.COMMITTED)) {
    return CadTrustSyncOverallStatus.SYNCED;
  }
  return CadTrustSyncOverallStatus.IN_PROGRESS;
}

/**
 * Read-only view over `cadtrust_sync_record` for the UI's "synced to CAD Trust?" badge and its
 * detail popup. Reads repositories directly (never domain services) — same convention as the rest
 * of this module (see `cadtrust-sync.module.ts`'s class doc).
 */
@Injectable()
export class CadTrustSyncQueryService {
  constructor(
    @InjectRepository(CadTrustSyncRecordEntity)
    private readonly syncRecordRepo: Repository<CadTrustSyncRecordEntity>,
    @InjectRepository(ProjectEntity)
    private readonly projectRepo: Repository<ProjectEntity>,
    @InjectRepository(CreditBlocksEntity)
    private readonly creditBlocksRepo: Repository<CreditBlocksEntity>
  ) {}

  // ---------------------------------------------------------------------------------------------
  // Detail popups
  // ---------------------------------------------------------------------------------------------

  async getProjectOverview(refId: string): Promise<CadTrustSyncOverviewDto> {
    const project = await this.projectRepo.findOne({ where: { refId } });

    const ownRows = await this.syncRecordRepo
      .createQueryBuilder("record")
      .where("record.localId = :refId OR record.localId LIKE :prefix", {
        refId,
        prefix: `${refId}-%`,
      })
      .orderBy("record.localEntityType", "ASC")
      .addOrderBy("record.localId", "ASC")
      .getMany();

    const stakeholderRows = project
      ? await this.syncRecordRepo.find({
          where: {
            localEntityType: CadTrustLocalEntityType.STAKEHOLDER,
            localId: String(project.companyId),
          },
        })
      : [];

    const singletonRows = await this.syncRecordRepo.find({
      where: { localEntityType: In(SINGLETON_ENTITY_TYPES) },
    });

    // The badge state reflects the project's own records only — a shared stakeholder or a
    // bootstrap singleton that failed must not paint every project red.
    const records = [...ownRows, ...stakeholderRows, ...singletonRows].map(toRecordView);
    return {
      overallStatus: rollUpSyncStatus(ownRows.map((row) => row.syncStatus)),
      records,
    };
  }

  async getCreditOverview(creditBlockId: string): Promise<CadTrustSyncOverviewDto> {
    // UNIT + UNIT_LABEL are both keyed by creditBlockId. The credit-side popups
    // (balance / retirement) intentionally do NOT show the project's issuance /
    // verification records — only this block's unit and, if it was
    // ITMO-authorized, its Article 6 label link.
    const ownRows = await this.syncRecordRepo.find({
      where: { localId: creditBlockId },
      order: { localEntityType: "ASC" },
    });

    const isLabelLinked = ownRows.some(
      (row) => row.localEntityType === CadTrustLocalEntityType.UNIT_LABEL
    );
    const labelRows = isLabelLinked
      ? await this.syncRecordRepo.find({
          where: { localEntityType: CadTrustLocalEntityType.LABEL },
        })
      : [];

    const records = [...ownRows, ...labelRows].map(toRecordView);
    return {
      overallStatus: rollUpSyncStatus(ownRows.map((row) => row.syncStatus)),
      records,
    };
  }

  // ---------------------------------------------------------------------------------------------
  // Batch badge gates
  // ---------------------------------------------------------------------------------------------

  async getProjectStatuses(
    refIds: string[]
  ): Promise<Record<string, CadTrustSyncStatusSummary>> {
    const unique = [...new Set(refIds.filter(Boolean))];
    const summary: Record<string, CadTrustSyncStatusSummary> = {};
    for (const refId of unique) {
      summary[refId] = { hasRecords: false, overallStatus: CadTrustSyncOverallStatus.NONE };
    }
    if (unique.length === 0) {
      return summary;
    }

    const rows = await this.syncRecordRepo
      .createQueryBuilder("record")
      .select(["record.localId AS \"localId\"", "record.syncStatus AS \"syncStatus\""])
      .where("record.localId IN (:...refIds)", { refIds: unique })
      .orWhere("record.localId LIKE ANY(:prefixes)", {
        prefixes: unique.map((refId) => `${refId}-%`),
      })
      .getRawMany<{ localId: string; syncStatus: CadTrustSyncStatus }>();

    const byRefId = new Map<string, CadTrustSyncStatus[]>();
    for (const row of rows) {
      const refId = unique.find(
        (candidate) => row.localId === candidate || row.localId.startsWith(`${candidate}-`)
      );
      if (!refId) {
        continue;
      }
      const bucket = byRefId.get(refId) ?? [];
      bucket.push(row.syncStatus);
      byRefId.set(refId, bucket);
    }

    for (const [refId, statuses] of byRefId) {
      summary[refId] = {
        hasRecords: statuses.length > 0,
        overallStatus: rollUpSyncStatus(statuses),
      };
    }
    return summary;
  }

  async getCreditStatuses(
    creditBlockIds: string[]
  ): Promise<Record<string, CadTrustSyncStatusSummary>> {
    const unique = [...new Set(creditBlockIds.filter(Boolean))];
    const summary: Record<string, CadTrustSyncStatusSummary> = {};
    for (const id of unique) {
      summary[id] = { hasRecords: false, overallStatus: CadTrustSyncOverallStatus.NONE };
    }
    if (unique.length === 0) {
      return summary;
    }

    const rows = await this.syncRecordRepo.find({
      where: { localId: In(unique) },
      select: ["localId", "syncStatus"],
    });

    const byBlockId = new Map<string, CadTrustSyncStatus[]>();
    for (const row of rows) {
      const bucket = byBlockId.get(row.localId) ?? [];
      bucket.push(row.syncStatus);
      byBlockId.set(row.localId, bucket);
    }

    for (const [id, statuses] of byBlockId) {
      summary[id] = {
        hasRecords: statuses.length > 0,
        overallStatus: rollUpSyncStatus(statuses),
      };
    }
    return summary;
  }
}

function toRecordView(record: CadTrustSyncRecordEntity): CadTrustSyncRecordView {
  return {
    localEntityType: record.localEntityType,
    cadTrustEntityType: record.cadTrustEntityType,
    localId: record.localId,
    cadTrustId: record.cadTrustId ?? undefined,
    syncStatus: record.syncStatus,
    attemptCount: record.attemptCount,
    lastError: record.lastError ?? undefined,
    lastAttemptTime: record.lastAttemptTime ?? undefined,
    updateTime: record.updateTime,
    payload: record.payload ?? undefined,
  };
}
