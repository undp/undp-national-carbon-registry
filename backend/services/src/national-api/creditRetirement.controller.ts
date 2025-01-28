import { Controller, UseGuards, Request, Post, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CreditRetirementRequestSlDto } from "../dto/creditRetirementRequestSl.dto";
import { CreditRetirementSlService } from "../creditRetirement-sl/creditRetirementSl.service";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { Action } from "../casl/action.enum";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { CreditRetirementStatusUpdateSlDto } from "../dto/creditRetirementStatusUpdateSl.dto";
import { QueryDto } from "../dto/query.dto";
import { ConfigService } from "@nestjs/config";
import { RetirementRateLimiterGuard } from "src/auth/guards/retirement-rate-limiter.guard";

@ApiTags("Credit Retire")
@ApiBearerAuth()
@Controller("retire")
export class CreditRetirementSlController {
  constructor(private readonly retirementService: CreditRetirementSlService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Create, CreditRetirementSl, true))
  @Post("create")
  async createCreditRetirementRequest(@Body() dto: CreditRetirementRequestSlDto, @Request() req) {
    return await this.retirementService.createCreditRetirementRequest(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Update, CreditRetirementSl, true))
  @Post("status")
  async updateCreditRetirementRequestStatus(
    @Body() dto: CreditRetirementStatusUpdateSlDto,
    @Request() req
  ) {
    return await this.retirementService.updateCreditRetirementRequestStatus(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, CreditRetirementSl, true))
  @Post("query")
  async queryCreditRetirementRequests(@Body() dto: QueryDto, @Request() req) {
    return await this.retirementService.queryRetirements(dto, req.abilityCondition, req.user);
  }

  @UseGuards(RetirementRateLimiterGuard)
  @Post("public/get")
  async getPublicProjectDetails(@Body() query: QueryDto) {
    return this.retirementService.queryRetirementsPublicDetails(query);
  }
}
