import { Module } from "@nestjs/common";
import { RegionalMarketService } from "./regional-market.service";

@Module({
  providers: [RegionalMarketService],
  exports: [RegionalMarketService],
})
export class RegionalMarketModule {}
