import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { CadTrustSyncRecordService } from "./cadtrust-sync-record.service";

const KEY = {
  localEntityType: CadTrustLocalEntityType.PROJECT,
  localId: "0042",
  cadTrustEntityType: CadTrustResourceType.PROJECT,
};

function buildService(existing: any = null, rawMany: any[] = [], findMany: any[] = []) {
  const queryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(async () => rawMany),
    // markAllStagedAsFailed's chain — a separate method set on the same mock object, since both
    // chains share one createQueryBuilder() call in the real service.
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn(async () => ({ affected: 2 })),
  };
  const repo = {
    findOne: jest.fn(async () => existing),
    find: jest.fn(async () => findMany),
    create: jest.fn((row: any) => row),
    save: jest.fn(async (row: any) => row),
    update: jest.fn(async () => ({ affected: 2 })),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  return { service: new CadTrustSyncRecordService(repo as any, logger as any), repo, queryBuilder, logger };
}

describe("CadTrustSyncRecordService", () => {
  describe("ensure", () => {
    it("creates a pending row keyed on the unique triple", async () => {
      const { service, repo } = buildService();

      const record = await service.ensure(KEY);

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining(KEY));
      expect(record.syncStatus).toBe(CadTrustSyncStatus.PENDING);
      expect(record.attemptCount).toBe(0);
    });

    it("returns the existing row rather than duplicating it", async () => {
      const existing = { id: 7, ...KEY, syncStatus: CadTrustSyncStatus.STAGED };
      const { service, repo } = buildService(existing);

      expect(await service.ensure(KEY)).toBe(existing);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe("isAlreadySynced", () => {
    it.each([CadTrustSyncStatus.STAGED, CadTrustSyncStatus.COMMITTED])(
      "is true for %s, so a re-delivered action is skipped",
      async (syncStatus) => {
        const { service } = buildService({ ...KEY, syncStatus });

        expect(await service.isAlreadySynced(KEY)).toBe(true);
      }
    );

    it.each([CadTrustSyncStatus.PENDING, CadTrustSyncStatus.FAILED])(
      "is false for %s, so the sync is retried",
      async (syncStatus) => {
        const { service } = buildService({ ...KEY, syncStatus });

        expect(await service.isAlreadySynced(KEY)).toBe(false);
      }
    );

    it("is false when nothing has been recorded yet", async () => {
      const { service } = buildService();

      expect(await service.isAlreadySynced(KEY)).toBe(false);
    });
  });

  describe("markStaged", () => {
    it("stores both ids and clears any previous error", async () => {
      const { service, repo } = buildService({
        ...KEY,
        syncStatus: CadTrustSyncStatus.FAILED,
        lastError: "previous failure",
        attemptCount: 2,
      });

      await service.markStaged(KEY, { cadTrustId: "cadt-1", stagingUuid: "staging-1" });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cadTrustId: "cadt-1",
          stagingUuid: "staging-1",
          syncStatus: CadTrustSyncStatus.STAGED,
          lastError: null,
        })
      );
    });

    it("keeps a known cadTrustId when the new response omits it", async () => {
      const { service, repo } = buildService({ ...KEY, cadTrustId: "cadt-existing" });

      await service.markStaged(KEY, { stagingUuid: "staging-2" });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ cadTrustId: "cadt-existing" })
      );
    });

    it("stores the payload when one is given", async () => {
      const { service, repo } = buildService();
      const payload = { programName: "Test Program" };

      await service.markStaged(KEY, { cadTrustId: "cadt-1" }, payload);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ payload }));
    });

    it("leaves a previously-stored payload alone when none is given this call", async () => {
      const existingPayload = { programName: "Already staged" };
      const { service, repo } = buildService({ ...KEY, payload: existingPayload });

      await service.markStaged(KEY, { cadTrustId: "cadt-1" });

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ payload: existingPayload }));
    });
  });

  describe("markCommitted", () => {
    it("records the id as committed without ever having been staged", async () => {
      const { service, repo } = buildService();

      await service.markCommitted(KEY, { cadTrustId: "org-uid-1" });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          cadTrustId: "org-uid-1",
          syncStatus: CadTrustSyncStatus.COMMITTED,
          lastError: null,
        })
      );
    });

    it("is not swept up by markAllStagedAsCommitted, since it was never STAGED", async () => {
      // markCommitted writes COMMITTED directly; markAllStagedAsCommitted only
      // touches rows whose syncStatus is STAGED (asserted above), so a verified
      // organization row is untouched by every later project commit.
      const { service, repo } = buildService();

      await service.markCommitted(KEY, { cadTrustId: "org-uid-1" });

      expect(repo.update).not.toHaveBeenCalled();
    });

    it("stores the payload when one is given", async () => {
      const { service, repo } = buildService();
      const payload = { org_uid: "org-uid-1", is_home: true };

      await service.markCommitted(KEY, { cadTrustId: "org-uid-1" }, payload);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ payload }));
    });
  });

  describe("markFailed", () => {
    it("increments the attempt count and stores the message", async () => {
      const { service, repo } = buildService({ ...KEY, attemptCount: 2 });

      await service.markFailed(KEY, new Error("node unreachable"));

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: CadTrustSyncStatus.FAILED,
          attemptCount: 3,
          lastError: "Error: node unreachable",
        })
      );
    });

    it("keeps the CAD Trust response body, which is the useful part", async () => {
      const { service, repo } = buildService();
      const error = Object.assign(new Error("Bad request"), {
        name: "CadTrustValidationError",
        body: { message: "projectLink must be a valid URI", success: false },
      });

      await service.markFailed(KEY, error);

      expect(repo.save.mock.calls[0][0].lastError).toContain("projectLink must be a valid URI");
    });

    it("stores the payload that was being staged when the failure happened", async () => {
      const { service, repo } = buildService();
      const payload = { projectId: "0042", projectLink: "not-a-uri" };

      await service.markFailed(KEY, new Error("rejected"), payload);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ payload }));
    });

    it("never throws, because it is called from a handler that must not throw", async () => {
      const { service, repo, logger } = buildService();
      repo.save.mockRejectedValueOnce(new Error("database is down"));

      await expect(service.markFailed(KEY, new Error("original"))).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });

    it("handles a non-Error throwable", async () => {
      const { service, repo } = buildService();

      await service.markFailed(KEY, "just a string");

      expect(repo.save.mock.calls[0][0].lastError).toBe("just a string");
    });
  });

  describe("recordSyncProps", () => {
    it("stores the inbound snapshot on a fresh row without touching status or attemptCount", async () => {
      const { service, repo } = buildService();
      const syncProps = { refId: "0042", documentType: "PDD", documentVersion: 1 };

      await service.recordSyncProps(KEY, syncProps);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ syncProps, syncStatus: CadTrustSyncStatus.PENDING, attemptCount: 0 })
      );
    });

    it("leaves an existing row's status, payload and attemptCount alone", async () => {
      const existingPayload = { validationId: "0042-PDD-v1" };
      const { service, repo } = buildService({
        ...KEY,
        syncStatus: CadTrustSyncStatus.FAILED,
        attemptCount: 3,
        payload: existingPayload,
      });

      await service.recordSyncProps(KEY, { refId: "0042" });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          syncProps: { refId: "0042" },
          syncStatus: CadTrustSyncStatus.FAILED,
          attemptCount: 3,
          payload: existingPayload,
        })
      );
    });

    it("never throws — it is on the same never-throw path as markFailed", async () => {
      const { service, repo, logger } = buildService();
      repo.save.mockRejectedValueOnce(new Error("database is down"));

      await expect(service.recordSyncProps(KEY, { refId: "0042" })).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("findFailedSnapshotRecords", () => {
    it("returns the full FAILED VALIDATION/VERIFICATION/ISSUANCE rows", async () => {
      const rows = [
        { localId: "0042-PDD-v1", localEntityType: CadTrustLocalEntityType.VALIDATION },
        { localId: "0042-VERIFICATION-v1", localEntityType: CadTrustLocalEntityType.ISSUANCE },
      ];
      const { service, repo } = buildService(null, [], rows);

      expect(await service.findFailedSnapshotRecords(10)).toBe(rows);
      expect(repo.find).toHaveBeenCalledWith({
        where: {
          syncStatus: CadTrustSyncStatus.FAILED,
          localEntityType: expect.anything(), // In([VALIDATION, VERIFICATION, ISSUANCE]) — a FindOperator
          attemptCount: expect.anything(), // LessThan(10) — a FindOperator
        },
      });
    });

    it("returns an empty array when nothing is FAILED", async () => {
      const { service } = buildService(null, [], []);

      expect(await service.findFailedSnapshotRecords(10)).toEqual([]);
    });
  });

  describe("bulk transitions used by the commit handler", () => {
    it("moves every staged row to committed", async () => {
      const { service, repo } = buildService();

      expect(await service.markAllStagedAsCommitted()).toBe(2);
      expect(repo.update).toHaveBeenCalledWith(
        { syncStatus: CadTrustSyncStatus.STAGED },
        expect.objectContaining({ syncStatus: CadTrustSyncStatus.COMMITTED })
      );
    });

    it("moves every staged row to failed when a commit fails, incrementing attemptCount", async () => {
      const { service, queryBuilder } = buildService();

      expect(await service.markAllStagedAsFailed(new Error("commit failed"))).toBe(2);
      expect(queryBuilder.update).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith({ syncStatus: CadTrustSyncStatus.STAGED });
      expect(queryBuilder.set).toHaveBeenCalledWith(
        expect.objectContaining({
          syncStatus: CadTrustSyncStatus.FAILED,
          attemptCount: expect.any(Function),
        })
      );
      // The raw SQL expression itself — confirms this is a real increment, not an overwrite.
      const setCall = queryBuilder.set.mock.calls[0][0];
      expect(setCall.attemptCount()).toBe('"attemptCount" + 1');
    });
  });

  describe("findStuckFailures", () => {
    it("returns FAILED records whose attemptCount has reached the threshold", async () => {
      const stuck = [{ localId: "0042" }];
      const { service, repo } = buildService(null, [], stuck);

      expect(await service.findStuckFailures(6)).toBe(stuck);
      expect(repo.find).toHaveBeenCalledWith({
        where: { syncStatus: CadTrustSyncStatus.FAILED, attemptCount: expect.anything() },
      });
    });

    it("returns an empty array when nothing is stuck", async () => {
      const { service } = buildService(null, [], []);

      expect(await service.findStuckFailures(6)).toEqual([]);
    });
  });

  it("returns the CAD Trust id for a synced record, which is what updates need", async () => {
    const { service } = buildService({ ...KEY, cadTrustId: "cadt-1" });

    expect(await service.getCadTrustId(KEY)).toBe("cadt-1");
    expect(await buildService().service.getCadTrustId(KEY)).toBeUndefined();
  });

  describe("getSyncedCadTrustId — the PROGRAM/METHODOLOGY singleton lookup", () => {
    it("returns the cadTrustId with no localId filter, unlike every other lookup here", async () => {
      const { service, repo } = buildService({
        cadTrustId: "cadt-methodology-1",
        syncStatus: CadTrustSyncStatus.COMMITTED,
      });

      const result = await service.getSyncedCadTrustId(
        CadTrustLocalEntityType.METHODOLOGY,
        CadTrustResourceType.METHODOLOGY
      );

      expect(result).toBe("cadt-methodology-1");
      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          localEntityType: CadTrustLocalEntityType.METHODOLOGY,
          cadTrustEntityType: CadTrustResourceType.METHODOLOGY,
          syncStatus: expect.anything(), // In([STAGED, COMMITTED]) — a TypeORM FindOperator
        },
        order: { id: "ASC" },
      });
    });

    it("returns undefined when nothing has been synced yet", async () => {
      const { service } = buildService(null);

      expect(
        await service.getSyncedCadTrustId(CadTrustLocalEntityType.PROGRAM, CadTrustResourceType.PROGRAM)
      ).toBeUndefined();
    });
  });

  describe("findFailedProjectRefIds", () => {
    it("returns the distinct refIds of FAILED project-scoped sync records", async () => {
      const { service, queryBuilder } = buildService(null, [{ localId: "0042" }, { localId: "0099" }]);

      const refIds = await service.findFailedProjectRefIds(10);

      expect(refIds).toEqual(["0042", "0099"]);
      expect(queryBuilder.where).toHaveBeenCalledWith("record.syncStatus = :status", {
        status: CadTrustSyncStatus.FAILED,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith("record.localEntityType IN (:...types)", {
        types: [
          CadTrustLocalEntityType.PROJECT,
          CadTrustLocalEntityType.PROJECT_METHODOLOGY,
          CadTrustLocalEntityType.STAKEHOLDER_PROJECT,
          CadTrustLocalEntityType.LOCATION,
        ],
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith("record.attemptCount < :maxAttempts", {
        maxAttempts: 10,
      });
    });

    it("returns an empty array when nothing is FAILED", async () => {
      const { service } = buildService(null, []);

      expect(await service.findFailedProjectRefIds(10)).toEqual([]);
    });
  });

  describe("findFailedCreditBlockIds", () => {
    it("returns the distinct creditBlockIds of FAILED UNIT/UNIT_LABEL sync records", async () => {
      const { service, queryBuilder } = buildService(null, [
        { localId: "CA0001-XX-XX-1-1-100" },
        { localId: "CA0001-XX-XX-1-101-200" },
      ]);

      const creditBlockIds = await service.findFailedCreditBlockIds(10);

      expect(creditBlockIds).toEqual(["CA0001-XX-XX-1-1-100", "CA0001-XX-XX-1-101-200"]);
      expect(queryBuilder.where).toHaveBeenCalledWith("record.syncStatus = :status", {
        status: CadTrustSyncStatus.FAILED,
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith("record.localEntityType IN (:...types)", {
        types: [CadTrustLocalEntityType.UNIT, CadTrustLocalEntityType.UNIT_LABEL],
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith("record.attemptCount < :maxAttempts", {
        maxAttempts: 10,
      });
    });

    it("returns an empty array when nothing is FAILED", async () => {
      const { service } = buildService(null, []);

      expect(await service.findFailedCreditBlockIds(10)).toEqual([]);
    });
  });

  describe("findLatestSynced / getLatestSyncedCadTrustId — the refId-prefixed composite-key lookup", () => {
    it("finds the most recently staged/committed record whose localId is prefixed by refId", async () => {
      const record = { localId: "0042-VERIFICATION-v2", cadTrustId: "cadt-verification-2" };
      const { service, repo } = buildService(record);

      const result = await service.findLatestSynced(CadTrustLocalEntityType.VERIFICATION, "0042");

      expect(result).toBe(record);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: {
          localEntityType: CadTrustLocalEntityType.VERIFICATION,
          localId: expect.anything(), // Like(`0042-%`) — a TypeORM FindOperator
          syncStatus: expect.anything(), // In([STAGED, COMMITTED])
        },
        order: { id: "DESC" },
      });
    });

    it("getLatestSyncedCadTrustId returns just the cadTrustId, or undefined when nothing matched", async () => {
      const { service: withRecord } = buildService({ cadTrustId: "cadt-verification-2" });
      expect(await withRecord.getLatestSyncedCadTrustId(CadTrustLocalEntityType.VERIFICATION, "0042")).toBe(
        "cadt-verification-2"
      );

      const { service: withNothing } = buildService(null);
      expect(
        await withNothing.getLatestSyncedCadTrustId(CadTrustLocalEntityType.VERIFICATION, "0042")
      ).toBeUndefined();
    });
  });
});
