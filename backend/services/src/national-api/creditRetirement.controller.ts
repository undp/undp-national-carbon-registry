import { Controller, UseGuards, Request, Post, Body } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { RetirementRateLimiterGuard } from "@app/shared/auth/guards/retirement-rate-limiter.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { CreditRetirementSlService } from "@app/shared/creditRetirement-sl/creditRetirementSl.service";
import { CreditRetirementRequestSlDto } from "@app/shared/dto/creditRetirementRequestSl.dto";
import { CreditRetirementStatusUpdateSlDto } from "@app/shared/dto/creditRetirementStatusUpdateSl.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { CreditRetirementSl } from "@app/shared/entities/creditRetirementSl.entity";

@ApiTags("Credit Retire")
@ApiBearerAuth()
@Controller("retire")
export class CreditRetirementSlController {
  constructor(private readonly retirementService: CreditRetirementSlService) {}

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, CreditRetirementSl, true)
  )
  @Post("create")
  async createCreditRetirementRequest(
    @Body() dto: CreditRetirementRequestSlDto,
    @Request() req
  ) {
    return await this.retirementService.createCreditRetirementRequest(
      dto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CreditRetirementSl, true)
  )
  @Post("status")
  async updateCreditRetirementRequestStatus(
    @Body() dto: CreditRetirementStatusUpdateSlDto,
    @Request() req
  ) {
    return await this.retirementService.updateCreditRetirementRequestStatus(
      dto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CreditRetirementSl, true)
  )
  @Post("query")
  async queryCreditRetirementRequests(@Body() dto: QueryDto, @Request() req) {
    return await this.retirementService.queryRetirements(
      dto,
      req.abilityCondition,
      req.user
    );
  }

  @UseGuards(RetirementRateLimiterGuard)
  @Post("public/get")
  async getPublicProjectDetails(@Body() query: QueryDto) {
    return this.retirementService.queryRetirementsPublicDetails(query);
  }
}
