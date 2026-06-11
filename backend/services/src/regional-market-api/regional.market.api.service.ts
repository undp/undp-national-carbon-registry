import { Injectable } from "@nestjs/common";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { QueryDto } from "@app/shared/dto/query.dto";

@Injectable()
export class RegionalMarketAPIService {
  constructor(private readonly regionalMarketService: RegionalMarketService) {}

  getInfo() {
    return this.regionalMarketService.getBoundary();
  }

  queryProjects(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryProjects(query, abilityCondition, user);
  }

  getProjectById(programmeId: string, user?: any) {
    return this.regionalMarketService.getProjectById(programmeId, user);
  }

  queryCreditBalances(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryCreditBalances(
      query,
      abilityCondition,
      user
    );
  }

  queryTransfers(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryTransfers(query, abilityCondition, user);
  }

  queryRetirements(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryRetirements(
      query,
      abilityCondition,
      user
    );
  }
}
