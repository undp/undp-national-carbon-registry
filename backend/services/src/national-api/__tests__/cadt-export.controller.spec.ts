import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, HttpStatus } from "@nestjs/common";
import * as request from "supertest";
import { CadtExportController } from "../cadt-export.controller";
import { CadtV2ApiService } from "@app/shared/cadt/cadt-v2-api.service";
import { CadtV2ExportService } from "@app/shared/cadt/cadt-v2-export.service";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";

describe("CadtExportController (e2e)", () => {
  let app: INestApplication;
  let mockApiService: Partial<CadtV2ApiService>;
  let mockExportService: Partial<CadtV2ExportService>;

  const mockAuthGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  const mockPoliciesGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    mockApiService = {
      syncAll: jest.fn().mockResolvedValue({ synced: 5, failed: 0 }),
      syncProject: jest.fn().mockResolvedValue(undefined),
      getSyncStatus: jest.fn().mockResolvedValue({
        lastSyncTime: 1672531200000,
        projectCount: 5,
        failedCount: 0,
      }),
    };

    mockExportService = {
      generateExport: jest.fn().mockResolvedValue({
        url: "https://s3.example.com/export.xlsx",
        outputFileName: "cadt_v2_export.xlsx",
      }),
      generateCsvExport: jest.fn().mockResolvedValue({
        url: "https://s3.example.com/export.csv",
        outputFileName: "cadt_v2_projects.csv",
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [CadtExportController],
      providers: [
        { provide: CadtV2ApiService, useValue: mockApiService },
        { provide: CadtV2ExportService, useValue: mockExportService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(PoliciesGuard)
      .useValue(mockPoliciesGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /cadtExport/status", () => {
    it("returns sync status", async () => {
      const resp = await request(app.getHttpServer())
        .get("/cadtExport/status")
        .expect(HttpStatus.OK);

      expect(resp.body.lastSyncTime).toBe(1672531200000);
      expect(resp.body.projectCount).toBe(5);
      expect(resp.body.failedCount).toBe(0);
    });

    it("returns correct status when no sync performed", async () => {
      (mockApiService.getSyncStatus as jest.Mock).mockResolvedValue({
        lastSyncTime: null,
        projectCount: 0,
        failedCount: 0,
      });

      const resp = await request(app.getHttpServer())
        .get("/cadtExport/status")
        .expect(HttpStatus.OK);

      expect(resp.body.lastSyncTime).toBeNull();
      expect(resp.body.projectCount).toBe(0);
    });
  });

  describe("GET /cadtExport/download", () => {
    it("returns xlsx download URL by default", async () => {
      const resp = await request(app.getHttpServer())
        .get("/cadtExport/download")
        .expect(HttpStatus.OK);

      expect(resp.body.url).toBe("https://s3.example.com/export.xlsx");
      expect(resp.body.outputFileName).toMatch(/\.xlsx$/);
      expect(mockExportService.generateExport).toHaveBeenCalled();
    });

    it("returns csv download URL when format=csv", async () => {
      const resp = await request(app.getHttpServer())
        .get("/cadtExport/download?format=csv")
        .expect(HttpStatus.OK);

      expect(resp.body.url).toBe("https://s3.example.com/export.csv");
      expect(mockExportService.generateCsvExport).toHaveBeenCalled();
    });

    it("returns 500 when export fails", async () => {
      (mockExportService.generateExport as jest.Mock).mockRejectedValue(
        new Error("Export failure")
      );

      await request(app.getHttpServer())
        .get("/cadtExport/download")
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("POST /cadtExport/sync", () => {
    it("triggers full sync and returns results", async () => {
      const resp = await request(app.getHttpServer())
        .post("/cadtExport/sync")
        .expect(HttpStatus.CREATED);

      expect(resp.body.synced).toBe(5);
      expect(resp.body.failed).toBe(0);
      expect(mockApiService.syncAll).toHaveBeenCalled();
    });

    it("returns 500 when sync fails", async () => {
      (mockApiService.syncAll as jest.Mock).mockRejectedValue(
        new Error("Sync failure")
      );

      await request(app.getHttpServer())
        .post("/cadtExport/sync")
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("POST /cadtExport/syncProject/:id", () => {
    it("syncs a single project", async () => {
      const resp = await request(app.getHttpServer())
        .post("/cadtExport/syncProject/P-001")
        .expect(HttpStatus.CREATED);

      expect(resp.body.message).toContain("P-001");
      expect(mockApiService.syncProject).toHaveBeenCalledWith("P-001");
    });

    it("returns 500 for sync failure", async () => {
      (mockApiService.syncProject as jest.Mock).mockRejectedValue(
        new Error("Project not found")
      );

      await request(app.getHttpServer())
        .post("/cadtExport/syncProject/P-999")
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("Auth required", () => {
    it("returns 403 when auth guard rejects", async () => {
      mockAuthGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .get("/cadtExport/status")
        .expect(HttpStatus.FORBIDDEN);
    });

    it("returns 403 when policies guard rejects", async () => {
      mockPoliciesGuard.canActivate.mockReturnValueOnce(false);

      await request(app.getHttpServer())
        .post("/cadtExport/sync")
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
