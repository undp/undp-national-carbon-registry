import { CadTrustLocalEntityType } from "../../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../../enum/cadtrust.sync.status.enum";
import { CadTrustBootstrapHandler } from "./bootstrap.handler";

const ORGANIZATION_KEY = {
  localEntityType: CadTrustLocalEntityType.ORGANIZATION,
  localId: "HOME",
  cadTrustEntityType: CadTrustResourceType.ORGANIZATION,
};
const PROGRAM_KEY = {
  localEntityType: CadTrustLocalEntityType.PROGRAM,
  localId: "activity-1",
  cadTrustEntityType: CadTrustResourceType.PROGRAM,
};
const METHODOLOGY_KEY = {
  localEntityType: CadTrustLocalEntityType.METHODOLOGY,
  localId: "NCC-1",
  cadTrustEntityType: CadTrustResourceType.METHODOLOGY,
};

const PROGRAM_INPUT = {
  programName: "Test Program",
  programRegistry: "Test Registry",
  programRegistryActivityId: "activity-1",
};
const METHODOLOGY_INPUT = { methodologyCode: "NCC-1", methodologyName: "Test Methodology" };

function buildHandler(
  overrides: {
    enabled?: boolean;
    configProblems?: string[];
    /** Program/methodology: simulates an existing sync record already COMMITTED — fully done. */
    alreadySynced?: Partial<Record<"organization" | "program" | "methodology", boolean>>;
    /**
     * Program/methodology: simulates an existing sync record that's STAGED but never got
     * committed — the exact stuck state this handler used to never retry. Distinct from
     * `alreadySynced` above, which represents COMMITTED (fully done, no retry needed).
     */
    stagedNotCommitted?: Partial<Record<"program" | "methodology", boolean>>;
    organizations?: Record<string, { org_uid: string; name: string; is_home: boolean }>;
    listOrganizations?: jest.Mock;
    stageProgram?: jest.Mock;
    stageMethodology?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const alreadySynced = overrides.alreadySynced ?? {};
  const stagedNotCommitted = overrides.stagedNotCommitted ?? {};
  const listOrganizations =
    overrides.listOrganizations ??
    jest.fn(async () => overrides.organizations ?? { "org-uid-1": { org_uid: "org-uid-1", name: "Home Org", is_home: true } });
  const stageProgram =
    overrides.stageProgram ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-program-1", cadTrustProgramId: "cadt-program-1", success: true },
    }));
  const stageMethodology =
    overrides.stageMethodology ??
    jest.fn(async () => ({
      staged: true as const,
      response: {
        message: "ok",
        uuid: "staging-methodology-1",
        cadTrustMethodologyId: "cadt-methodology-1",
        success: true,
      },
    }));

  const syncRecords = {
    // Only ORGANIZATION goes through isAlreadySynced now — program/methodology use find()
    // instead, so a STAGED-but-not-committed record can be told apart from a COMMITTED one.
    isAlreadySynced: jest.fn(async (key: any) => {
      if (key.localEntityType === CadTrustLocalEntityType.ORGANIZATION) return alreadySynced.organization ?? false;
      return false;
    }),
    find: jest.fn(async (key: any) => {
      if (key.localEntityType === CadTrustLocalEntityType.PROGRAM) {
        if (alreadySynced.program) return { syncStatus: CadTrustSyncStatus.COMMITTED };
        if (stagedNotCommitted.program) return { syncStatus: CadTrustSyncStatus.STAGED };
      }
      if (key.localEntityType === CadTrustLocalEntityType.METHODOLOGY) {
        if (alreadySynced.methodology) return { syncStatus: CadTrustSyncStatus.COMMITTED };
        if (stagedNotCommitted.methodology) return { syncStatus: CadTrustSyncStatus.STAGED };
      }
      return null;
    }),
    getCadTrustId: jest.fn(async () => "org-uid-cached"),
    markCommitted: jest.fn(async () => undefined),
    markStaged: jest.fn(async () => undefined),
    markFailed: jest.fn(async () => undefined),
  };
  const profile = {
    getOrganizationName: jest.fn(() => "Test Registry Org"),
    getProgramInput: jest.fn(() => PROGRAM_INPUT),
    getMethodologyInput: jest.fn(async () => METHODOLOGY_INPUT),
    assertConfigured: jest.fn(() => overrides.configProblems ?? []),
  };
  // CadTrustCommitHandler is called directly (not enqueued) — see the class
  // doc. A mock satisfying the shape actually used (`handle(): Promise<void>`)
  // is enough; it already has its own dedicated spec.
  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const cadTrustV2Service = {
    getClient: () => ({
      organizations: { list: listOrganizations },
      program: { stageCreate: stageProgram },
      methodology: { stageCreate: stageMethodology },
    }),
  };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustBootstrapHandler(
    syncRecords as any,
    profile as any,
    commitHandler as any,
    cadTrustV2Service as any,
    configService as any,
    logger as any
  );

  return {
    handler,
    syncRecords,
    profile,
    commitHandler,
    listOrganizations,
    stageProgram,
    stageMethodology,
    logger,
  };
}

describe("CadTrustBootstrapHandler", () => {
  it("verifies the home organization, stages the program and methodology, and commits inline", async () => {
    const { handler, syncRecords, commitHandler } = buildHandler();

    await handler.handle();

    expect(syncRecords.markCommitted).toHaveBeenCalledWith(
      ORGANIZATION_KEY,
      { cadTrustId: "org-uid-1" },
      expect.objectContaining({ org_uid: "org-uid-1" })
    );
    expect(syncRecords.markStaged).toHaveBeenCalledWith(
      PROGRAM_KEY,
      { cadTrustId: "cadt-program-1", stagingUuid: "staging-program-1" },
      PROGRAM_INPUT
    );
    expect(syncRecords.markStaged).toHaveBeenCalledWith(
      METHODOLOGY_KEY,
      { cadTrustId: "cadt-methodology-1", stagingUuid: "staging-methodology-1" },
      METHODOLOGY_INPUT
    );
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("identifies the home organization by is_home, ignoring non-home entries in the list", async () => {
    const { handler, syncRecords } = buildHandler({
      organizations: {
        "org-uid-mirrored": { org_uid: "org-uid-mirrored", name: "Someone else's org", is_home: false },
        "org-uid-1": { org_uid: "org-uid-1", name: "Home Org", is_home: true },
      },
    });

    await handler.handle();

    expect(syncRecords.markCommitted).toHaveBeenCalledWith(
      ORGANIZATION_KEY,
      { cadTrustId: "org-uid-1" },
      expect.objectContaining({ org_uid: "org-uid-1" })
    );
  });

  it("does nothing when the integration is disabled", async () => {
    const { handler, listOrganizations, stageProgram, commitHandler } = buildHandler({ enabled: false });

    await handler.handle();

    expect(listOrganizations).not.toHaveBeenCalled();
    expect(stageProgram).not.toHaveBeenCalled();
    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("sentinel-default guard", () => {
    it("publishes nothing when the profile is not configured", async () => {
      const { handler, listOrganizations, stageProgram, syncRecords, commitHandler, logger } = buildHandler({
        configProblems: ["CADT_V2_PROGRAM_NAME is unset and systemCountryName defaults to CountryX."],
      });

      await handler.handle();

      expect(listOrganizations).not.toHaveBeenCalled();
      expect(stageProgram).not.toHaveBeenCalled();
      expect(syncRecords.markFailed).not.toHaveBeenCalled();
      expect(commitHandler.handle).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe("idempotency", () => {
    it("reuses the cached org_uid and skips list() once the organization is verified", async () => {
      const { handler, listOrganizations } = buildHandler({ alreadySynced: { organization: true } });

      await handler.handle();

      expect(listOrganizations).not.toHaveBeenCalled();
    });

    it("stages only the methodology when the program is already synced", async () => {
      const { handler, stageProgram, stageMethodology, commitHandler } = buildHandler({
        alreadySynced: { program: true },
      });

      await handler.handle();

      expect(stageProgram).not.toHaveBeenCalled();
      expect(stageMethodology).toHaveBeenCalledTimes(1);
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("does not commit when program and methodology are both already synced", async () => {
      const { handler, commitHandler } = buildHandler({
        alreadySynced: { program: true, methodology: true },
      });

      await handler.handle();

      expect(commitHandler.handle).not.toHaveBeenCalled();
    });
  });

  describe("retrying a commit that never went through", () => {
    // The bug this covers: a previous run staged program/methodology successfully, but the
    // commit itself either failed or was skipped (e.g. CadTrustCommitHandler found a different
    // commit still unconfirmed on the node) — leaving both sync records stuck at STAGED forever,
    // because the old isAlreadySynced-based check treated STAGED the same as COMMITTED and never
    // asked for a retry again.
    it("retries the commit — without re-staging — when both are STAGED but not committed", async () => {
      const { handler, stageProgram, stageMethodology, commitHandler } = buildHandler({
        stagedNotCommitted: { program: true, methodology: true },
      });

      await handler.handle();

      expect(stageProgram).not.toHaveBeenCalled();
      expect(stageMethodology).not.toHaveBeenCalled();
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("retries the commit when only the program is stuck STAGED, methodology already committed", async () => {
      const { handler, stageProgram, stageMethodology, commitHandler } = buildHandler({
        stagedNotCommitted: { program: true },
        alreadySynced: { methodology: true },
      });

      await handler.handle();

      expect(stageProgram).not.toHaveBeenCalled();
      expect(stageMethodology).not.toHaveBeenCalled();
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe("the head-of-line guarantee", () => {
    // A throw here stalls the shared async-operations cursor and stops every
    // queued action in the system, email included.
    it("does not rethrow, and does not stage program, methodology or commit, when no home organization exists", async () => {
      const { handler, syncRecords, stageProgram, stageMethodology, commitHandler } = buildHandler({
        organizations: {},
      });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(ORGANIZATION_KEY, expect.any(Error));
      expect(stageProgram).not.toHaveBeenCalled();
      expect(stageMethodology).not.toHaveBeenCalled();
      expect(commitHandler.handle).not.toHaveBeenCalled();
    });

    it("does not rethrow when the node is unreachable while verifying the organization", async () => {
      const listOrganizations = jest.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      });
      const { handler, syncRecords } = buildHandler({ listOrganizations });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(ORGANIZATION_KEY, expect.any(Error));
    });

    it("does not rethrow when staging the program fails, and still attempts the methodology", async () => {
      const stageProgram = jest.fn(async () => {
        throw new Error("CAD Trust rejected the program payload");
      });
      const { handler, syncRecords, stageMethodology, commitHandler } = buildHandler({ stageProgram });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(PROGRAM_KEY, expect.any(Error), PROGRAM_INPUT);
      expect(stageMethodology).toHaveBeenCalledTimes(1);
      // The methodology alone still staged, so committing is still worthwhile.
      expect(commitHandler.handle).toHaveBeenCalledTimes(1);
    });

    it("does not rethrow when staging the methodology fails", async () => {
      const stageMethodology = jest.fn(async () => {
        throw new Error("CAD Trust rejected the methodology payload");
      });
      const { handler, syncRecords } = buildHandler({ stageMethodology });

      await expect(handler.handle()).resolves.toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(
        METHODOLOGY_KEY,
        expect.any(Error),
        METHODOLOGY_INPUT
      );
    });

    it("does not rethrow if the (never-throwing-in-practice) commit call somehow throws", async () => {
      // CadTrustCommitHandler.handle() already never throws on its own — this
      // is only the outer catch's backstop, exercised in case that contract is
      // ever violated.
      const commit = jest.fn(async () => {
        throw new Error("unexpected");
      });
      const { handler } = buildHandler({ commit });

      await expect(handler.handle()).resolves.toBeUndefined();
    });
  });
});
