import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, Like, MoreThanOrEqual, Repository } from "typeorm";

import { CadTrustSyncRecordEntity } from "../entities/cadtrust.sync.record.entity";
import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { CadTrustReconcilePass, entityTypesForPass } from "./reconcile-scope";

/** Identifies one local record's mapping to one CAD Trust resource. */
export interface CadTrustSyncKey {
  localEntityType: CadTrustLocalEntityType;
  localId: string;
  cadTrustEntityType: CadTrustResourceType;
}

/**
 * The local-id <-> CAD Trust-id map.
 *
 * Every handler goes through this rather than touching the repository, so the
 * "have we already synced this?" question and the failure bookkeeping have one
 * implementation instead of one per entity type.
 */
@Injectable()
export class CadTrustSyncRecordService {
  constructor(
    @InjectRepository(CadTrustSyncRecordEntity)
    private readonly syncRecordRepo: Repository<CadTrustSyncRecordEntity>,
    private readonly logger: Logger
  ) {}

  async find(key: CadTrustSyncKey): Promise<CadTrustSyncRecordEntity | null> {
    return this.syncRecordRepo.findOne({ where: { ...key } });
  }

  /** The CAD Trust UUID for a local record, or undefined if it was never staged. */
  async getCadTrustId(key: CadTrustSyncKey): Promise<string | undefined> {
    const record = await this.find(key);
    return record?.cadTrustId;
  }

  /**
   * The CAD Trust UUID for a resource type this registry only ever creates one
   * of — no `localId` filter, unlike every other lookup here. Used for PROGRAM
   * and METHODOLOGY: this registry bootstraps exactly one of each by design
   * (see `CadTrustRegistryProfileService`), so a project sync that needs to
   * link to either doesn't need to know how bootstrap computed its `localId` —
   * that stays bootstrap's concern. If this assumption is ever violated (a
   * second program/methodology gets synced), this returns whichever row was
   * staged/committed first; it does not detect or warn about the ambiguity.
   */
  async getSyncedCadTrustId(
    localEntityType: CadTrustLocalEntityType,
    cadTrustEntityType: CadTrustResourceType
  ): Promise<string | undefined> {
    const record = await this.syncRecordRepo.findOne({
      where: {
        localEntityType,
        cadTrustEntityType,
        syncStatus: In([CadTrustSyncStatus.STAGED, CadTrustSyncStatus.COMMITTED]),
      },
      order: { id: "ASC" },
    });
    return record?.cadTrustId;
  }

  /**
   * The most recently staged/committed record of a `refId`-prefixed composite-key type —
   * `VERIFICATION`'s `${refId}-VERIFICATION-v${documentVersion}` keys, most concretely. Used when
   * a caller knows the `refId` but not the exact `documentVersion` a prior step keyed its record
   * under (e.g. `CadTrustCreditIssuanceHandler`, triggered per `creditBlockId`, doesn't itself
   * know which monitoring cycle's verification produced it — but needs that record's own `localId`
   * to key its 1:1 `ISSUANCE` record identically). "Most recent" is unambiguous here because
   * monitoring cycles are strictly serial — a new one cannot start until the previous is fully
   * verified — and causality guarantees the verification action's row always gets a lower
   * `actionId` (and so processes first, on this single CAD Trust lane) than any credit-block event
   * it precedes.
   */
  async findLatestSynced(
    localEntityType: CadTrustLocalEntityType,
    refId: string
  ): Promise<CadTrustSyncRecordEntity | null> {
    return this.syncRecordRepo.findOne({
      where: {
        localEntityType,
        localId: Like(`${refId}-%`),
        syncStatus: In([CadTrustSyncStatus.STAGED, CadTrustSyncStatus.COMMITTED]),
      },
      order: { id: "DESC" },
    });
  }

  /** Convenience wrapper over `findLatestSynced` for callers that only need the CAD Trust id. */
  async getLatestSyncedCadTrustId(
    localEntityType: CadTrustLocalEntityType,
    refId: string
  ): Promise<string | undefined> {
    const record = await this.findLatestSynced(localEntityType, refId);
    return record?.cadTrustId;
  }

  /**
   * True once a create has been staged or committed — the signal that a
   * re-delivered create action should be skipped rather than duplicated.
   * The async queue is at-least-once, so re-delivery is expected, not exceptional.
   */
  async isAlreadySynced(key: CadTrustSyncKey): Promise<boolean> {
    const record = await this.find(key);
    return (
      record?.syncStatus === CadTrustSyncStatus.STAGED ||
      record?.syncStatus === CadTrustSyncStatus.COMMITTED
    );
  }

  /** Creates the row if it is new, leaves an existing one alone. */
  async ensure(key: CadTrustSyncKey): Promise<CadTrustSyncRecordEntity> {
    const existing = await this.find(key);
    if (existing) {
      return existing;
    }

    const now = Date.now();
    return this.syncRecordRepo.save(
      this.syncRecordRepo.create({
        ...key,
        syncStatus: CadTrustSyncStatus.PENDING,
        attemptCount: 0,
        createTime: now,
        updateTime: now,
      })
    );
  }

  /**
   * Records a successful stage: the CAD Trust UUID is now known.
   *
   * @param payload The exact input built for the CAD Trust request, when the caller has one — see
   *   `CadTrustSyncRecordEntity.payload`'s doc for why this is worth storing.
   */
  async markStaged(
    key: CadTrustSyncKey,
    ids: { cadTrustId?: string; stagingUuid?: string },
    payload?: Record<string, unknown>
  ): Promise<CadTrustSyncRecordEntity> {
    const record = await this.ensure(key);
    const now = Date.now();

    record.cadTrustId = ids.cadTrustId ?? record.cadTrustId;
    record.stagingUuid = ids.stagingUuid ?? record.stagingUuid;
    record.syncStatus = CadTrustSyncStatus.STAGED;
    record.lastError = null;
    record.lastAttemptTime = now;
    record.updateTime = now;
    record.payload = payload !== undefined ? payload : record.payload;

    return this.syncRecordRepo.save(record);
  }

  /**
   * Records a resource that is already committed on the network without ever
   * having been staged by this registry — the CAD Trust home organization,
   * verified rather than created. Marking it STAGED would be wrong (nothing was
   * staged) and would get swept up by `markAllStagedAsCommitted()`'s bulk update.
   */
  async markCommitted(
    key: CadTrustSyncKey,
    ids: { cadTrustId: string },
    payload?: Record<string, unknown>
  ): Promise<CadTrustSyncRecordEntity> {
    const record = await this.ensure(key);
    const now = Date.now();

    record.cadTrustId = ids.cadTrustId;
    record.syncStatus = CadTrustSyncStatus.COMMITTED;
    record.lastError = null;
    record.lastAttemptTime = now;
    record.updateTime = now;
    record.payload = payload !== undefined ? payload : record.payload;

    return this.syncRecordRepo.save(record);
  }

  /** Flips every currently-staged row to committed after a successful commit. */
  async markAllStagedAsCommitted(): Promise<number> {
    const now = Date.now();
    const result = await this.syncRecordRepo.update(
      { syncStatus: CadTrustSyncStatus.STAGED },
      { syncStatus: CadTrustSyncStatus.COMMITTED, updateTime: now, lastError: null }
    );
    return result.affected ?? 0;
  }

  /**
   * Marks every currently-staged row failed — used when a commit itself fails.
   *
   * Unlike `markFailed`, this is a bulk `UPDATE`, so it increments `attemptCount` via a raw SQL
   * expression (`"attemptCount" + 1`, the same pattern `CounterService.incrementCount` already
   * uses) rather than reading each row first. That increment is what makes `findStuckFailures`
   * below meaningful — `CadTrustCommitHandler` calls it after this to decide whether a run of
   * consecutive commit failures has crossed `cadTrustV2.commitStuckThreshold` (CAD Trust's own
   * "pending commit" guard is not always self-resolving — see the handler's doc).
   */
  async markAllStagedAsFailed(error: unknown): Promise<number> {
    const now = Date.now();
    const result = await this.syncRecordRepo
      .createQueryBuilder()
      .update()
      .where({ syncStatus: CadTrustSyncStatus.STAGED })
      .set({
        syncStatus: CadTrustSyncStatus.FAILED,
        lastError: this.describe(error),
        updateTime: now,
        attemptCount: () => '"attemptCount" + 1',
      })
      .execute();
    return result.affected ?? 0;
  }

  /**
   * Records a failure. Never throws — it is called from a catch block in a
   * handler that must not throw (see the module README for why).
   *
   * @param payload The input that was being staged when the failure happened, when the caller has
   *   one — lets a rejected payload be diagnosed from the row alone.
   */
  async markFailed(
    key: CadTrustSyncKey,
    error: unknown,
    payload?: Record<string, unknown>
  ): Promise<void> {
    try {
      const record = await this.ensure(key);
      const now = Date.now();

      record.syncStatus = CadTrustSyncStatus.FAILED;
      record.attemptCount = (record.attemptCount ?? 0) + 1;
      record.lastError = this.describe(error);
      record.lastAttemptTime = now;
      record.updateTime = now;
      record.payload = payload !== undefined ? payload : record.payload;

      await this.syncRecordRepo.save(record);
    } catch (bookkeepingError) {
      this.logger.error(
        `Could not record CAD Trust sync failure for ${key.localEntityType}:${key.localId}`,
        bookkeepingError
      );
    }
  }

  /**
   * Persists the *inbound* queue snapshot a sync is being driven from onto its sync record — see
   * the `syncProps` column doc on `CadTrustSyncRecordEntity`. Called before staging by the
   * `SNAPSHOT`-pass resources (`ensureValidation` / `ensureVerification` / `ensureIssuance`) so
   * `CadTrustReconcileHandler` can re-drive a FAILED record after the original `async_action_entity`
   * row is gone. Deliberately separate from `markStaged` / `markFailed` — the snapshot must survive
   * the "project not yet synced" early return, which marks the record FAILED without ever building
   * an outbound `payload`. Never throws; it is on the same never-throw path as `markFailed`.
   */
  async recordSyncProps(key: CadTrustSyncKey, syncProps: Record<string, unknown>): Promise<void> {
    try {
      const record = await this.ensure(key);
      record.syncProps = syncProps;
      record.updateTime = Date.now();
      await this.syncRecordRepo.save(record);
    } catch (error) {
      this.logger.error(
        `Could not record CAD Trust sync props for ${key.localEntityType}:${key.localId}`,
        error
      );
    }
  }

  /**
   * Distinct `localId`s (project `refId`s) of every currently-FAILED sync record among the
   * entity types assigned to `CadTrustReconcilePass.PROJECT` — PROJECT itself and its three child
   * links/records that share a refId-keyed `localId` (`PROJECT_METHODOLOGY`, `STAKEHOLDER_PROJECT`,
   * `LOCATION`). Used by `CadTrustReconcileHandler` to find which projects have something worth
   * re-driving.
   *
   * Which entity types belong to which reconcile pass — and why `STAKEHOLDER` (companyId-keyed,
   * re-driven indirectly), the `SNAPSHOT` types, and the bootstrap-owned singletons are not here —
   * is defined and explained in `reconcile-scope.ts`.
   *
   * @param maxAttempts Records whose `attemptCount` has already reached this are excluded — a
   *   permanently-broken record (bad data, a resource CAD Trust will never accept) would otherwise
   *   be re-driven forever, every reconcile tick. See `cadTrustV2.reconcileMaxAttempts`.
   */
  async findFailedProjectRefIds(maxAttempts: number): Promise<string[]> {
    const rows = await this.syncRecordRepo
      .createQueryBuilder("record")
      .select("DISTINCT record.localId", "localId")
      .where("record.syncStatus = :status", { status: CadTrustSyncStatus.FAILED })
      .andWhere("record.localEntityType IN (:...types)", {
        types: entityTypesForPass(CadTrustReconcilePass.PROJECT),
      })
      .andWhere("record.attemptCount < :maxAttempts", { maxAttempts })
      .getRawMany<{ localId: string }>();
    return rows.map((row) => row.localId);
  }

  /**
   * Distinct `localId`s (`creditBlockId`s) of every currently-FAILED sync record among the entity
   * types assigned to `CadTrustReconcilePass.CREDIT_BLOCK` — `UNIT` and `UNIT_LABEL`, both keyed
   * directly by `creditBlockId`. Used by `CadTrustReconcileHandler`'s credit sweep — the parallel
   * of `findFailedProjectRefIds()` for the credit side. See `reconcile-scope.ts` for the full
   * pass-by-pass breakdown.
   *
   * @param maxAttempts See `findFailedProjectRefIds`'s doc.
   */
  async findFailedCreditBlockIds(maxAttempts: number): Promise<string[]> {
    const rows = await this.syncRecordRepo
      .createQueryBuilder("record")
      .select("DISTINCT record.localId", "localId")
      .where("record.syncStatus = :status", { status: CadTrustSyncStatus.FAILED })
      .andWhere("record.localEntityType IN (:...types)", {
        types: entityTypesForPass(CadTrustReconcilePass.CREDIT_BLOCK),
      })
      .andWhere("record.attemptCount < :maxAttempts", { maxAttempts })
      .getRawMany<{ localId: string }>();
    return rows.map((row) => row.localId);
  }

  /**
   * Every currently-FAILED sync record of a `CadTrustReconcilePass.SNAPSHOT` entity type
   * (`VALIDATION` / `VERIFICATION` / `ISSUANCE` — see `reconcile-scope.ts`). Returns full rows,
   * unlike the two `localId`-only finders above: `CadTrustReconcileHandler.reconcileSnapshots()`
   * needs `syncProps` (the request-side snapshot to re-drive from), `payload` (the fallback for a
   * pre-`syncProps` row) and `localEntityType` (to pick which `ensureX` to call).
   *
   * @param maxAttempts See `findFailedProjectRefIds`'s doc.
   */
  async findFailedSnapshotRecords(maxAttempts: number): Promise<CadTrustSyncRecordEntity[]> {
    return this.syncRecordRepo.find({
      where: {
        syncStatus: CadTrustSyncStatus.FAILED,
        localEntityType: In(entityTypesForPass(CadTrustReconcilePass.SNAPSHOT)),
        attemptCount: LessThan(maxAttempts),
      },
    });
  }

  /**
   * Every currently-FAILED sync record whose `attemptCount` has reached `threshold` —
   * `CadTrustCommitHandler` uses this to escalate a run of consecutive commit failures from
   * "routine, the reconcile timer will retry it" to "an operator should look at this," since CAD
   * Trust's own "pending commit" guard is not always self-resolving (see the handler's doc).
   * Relies on `markAllStagedAsFailed`'s `attemptCount` increment — records marked via the
   * per-record `markFailed` also count, since it increments the same column.
   */
  async findStuckFailures(threshold: number): Promise<CadTrustSyncRecordEntity[]> {
    return this.syncRecordRepo.find({
      where: { syncStatus: CadTrustSyncStatus.FAILED, attemptCount: MoreThanOrEqual(threshold) },
    });
  }

  /** Flattens an unknown throwable into something worth storing. */
  private describe(error: unknown): string {
    if (error instanceof Error) {
      // CAD Trust errors carry the node's own response body; keep it, it is the
      // whole point of the typed error classes in @app/cadtrust.
      const body = (error as { body?: unknown }).body;
      return body === undefined
        ? `${error.name}: ${error.message}`
        : `${error.name}: ${error.message} | body=${JSON.stringify(body)}`;
    }
    return String(error);
  }
}
