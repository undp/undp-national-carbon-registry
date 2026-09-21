import { CadTrustLocalEntityType } from "../enum/cadtrust.local.entity.type.enum";
import { CadTrustResourceType } from "../enum/cadtrust.resource.type.enum";
import { CadTrustSyncStatus } from "../enum/cadtrust.sync.status.enum";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { CadTrustProjectResourceService } from "./cadtrust-project-resource.service";

const REF_ID = "0042";
const COMPANY_ID = 7;

const STAKEHOLDER_KEY = {
  localEntityType: CadTrustLocalEntityType.STAKEHOLDER,
  localId: String(COMPANY_ID),
  cadTrustEntityType: CadTrustResourceType.STAKEHOLDER,
};
const PROJECT_KEY = {
  localEntityType: CadTrustLocalEntityType.PROJECT,
  localId: REF_ID,
  cadTrustEntityType: CadTrustResourceType.PROJECT,
};
const PROJECT_METHODOLOGY_KEY = {
  localEntityType: CadTrustLocalEntityType.PROJECT_METHODOLOGY,
  localId: REF_ID,
  cadTrustEntityType: CadTrustResourceType.PROJECT_METHODOLOGY,
};
const STAKEHOLDER_PROJECT_KEY = {
  localEntityType: CadTrustLocalEntityType.STAKEHOLDER_PROJECT,
  localId: REF_ID,
  cadTrustEntityType: CadTrustResourceType.STAKEHOLDER_PROJECT,
};
const LOCATION_KEY = {
  localEntityType: CadTrustLocalEntityType.LOCATION,
  localId: REF_ID,
  cadTrustEntityType: CadTrustResourceType.LOCATION,
};

// A snapshot — the shape CadTrustProjectCreateSnapshot / ProjectEntity share. See
// CadTrustProjectCreateSnapshot's doc for why callers pass this rather than a live
// project_entity read.
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

const COMPANY = { companyId: COMPANY_ID, name: "Kunene Developers", website: "https://kunenedev.example.org" };
const INF_WITH_LOCATION = { projectDescription: "d", province: "Kunene" };

type EntityKey = "stakeholder" | "project" | "methodology" | "stakeholderProject" | "location";

function buildService(
  overrides: {
    /** Sub-entity already COMMITTED — nothing to do. */
    alreadySynced?: Partial<Record<EntityKey, boolean>>;
    /** Sub-entity STAGED by a prior run whose commit never landed — commit owed, no re-stage. */
    staged?: Partial<Record<EntityKey, boolean>>;
    /** Sub-entity FAILED by a prior run — triggers the orphan-adopt lookup before re-staging. */
    failed?: Partial<Record<EntityKey, boolean>>;
    syncedProgramId?: string | undefined;
    syncedMethodologyId?: string | undefined;
    company?: any;
    infContent?: any;
    /** ensureValidation: the synced CAD Trust project id. Omit for "synced"; pass undefined for "not synced". */
    validationProjectId?: string | undefined;
    /** ensureValidation: force the VALIDATION sync record's status (COMMITTED / STAGED / FAILED). */
    validationSyncStatus?: CadTrustSyncStatus;
    stageStakeholder?: jest.Mock;
    stageProject?: jest.Mock;
    stageProjectMethodology?: jest.Mock;
    stageStakeholderProject?: jest.Mock;
    stageLocation?: jest.Mock;
    stageValidation?: jest.Mock;
    /** Stub for `client.staging.listAll` — the orphan-adopt lookup. Defaults to yielding nothing. */
    stagingListAll?: jest.Mock;
  } = {}
) {
  const alreadySynced = overrides.alreadySynced ?? {};
  const staged = overrides.staged ?? {};
  const failed = overrides.failed ?? {};

  const stageStakeholder =
    overrides.stageStakeholder ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-stakeholder-1", cadTrustStakeholderId: "cadt-stakeholder-1", success: true },
    }));
  const stageProject =
    overrides.stageProject ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-project-1", cadTrustProjectId: "cadt-project-1", success: true },
    }));
  const stageProjectMethodology =
    overrides.stageProjectMethodology ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-pm-1", cadTrustProjectMethodologyId: "cadt-pm-1", success: true },
    }));
  const stageStakeholderProject =
    overrides.stageStakeholderProject ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-sp-1", cadTrustStakeholderProjectId: "cadt-sp-1", success: true },
    }));
  const stageLocation =
    overrides.stageLocation ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-loc-1", cadTrustLocationId: "cadt-loc-1", success: true },
    }));
  const stageValidation =
    overrides.stageValidation ??
    jest.fn(async () => ({
      staged: true as const,
      response: { message: "ok", uuid: "staging-validation-1", cadTrustValidationId: "cadt-validation-1", success: true },
    }));

  const documentRepo = {
    findOne: jest.fn(async () => ({ content: overrides.infContent ?? INF_WITH_LOCATION })),
  };
  const companyRepo = {
    findOne: jest.fn(async () => (overrides.company === undefined ? COMPANY : overrides.company)),
  };

  const syncedIds: Record<string, string> = {
    STAKEHOLDER: "cadt-stakeholder-cached",
    PROJECT: "cadt-project-cached",
    PROJECT_METHODOLOGY: "cadt-pm-cached",
    STAKEHOLDER_PROJECT: "cadt-sp-cached",
    LOCATION: "cadt-loc-cached",
  };

  const entityKeyFor = (localEntityType: CadTrustLocalEntityType): EntityKey | undefined => {
    switch (localEntityType) {
      case CadTrustLocalEntityType.STAKEHOLDER:
        return "stakeholder";
      case CadTrustLocalEntityType.PROJECT:
        return "project";
      case CadTrustLocalEntityType.PROJECT_METHODOLOGY:
        return "methodology";
      case CadTrustLocalEntityType.STAKEHOLDER_PROJECT:
        return "stakeholderProject";
      case CadTrustLocalEntityType.LOCATION:
        return "location";
      default:
        return undefined;
    }
  };

  const syncRecords = {
    // Backs `existingSync()`. `alreadySynced`/`staged`/`failed` map onto the three statuses the
    // service distinguishes — COMMITTED (nothing to do), STAGED (commit owed, don't re-stage),
    // FAILED (triggers the orphan-adopt lookup before re-staging).
    find: jest.fn(async (key: any) => {
      if (key.localEntityType === CadTrustLocalEntityType.VALIDATION) {
        return overrides.validationSyncStatus
          ? { syncStatus: overrides.validationSyncStatus, cadTrustId: "cadt-validation-cached" }
          : null;
      }
      const entityKey = entityKeyFor(key.localEntityType);
      if (!entityKey) {
        return null;
      }
      const syncStatus = alreadySynced[entityKey]
        ? CadTrustSyncStatus.COMMITTED
        : staged[entityKey]
        ? CadTrustSyncStatus.STAGED
        : failed[entityKey]
        ? CadTrustSyncStatus.FAILED
        : undefined;
      return syncStatus ? { syncStatus, cadTrustId: syncedIds[key.localEntityType] } : null;
    }),
    // Backs ensureValidation's PROJECT-id lookup. Defaults to "the project is synced"; pass
    // `validationProjectId: undefined` to exercise the "project not yet synced" branch.
    getCadTrustId: jest.fn(async () =>
      "validationProjectId" in overrides ? overrides.validationProjectId : "cadt-project-1"
    ),
    recordSyncProps: jest.fn(async () => undefined),
    getSyncedCadTrustId: jest.fn(async (_localEntityType: any, cadTrustEntityType: any) => {
      if (cadTrustEntityType === CadTrustResourceType.PROGRAM) return overrides.syncedProgramId;
      if (cadTrustEntityType === CadTrustResourceType.METHODOLOGY) {
        // Distinguish "not specified" (default: bootstrapped) from an explicit
        // `undefined` override (not yet bootstrapped) — `??` can't tell these
        // apart, since both read as `undefined`.
        return "syncedMethodologyId" in overrides ? overrides.syncedMethodologyId : "cadt-methodology-1";
      }
      return undefined;
    }),
    markStaged: jest.fn(async () => undefined),
    markFailed: jest.fn(async () => undefined),
  };

  const projectMapper = { toCreateInput: jest.fn(async () => ({ projectId: REF_ID })) };
  const validationMapper = {
    toCreateInput: jest.fn(async (_props: any, validationId: string, cadTrustProjectId: string) => ({
      validationId,
      cadTrustProjectId,
      validationType: "Validation of Project Design Document",
      validationBody: "Default VVB",
    })),
  };
  const stakeholderMapper = {
    toCreateInput: jest.fn(async (company: any) => ({
      stakeholderName: company.name,
      stakeholderType: "Developer",
      ...(company.website ? { stakeholderLink: company.website } : {}),
    })),
  };
  const locationMapper = {
    toCreateInput: jest.fn(async (cadTrustProjectId: string, infContent: any) =>
      infContent?.province
        ? { cadTrustProjectId, locationCountry: "CountryX", locationRegion: infContent.province }
        : undefined
    ),
  };

  // The orphan-adopt lookup (adoptOrphanedStagedRow) — defaults to "the node has nothing".
  const stagingListAll = overrides.stagingListAll ?? jest.fn(async function* () {});

  const cadTrustV2Service = {
    getClient: () => ({
      stakeholder: { stageCreate: stageStakeholder },
      project: { stageCreate: stageProject },
      projectMethodology: { stageCreate: stageProjectMethodology },
      stakeholderProject: { stageCreate: stageStakeholderProject },
      location: { stageCreate: stageLocation },
      validation: { stageCreate: stageValidation },
      staging: { listAll: stagingListAll },
    }),
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  const service = new CadTrustProjectResourceService(
    documentRepo as any,
    companyRepo as any,
    syncRecords as any,
    projectMapper as any,
    stakeholderMapper as any,
    locationMapper as any,
    validationMapper as any,
    cadTrustV2Service as any,
    logger as any
  );

  return {
    service,
    documentRepo,
    companyRepo,
    syncRecords,
    projectMapper,
    stakeholderMapper,
    locationMapper,
    stageStakeholder,
    stageProject,
    stageProjectMethodology,
    stageStakeholderProject,
    stageLocation,
    stageValidation,
    validationMapper,
    stagingListAll,
    logger,
  };
}

const VALIDATION_PROPS = {
  refId: REF_ID,
  documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
  documentVersion: 1,
  validationBodyName: "Kunene Certifiers",
  creditPeriodStartDate: "2026-01-01",
  creditPeriodEndDate: "2033-01-01",
  validationDate: "2026-03-15",
};
const VALIDATION_KEY = {
  localEntityType: CadTrustLocalEntityType.VALIDATION,
  localId: "0042-PDD-v1",
  cadTrustEntityType: CadTrustResourceType.VALIDATION,
};

describe("CadTrustProjectResourceService", () => {
  describe("ensureStakeholder", () => {
    it("stages a fresh stakeholder and reports a commit is owed", async () => {
      const { service, syncRecords, stageStakeholder } = buildService();

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ cadTrustId: "cadt-stakeholder-1", commitOwed: true });
      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        STAKEHOLDER_KEY,
        { cadTrustId: "cadt-stakeholder-1", stagingUuid: "staging-stakeholder-1" },
        expect.any(Object)
      );
    });

    it("reuses the cached id and does not re-stage when already COMMITTED", async () => {
      const { service, stageStakeholder } = buildService({ alreadySynced: { stakeholder: true } });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-stakeholder-cached", commitOwed: false });
    });

    it("reports commit owed without re-staging when STAGED but never committed", async () => {
      const { service, stageStakeholder } = buildService({ staged: { stakeholder: true } });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-stakeholder-cached", commitOwed: true });
    });

    it("marks FAILED and returns undefined when the company is not found", async () => {
      const { service, syncRecords, stageStakeholder } = buildService({ company: null });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(STAKEHOLDER_KEY, expect.any(Error));
    });

    it("adopts a matching orphaned staging row instead of re-staging, when FAILED before", async () => {
      const stagingListAll = jest.fn(async function* (query: any) {
        if (query.table === "stakeholder") {
          yield {
            uuid: "staging-orphan-1",
            committed: false,
            failed_commit: false,
            diff: { change: [{ stakeholder_name: "Kunene Developers" }] },
          };
        }
      });
      const { service, syncRecords, stageStakeholder } = buildService({
        failed: { stakeholder: true },
        stagingListAll,
      });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "staging-orphan-1", commitOwed: true });
      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        STAKEHOLDER_KEY,
        { cadTrustId: "staging-orphan-1", stagingUuid: "staging-orphan-1" },
        { stakeholder_name: "Kunene Developers" }
      );
    });

    it("stages fresh when FAILED before but no matching orphan row exists", async () => {
      const { service, stageStakeholder } = buildService({ failed: { stakeholder: true } });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(stageStakeholder).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ cadTrustId: "cadt-stakeholder-1", commitOwed: true });
    });

    it("marks FAILED and returns undefined when the stage call throws", async () => {
      const stageStakeholder = jest.fn(async () => {
        throw new Error("connect ECONNREFUSED");
      });
      const { service, syncRecords } = buildService({ stageStakeholder });

      const result = await service.ensureStakeholder(COMPANY_ID);

      expect(result).toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(STAKEHOLDER_KEY, expect.any(Error), expect.any(Object));
    });
  });

  describe("ensureProject", () => {
    it("stages a fresh project, attaching the program link when one is synced", async () => {
      const { service, stageProject, syncRecords } = buildService({ syncedProgramId: "cadt-program-1" });

      const result = await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      expect(stageProject).toHaveBeenCalledWith(expect.objectContaining({ cadTrustProgramId: "cadt-program-1" }));
      expect(result).toEqual({ cadTrustId: "cadt-project-1", commitOwed: true });
      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        PROJECT_KEY,
        { cadTrustId: "cadt-project-1", stagingUuid: "staging-project-1" },
        expect.objectContaining({ cadTrustProgramId: "cadt-program-1" })
      );
    });

    it("omits the program link when no program is synced yet", async () => {
      const { service, stageProject } = buildService({ syncedProgramId: undefined });

      await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      const input = stageProject.mock.calls[0][0];
      expect(input).not.toHaveProperty("cadTrustProgramId");
    });

    it("reuses the cached id without re-staging when already COMMITTED", async () => {
      const { service, stageProject } = buildService({ alreadySynced: { project: true } });

      const result = await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      expect(stageProject).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-project-cached", commitOwed: false });
    });

    it("reports commit owed without re-staging when STAGED but never committed", async () => {
      const { service, stageProject } = buildService({ staged: { project: true } });

      const result = await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      expect(stageProject).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-project-cached", commitOwed: true });
    });

    it("adopts a matching orphaned staging row instead of re-staging, when FAILED before", async () => {
      const stagingListAll = jest.fn(async function* (query: any) {
        if (query.table === "project") {
          yield {
            uuid: "staging-orphan-2",
            committed: false,
            failed_commit: false,
            diff: { change: [{ project_id: REF_ID }] },
          };
        }
      });
      const { service, stageProject } = buildService({ failed: { project: true }, stagingListAll });

      const result = await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      expect(stageProject).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "staging-orphan-2", commitOwed: true });
    });

    it("marks FAILED and returns undefined when the stage call throws", async () => {
      const error = new Error("projectLink must be a valid URI");
      const stageProject = jest.fn(async () => {
        throw error;
      });
      const { service, syncRecords } = buildService({ stageProject });

      const result = await service.ensureProject(REF_ID, SNAPSHOT, INF_WITH_LOCATION);

      expect(result).toBeUndefined();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(PROJECT_KEY, error, expect.any(Object));
    });
  });

  describe("ensureProjectMethodology", () => {
    it("links the project to the bootstrapped methodology", async () => {
      const { service, stageProjectMethodology, syncRecords } = buildService();

      const result = await service.ensureProjectMethodology(REF_ID, "cadt-project-1", SNAPSHOT.createTime);

      expect(stageProjectMethodology).toHaveBeenCalledWith({
        cadTrustProjectId: "cadt-project-1",
        cadTrustMethodologyId: "cadt-methodology-1",
        projectMethodologyDate: "2023-11-14",
      });
      expect(result).toBe(true);
      expect(syncRecords.markStaged).toHaveBeenCalled();
    });

    it("is marked FAILED with a clear message when no methodology has been bootstrapped yet", async () => {
      const { service, syncRecords, stageProjectMethodology } = buildService({ syncedMethodologyId: undefined });

      const result = await service.ensureProjectMethodology(REF_ID, "cadt-project-1", SNAPSHOT.createTime);

      expect(result).toBe(false);
      expect(stageProjectMethodology).not.toHaveBeenCalled();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(PROJECT_METHODOLOGY_KEY, expect.any(Error));
      const call: any[] = syncRecords.markFailed.mock.calls.find(
        (args: any[]) => args[0].localEntityType === CadTrustLocalEntityType.PROJECT_METHODOLOGY
      );
      expect(call[1].message).toContain("Bootstrap");
    });

    it("reports true without re-staging when already COMMITTED or STAGED", async () => {
      const { service: committedService, stageProjectMethodology: committedStage } = buildService({
        alreadySynced: { methodology: true },
      });
      expect(await committedService.ensureProjectMethodology(REF_ID, "cadt-project-1", SNAPSHOT.createTime)).toBe(
        false
      );
      expect(committedStage).not.toHaveBeenCalled();

      const { service: stagedService, stageProjectMethodology: stagedStage } = buildService({
        staged: { methodology: true },
      });
      expect(await stagedService.ensureProjectMethodology(REF_ID, "cadt-project-1", SNAPSHOT.createTime)).toBe(true);
      expect(stagedStage).not.toHaveBeenCalled();
    });
  });

  describe("ensureStakeholderProject", () => {
    it("links the project to its stakeholder", async () => {
      const { service, stageStakeholderProject } = buildService();

      const result = await service.ensureStakeholderProject(REF_ID, "cadt-project-1", "cadt-stakeholder-1");

      expect(stageStakeholderProject).toHaveBeenCalledWith({
        cadTrustStakeholderId: "cadt-stakeholder-1",
        cadTrustProjectId: "cadt-project-1",
      });
      expect(result).toBe(true);
    });

    it("adopts a matching orphaned staging row instead of re-staging, when FAILED before", async () => {
      const stagingListAll = jest.fn(async function* (query: any) {
        if (query.table === "stakeholderProject") {
          yield {
            uuid: "staging-orphan-3",
            committed: false,
            failed_commit: false,
            diff: { change: [{ cad_trust_stakeholder_id: "cadt-stakeholder-1", cad_trust_project_id: "cadt-project-1" }] },
          };
        }
      });
      const { service, stageStakeholderProject } = buildService({
        failed: { stakeholderProject: true },
        stagingListAll,
      });

      const result = await service.ensureStakeholderProject(REF_ID, "cadt-project-1", "cadt-stakeholder-1");

      expect(stageStakeholderProject).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("ensureLocation", () => {
    it("stages the location when the INF has location data", async () => {
      const { service, stageLocation } = buildService();

      const result = await service.ensureLocation(REF_ID, "cadt-project-1", INF_WITH_LOCATION);

      expect(stageLocation).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it("skips gracefully — not a failure — when the INF has no location data", async () => {
      const { service, stageLocation, syncRecords } = buildService({ infContent: { projectDescription: "d" } });

      const result = await service.ensureLocation(REF_ID, "cadt-project-1", { projectDescription: "d" });

      expect(stageLocation).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(syncRecords.markFailed).not.toHaveBeenCalledWith(LOCATION_KEY, expect.anything());
    });

    it("adopts a matching orphaned staging row instead of re-staging, when FAILED before", async () => {
      const stagingListAll = jest.fn(async function* (query: any) {
        if (query.table === "location") {
          yield {
            uuid: "staging-orphan-4",
            committed: false,
            failed_commit: false,
            diff: { change: [{ cad_trust_project_id: "cadt-project-1" }] },
          };
        }
      });
      const { service, stageLocation } = buildService({ failed: { location: true }, stagingListAll });

      const result = await service.ensureLocation(REF_ID, "cadt-project-1", INF_WITH_LOCATION);

      expect(stageLocation).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe("ensureValidation", () => {
    it("records the inbound snapshot, then stages a validation record and reports a commit is owed", async () => {
      const { service, syncRecords, stageValidation, validationMapper } = buildService();

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(syncRecords.recordSyncProps).toHaveBeenCalledWith(VALIDATION_KEY, expect.objectContaining({ refId: REF_ID }));
      expect(validationMapper.toCreateInput).toHaveBeenCalledWith(VALIDATION_PROPS, "0042-PDD-v1", "cadt-project-1");
      expect(stageValidation).toHaveBeenCalledTimes(1);
      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        VALIDATION_KEY,
        { cadTrustId: "cadt-validation-1", stagingUuid: "staging-validation-1" },
        expect.any(Object)
      );
      expect(result).toEqual({ cadTrustId: "cadt-validation-1", commitOwed: true });
    });

    it("keys a validation-report approval differently from a PDD approval on the same project", async () => {
      const { service, syncRecords } = buildService();

      await service.ensureValidation({ ...VALIDATION_PROPS, documentType: DocumentTypeEnum.VALIDATION } as any);

      expect(syncRecords.markStaged).toHaveBeenCalledWith(
        expect.objectContaining({ localId: "0042-VALIDATION-v1" }),
        expect.anything(),
        expect.anything()
      );
    });

    it("reuses the cached id and does not re-stage when already COMMITTED", async () => {
      const { service, stageValidation } = buildService({
        validationSyncStatus: CadTrustSyncStatus.COMMITTED,
      });

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(stageValidation).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-validation-cached", commitOwed: false });
    });

    it("reports commit owed without re-staging when STAGED but never committed", async () => {
      const { service, stageValidation } = buildService({
        validationSyncStatus: CadTrustSyncStatus.STAGED,
      });

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(stageValidation).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-validation-cached", commitOwed: true });
    });

    it("marks FAILED (with the snapshot already recorded) and returns undefined when the project is not yet synced", async () => {
      const { service, syncRecords, stageValidation } = buildService({ validationProjectId: undefined });

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(syncRecords.recordSyncProps).toHaveBeenCalled();
      expect(stageValidation).not.toHaveBeenCalled();
      expect(syncRecords.markFailed).toHaveBeenCalledWith(VALIDATION_KEY, expect.any(Error));
      const failCall: any[] = syncRecords.markFailed.mock.calls[0];
      expect(failCall[1].message).toContain("not yet synced");
      expect(result).toBeUndefined();
    });

    it("marks FAILED and returns undefined when staging throws", async () => {
      const stageValidation = jest.fn(async () => {
        throw new Error("CAD Trust rejected the validation payload");
      });
      const { service, syncRecords } = buildService({ stageValidation });

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(syncRecords.markFailed).toHaveBeenCalledWith(VALIDATION_KEY, expect.any(Error), expect.any(Object));
      expect(result).toBeUndefined();
    });

    it("adopts a matching orphaned staging row instead of re-staging, when FAILED before", async () => {
      const stagingListAll = jest.fn(async function* (query: any) {
        if (query.table === "validation") {
          yield {
            uuid: "staging-orphan-v1",
            committed: false,
            failed_commit: false,
            diff: { change: [{ validation_id: "0042-PDD-v1", cad_trust_validation_id: "cadt-validation-orphan" }] },
          };
        }
      });
      const { service, stageValidation } = buildService({
        validationSyncStatus: CadTrustSyncStatus.FAILED,
        stagingListAll,
      });

      const result = await service.ensureValidation(VALIDATION_PROPS as any);

      expect(stageValidation).not.toHaveBeenCalled();
      expect(result).toEqual({ cadTrustId: "cadt-validation-orphan", commitOwed: true });
    });
  });

  describe("getLatestInfContent", () => {
    it("reads the latest INF document version via the repository", async () => {
      const { service, documentRepo } = buildService();

      await service.getLatestInfContent(REF_ID);

      expect(documentRepo.findOne).toHaveBeenCalledWith({
        where: { programmeId: REF_ID, type: DocumentTypeEnum.INITIAL_NOTIFICATION_FORM },
        order: { version: "DESC" },
      });
    });
  });
});
