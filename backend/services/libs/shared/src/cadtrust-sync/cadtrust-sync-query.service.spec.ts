import { CadTrustSyncOverallStatus } from "../dto/cadtrust.sync.dto";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import {
  CadTrustSyncQueryService,
  rollUpSyncStatus,
} from "./cadtrust-sync-query.service";

describe("rollUpSyncStatus", () => {
  it("is NONE for no records", () => {
    expect(rollUpSyncStatus([])).toBe(CadTrustSyncOverallStatus.NONE);
  });

  it("is FAILED if any record failed, regardless of the others", () => {
    expect(
      rollUpSyncStatus([CadTrustSyncStatus.COMMITTED, CadTrustSyncStatus.FAILED])
    ).toBe(CadTrustSyncOverallStatus.FAILED);
  });

  it("is SYNCED only when every record is committed", () => {
    expect(
      rollUpSyncStatus([CadTrustSyncStatus.COMMITTED, CadTrustSyncStatus.COMMITTED])
    ).toBe(CadTrustSyncOverallStatus.SYNCED);
  });

  it("is IN_PROGRESS for a staged/pending mix with no failure", () => {
    expect(
      rollUpSyncStatus([CadTrustSyncStatus.COMMITTED, CadTrustSyncStatus.STAGED])
    ).toBe(CadTrustSyncOverallStatus.IN_PROGRESS);
    expect(rollUpSyncStatus([CadTrustSyncStatus.PENDING])).toBe(
      CadTrustSyncOverallStatus.IN_PROGRESS
    );
  });
});

describe("CadTrustSyncQueryService", () => {
  const buildService = (
    overrides: { syncRows?: any[]; ownRows?: any[]; labelRows?: any[] } = {}
  ) => {
    const syncRecordRepo = {
      find: jest.fn(async (options: any) => {
        const where = options?.where ?? {};
        if (where.localEntityType === "LABEL") {
          return overrides.labelRows ?? [];
        }
        if (where.localId !== undefined) {
          return overrides.ownRows ?? overrides.syncRows ?? [];
        }
        return overrides.syncRows ?? [];
      }),
      createQueryBuilder: jest.fn(() => {
        const qb: any = {
          select: () => qb,
          where: () => qb,
          orWhere: () => qb,
          andWhere: () => qb,
          orderBy: () => qb,
          addOrderBy: () => qb,
          getMany: async () => overrides.syncRows ?? [],
          getRawMany: async () => overrides.syncRows ?? [],
        };
        return qb;
      }),
    };
    const projectRepo = { findOne: jest.fn(async () => null) };
    const creditBlocksRepo = { findOne: jest.fn(async () => null) };
    return {
      service: new CadTrustSyncQueryService(
        syncRecordRepo as any,
        projectRepo as any,
        creditBlocksRepo as any
      ),
      syncRecordRepo,
    };
  };

  it("getCreditStatuses returns NONE for ids with no rows and rolls up ids that have them", async () => {
    const { service } = buildService({
      syncRows: [
        { localId: "BLK-1", syncStatus: CadTrustSyncStatus.COMMITTED },
        { localId: "BLK-1", syncStatus: CadTrustSyncStatus.STAGED },
        { localId: "BLK-2", syncStatus: CadTrustSyncStatus.FAILED },
      ],
    });

    const result = await service.getCreditStatuses(["BLK-1", "BLK-2", "BLK-3"]);

    expect(result["BLK-1"]).toEqual({
      hasRecords: true,
      overallStatus: CadTrustSyncOverallStatus.IN_PROGRESS,
    });
    expect(result["BLK-2"]).toEqual({
      hasRecords: true,
      overallStatus: CadTrustSyncOverallStatus.FAILED,
    });
    expect(result["BLK-3"]).toEqual({
      hasRecords: false,
      overallStatus: CadTrustSyncOverallStatus.NONE,
    });
  });

  it("getProjectStatuses matches a refId-prefixed localId back to its refId", async () => {
    const { service } = buildService({
      syncRows: [
        { localId: "REF-1", syncStatus: CadTrustSyncStatus.COMMITTED },
        { localId: "REF-1-VERIFICATION-v1", syncStatus: CadTrustSyncStatus.COMMITTED },
      ],
    });

    const result = await service.getProjectStatuses(["REF-1", "REF-2"]);

    expect(result["REF-1"]).toEqual({
      hasRecords: true,
      overallStatus: CadTrustSyncOverallStatus.SYNCED,
    });
    expect(result["REF-2"]).toEqual({
      hasRecords: false,
      overallStatus: CadTrustSyncOverallStatus.NONE,
    });
  });

  it("returns an empty map without hitting the repo for an empty id list", async () => {
    const { service, syncRecordRepo } = buildService();
    const result = await service.getProjectStatuses([]);
    expect(result).toEqual({});
    expect(syncRecordRepo.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("getCreditOverview returns only the block's own UNIT record when it was never label-linked", async () => {
    const { service, syncRecordRepo } = buildService({
      ownRows: [{ localEntityType: "UNIT", syncStatus: CadTrustSyncStatus.COMMITTED }],
      labelRows: [{ localEntityType: "LABEL", syncStatus: CadTrustSyncStatus.COMMITTED }],
    });

    const result = await service.getCreditOverview("BLK-1");

    expect(result.records.map((r) => r.localEntityType)).toEqual(["UNIT"]);
    // The LABEL singleton must not be fetched for a non-authorized block.
    expect(syncRecordRepo.find).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { localEntityType: "LABEL" } })
    );
    expect(result.overallStatus).toBe(CadTrustSyncOverallStatus.SYNCED);
  });

  it("getCreditOverview includes the LABEL record when the block has a UNIT_LABEL, and never ISSUANCE/VERIFICATION", async () => {
    const { service } = buildService({
      ownRows: [
        { localEntityType: "UNIT", syncStatus: CadTrustSyncStatus.COMMITTED },
        { localEntityType: "UNIT_LABEL", syncStatus: CadTrustSyncStatus.COMMITTED },
      ],
      labelRows: [{ localEntityType: "LABEL", syncStatus: CadTrustSyncStatus.COMMITTED }],
    });

    const result = await service.getCreditOverview("BLK-1");
    const types = result.records.map((r) => r.localEntityType);

    expect(types).toEqual(expect.arrayContaining(["UNIT", "UNIT_LABEL", "LABEL"]));
    expect(types).not.toContain("ISSUANCE");
    expect(types).not.toContain("VERIFICATION");
  });
});
