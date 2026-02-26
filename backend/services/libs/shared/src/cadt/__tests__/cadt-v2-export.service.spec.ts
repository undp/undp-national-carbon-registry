import { CadtV2ExportService } from "../cadt-v2-export.service";
import { CadtV2MappingService } from "../cadt-v2-mapping.service";
import { createMockConfigService } from "./config-mock";
import {
  makeProjectEntity,
  makeProgramme,
  makeCompany,
  makeCreditBlock,
  makeAefActionsRecord,
} from "./test-fixtures";
import { TxType } from "../../enum/txtype.enum";
import { AefActionTypeEnum } from "../../enum/aef.action.type.enum";
import * as fs from "fs";
import * as ExcelJS from "exceljs";

describe("CadtV2ExportService", () => {
  let service: CadtV2ExportService;
  let mappingService: CadtV2MappingService;
  let mockProjectRepo: any;
  let mockProgrammeRepo: any;
  let mockCreditBlockRepo: any;
  let mockCountryRepo: any;
  let mockAefRepo: any;
  let mockCompanyService: any;
  let mockFileHandler: any;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const configService = createMockConfigService();
    mappingService = new CadtV2MappingService(configService as any);

    mockProjectRepo = {
      find: jest.fn().mockResolvedValue([makeProjectEntity()]),
      findByIds: jest.fn().mockResolvedValue([makeProjectEntity()]),
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

    mockAefRepo = {
      find: jest.fn().mockResolvedValue([
        makeAefActionsRecord(),
        makeAefActionsRecord({
          id: 2,
          actionType: AefActionTypeEnum.TRANSFER,
        }),
      ]),
    };

    mockCompanyService = {
      findByCompanyIds: jest.fn().mockResolvedValue([makeCompany()]),
      findByCompanyId: jest.fn().mockResolvedValue(makeCompany()),
    };

    mockFileHandler = {
      uploadFile: jest
        .fn()
        .mockResolvedValue("https://s3.example.com/exports/test.xlsx"),
    };

    mockLogger = {
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    service = new CadtV2ExportService(
      configService as any,
      mappingService,
      mockCompanyService,
      mockProjectRepo,
      mockProgrammeRepo,
      mockCreditBlockRepo,
      mockCountryRepo,
      mockAefRepo,
      mockFileHandler,
      mockLogger
    );
  });

  afterEach(() => {
    const testFiles = fs.readdirSync(".").filter(
      (f) => f.startsWith("cadt_v2_") && (f.endsWith(".xlsx") || f.endsWith(".csv"))
    );
    testFiles.forEach((f) => {
      try { fs.unlinkSync(f); } catch (_) {}
    });
  });

  describe("generateExport (XLSX)", () => {
    it("returns url and fileName", async () => {
      const result = await service.generateExport();
      expect(result.url).toBeDefined();
      expect(result.outputFileName).toMatch(/cadt_v2_export_.*\.xlsx/);
    });

    it("uploads to file handler", async () => {
      await service.generateExport();
      expect(mockFileHandler.uploadFile).toHaveBeenCalledTimes(1);
      const uploadPath = mockFileHandler.uploadFile.mock.calls[0][0];
      expect(uploadPath).toContain("documents/exports/");
    });

    it("generates file with correct sheets", async () => {
      mockFileHandler.uploadFile.mockImplementation(
        async (_path: string, content: string) => {
          const buf = Buffer.from(content, "base64");
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(buf);

          const sheetNames = wb.worksheets.map((s) => s.name);
          expect(sheetNames).toContain("Projects");
          expect(sheetNames).toContain("Locations");
          expect(sheetNames).toContain("Methodologies");
          expect(sheetNames).toContain("Stakeholders");
          expect(sheetNames).toContain("Validations");
          expect(sheetNames).toContain("Verifications");
          expect(sheetNames).toContain("Issuances");
          expect(sheetNames).toContain("Units");
          expect(sheetNames).toContain("AEF T1 Submission");
          expect(sheetNames).toContain("AEF T2 Authorizations");

          return "https://s3.example.com/test.xlsx";
        }
      );

      await service.generateExport();
    });

    it("exports project data rows", async () => {
      mockFileHandler.uploadFile.mockImplementation(
        async (_path: string, content: string) => {
          const buf = Buffer.from(content, "base64");
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(buf);

          const projectSheet = wb.getWorksheet("Projects");
          expect(projectSheet.rowCount).toBeGreaterThan(1);

          const headerRow = projectSheet.getRow(1).values as string[];
          expect(headerRow).toContain("projectId");
          expect(headerRow).toContain("projectName");

          return "https://s3.example.com/test.xlsx";
        }
      );

      await service.generateExport();
    });

    it("handles empty data without error", async () => {
      mockProjectRepo.find.mockResolvedValue([]);
      const result = await service.generateExport();
      expect(result.url).toBeDefined();
    });

    it("supports filtering by project IDs", async () => {
      await service.generateExport(["P-001"]);
      expect(mockProjectRepo.findByIds).toHaveBeenCalledWith(["P-001"]);
    });
  });

  describe("generateCsvExport", () => {
    it("returns url and fileName", async () => {
      const result = await service.generateCsvExport();
      expect(result.url).toBeDefined();
      expect(result.outputFileName).toMatch(/cadt_v2_projects_.*\.csv/);
    });

    it("uploads CSV file", async () => {
      await service.generateCsvExport();
      expect(mockFileHandler.uploadFile).toHaveBeenCalledTimes(1);
    });

    it("handles empty projects", async () => {
      mockProjectRepo.find.mockResolvedValue([]);
      const result = await service.generateCsvExport();
      expect(result.url).toBeDefined();
    });
  });
});
