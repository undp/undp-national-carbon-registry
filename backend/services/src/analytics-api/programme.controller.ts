import { Controller, Logger, UseGuards, Request, Post, Body, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { StatList } from "../dto/stat.list.dto";
import { ApiKeyJwtAuthGuard } from "../auth/guards/api-jwt-key.guard";
import { Action } from "../casl/action.enum";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { Stat } from "../dto/stat.dto";
import { AggregateAPIService } from "./aggregate.api.service";
import { AggregateSlAPIService } from "./aggregate.sl.api.service";
// import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";

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
}
