import { Logger, Module } from "@nestjs/common";
import { RegionalMarketModule } from "@app/shared/regional-market/regional-market.module";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";
import { RegionalMarketDemoGuard } from "./regional.market.demo.guard";

@Module({
  imports: [
    RateLimiterModule.register({
      type: "Memory",
    }),
    RegionalMarketModule,
  ],
  controllers: [RegionalMarketAPIController],
  providers: [RegionalMarketAPIService, RegionalMarketDemoGuard, Logger],
})
export class RegionalMarketAPIModule {}
