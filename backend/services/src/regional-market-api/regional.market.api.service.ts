import { Injectable } from "@nestjs/common";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketProjectionService } from "@app/shared/regional-market/regional-market-projection.service";
import { QueryDto } from "@app/shared/dto/query.dto";

@Injectable()
export class RegionalMarketAPIService {
  constructor(
    private readonly regionalMarketService: RegionalMarketService,
    private readonly regionalMarketProjectionService: RegionalMarketProjectionService
  ) {}

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

  createProjectDocument(documentDto: any, user?: any) {
    return this.regionalMarketService.createProjectDocument(documentDto, user);
  }

  performProjectDocumentAction(actionDto: any, user?: any) {
    return this.regionalMarketService.performProjectDocumentAction(actionDto, user);
  }

  issueProjectCredits(issueDto: any, user?: any) {
    return this.regionalMarketService.issueProjectCredits(
      issueDto.activity,
      issueDto.creditVerified,
      issueDto.companyId,
      issueDto.document,
      issueDto.txRef,
      user
    );
  }

  executeOtcTrade(dto: any, user?: any) {
    return this.regionalMarketService.executeOtcTrade(dto, user);
  }

  getDashboardSummary() {
    return this.regionalMarketProjectionService.getDashboardSummary();
  }
}
