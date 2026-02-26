import { CadtV2ApiService } from "../cadt-v2-api.service";
import { CadtV2MappingService } from "../cadt-v2-mapping.service";
import { createMockConfigService } from "./config-mock";
import {
  makeProjectEntity,
  makeProgramme,
  makeCompany,
  makeCreditBlock,
} from "./test-fixtures";
import { TxType } from "../../enum/txtype.enum";

jest.mock("axios");
import axios from "axios";
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe("CadtV2ApiService", () => {
  let service: CadtV2ApiService;
  let mappingService: CadtV2MappingService;
  let mockEntityMapRepo: any;
  let mockProjectRepo: any;
  let mockProgrammeRepo: any;
  let mockCreditBlockRepo: any;
  let mockCountryRepo: any;
  let mockCompanyService: any;
  let mockLogger: any;

  const storedEntities: Record<string, any> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(storedEntities).forEach((k) => delete storedEntities[k]);

    const configService = createMockConfigService();
    mappingService = new CadtV2MappingService(configService as any);

    mockEntityMapRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        const key = `${where.cadtEntityType}:${where.localEntityId}`;
        return storedEntities[key] || null;
      }),
      save: jest.fn().mockImplementation((entity) => {
        const key = `${entity.cadtEntityType}:${entity.localEntityId}`;
        storedEntities[key] = entity;
        return entity;
      }),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ lastSync: null }),
      }),
    };

    mockProjectRepo = {
      findOneBy: jest.fn().mockResolvedValue(makeProjectEntity()),
      find: jest.fn().mockResolvedValue([makeProjectEntity()]),
    };

    mockProgrammeRepo = {
      createQueryBuilder: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(makeProgramme()),
      }),
    };

    mockCreditBlockRepo = {
      find: jest.fn().mockResolvedValue([makeCreditBlock()]),
    };

    mockCountryRepo = {
      findOneBy: jest
        .fn()
        .mockResolvedValue({ alpha2: "NG", alpha3: "NGA", name: "Nigeria" }),
    };

    mockCompanyService = {
      findByCompanyIds: jest.fn().mockResolvedValue([makeCompany()]),
      findByCompanyId: jest.fn().mockResolvedValue(makeCompany()),
    };

    mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    let callCount = 0;
    mockedAxios.mockImplementation(async () => {
      callCount++;
      return {
        data: { uuid: `mock-uuid-${callCount}` },
        status: 200,
      } as any;
    });

    service = new CadtV2ApiService(
      configService as any,
      mappingService,
      mockCompanyService,
      mockEntityMapRepo,
      mockProgrammeRepo,
      mockProjectRepo,
      mockCreditBlockRepo,
      mockCountryRepo,
      mockLogger
    );
  });

  describe("syncProject", () => {
    it("makes API calls in correct dependency chain order", async () => {
      await service.syncProject("P-001");

      const urls = mockedAxios.mock.calls.map((c: any) => {
        const url: string = c[0]?.url || "";
        return url.replace(/.*v2\//, "");
      });

      const methodologyIdx = urls.findIndex((u) => u === "methodology");
      const projectIdx = urls.findIndex((u) => u === "project");
      const locationIdx = urls.findIndex((u) => u === "location");
      const stakeholderIdx = urls.findIndex((u) => u === "stakeholder");
      const pmIdx = urls.findIndex((u) => u === "project-methodology");
      const validationIdx = urls.findIndex((u) => u === "validation");
      const verificationIdx = urls.findIndex((u) => u === "verification");
      const commitIdx = urls.indexOf("staging/commit");

      expect(methodologyIdx).toBeLessThan(pmIdx);
      expect(projectIdx).toBeLessThan(locationIdx);
      expect(projectIdx).toBeLessThan(stakeholderIdx);
      expect(projectIdx).toBeLessThan(pmIdx);
      expect(validationIdx).toBeLessThan(verificationIdx);
      expect(verificationIdx).toBeLessThan(commitIdx);
    });

    it("stores UUIDs in entity map", async () => {
      await service.syncProject("P-001");

      expect(mockEntityMapRepo.save).toHaveBeenCalled();
      const savedTypes = mockEntityMapRepo.save.mock.calls.map(
        (c: any) => c[0].cadtEntityType
      );
      expect(savedTypes).toContain("project");
      expect(savedTypes).toContain("methodology");
      expect(savedTypes).toContain("location");
    });

    it("uses PUT for existing projects", async () => {
      storedEntities["project:P-001"] = {
        cadtEntityType: "project",
        localEntityId: "P-001",
        cadtUuid: "existing-uuid",
        lastSyncedAt: Date.now(),
        syncStatus: "committed",
      };

      await service.syncProject("P-001");

      const putCalls = mockedAxios.mock.calls.filter(
        (c: any) => c[0]?.method === "put"
      );
      expect(putCalls.length).toBeGreaterThan(0);
    });

    it("skips when project not found", async () => {
      mockProjectRepo.findOneBy.mockResolvedValue(null);
      await service.syncProject("P-NONEXISTENT");
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it("handles issuance and unit creation for credit blocks", async () => {
      await service.syncProject("P-001");

      const urls = mockedAxios.mock.calls.map(
        (c: any) => c[0]?.url?.replace(/.*v2\//, "") || ""
      );
      expect(urls).toContain("issuance");
      expect(urls).toContain("unit");
    });

    it("commits after staging all entities", async () => {
      await service.syncProject("P-001");

      const urls = mockedAxios.mock.calls.map(
        (c: any) => c[0]?.url?.replace(/.*v2\//, "") || ""
      );
      const commitCalls = urls.filter((u) => u === "staging/commit");
      expect(commitCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("syncAll", () => {
    it("returns synced and failed counts", async () => {
      const result = await service.syncAll();
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
    });

    it("counts failures individually", async () => {
      mockProjectRepo.find.mockResolvedValue([
        makeProjectEntity({ refId: "P-001" }),
        makeProjectEntity({ refId: "P-002" }),
      ]);

      let callNum = 0;
      mockedAxios.mockImplementation(async (config: any) => {
        callNum++;
        if (config?.url?.includes("P-002") || callNum > 20) {
          throw new Error("API error");
        }
        return { data: { uuid: `uuid-${callNum}` }, status: 200 } as any;
      });

      const result = await service.syncAll();
      expect(result.synced + result.failed).toBe(2);
    });
  });

  describe("config disabled", () => {
    it("does not make API calls when disabled", async () => {
      const disabledConfig = createMockConfigService({
        "cadTrustV2.enable": false,
      });
      const disabledService = new CadtV2ApiService(
        disabledConfig as any,
        mappingService,
        mockCompanyService,
        mockEntityMapRepo,
        mockProgrammeRepo,
        mockProjectRepo,
        mockCreditBlockRepo,
        mockCountryRepo,
        mockLogger
      );

      await disabledService.syncProject("P-001");
      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it("returns zero counts when disabled", async () => {
      const disabledConfig = createMockConfigService({
        "cadTrustV2.enable": false,
      });
      const disabledService = new CadtV2ApiService(
        disabledConfig as any,
        mappingService,
        mockCompanyService,
        mockEntityMapRepo,
        mockProgrammeRepo,
        mockProjectRepo,
        mockCreditBlockRepo,
        mockCountryRepo,
        mockLogger
      );

      const result = await disabledService.syncAll();
      expect(result).toEqual({ synced: 0, failed: 0 });
    });
  });

  describe("getSyncStatus", () => {
    it("returns status with defaults when no syncs", async () => {
      const status = await service.getSyncStatus();
      expect(status.lastSyncTime).toBeNull();
      expect(status.projectCount).toBe(0);
      expect(status.failedCount).toBe(0);
    });
  });

  describe("error handling", () => {
    it("logs errors when API calls fail", async () => {
      mockedAxios.mockRejectedValueOnce(new Error("Network error"));

      await expect(service.syncProject("P-001")).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
