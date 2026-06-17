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
});
