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
    await expect(controller.resetDemo({ actorRole: "OPERATOR" })).resolves.toMatchObject({
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

  it("transfers registry demo holdings into the trading context and blocks unavailable quantity", async () => {
    const registryBefore = await controller.listDemoRegistryHoldings();
    const holding = registryBefore.items[0];
    const availableBeforeTransfer = holding.availableQuantity;

    await expect(
      controller.transferDemoRegistryHoldingToTrading({
        actorRole: "ENTERPRISE",
        holdingId: holding.id,
        quantity: 1200,
      })
    ).resolves.toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      transfer: {
        holdingId: holding.id,
        quantity: 1200,
        status: "TRANSFERRED_TO_TRADING",
      },
      registryHolding: {
        id: holding.id,
        availableQuantity: availableBeforeTransfer - 1200,
      },
      tradingHolding: {
        registryHoldingId: holding.id,
        availableQuantity: 1200,
        status: "AVAILABLE_FOR_LISTING",
      },
    });

    await expect(
      controller.transferDemoRegistryHoldingToTrading({
        actorRole: "ENTERPRISE",
        holdingId: holding.id,
        quantity: holding.availableQuantity + 1,
      })
    ).rejects.toMatchObject({
      response: {
        error: {
          code: "DEMO_TRANSFER_QUANTITY_UNAVAILABLE",
        },
      },
    });
  });

  it("blocks listing before transfer-in and confirms demo deals with non-legal documents", async () => {
    await expect(
      controller.createDemoTradingListing({
        actorRole: "ENTERPRISE",
        tradingHoldingId: "missing-trading-holding",
        quantity: 100,
        unitPrice: 42,
      })
    ).rejects.toMatchObject({
      response: {
        error: {
          code: "DEMO_TRADING_HOLDING_NOT_FOUND",
        },
      },
    });

    const transfer = await controller.transferDemoRegistryHoldingToTrading({
      actorRole: "ENTERPRISE",
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 1000,
    });
    const listing = await controller.createDemoTradingListing({
      actorRole: "ENTERPRISE",
      tradingHoldingId: transfer.tradingHolding.id,
      quantity: 800,
      unitPrice: 42,
    });

    expect(listing).toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      listing: {
        status: "LISTED",
        quantity: 800,
        unitPrice: 42,
      },
    });

    const deal = await controller.confirmDemoTradingDeal({
      actorRole: "ENTERPRISE",
      listingId: listing.listing.id,
      buyerOrganizationId: "org-buyer-demo",
      quantity: 800,
    });

    expect(deal).toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      deal: {
        status: "CONFIRMED",
        totalAmount: 33600,
      },
    });

    await expect(
      controller.getDemoTradingDealContractPreview(deal.deal.id)
    ).resolves.toMatchObject({
      title: "演示合同预览",
      legalEffect: "演示文本，不具法律效力",
      truthStatus: "SIMULATED_DEMO_DOCUMENT",
    });
    await expect(
      controller.getDemoTradingDealStatusCertificate(deal.deal.id)
    ).resolves.toMatchObject({
      title: "模拟成交状态凭证",
      settlementBoundary: "不含资金清算或银行结算",
      truthStatus: "SIMULATED_DEMO_DOCUMENT",
    });
  });

  it("runs S10 valuation, financing-intent review, and pledge lock without disbursement semantics", async () => {
    const profile = await controller.getDemoFinanceProfile("org-enterprise-demo");

    expect(profile).toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      enterpriseId: "org-enterprise-demo",
      esgModel: "ESG demo-v1 为内部演示模型",
    });

    const valuation = await controller.createDemoFinanceValuation({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      assetId: profile.assets[0].id,
      quantity: 1000,
      unitPrice: 42,
      discountFactor: 0.6,
    });

    expect(valuation).toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      valuation: {
        assessedAmount: 25200,
        disclaimer: "融资测算结果仅用于演示",
      },
    });

    const application = await controller.createDemoFinanceApplication({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      valuationId: valuation.valuation.id,
      requestedAmount: 20000,
      purpose: "绿色设备更新演示",
    });
    const review = await controller.reviewDemoFinanceApplication(application.application.id, {
      actorRole: "FINANCE",
      result: "APPROVED",
      reviewerNote: "演示额度内",
    });

    expect(review).toMatchObject({
      truthStatus: "SIMULATED_DEMO_DATA",
      application: {
        status: "SIMULATED_APPROVED",
        pledgeStatus: "PLEDGE_LOCKED",
        reviewDisclaimer: "模拟审批不代表银行授信",
      },
    });
  });

  it("returns supervision summary with real and simulated truth layers separated", async () => {
    await controller.transferDemoRegistryHoldingToTrading({
      actorRole: "ENTERPRISE",
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 600,
    });
    const valuation = await controller.createDemoFinanceValuation({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      assetId: "reg-holding-enterprise-forest-2025",
      quantity: 600,
      unitPrice: 42,
      discountFactor: 0.6,
    });
    await controller.createDemoFinanceApplication({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      valuationId: valuation.valuation.id,
      requestedAmount: 10000,
      purpose: "演示用途",
    });

    await expect(controller.getDemoSupervisionSummary()).resolves.toMatchObject({
      publicIndicators: {
        truthStatus: "REAL_PUBLIC_DATA",
        count: expect.any(Number),
      },
      simulatedTradingActivity: {
        truthStatus: "SIMULATED_DEMO_DATA",
        transferCount: 1,
      },
      simulatedFinancingIntent: {
        truthStatus: "SIMULATED_DEMO_DATA",
        applicationCount: 1,
      },
      internalAssessmentTags: {
        truthStatus: "INTERNAL_DEMO_LOGIC",
      },
    });
  });
});
