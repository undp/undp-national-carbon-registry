import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { ItmoAccountService } from "@app/shared/itmo-account/itmo-account.service";
import { ItmoAccount } from "@app/shared/entities/itmo.account.entity";
import { QueryDto } from "@app/shared/dto/query.dto";

/**
 * Read-only HTTP surface for the ItmoAccount table.
 *
 * Dec 2/CMA.3 Annex paragraph 29 requires the national registry to
 * expose per-account-type holdings; Dec 4/CMA.6 Annex II's AEF
 * Holdings table reads from these accounts. Prior to this controller,
 * the ItmoAccount entity was registered with TypeORM (Phase 2) but
 * had no HTTP reachability, forcing AEF submission tooling to derive
 * accounts from the balance view.
 */
@ApiTags("ITMO Account")
@ApiBearerAuth()
@Controller("itmoAccount")
export class ItmoAccountController {
  constructor(private readonly itmoAccountService: ItmoAccountService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, ItmoAccount))
  @Post("query")
  query(@Body() query: QueryDto, @Request() req) {
    return this.itmoAccountService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, ItmoAccount))
  @Get("byCompany")
  byCompany(@Query("companyId") companyId: number) {
    return this.itmoAccountService.getByCompany(Number(companyId));
  }
}
