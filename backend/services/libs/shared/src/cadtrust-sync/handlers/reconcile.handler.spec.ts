import { CadTrustLocalEntityType } from "../../enum/cadtrust.local.entity.type.enum";
import { CadTrustSyncStatus } from "../../enum/cadtrust.sync.status.enum";
import { CadTrustReconcileHandler } from "./reconcile.handler";

const REF_ID_1 = "0042";
const REF_ID_2 = "0099";
const CREDIT_BLOCK_ID_1 = "CA0001-XX-XX-1-1-100";
const CREDIT_BLOCK_ID_2 = "CA0001-XX-XX-1-101-200";

function snapshotRecord(overrides: Partial<any> = {}): any {
  return {
    localEntityType: CadTrustLocalEntityType.VALIDATION,
    localId: "0042-PDD-v1",
    syncStatus: CadTrustSyncStatus.FAILED,
    syncProps: { refId: REF_ID_1, documentType: "PDD", documentVersion: 1, validationBodyName: "" },
    payload: null,
    createTime: 1_700_000_000_000,
    ...overrides,
  };
}

const LEDGER_PROJECT = {
  refId: REF_ID_1,
  title: "Kunene Solar",
  sector: "ENERGY",
  sectoralScope: "ENERGY_INDUSTRIES",
  projectProposalStage: "APPROVED",
  createTime: 1_700_000_000_000,
  updateTime: 1_700_100_000_000,
  companyId: 7,
};

function buildHandler(
  overrides: {
    enabled?: boolean;
    reconcileMaxAttempts?: number;
    failedRefIds?: string[];
    failedCreditBlockIds?: string[];
    hasUncommittedStagedRows?: boolean;
    ledgerProjects?: Record<string, any>;
    infContent?: any;
    ensureStakeholder?: jest.Mock;
    ensureProject?: jest.Mock;
    ensureProjectMethodology?: jest.Mock;
    ensureStakeholderProject?: jest.Mock;
    ensureLocation?: jest.Mock;
    ensureUnitUpdate?: jest.Mock;
    ensureItmoLabelIfAuthorized?: jest.Mock;
    ensureIssuanceForUncreatedUnit?: jest.Mock;
    ensureValidation?: jest.Mock;
    ensureVerification?: jest.Mock;
    ensureIssuance?: jest.Mock;
    failedSnapshotRecords?: any[];
    commit?: jest.Mock;
    hasUncommittedStagedRowsImpl?: jest.Mock;
    getProjectByIdImpl?: jest.Mock;
  } = {}
) {
  const syncRecords = {
    findFailedProjectRefIds: jest.fn(async () => overrides.failedRefIds ?? []),
    findFailedCreditBlockIds: jest.fn(async () => overrides.failedCreditBlockIds ?? []),
    findFailedSnapshotRecords: jest.fn(async () => overrides.failedSnapshotRecords ?? []),
  };

  const resources = {
    getLatestInfContent: jest.fn(async () => overrides.infContent ?? { projectDescription: "d" }),
    ensureStakeholder:
      overrides.ensureStakeholder ?? jest.fn(async () => ({ cadTrustId: "cadt-stakeholder-1", commitOwed: false })),
    ensureProject:
      overrides.ensureProject ?? jest.fn(async () => ({ cadTrustId: "cadt-project-1", commitOwed: false })),
    ensureProjectMethodology: overrides.ensureProjectMethodology ?? jest.fn(async () => true),
    ensureStakeholderProject: overrides.ensureStakeholderProject ?? jest.fn(async () => false),
    ensureLocation: overrides.ensureLocation ?? jest.fn(async () => false),
    ensureValidation:
      overrides.ensureValidation ?? jest.fn(async () => ({ cadTrustId: "cadt-validation-1", commitOwed: false })),
  };

  const creditResources = {
    ensureUnitUpdate: overrides.ensureUnitUpdate ?? jest.fn(async () => false),
    ensureItmoLabelIfAuthorized: overrides.ensureItmoLabelIfAuthorized ?? jest.fn(async () => false),
    ensureIssuanceForUncreatedUnit: overrides.ensureIssuanceForUncreatedUnit ?? jest.fn(async () => false),
    ensureVerification:
      overrides.ensureVerification ?? jest.fn(async () => ({ cadTrustId: "cadt-verification-1", commitOwed: false })),
    ensureIssuance:
      overrides.ensureIssuance ?? jest.fn(async () => ({ cadTrustId: "cadt-issuance-1", commitOwed: false })),
  };

  const ledgerProjects: Record<string, any> = overrides.ledgerProjects ?? { [REF_ID_1]: LEDGER_PROJECT };
  const programmeLedgerService = {
    getProjectById:
      overrides.getProjectByIdImpl ??
      jest.fn(async (refId: string) => (refId in ledgerProjects ? ledgerProjects[refId] : null)),
  };

  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };

  const hasUncommittedStagedRows =
    overrides.hasUncommittedStagedRowsImpl ?? jest.fn(async () => overrides.hasUncommittedStagedRows ?? false);
  const cadTrustV2Service = {
    getClient: () => ({
      staging: { hasUncommittedStagedRows },
    }),
  };
  const configService = {
    get: (key: string) =>
      key === "cadTrustV2.enable"
        ? overrides.enabled ?? true
        : key === "cadTrustV2.reconcileMaxAttempts"
        ? overrides.reconcileMaxAttempts ?? 10
        : undefined,
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustReconcileHandler(
    syncRecords as any,
    resources as any,
    creditResources as any,
    programmeLedgerService as any,
    commitHandler as any,
    cadTrustV2Service as any,
    configService as any,
    logger as any
  );

  return {
    handler,
    syncRecords,
    resources,
    creditResources,
    programmeLedgerService,
    commitHandler,
    hasUncommittedStagedRows,
    logger,
  };
}

describe("CadTrustReconcileHandler", () => {
  it("does nothing when there is no uncommitted staged batch and no FAILED records", async () => {
    const { handler, commitHandler, programmeLedgerService } = buildHandler();

    await handler.handle();

    expect(commitHandler.handle).not.toHaveBeenCalled();
    expect(programmeLedgerService.getProjectById).not.toHaveBeenCalled();
  });

  it("retries the commit when the node still has an uncommitted staged batch", async () => {
    const { handler, commitHandler } = buildHandler({ hasUncommittedStagedRows: true });

    await handler.handle();

    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("re-drives every ensure step for a project with a FAILED sync record", async () => {
    const { handler, resources, programmeLedgerService } = buildHandler({ failedRefIds: [REF_ID_1] });

    await handler.handle();

    expect(programmeLedgerService.getProjectById).toHaveBeenCalledWith(REF_ID_1);
    expect(resources.ensureStakeholder).toHaveBeenCalledWith(LEDGER_PROJECT.companyId);
    expect(resources.ensureProject).toHaveBeenCalledWith(REF_ID_1, LEDGER_PROJECT, expect.anything());
    expect(resources.ensureProjectMethodology).toHaveBeenCalledWith(
      REF_ID_1,
      "cadt-project-1",
      LEDGER_PROJECT.createTime
    );
    expect(resources.ensureStakeholderProject).toHaveBeenCalledWith(REF_ID_1, "cadt-project-1", "cadt-stakeholder-1");
    expect(resources.ensureLocation).toHaveBeenCalledWith(REF_ID_1, "cadt-project-1", expect.anything());
  });

  it("processes every FAILED refId and commits once if any of them owed a commit", async () => {
    const { handler, commitHandler, programmeLedgerService } = buildHandler({
      failedRefIds: [REF_ID_1, REF_ID_2],
      ledgerProjects: { [REF_ID_1]: LEDGER_PROJECT, [REF_ID_2]: { ...LEDGER_PROJECT, refId: REF_ID_2 } },
      ensureProject: jest.fn(async () => ({ cadTrustId: "cadt-project-1", commitOwed: true })),
    });

    await handler.handle();

    expect(programmeLedgerService.getProjectById).toHaveBeenCalledWith(REF_ID_1);
    expect(programmeLedgerService.getProjectById).toHaveBeenCalledWith(REF_ID_2);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not commit for a project that owed nothing, and does not touch downstream links when the project never resolved", async () => {
    const { handler, resources, commitHandler } = buildHandler({
      failedRefIds: [REF_ID_1],
      ensureProject: jest.fn(async () => undefined),
    });

    await handler.handle();

    expect(resources.ensureProjectMethodology).not.toHaveBeenCalled();
    expect(resources.ensureStakeholderProject).not.toHaveBeenCalled();
    expect(resources.ensureLocation).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  it("leaves a FAILED sync record alone (does not commit for it) when the project is missing from the ledger", async () => {
    const { handler, resources, commitHandler, logger } = buildHandler({
      failedRefIds: [REF_ID_1],
      ledgerProjects: {},
    });

    await handler.handle();

    expect(resources.ensureStakeholder).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining(REF_ID_1));
  });

  describe("the credit-block sweep", () => {
    it("re-drives ensureIssuanceForUncreatedUnit, ensureUnitUpdate and ensureItmoLabelIfAuthorized for every FAILED credit block", async () => {
      const { handler, creditResources, syncRecords } = buildHandler({
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1],
      });

      await handler.handle();

      expect(syncRecords.findFailedCreditBlockIds).toHaveBeenCalledWith(10);
      expect(creditResources.ensureIssuanceForUncreatedUnit).toHaveBeenCalledWith(CREDIT_BLOCK_ID_1);
      expect(creditResources.ensureUnitUpdate).toHaveBeenCalledWith(CREDIT_BLOCK_ID_1);
      expect(creditResources.ensureItmoLabelIfAuthorized).toHaveBeenCalledWith(CREDIT_BLOCK_ID_1);
    });

    it("heals a multi-vintage issuance failure in one tick: issuance re-driven in the snapshot sweep, every unit staged in the credit sweep", async () => {
      // The bug: a failed multi-vintage issuance leaves one FAILED ISSUANCE row plus one FAILED
      // UNIT row per vintage block (the latter is the breadcrumb ensureCreditIssuance now writes).
      const blockIds = [CREDIT_BLOCK_ID_1, CREDIT_BLOCK_ID_2, "CA0001-XX-XX-1-201-300"];
      const ensureIssuance = jest.fn(async () => ({ cadTrustId: "cadt-issuance-1", commitOwed: true }));
      const ensureUnitUpdate = jest.fn(async () => true);
      const { handler, commitHandler } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord({
            localEntityType: CadTrustLocalEntityType.ISSUANCE,
            localId: "0042-VERIFICATION-v1",
            syncProps: { refId: REF_ID_1 },
          }),
        ],
        failedCreditBlockIds: blockIds,
        ensureIssuance,
        ensureUnitUpdate,
      });

      await handler.handle();

      expect(ensureIssuance).toHaveBeenCalledWith(REF_ID_1);
      for (const blockId of blockIds) {
        expect(ensureUnitUpdate).toHaveBeenCalledWith(blockId);
      }
      // one commit for the snapshot ISSUANCE group, one for the credit-block sweep
      expect(commitHandler.handle).toHaveBeenCalledTimes(2);
    });

    it("re-drives the issuance from the credit sweep when a never-created unit has no ISSUANCE row at all", async () => {
      const ensureIssuanceForUncreatedUnit = jest.fn(async () => true);
      const { handler, commitHandler, creditResources } = buildHandler({
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1],
        ensureIssuanceForUncreatedUnit,
      });

      await handler.handle();

      expect(creditResources.ensureIssuanceForUncreatedUnit).toHaveBeenCalledWith(CREDIT_BLOCK_ID_1);
      // commitOwed from ensureIssuanceForUncreatedUnit alone still drives a commit for the sweep
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("processes every FAILED creditBlockId and commits once if any of them owed a commit", async () => {
      const { handler, commitHandler, creditResources } = buildHandler({
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1, CREDIT_BLOCK_ID_2],
        ensureUnitUpdate: jest.fn(async (id: string) => id === CREDIT_BLOCK_ID_2),
      });

      await handler.handle();

      expect(creditResources.ensureUnitUpdate).toHaveBeenCalledWith(CREDIT_BLOCK_ID_1);
      expect(creditResources.ensureUnitUpdate).toHaveBeenCalledWith(CREDIT_BLOCK_ID_2);
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("does not commit when neither the unit update nor the label owed a commit for any block", async () => {
      const { handler, commitHandler } = buildHandler({ failedCreditBlockIds: [CREDIT_BLOCK_ID_1] });

      await handler.handle();

      expect(commitHandler.handle).not.toHaveBeenCalled();
    });

    it("commits per sweep — once for the project sweep, once for the credit sweep, when both owed one", async () => {
      const { handler, commitHandler } = buildHandler({
        failedRefIds: [REF_ID_1],
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1],
        ensureProject: jest.fn(async () => ({ cadTrustId: "cadt-project-1", commitOwed: true })),
        ensureUnitUpdate: jest.fn(async () => true),
      });

      await handler.handle();

      expect(commitHandler.handle).toHaveBeenCalledTimes(2);
    });

    it("does not commit for the credit sweep when only the project sweep owed one", async () => {
      const { handler, commitHandler } = buildHandler({
        failedRefIds: [REF_ID_1],
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1],
        ensureProject: jest.fn(async () => ({ cadTrustId: "cadt-project-1", commitOwed: true })),
        ensureProjectMethodology: jest.fn(async () => false),
        ensureUnitUpdate: jest.fn(async () => false),
        ensureItmoLabelIfAuthorized: jest.fn(async () => false),
      });

      await handler.handle();

      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("does not let one bad creditBlockId abort the whole reconcile pass", async () => {
      const { handler, creditResources } = buildHandler({
        failedCreditBlockIds: [CREDIT_BLOCK_ID_1, CREDIT_BLOCK_ID_2],
        ensureUnitUpdate: jest.fn(async (id: string) => {
          if (id === CREDIT_BLOCK_ID_1) {
            throw new Error("CAD Trust node unreachable");
          }
          return true;
        }),
      });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(creditResources.ensureUnitUpdate).toHaveBeenCalledWith(CREDIT_BLOCK_ID_2);
    });
  });

  describe("the snapshot sweep", () => {
    it("re-drives a FAILED validation record from its syncProps snapshot", async () => {
      const { handler, resources, syncRecords } = buildHandler({
        failedSnapshotRecords: [snapshotRecord()],
      });

      await handler.handle();

      expect(syncRecords.findFailedSnapshotRecords).toHaveBeenCalledWith(10);
      expect(resources.ensureValidation).toHaveBeenCalledWith(
        expect.objectContaining({ refId: REF_ID_1, documentType: "PDD", documentVersion: 1 })
      );
    });

    it("re-drives verification from syncProps and issuance from its refId", async () => {
      const { handler, creditResources } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord({
            localEntityType: CadTrustLocalEntityType.VERIFICATION,
            localId: "0042-VERIFICATION-v1",
            syncProps: { refId: REF_ID_1, documentVersion: 1, verificationBodyName: "" },
          }),
          snapshotRecord({
            localEntityType: CadTrustLocalEntityType.ISSUANCE,
            localId: "0042-VERIFICATION-v1",
            syncProps: { refId: REF_ID_1 },
          }),
        ],
      });

      await handler.handle();

      expect(creditResources.ensureVerification).toHaveBeenCalledWith(
        expect.objectContaining({ refId: REF_ID_1, documentVersion: 1 })
      );
      expect(creditResources.ensureIssuance).toHaveBeenCalledWith(REF_ID_1);
    });

    it("processes the groups in VALIDATION -> VERIFICATION -> ISSUANCE order", async () => {
      const calls: string[] = [];
      const { handler } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord({ localEntityType: CadTrustLocalEntityType.ISSUANCE, localId: "0042-VERIFICATION-v1", syncProps: { refId: REF_ID_1 } }),
          snapshotRecord({ localEntityType: CadTrustLocalEntityType.VALIDATION }),
          snapshotRecord({ localEntityType: CadTrustLocalEntityType.VERIFICATION, localId: "0042-VERIFICATION-v1", syncProps: { refId: REF_ID_1, documentVersion: 1 } }),
        ],
        ensureValidation: jest.fn(async () => { calls.push("validation"); return { cadTrustId: "v", commitOwed: false }; }),
        ensureVerification: jest.fn(async () => { calls.push("verification"); return { cadTrustId: "v", commitOwed: false }; }),
        ensureIssuance: jest.fn(async () => { calls.push("issuance"); return { cadTrustId: "i", commitOwed: false }; }),
      });

      await handler.handle();

      expect(calls).toEqual(["validation", "verification", "issuance"]);
    });

    it("commits once per group that owed a commit", async () => {
      const { handler, commitHandler } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord(),
          snapshotRecord({ localEntityType: CadTrustLocalEntityType.VERIFICATION, localId: "0042-VERIFICATION-v1", syncProps: { refId: REF_ID_1, documentVersion: 1 } }),
        ],
        ensureValidation: jest.fn(async () => ({ cadTrustId: "v", commitOwed: true })),
        ensureVerification: jest.fn(async () => ({ cadTrustId: "v", commitOwed: true })),
      });

      await handler.handle();

      expect(commitHandler.handle).toHaveBeenCalledTimes(2);
    });

    it("falls back to the stored payload when a legacy row has no syncProps", async () => {
      const { handler, resources } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord({
            syncProps: null,
            payload: {
              validationId: "0042-PDD-v1",
              validationDate: "2026-03-15",
              validationCreditPeriodStartDate: "2026-01-01",
            },
          }),
        ],
      });

      await handler.handle();

      expect(resources.ensureValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          refId: "0042",
          documentType: "PDD",
          documentVersion: 1,
          validationDate: "2026-03-15",
          creditPeriodStartDate: "2026-01-01",
        })
      );
    });

    it("warns and leaves the record alone when it has neither syncProps nor a usable payload", async () => {
      const { handler, resources, logger } = buildHandler({
        failedSnapshotRecords: [snapshotRecord({ syncProps: null, payload: null })],
      });

      await handler.handle();

      expect(resources.ensureValidation).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("0042-PDD-v1"));
    });

    it("does not let one bad snapshot record abort the sweep", async () => {
      const { handler, creditResources } = buildHandler({
        failedSnapshotRecords: [
          snapshotRecord(),
          snapshotRecord({ localEntityType: CadTrustLocalEntityType.VERIFICATION, localId: "0042-VERIFICATION-v1", syncProps: { refId: REF_ID_1, documentVersion: 1 } }),
        ],
        ensureValidation: jest.fn(async () => {
          throw new Error("CAD Trust node unreachable");
        }),
      });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(creditResources.ensureVerification).toHaveBeenCalled();
    });

    it("does nothing and logs when there are no FAILED snapshot records", async () => {
      const { handler, resources, creditResources } = buildHandler();

      await handler.handle();

      expect(resources.ensureValidation).not.toHaveBeenCalled();
      expect(creditResources.ensureVerification).not.toHaveBeenCalled();
      expect(creditResources.ensureIssuance).not.toHaveBeenCalled();
    });
  });

  describe("the head-of-line guarantee", () => {
    it("does not rethrow when checking the staged batch throws", async () => {
      const hasUncommittedStagedRowsImpl = jest.fn(async () => {
        throw new Error("node unreachable");
      });
      const { handler } = buildHandler({ hasUncommittedStagedRowsImpl });

      await expect(handler.handle()).resolves.toBeUndefined();
    });

    it("does not let one bad refId abort the whole reconcile pass", async () => {
      // REF_ID_1's ledger read throws outright (as opposed to the "missing from the ledger" case
      // above, which resolves null) to exercise the per-project try/catch specifically.
      const getProjectByIdImpl = jest.fn(async (refId: string) => {
        if (refId === REF_ID_1) {
          throw new Error("ledger unavailable");
        }
        return { ...LEDGER_PROJECT, refId: REF_ID_2 };
      });
      const { handler, resources } = buildHandler({
        failedRefIds: [REF_ID_1, REF_ID_2],
        getProjectByIdImpl,
      });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(resources.ensureStakeholder).toHaveBeenCalledWith(LEDGER_PROJECT.companyId);
    });

    it("does not rethrow on an unexpected error", async () => {
      const { handler } = buildHandler({
        failedRefIds: [REF_ID_1],
        ensureStakeholder: jest.fn(async () => {
          throw new Error("unexpected");
        }),
      });

      await expect(handler.handle()).resolves.toBeUndefined();
    });
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, syncRecords, commitHandler } = buildHandler({ enabled: false, failedRefIds: [REF_ID_1] });

    await handler.handle();

    expect(syncRecords.findFailedProjectRefIds).not.toHaveBeenCalled();
    expect(syncRecords.findFailedCreditBlockIds).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });
});
