import { Controller, Get } from "@nestjs/common";
import { RegionalMarketAPIService } from "./regional.market.api.service";

@Controller()
export class RegionalMarketAPIController {
  constructor(private readonly regionalMarketAPIService: RegionalMarketAPIService) {}

  @Get("info")
  async getInfo() {
    return this.regionalMarketAPIService.getInfo();
  }
}
