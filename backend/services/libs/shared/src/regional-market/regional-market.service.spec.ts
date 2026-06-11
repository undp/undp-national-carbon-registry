import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketModule } from "./regional-market.module";
import { RegionalMarketService } from "./regional-market.service";

describe("RegionalMarketService", () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [RegionalMarketModule],
    }).compile();
  });

  afterEach(async () => {
    await module.close();
  });

  it("resolves from the regional market module", () => {
    expect(module.get(RegionalMarketService)).toBeInstanceOf(
      RegionalMarketService
    );
  });
});
