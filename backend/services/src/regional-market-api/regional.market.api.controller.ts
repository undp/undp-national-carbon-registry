import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { QueryDto } from "@app/shared/dto/query.dto";
import { RegionalMarketAPIService } from "./regional.market.api.service";
import { RegionalMarketDemoGuard } from "./regional.market.demo.guard";
import {
  RegionalDemoFinanceApplicationDto,
  RegionalDemoFinanceReviewDto,
  RegionalDemoFinanceValuationDto,
  RegionalIssueCreditsDto,
  RegionalDemoLoginDto,
  RegionalDemoSwitchRoleDto,
  RegionalDemoTradingDealDto,
  RegionalDemoTradingListingDto,
  RegionalDemoTransferToTradingDto,
  RegionalOtcTradeExecuteDto,
  RegionalProjectIdDto,
} from "./regional.market.api.dto";

@Controller()
export class RegionalMarketAPIController {
  constructor(private readonly regionalMarketAPIService: RegionalMarketAPIService) {}

  @Get("info")
  async getInfo() {
    return this.regionalMarketAPIService.getInfo();
  }

  @Post("projects/query")
  @UseGuards(RegionalMarketDemoGuard)
  async queryProjects(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryProjects(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("projects/getById")
  @UseGuards(RegionalMarketDemoGuard)
  async getProjectById(
    @Body() body: RegionalProjectIdDto,
    @Request() req: any
  ) {
    return this.regionalMarketAPIService.getProjectById(
      body.programmeId,
      req?.user
    );
  }

  @Post("credits/balance")
  @UseGuards(RegionalMarketDemoGuard)
  async queryCreditBalances(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryCreditBalances(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("settlements/transfers/query")
  @UseGuards(RegionalMarketDemoGuard)
  async queryTransfers(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryTransfers(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("retirements/query")
  @UseGuards(RegionalMarketDemoGuard)
  async queryRetirements(@Body() query: QueryDto, @Request() req: any) {
    return this.regionalMarketAPIService.queryRetirements(
      query,
      req?.abilityCondition,
      req?.user
    );
  }

  @Post("projects/documents")
  @UseGuards(RegionalMarketDemoGuard)
  async createProjectDocument(@Body() documentDto: any, @Request() req: any) {
    return this.regionalMarketAPIService.createProjectDocument(
      documentDto,
      req?.user
    );
  }

  @Post("projects/documents/action")
  @UseGuards(RegionalMarketDemoGuard)
  async performProjectDocumentAction(@Body() actionDto: any, @Request() req: any) {
    return this.regionalMarketAPIService.performProjectDocumentAction(
      actionDto,
      req?.user
    );
  }

  @Post("projects/credits/issue")
  @UseGuards(RegionalMarketDemoGuard)
  async issueProjectCredits(
    @Body() issueDto: RegionalIssueCreditsDto,
    @Request() req: any
  ) {
    return this.regionalMarketAPIService.issueProjectCredits(issueDto, req?.user);
  }

  @Post("otc-trades/execute")
  @UseGuards(RegionalMarketDemoGuard)
  async executeOtcTrade(
    @Body() dto: RegionalOtcTradeExecuteDto,
    @Request() req: any
  ) {
    return this.regionalMarketAPIService.executeOtcTrade(dto, req?.user);
  }

  @Get("dashboard/summary")
  async getDashboardSummary() {
    return this.regionalMarketAPIService.getDashboardSummary();
  }

  @Post("demo/session/login")
  async loginDemoSession(@Body() body: RegionalDemoLoginDto) {
    return this.regionalMarketAPIService.loginDemoSession(body.account);
  }

  @Post("demo/session/switch-role")
  async switchDemoRole(@Body() body: RegionalDemoSwitchRoleDto) {
    return this.regionalMarketAPIService.switchDemoRole(body.role);
  }

  @Get("demo/session/me")
  async getDemoSessionMe(@Query("role") role?: string) {
    return this.regionalMarketAPIService.getDemoSessionMe(role);
  }

  @Get("demo/indicators")
  async listDemoIndicators(@Query() query: Record<string, any>) {
    return this.regionalMarketAPIService.listDemoIndicators(query);
  }

  @Get("demo/indicators/:id/source")
  async getDemoIndicatorSource(@Param("id") id: string) {
    return this.regionalMarketAPIService.getDemoIndicatorSource(id);
  }

  @Get("demo/registry/holdings")
  async listDemoRegistryHoldings() {
    return this.regionalMarketAPIService.listDemoRegistryHoldings();
  }

  @Post("demo/registry/transfers-to-trading")
  async transferDemoRegistryHoldingToTrading(
    @Body() body: RegionalDemoTransferToTradingDto
  ) {
    return this.regionalMarketAPIService.transferDemoRegistryHoldingToTrading(
      body
    );
  }

  @Get("demo/trading/holdings")
  async listDemoTradingHoldings() {
    return this.regionalMarketAPIService.listDemoTradingHoldings();
  }

  @Post("demo/trading/listings")
  async createDemoTradingListing(@Body() body: RegionalDemoTradingListingDto) {
    return this.regionalMarketAPIService.createDemoTradingListing(body);
  }

  @Post("demo/trading/deals")
  async confirmDemoTradingDeal(@Body() body: RegionalDemoTradingDealDto) {
    return this.regionalMarketAPIService.confirmDemoTradingDeal(body);
  }

  @Get("demo/trading/deals/:id/contract-preview")
  async getDemoTradingDealContractPreview(@Param("id") id: string) {
    return this.regionalMarketAPIService.getDemoTradingDealContractPreview(id);
  }

  @Get("demo/trading/deals/:id/status-certificate")
  async getDemoTradingDealStatusCertificate(@Param("id") id: string) {
    return this.regionalMarketAPIService.getDemoTradingDealStatusCertificate(id);
  }

  @Get("demo/finance/profile/:enterpriseId")
  async getDemoFinanceProfile(@Param("enterpriseId") enterpriseId: string) {
    return this.regionalMarketAPIService.getDemoFinanceProfile(enterpriseId);
  }

  @Post("demo/finance/valuations")
  async createDemoFinanceValuation(
    @Body() body: RegionalDemoFinanceValuationDto
  ) {
    return this.regionalMarketAPIService.createDemoFinanceValuation(body);
  }

  @Post("demo/finance/applications")
  async createDemoFinanceApplication(
    @Body() body: RegionalDemoFinanceApplicationDto
  ) {
    return this.regionalMarketAPIService.createDemoFinanceApplication(body);
  }

  @Post("demo/finance/applications/:id/review")
  async reviewDemoFinanceApplication(
    @Param("id") id: string,
    @Body() body: RegionalDemoFinanceReviewDto
  ) {
    return this.regionalMarketAPIService.reviewDemoFinanceApplication(id, body);
  }

  @Get("demo/supervision/summary")
  async getDemoSupervisionSummary() {
    return this.regionalMarketAPIService.getDemoSupervisionSummary();
  }

  @Post("demo/reset")
  async resetDemo() {
    return this.regionalMarketAPIService.resetDemo();
  }
}
