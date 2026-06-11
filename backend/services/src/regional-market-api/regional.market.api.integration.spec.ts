import { INestApplication } from "@nestjs/common";
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
});
