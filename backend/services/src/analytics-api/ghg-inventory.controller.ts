import {
  Controller,
  Get,
  Logger,
  Query,
  UseGuards,
  Request,
  Post,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { StatList } from "../dto/stat.list.dto";
import { ApiKeyJwtAuthGuard } from "../auth/guards/api-jwt-key.guard";
import { Action } from "../casl/action.enum";
import { PoliciesGuardEx } from "../casl/policy.guard";
import { Stat } from "../dto/stat.dto";
import { AggregateAPIService } from "./aggregate.api.service";

@ApiTags("GHG Inventory")
@ApiBearerAuth()
@Controller("ghg")
export class GHGInventoryController {
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
  async aggQueries(
    @Body() query: StatList,
    @Request() req
  ) {
    const companyId =
      req?.user?.companyId !== null ? req?.user?.companyId : null;
    return this.aggService.getGhgEmissionStats(
      query,
      query.system
    );
  }
}
