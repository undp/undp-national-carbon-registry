import {
  Controller,
  Logger,
  UseGuards,
  Request,
  Post,
  Body,
  Get,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AggregateAPIService } from "./aggregate.api.service";
import { ApiKeyJwtAuthGuard } from "@app/shared/auth/guards/api-jwt-key.guard";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { Action } from "@app/shared/casl/action.enum";
import { Stat } from "@app/shared/dto/stat.dto";
import { StatList } from "@app/shared/dto/stat.list.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { StatFilter } from "@app/shared/dto/stat.filter";
@ApiTags("Programme")
@ApiBearerAuth()
@Controller("programme")
export class ProgrammeController {
  constructor(
    private aggService: AggregateAPIService,
    private readonly logger: Logger
  ) {}

  @ApiBearerAuth()
  @UseGuards(
    ApiKeyJwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, Stat, true, true)
  )
  @Post("agg")
  async aggQueries(@Body() query: StatList, @Request() req) {
    const companyId =
      req?.user?.companyId !== null ? req?.user?.companyId : null;
    return this.aggService.getAggregateQuery(
      req.abilityCondition,
      query,
      companyId,
      req.user?.companyRole,
      query.system
    );
  }
}
