import { Module } from "@nestjs/common";
import { MarketTradeExecutionService } from "./market-trade-execution.service";
import { RegionalMarketService } from "./regional-market.service";

@Module({
  providers: [RegionalMarketService, MarketTradeExecutionService],
  exports: [RegionalMarketService, MarketTradeExecutionService],
})
export class RegionalMarketModule {}
