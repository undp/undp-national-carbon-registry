import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";

describe("RegionalMarketAPIController", () => {
  let controller: RegionalMarketAPIController;
  let regionalMarketService: Record<string, jest.Mock>;

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
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionalMarketAPIController],
      providers: [
        RegionalMarketAPIService,
        {
          provide: RegionalMarketService,
          useValue: regionalMarketService,
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
    await expect(controller.getProjectById("PRJ-1", req)).resolves.toEqual({
      refId: "PRJ-1",
    });
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
});
