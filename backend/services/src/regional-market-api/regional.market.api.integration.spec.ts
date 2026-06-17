import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";
import { RegionalMarketDemoGuard } from "./regional.market.demo.guard";

describe("RegionalMarketAPI routes", () => {
  let app: INestApplication;
  let service: Record<string, jest.Mock>;
  const originalDemoMode = process.env.REGIONAL_MARKET_DEMO_MODE;

  beforeEach(async () => {
    service = {
      getInfo: jest.fn().mockReturnValue({
        subsystem: "regional-carbon-market",
      }),
      queryProjects: jest.fn().mockResolvedValue({ data: [] }),
      executeOtcTrade: jest.fn().mockResolvedValue({
        registryTransaction: { id: "TX-1" },
        marketTrade: { id: "TRADE-1" },
      }),
      loginDemoSession: jest.fn().mockReturnValue({
        sessionId: "demo-session-gov",
        user: { account: "gov_demo", role: "GOVERNMENT" },
      }),
      switchDemoRole: jest.fn().mockReturnValue({
        sessionId: "demo-session-enterprise",
        user: { account: "enterprise_demo", role: "ENTERPRISE" },
      }),
      getDemoSessionMe: jest.fn().mockReturnValue({
        sessionId: "demo-session-gov",
        user: { account: "gov_demo", role: "GOVERNMENT" },
      }),
      listDemoIndicators: jest.fn().mockReturnValue({
        verifiedOnly: true,
        items: [{ id: "s12-henan-gdp-2025", verified: true }],
      }),
      getDemoIndicatorSource: jest.fn().mockReturnValue({
        id: "s12-henan-gdp-2025",
        verified: true,
      }),
      listDemoRegistryHoldings: jest.fn().mockReturnValue({
        truthStatus: "SIMULATED_DEMO_DATA",
        items: [{ id: "reg-holding-enterprise-forest-2025" }],
      }),
      transferDemoRegistryHoldingToTrading: jest.fn().mockReturnValue({
        transfer: { id: "transfer-1" },
      }),
      listDemoTradingHoldings: jest.fn().mockReturnValue({
        items: [{ id: "trading-holding-1" }],
      }),
      createDemoTradingListing: jest.fn().mockReturnValue({
        listing: { id: "listing-1" },
      }),
      confirmDemoTradingDeal: jest.fn().mockReturnValue({
        deal: { id: "deal-1" },
      }),
      getDemoTradingDealContractPreview: jest.fn().mockReturnValue({
        title: "演示合同预览",
      }),
      getDemoTradingDealStatusCertificate: jest.fn().mockReturnValue({
        title: "模拟成交状态凭证",
      }),
      getDemoFinanceProfile: jest.fn().mockReturnValue({
        enterpriseId: "org-enterprise-demo",
      }),
      createDemoFinanceValuation: jest.fn().mockReturnValue({
        valuation: { id: "valuation-1" },
      }),
      createDemoFinanceApplication: jest.fn().mockReturnValue({
        application: { id: "finance-application-1" },
      }),
      reviewDemoFinanceApplication: jest.fn().mockReturnValue({
        application: { status: "SIMULATED_APPROVED" },
      }),
      getDemoSupervisionSummary: jest.fn().mockReturnValue({
        publicIndicators: { truthStatus: "REAL_PUBLIC_DATA" },
      }),
      resetDemo: jest.fn().mockReturnValue({
        status: "RESET",
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionalMarketAPIController],
      providers: [
        RegionalMarketDemoGuard,
        {
          provide: RegionalMarketAPIService,
          useValue: service,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix("regional");
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    if (originalDemoMode === undefined) {
      delete process.env.REGIONAL_MARKET_DEMO_MODE;
    } else {
      process.env.REGIONAL_MARKET_DEMO_MODE = originalDemoMode;
    }
  });

  it("serves public subsystem metadata", async () => {
    await request(app.getHttpServer())
      .get("/regional/info")
      .expect(200)
      .expect({ subsystem: "regional-carbon-market" });
  });

  it("rejects protected regional routes without auth or demo mode", async () => {
    delete process.env.REGIONAL_MARKET_DEMO_MODE;

    await request(app.getHttpServer())
      .post("/regional/projects/query")
      .send({ page: 1, size: 10 })
      .expect(401);
    expect(service.queryProjects).not.toHaveBeenCalled();
  });

  it("allows protected regional routes in explicit demo mode", async () => {
    process.env.REGIONAL_MARKET_DEMO_MODE = "true";

    await request(app.getHttpServer())
      .post("/regional/projects/query")
      .send({ page: 1, size: 10 })
      .expect(201)
      .expect({ data: [] });
    expect(service.queryProjects).toHaveBeenCalledWith(
      { page: 1, size: 10 },
      {},
      expect.objectContaining({
        companyRole: "REGIONAL_MARKET_DEMO",
      })
    );
  });

  it("rejects invalid OTC trade execution payloads before reaching the service", async () => {
    process.env.REGIONAL_MARKET_DEMO_MODE = "true";

    await request(app.getHttpServer())
      .post("/regional/otc-trades/execute")
      .send({
        transfer: {
          senderId: 10,
          receiverId: 20,
          projectRefId: "PRJ-1",
          creditBlockId: "CB-1",
          amount: 0,
        },
        market: {
          unitPrice: -1,
        },
      })
      .expect(400);
    expect(service.executeOtcTrade).not.toHaveBeenCalled();
  });

  it("serves phase-one demo session login", async () => {
    await request(app.getHttpServer())
      .post("/regional/demo/session/login")
      .send({ account: "gov_demo" })
      .expect(201)
      .expect({
        sessionId: "demo-session-gov",
        user: { account: "gov_demo", role: "GOVERNMENT" },
      });
    expect(service.loginDemoSession).toHaveBeenCalledWith("gov_demo");
  });

  it("rejects unknown phase-one demo accounts", async () => {
    await request(app.getHttpServer())
      .post("/regional/demo/session/login")
      .send({ account: "real_bank" })
      .expect(400);
    expect(service.loginDemoSession).not.toHaveBeenCalledWith("real_bank");
  });

  it("serves verified S12 indicators and source details", async () => {
    await request(app.getHttpServer())
      .get("/regional/demo/indicators?verifiedOnly=true")
      .expect(200)
      .expect({
        verifiedOnly: true,
        items: [{ id: "s12-henan-gdp-2025", verified: true }],
      });
    expect(service.listDemoIndicators).toHaveBeenCalledWith({
      verifiedOnly: "true",
    });

    await request(app.getHttpServer())
      .get("/regional/demo/indicators/s12-henan-gdp-2025/source")
      .expect(200)
      .expect({
        id: "s12-henan-gdp-2025",
        verified: true,
      });
    expect(service.getDemoIndicatorSource).toHaveBeenCalledWith(
      "s12-henan-gdp-2025"
    );
  });

  it("serves reset skeleton", async () => {
    await request(app.getHttpServer())
      .post("/regional/demo/reset")
      .send({})
      .expect(201)
      .expect({ status: "RESET" });
    expect(service.resetDemo).toHaveBeenCalled();
  });

  it("serves phase-two registry and trading routes", async () => {
    await request(app.getHttpServer())
      .get("/regional/demo/registry/holdings")
      .expect(200)
      .expect({
        truthStatus: "SIMULATED_DEMO_DATA",
        items: [{ id: "reg-holding-enterprise-forest-2025" }],
      });

    await request(app.getHttpServer())
      .post("/regional/demo/registry/transfers-to-trading")
      .send({
        holdingId: "reg-holding-enterprise-forest-2025",
        quantity: 1200,
      })
      .expect(201)
      .expect({ transfer: { id: "transfer-1" } });
    expect(service.transferDemoRegistryHoldingToTrading).toHaveBeenCalledWith({
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 1200,
    });

    await request(app.getHttpServer())
      .get("/regional/demo/trading/holdings")
      .expect(200)
      .expect({ items: [{ id: "trading-holding-1" }] });

    await request(app.getHttpServer())
      .post("/regional/demo/trading/listings")
      .send({
        tradingHoldingId: "trading-holding-1",
        quantity: 800,
        unitPrice: 42,
      })
      .expect(201)
      .expect({ listing: { id: "listing-1" } });

    await request(app.getHttpServer())
      .post("/regional/demo/trading/deals")
      .send({
        listingId: "listing-1",
        buyerOrganizationId: "org-buyer-demo",
        quantity: 800,
      })
      .expect(201)
      .expect({ deal: { id: "deal-1" } });

    await request(app.getHttpServer())
      .get("/regional/demo/trading/deals/deal-1/contract-preview")
      .expect(200)
      .expect({ title: "演示合同预览" });
    await request(app.getHttpServer())
      .get("/regional/demo/trading/deals/deal-1/status-certificate")
      .expect(200)
      .expect({ title: "模拟成交状态凭证" });
  });

  it("rejects invalid phase-two quantities before reaching the service", async () => {
    await request(app.getHttpServer())
      .post("/regional/demo/trading/listings")
      .send({
        tradingHoldingId: "trading-holding-1",
        quantity: 0,
        unitPrice: -1,
      })
      .expect(400);
    expect(service.createDemoTradingListing).not.toHaveBeenCalled();
  });

  it("serves phase-two finance and supervision routes", async () => {
    await request(app.getHttpServer())
      .get("/regional/demo/finance/profile/org-enterprise-demo")
      .expect(200)
      .expect({ enterpriseId: "org-enterprise-demo" });

    await request(app.getHttpServer())
      .post("/regional/demo/finance/valuations")
      .send({
        enterpriseId: "org-enterprise-demo",
        assetId: "reg-holding-enterprise-forest-2025",
        quantity: 1000,
        unitPrice: 42,
        discountFactor: 0.6,
      })
      .expect(201)
      .expect({ valuation: { id: "valuation-1" } });

    await request(app.getHttpServer())
      .post("/regional/demo/finance/applications")
      .send({
        enterpriseId: "org-enterprise-demo",
        valuationId: "valuation-1",
        requestedAmount: 20000,
        purpose: "绿色设备更新演示",
      })
      .expect(201)
      .expect({ application: { id: "finance-application-1" } });

    await request(app.getHttpServer())
      .post("/regional/demo/finance/applications/finance-application-1/review")
      .send({
        result: "APPROVED",
        reviewerNote: "演示额度内",
      })
      .expect(201)
      .expect({ application: { status: "SIMULATED_APPROVED" } });

    await request(app.getHttpServer())
      .get("/regional/demo/supervision/summary")
      .expect(200)
      .expect({ publicIndicators: { truthStatus: "REAL_PUBLIC_DATA" } });
  });
});
