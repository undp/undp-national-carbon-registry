import { Controller, Logger, UseGuards, Request, Post, Body, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { StatList } from "../dto/stat.list.dto";
import { ApiKeyJwtAuthGuard } from "../auth/guards/api-jwt-key.guard";
import { Action } from "../casl/action.enum";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { Stat } from "../dto/stat.dto";
import { AggregateAPIService } from "./aggregate.api.service";
import { AggregateSlAPIService } from "./aggregate.sl.api.service";
import { StatFilter } from "../dto/stat.filter";
import { QueryDto } from "src/dto/query.dto";
@ApiTags("Programme")
@ApiBearerAuth()
@Controller("programme")
export class ProgrammeController {
  constructor(
    private aggService: AggregateAPIService,
    private aggSlService: AggregateSlAPIService,
    private readonly logger: Logger
  ) {}

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("agg")
  async aggQueries(@Body() query: StatList, @Request() req) {
    const companyId = req?.user?.companyId !== null ? req?.user?.companyId : null;
    return this.aggService.getAggregateQuery(
      req.abilityCondition,
      query,
      companyId,
      req.user?.companyRole,
      query.system
    );
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("aggSl")
  async aggSlQueries(@Body() query: StatList, @Request() req) {
    const companyId = req?.user?.companyId !== null ? req?.user?.companyId : null;
    return this.aggSlService.getAggregateQuery(
      req.abilityCondition,
      query,
      companyId,
      req.user?.companyRole,
      query.system
    );
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("totalSLProjects")
  async totalProjects(@Request() req) {
    return this.aggSlService.getTotalSLProjects(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("totalIssuedCredits")
  async totalIssuedCredits(@Request() req) {
    return this.aggSlService.getTotalIssuedCredits(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("totalRetiredCredits")
  async totalRetiredCredits(@Request() req) {
    return this.aggSlService.getTotalRetiredCredits(req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryProgrammesByStatus")
  async queryProgrammesByStatus(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryProgrammesByStatus(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryProgrammesByCategory")
  async queryProgrammesByCategory(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryProgrammesByCategory(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryRetirementsByDate")
  async queryRetirementsByDate(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryRetirementsByDate(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryCreditsByStatus")
  async queryCreditsByStatus(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryCreditsByStatus(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryCreditsByDate")
  async queryCreditsByDate(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryCreditsByDate(query, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(ApiKeyJwtAuthGuard)
  @Post("queryCreditsByPurpose")
  async queryCreditsByPurpose(@Body() query: QueryDto, @Request() req) {
    return this.aggSlService.queryCreditsByPurpose(query, req.user);
  }

  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Get("verifications")
  async getPendingVerifications(@Request() req) {
    return this.aggSlService.getPendingVerifications(req.user);
  }

  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Get("retirements")
  async getPendingRetirements(@Request() req) {
    return this.aggSlService.getPendingRetirements(req.user);
  }

  @ApiBearerAuth()
  // @UseGuards(JwtAuthGuard)
  @UseGuards(ApiKeyJwtAuthGuard, PoliciesGuardEx(true, Action.Read, Stat, true, true))
  @Post("authCreditsByCreditType")
  async getAuthorisedCreditsTotalByType(@Body() query: StatFilter, @Request() req) {
    return this.aggSlService.getCreditTypeSummary(query, req.user);
  }
}
