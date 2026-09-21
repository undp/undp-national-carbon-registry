import { InfSectorEnum } from "../../enum/inf.sector.enum";
import { InfSectoralScopeEnum } from "../../enum/inf.sectoral.scope.enum";
import { ProjectProposalStage } from "../../enum/projectProposalStage.enum";
import { CadTrustProjectCreateSnapshot } from "../cadtrust-sync.enqueue.service";
import { CadTrustProjectMapper } from "./project.mapper";
import { PROJECT_SECTOR_FALLBACK, PROJECT_TYPE_FALLBACK, PROJECT_UNIT_METRIC } from "./picklist.map";

const CONFIG: Record<string, any> = {
  "cadTrustV2.registryName": "Test National Registry",
  host: "https://registry.example.org",
  systemName: "SystemX",
};

function buildMapper(overrides: Record<string, any> = {}) {
  const warnOnUnknownValues = jest.fn(async (_key: string, values: string[]) => values);
  const configService = {
    get: (key: string) => ({ ...CONFIG, ...overrides })[key],
  };

  return {
    warnOnUnknownValues,
    mapper: new CadTrustProjectMapper(configService as any, { warnOnUnknownValues } as any),
  };
}

// A queue payload snapshot — see CadTrustProjectCreateSnapshot. The mapper has
// no dependency on ProjectEntity or the operational DB at all.
function buildProject(
  overrides: Partial<CadTrustProjectCreateSnapshot> = {}
): CadTrustProjectCreateSnapshot {
  return {
    refId: "0042",
    title: "Kunene Solar Farm",
    sector: InfSectorEnum.ENERGY,
    sectoralScope: InfSectoralScopeEnum.ENERGY_INDUSTRIES,
    projectProposalStage: ProjectProposalStage.PENDING,
    createTime: Date.UTC(2026, 0, 10),
    updateTime: Date.UTC(2026, 2, 15),
    companyId: 7,
    ...overrides,
  };
}

describe("CadTrustProjectMapper", () => {
  it("populates every field CAD Trust requires on create", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(buildProject());

    // ProjectCreateInput's nine required fields — a missing one is a 400 from the node.
    expect(input).toMatchObject({
      projectId: "0042",
      projectName: "Kunene Solar Farm",
      projectRegistryName: "Test National Registry",
      projectLink: "https://registry.example.org/programmeManagement/view/0042",
      projectStatus: "Listed",
      projectStatusDate: "2026-03-15",
      projectUnitMetric: PROJECT_UNIT_METRIC,
    });
    // projectSector is sourced from sectoralScope, not sector — see picklist.map.ts.
    expect(input.projectSector).toEqual(["Energy industries (renewable-/ non renewable sources)"]);
    // projectType is sourced from sector, not sectoralScope — ENERGY has no honest projectType
    // match (the real list is per-technology), so it falls back.
    expect(input.projectType).toEqual([PROJECT_TYPE_FALLBACK]);
  });

  it("wraps sector and type as arrays even though this registry stores one of each", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(buildProject());

    expect(Array.isArray(input.projectSector)).toBe(true);
    expect(Array.isArray(input.projectType)).toBe(true);
  });

  it("falls back rather than emitting undefined into a required picklist field", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProject({
        sector: "SOMETHING_UNMAPPED" as any,
        sectoralScope: InfSectoralScopeEnum.NOT_APPLICABLE,
        projectProposalStage: "LEGACY_STAGE" as any,
      })
    );

    expect(input.projectSector).toEqual([PROJECT_SECTOR_FALLBACK]);
    expect(input.projectType).toEqual([PROJECT_TYPE_FALLBACK]);
    expect(input.projectStatus).toBe("Listed");
  });

  it("maps a real projectType match when sector has one", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(buildProject({ sector: InfSectorEnum.AGRICULTURE }));

    expect(input.projectType).toEqual(["Agriculture"]);
  });

  it("maps the authorised stage to Authorized", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProject({ projectProposalStage: ProjectProposalStage.AUTHORISED })
    );

    expect(input.projectStatus).toBe("Authorized");
  });

  it("maps INF approval to Registered", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProject({ projectProposalStage: ProjectProposalStage.APPROVED })
    );

    expect(input.projectStatus).toBe("Registered");
  });

  it("maps rejections to Rejected", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProject({ projectProposalStage: ProjectProposalStage.REJECTED })
    );

    expect(input.projectStatus).toBe("Rejected");
  });

  describe("description", () => {
    it("comes from the INF jsonb, which is the only place it is stored", async () => {
      const { mapper } = buildMapper();

      const input = await mapper.toCreateInput(buildProject(), {
        projectDescription: "  A 50MW solar installation.  ",
        // Undeclared INF fields that must not leak into the payload.
        contactEmail: "someone@example.org",
        estimatedProjectCost: 1_000_000,
      });

      expect(input.projectDescription).toBe("A 50MW solar installation.");
      expect(input).not.toHaveProperty("contactEmail");
      expect(input).not.toHaveProperty("estimatedProjectCost");
    });

    it("is omitted entirely when the INF has none", async () => {
      const { mapper } = buildMapper();

      expect(await mapper.toCreateInput(buildProject(), {})).not.toHaveProperty(
        "projectDescription"
      );
      expect(await mapper.toCreateInput(buildProject(), undefined)).not.toHaveProperty(
        "projectDescription"
      );
      expect(
        await mapper.toCreateInput(buildProject(), { projectDescription: "   " })
      ).not.toHaveProperty("projectDescription");
    });
  });

  describe("projectLink", () => {
    it("tolerates a trailing slash on the configured host", async () => {
      const { mapper } = buildMapper({ host: "https://registry.example.org/" });

      const input = await mapper.toCreateInput(buildProject());

      expect(input.projectLink).toBe("https://registry.example.org/programmeManagement/view/0042");
    });
  });

  it("falls back to systemName when no registry name is configured", async () => {
    const { mapper } = buildMapper({ "cadTrustV2.registryName": undefined });

    const input = await mapper.toCreateInput(buildProject());

    expect(input.projectRegistryName).toBe("SystemX");
  });

  it("uses createTime for the status date when updateTime is absent", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProject({ updateTime: undefined, createTime: Date.UTC(2026, 0, 10) })
    );

    expect(input.projectStatusDate).toBe("2026-01-10");
  });

  it("checks every mapped picklist value against the live list", async () => {
    const { mapper, warnOnUnknownValues } = buildMapper();

    await mapper.toCreateInput(buildProject());

    expect(warnOnUnknownValues.mock.calls.map((call) => call[0])).toEqual([
      "projectSector",
      "projectType",
      "projectStatus",
    ]);
  });
});
