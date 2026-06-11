import { Module } from "@nestjs/common";
import { MarketTradeExecutionService } from "./market-trade-execution.service";
import { RegionalMarketProjectionService } from "./regional-market-projection.service";
import { RegionalMarketService } from "./regional-market.service";

@Module({
  providers: [
    RegionalMarketService,
    MarketTradeExecutionService,
    RegionalMarketProjectionService,
  ],
  exports: [
    RegionalMarketService,
    MarketTradeExecutionService,
    RegionalMarketProjectionService,
  ],
})
export class RegionalMarketModule {}
