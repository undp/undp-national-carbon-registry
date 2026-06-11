import { Logger, Module } from "@nestjs/common";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIService } from "./regional.market.api.service";

@Module({
  imports: [
    RateLimiterModule.register({
      type: "Memory",
    }),
  ],
  controllers: [RegionalMarketAPIController],
  providers: [RegionalMarketAPIService, Logger],
})
export class RegionalMarketAPIModule {}
