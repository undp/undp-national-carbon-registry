import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";
import { AnalyticsService } from "@app/shared/analytics/analytics.service";
import { ProjectDataRequestDTO } from "@app/shared/dto/project-data-request.dto";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("all")
  async getAllData() {
    return await this.analyticsService.getAllData();
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("getPendingActions")
  async getPendingActions(@Request() req) {
    return await this.analyticsService.getPendingActions(req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectsData")
  async getProjectsData(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectsData(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Get("getProjectSummary")
  async getProjectSummary(@Request() req) {
    return await this.analyticsService.getProjectSummary(req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectStatusSummary")
  async getProjectStatusSummary(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectStatusSummary(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectsByStatusDetail")
  async getProjectsByStatusDetail(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectsByStatusDetail(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectCountBySector")
  async getProjectCountBySector(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectCountBySector(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getProjectCountBySectorScope")
  async getProjectCountBySectorScope(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getProjectCountBySectorScope(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("getCreditSummary")
  async getCreditSummary(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.getCreditSummary(filters, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Post("creditsSummaryByDate")
  async creditsSummaryByDate(@Body() filters: ProjectDataRequestDTO, @Request() req) {
    return await this.analyticsService.creditsSummaryByDate(filters, req.user);
  }
}
