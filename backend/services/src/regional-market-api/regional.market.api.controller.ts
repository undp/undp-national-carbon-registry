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
  RegionalIssueCreditsDto,
  RegionalDemoLoginDto,
  RegionalDemoSwitchRoleDto,
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

  @Post("demo/reset")
  async resetDemo() {
    return this.regionalMarketAPIService.resetDemo();
  }
}
