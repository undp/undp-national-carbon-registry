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
import { AggregateAPIService } from "./aggregate.api.service";
import { StatList } from "../shared/src/dto/stat.list.dto";
import { ApiKeyJwtAuthGuard } from "src/shared/src/auth/guards/api-jwt-key.guard";
import { PoliciesGuardEx } from "src/shared/src/casl/policy.guard";
import { Stat } from "src/shared/src/dto/stat.dto";
import { Action } from "src/shared/src/casl/action.enum";

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
  async aggQueries(@Body() query: StatList, @Request() req) {
    const companyId =
      req?.user?.companyId !== null ? req?.user?.companyId : null;
    return this.aggService.getGhgEmissionStats(query, query.system);
  }
}
