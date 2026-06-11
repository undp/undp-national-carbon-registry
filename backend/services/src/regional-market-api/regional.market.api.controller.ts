import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { QueryDto } from "@app/shared/dto/query.dto";
import { RegionalMarketAPIService } from "./regional.market.api.service";

@Controller()
export class RegionalMarketAPIController {
  constructor(private readonly regionalMarketAPIService: RegionalMarketAPIService) {}

  @Get("info")
  async getInfo() {
    return this.regionalMarketAPIService.getInfo();
  }

  @Post("projects/query")
  async queryProjects(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryProjects(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("projects/getById")
  async getProjectById(
    @Body("programmeId") programmeId: string,
    @Request() req: any
  ) {
    return this.regionalMarketAPIService.getProjectById(programmeId, req?.user);
  }

  @Post("credits/balance")
  async queryCreditBalances(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryCreditBalances(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("settlements/transfers/query")
  async queryTransfers(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryTransfers(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("retirements/query")
  async queryRetirements(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryRetirements(
      query,
      req?.abilityCondition,
      req?.user
    );
  }
}
