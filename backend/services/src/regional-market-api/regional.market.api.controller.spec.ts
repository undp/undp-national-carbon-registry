import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";

describe("RegionalMarketAPIController", () => {
  let controller: RegionalMarketAPIController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegionalMarketAPIController],
      providers: [RegionalMarketAPIService],
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
});
