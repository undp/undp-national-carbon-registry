import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketProjectionService } from "@app/shared/regional-market/regional-market-projection.service";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";

describe("RegionalMarketAPIController", () => {
  let controller: RegionalMarketAPIController;
  let regionalMarketService: Record<string, jest.Mock>;
  let regionalMarketProjectionService: Record<string, jest.Mock>;

  const req = {
    user: { id: 12 },
    abilityCondition: { companyId: 20 },
  };

  beforeEach(async () => {
    regionalMarketService = {
      getBoundary: jest.fn().mockReturnValue({
        subsystem: "regional-carbon-market",
        mode: "registry-otc-settlement",
      }),
      queryProjects: jest.fn().mockResolvedValue({ data: [] }),
      getProjectById: jest.fn().mockResolvedValue({ refId: "PRJ-1" }),
      queryCreditBalances: jest.fn().mockResolvedValue({ data: [] }),
      queryTransfers: jest.fn().mockResolvedValue({ data: [] }),
      queryRetirements: jest.fn().mockResolvedValue({ data: [] }),
      createProjectDocument: jest.fn().mockResolvedValue({ id: 1 }),
      performProjectDocumentAction: jest
        .fn()
        .mockResolvedValue({ status: "APPROVED" }),
      issueProjectCredits: jest.fn().mockResolvedValue({ creditIssued: 100 }),
      executeOtcTrade: jest.fn().mockResolvedValue({
        registryTransaction: { id: "TX-1" },
        marketTrade: { id: "TRADE-1" },
        cashSettlementMode: "offline",
      }),
    };
    regionalMarketProjectionService = {
      getDashboardSummary: jest.fn().mockResolvedValue({
        metrics: { transferVolume: 300, averageOtcPrice: 42 },
        recentTrades: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionalMarketAPIController],
      providers: [
        RegionalMarketAPIService,
        {
          provide: RegionalMarketService,
          useValue: regionalMarketService,
        },
        {
          provide: RegionalMarketProjectionService,
          useValue: regionalMarketProjectionService,
        },
      ],
    }).compile();

    controller = module.get<RegionalMarketAPIController>(
      RegionalMarketAPIController
    );
  });

  it("returns regional registry subsystem metadata", async () => {
    await expect(controller.getInfo()).resolves.toMatchObject({
      subsystem: "regional-carbon-market",
      mode: "registry-otc-settlement",
    });
  });

  it("delegates project queries to the regional market service", async () => {
    const query = { page: 1, size: 10 };

    await expect(controller.queryProjects(query as any, req)).resolves.toEqual({
      data: [],
    });
    expect(regionalMarketService.queryProjects).toHaveBeenCalledWith(
      query,
      req.abilityCondition,
      req.user
    );
  });

  it("delegates project details to the regional market service", async () => {
    await expect(
      controller.getProjectById({ programmeId: "PRJ-1" }, req)
    ).resolves.toEqual({ refId: "PRJ-1" });
    expect(regionalMarketService.getProjectById).toHaveBeenCalledWith(
      "PRJ-1",
      req.user
    );
  });

  it("delegates credit balance queries to the regional market service", async () => {
    const query = { page: 1, size: 10 };

    await controller.queryCreditBalances(query as any, req);

    expect(regionalMarketService.queryCreditBalances).toHaveBeenCalledWith(
      query,
      req.abilityCondition,
      req.user
    );
  });

  it("delegates transfer queries to the regional market service", async () => {
    const query = { page: 1, size: 10 };

    await controller.queryTransfers(query as any, req);

    expect(regionalMarketService.queryTransfers).toHaveBeenCalledWith(
      query,
      req.abilityCondition,
      req.user
    );
  });

  it("delegates retirement queries to the regional market service", async () => {
    const query = { page: 1, size: 10 };

    await controller.queryRetirements(query as any, req);

    expect(regionalMarketService.queryRetirements).toHaveBeenCalledWith(
      query,
      req.abilityCondition,
      req.user
    );
  });

  it("delegates project document creation to the regional market service", async () => {
    const dto = { documentType: "INITIAL_NOTIFICATION_FORM" };

    await controller.createProjectDocument(dto as any, req);

    expect(regionalMarketService.createProjectDocument).toHaveBeenCalledWith(
      dto,
      req.user
    );
  });

  it("delegates project approval actions to the regional market service", async () => {
    const dto = { documentId: 1, action: "APPROVE" };

    await controller.performProjectDocumentAction(dto as any, req);

    expect(
      regionalMarketService.performProjectDocumentAction
    ).toHaveBeenCalledWith(dto, req.user);
  });

  it("delegates credit issuance to the regional market service", async () => {
    const dto = {
      activity: { projectRefId: "PRJ-1" },
      creditVerified: [{ vintage: 2025, creditAmount: 100 }],
      companyId: 20,
      document: { id: 1 },
      txRef: "TX-1",
    };

    await controller.issueProjectCredits(dto as any, req);

    expect(regionalMarketService.issueProjectCredits).toHaveBeenCalledWith(
      dto.activity,
      dto.creditVerified,
      dto.companyId,
      dto.document,
      dto.txRef,
      req.user
    );
  });

  it("delegates OTC trade execution to the regional market service", async () => {
    const dto = {
      transfer: { senderId: 10, recieverId: 20, amount: 100 },
      market: { unitPrice: 42, currency: "CNY" },
    };

    await expect(controller.executeOtcTrade(dto as any, req)).resolves.toEqual({
      registryTransaction: { id: "TX-1" },
      marketTrade: { id: "TRADE-1" },
      cashSettlementMode: "offline",
    });
    expect(regionalMarketService.executeOtcTrade).toHaveBeenCalledWith(
      dto,
      req.user
    );
  });

  it("returns dashboard summary projection", async () => {
    await expect(controller.getDashboardSummary()).resolves.toEqual({
      metrics: { transferVolume: 300, averageOtcPrice: 42 },
      recentTrades: [],
    });
    expect(
      regionalMarketProjectionService.getDashboardSummary
    ).toHaveBeenCalled();
  });

  it("logs in a government demo session", async () => {
    await expect(
      controller.loginDemoSession({ account: "gov_demo" })
    ).resolves.toMatchObject({
      sessionId: "demo-session-gov",
      user: {
        account: "gov_demo",
        role: "GOVERNMENT",
      },
    });
  });

  it("switches demo roles through the backend service", async () => {
    await expect(
      controller.switchDemoRole({
        sessionId: "demo-session-gov",
        role: "ENTERPRISE",
      })
    ).resolves.toMatchObject({
      sessionId: "demo-session-enterprise",
      user: {
        account: "enterprise_demo",
        role: "ENTERPRISE",
      },
    });
  });

  it("returns verified S12 indicators by default", async () => {
    const indicators = await controller.listDemoIndicators({});

    expect(indicators.items.length).toBeGreaterThanOrEqual(3);
    expect(indicators.items.every((item) => item.verified)).toBe(true);
    expect(indicators.items[0]).toMatchObject({
      truthStatus: "REAL_PUBLIC_DATA",
      sourceLabel: expect.any(String),
      sourceYear: expect.any(Number),
      methodologyNote: expect.any(String),
    });
  });

  it("can include unverified S12 source candidates only when requested", async () => {
    const verifiedOnly = await controller.listDemoIndicators({
      verifiedOnly: "true",
    });
    const includingCandidates = await controller.listDemoIndicators({
      verifiedOnly: "false",
    });

    expect(verifiedOnly.items.some((item) => item.verified === false)).toBe(false);
    expect(includingCandidates.items.some((item) => item.verified === false)).toBe(true);
  });

  it("returns indicator source details", async () => {
    const indicators = await controller.listDemoIndicators({});

    await expect(
      controller.getDemoIndicatorSource(indicators.items[0].id)
    ).resolves.toMatchObject({
      id: indicators.items[0].id,
      sourceLabel: indicators.items[0].sourceLabel,
      verified: true,
      verifiedBy: expect.any(String),
      verifiedAt: expect.any(String),
    });
  });

  it("returns reset skeleton result without deleting verified indicators", async () => {
    await expect(controller.resetDemo()).resolves.toMatchObject({
      status: "RESET",
      preserved: {
        verifiedIndicators: expect.any(Number),
      },
      reset: {
        sessions: true,
        demoTransactions: true,
        financeState: true,
      },
    });
  });
});
