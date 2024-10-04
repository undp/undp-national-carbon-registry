import { Body, Controller, Get, Post, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Action } from "src/casl/action.enum";
import { PoliciesGuardEx } from "src/casl/policy.guard";
import { QueryDto } from "src/dto/query.dto";
import { CreditAuditLog } from "src/entities/credit.audit.log.entity";
import { NationalAccountingService } from "src/analytics-api/national-accounting/national.accounting.service";

@ApiTags("national-accounting")
@ApiBearerAuth()
@Controller("national-accounting")
export class NationalAccountingController {
  constructor(private nationalAccountingService: NationalAccountingService) {}

  @ApiBearerAuth("api_key")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, CreditAuditLog))
  @Get("total")
  async getTotalStats() {
    return this.nationalAccountingService.getTotalStats();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, CreditAuditLog, true))
  @Post("query")
  queryTransactionRecords(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.nationalAccountingService.getTransactionRecords(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, CreditAuditLog, true))
  @Post("query-by-country")
  getRetirementsByCountry(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.nationalAccountingService.getRetiresByCountry(query, req.abilityCondition);
  }
}
