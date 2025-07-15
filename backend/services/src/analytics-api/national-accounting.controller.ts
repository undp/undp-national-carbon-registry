import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NationalAccountingService } from "src/analytics-api/national-accounting/national.accounting.service";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { QueryDto } from "@app/shared/dto/query.dto";
import { CreditAuditLog } from "@app/shared/entities/credit.audit.log.entity";

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
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CreditAuditLog, true)
  )
  @Post("query")
  queryTransactionRecords(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.nationalAccountingService.getTransactionRecords(
      query,
      req.abilityCondition
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CreditAuditLog, true)
  )
  @Post("query-by-country")
  getRetirementsByCountry(@Body() query: QueryDto, @Request() req) {
    console.log(req.abilityCondition);
    return this.nationalAccountingService.getRetiresByCountry(
      query,
      req.abilityCondition
    );
  }
}
