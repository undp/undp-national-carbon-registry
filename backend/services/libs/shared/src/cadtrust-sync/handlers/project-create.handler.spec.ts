import { ProjectProposalStage } from "../../enum/projectProposalStage.enum";
import { CadTrustProjectCreateHandler } from "./project-create.handler";

const REF_ID = "0042";
const COMPANY_ID = 7;

// The queue payload — a snapshot captured before the ledger write, not a
// project_entity read. See CadTrustProjectCreateSnapshot's doc for why.
const SNAPSHOT = {
  refId: REF_ID,
  title: "Kunene Solar",
  sector: "ENERGY",
  sectoralScope: "ENERGY_INDUSTRIES",
  projectProposalStage: ProjectProposalStage.PENDING,
  createTime: 1_700_000_000_000,
  updateTime: 1_700_000_000_000,
  companyId: COMPANY_ID,
};

const INF_CONTENT = { projectDescription: "d", province: "Kunene" };

/**
 * The real ensure* logic (dedup, STAGED-retries-commit, orphan adoption, ...) now lives on
 * `CadTrustProjectResourceService` and is covered by `cadtrust-project-resource.service.spec.ts`.
 * This suite only checks that the handler orchestrates that service correctly: calls the five
 * ensures in dependency order, decides whether a commit is owed, and never rethrows.
 */
function buildHandler(
  overrides: {
    enabled?: boolean;
    getLatestInfContent?: jest.Mock;
    ensureStakeholder?: jest.Mock;
    ensureProject?: jest.Mock;
    ensureProjectMethodology?: jest.Mock;
    ensureStakeholderProject?: jest.Mock;
    ensureLocation?: jest.Mock;
    commit?: jest.Mock;
  } = {}
) {
  const getLatestInfContent = overrides.getLatestInfContent ?? jest.fn(async () => INF_CONTENT);
  const ensureStakeholder =
    overrides.ensureStakeholder ?? jest.fn(async () => ({ cadTrustId: "cadt-stakeholder-1", commitOwed: true }));
  const ensureProject =
    overrides.ensureProject ?? jest.fn(async () => ({ cadTrustId: "cadt-project-1", commitOwed: true }));
  const ensureProjectMethodology = overrides.ensureProjectMethodology ?? jest.fn(async () => true);
  const ensureStakeholderProject = overrides.ensureStakeholderProject ?? jest.fn(async () => true);
  const ensureLocation = overrides.ensureLocation ?? jest.fn(async () => true);

  const resources = {
    getLatestInfContent,
    ensureStakeholder,
    ensureProject,
    ensureProjectMethodology,
    ensureStakeholderProject,
    ensureLocation,
  };

  const commitHandler = { handle: overrides.commit ?? jest.fn(async () => undefined) };
  const configService = { get: () => overrides.enabled ?? true };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const handler = new CadTrustProjectCreateHandler(
    resources as any,
    commitHandler as any,
    configService as any,
    logger as any
  );

  return { handler, resources, commitHandler, logger, ...resources };
}

describe("CadTrustProjectCreateHandler", () => {
  it("stages the stakeholder, the project, both links and the location, in dependency order, then commits", async () => {
    const { handler, ensureStakeholder, ensureProject, ensureProjectMethodology, ensureStakeholderProject, ensureLocation, commitHandler } =
      buildHandler();

    await handler.handle(SNAPSHOT);

    expect(ensureStakeholder).toHaveBeenCalledWith(COMPANY_ID);
    expect(ensureProject).toHaveBeenCalledWith(REF_ID, SNAPSHOT, INF_CONTENT);
    expect(ensureProjectMethodology).toHaveBeenCalledWith(REF_ID, "cadt-project-1", SNAPSHOT.createTime);
    expect(ensureStakeholderProject).toHaveBeenCalledWith(REF_ID, "cadt-project-1", "cadt-stakeholder-1");
    expect(ensureLocation).toHaveBeenCalledWith(REF_ID, "cadt-project-1", INF_CONTENT);
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("skips the project-scoped links entirely when the project itself never resolved a cadTrustId", async () => {
    const ensureProject = jest.fn(async () => undefined);
    const { handler, ensureProjectMethodology, ensureStakeholderProject, ensureLocation, commitHandler } =
      buildHandler({ ensureProject });

    await handler.handle(SNAPSHOT);

    expect(ensureProjectMethodology).not.toHaveBeenCalled();
    expect(ensureStakeholderProject).not.toHaveBeenCalled();
    expect(ensureLocation).not.toHaveBeenCalled();
    // The stakeholder alone may still have staged — still worth committing.
    expect(commitHandler.handle).toHaveBeenCalledTimes(1);
  });

  it("does not link the stakeholder-project relation when the stakeholder never resolved", async () => {
    const ensureStakeholder = jest.fn(async () => undefined);
    const { handler, ensureStakeholderProject } = buildHandler({ ensureStakeholder });

    await handler.handle(SNAPSHOT);

    expect(ensureStakeholderProject).not.toHaveBeenCalled();
  });

  it("does not commit when nothing reported a commit owed", async () => {
    const { handler, commitHandler } = buildHandler({
      ensureStakeholder: jest.fn(async () => ({ cadTrustId: "cadt-stakeholder-cached", commitOwed: false })),
      ensureProject: jest.fn(async () => ({ cadTrustId: "cadt-project-cached", commitOwed: false })),
      ensureProjectMethodology: jest.fn(async () => false),
      ensureStakeholderProject: jest.fn(async () => false),
      ensureLocation: jest.fn(async () => false),
    });

    await handler.handle(SNAPSHOT);

    expect(commitHandler.handle).not.toHaveBeenCalled();
  });

  describe("the head-of-line guarantee", () => {
    // A throw here stalls the shared async-operations cursor and stops every
    // queued action in the system, email included.
    it("does not rethrow when a resource ensure step throws unexpectedly", async () => {
      const ensureProject = jest.fn(async () => {
        throw new Error("unexpected");
      });
      const { handler } = buildHandler({ ensureProject });

      await expect(handler.handle(SNAPSHOT)).resolves.toBeUndefined();
    });

    it("does not rethrow if the inline commit call somehow throws", async () => {
      const commit = jest.fn(async () => {
        throw new Error("unexpected");
      });
      const { handler } = buildHandler({ commit });

      await expect(handler.handle(SNAPSHOT)).resolves.toBeUndefined();
    });

    it("does not rethrow on a malformed payload", async () => {
      const { handler, ensureProject } = buildHandler();

      await expect(handler.handle({} as any)).resolves.toBeUndefined();
      expect(ensureProject).not.toHaveBeenCalled();
    });
  });

  it("skips entirely when the integration is disabled", async () => {
    const { handler, ensureProject, ensureStakeholder, getLatestInfContent } = buildHandler({ enabled: false });

    await handler.handle(SNAPSHOT);

    expect(getLatestInfContent).not.toHaveBeenCalled();
    expect(ensureStakeholder).not.toHaveBeenCalled();
    expect(ensureProject).not.toHaveBeenCalled();
  });
});
