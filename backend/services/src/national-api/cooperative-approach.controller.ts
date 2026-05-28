import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Put,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { CooperativeApproachService } from "@app/shared/cooperative-approach/cooperative-approach.service";
import { CooperativeApproachCreateDto } from "@app/shared/dto/cooperative.approach.create.dto";
import { CooperativeApproachUpdateDto } from "@app/shared/dto/cooperative.approach.update.dto";
import { CooperativeApproach } from "@app/shared/entities/cooperative.approach.entity";
import { QueryDto } from "@app/shared/dto/query.dto";

@ApiTags("Cooperative Approach")
@ApiBearerAuth()
@Controller("cooperativeApproach")
export class CooperativeApproachController {
  constructor(
    private readonly cooperativeApproachService: CooperativeApproachService
  ) {}

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, CooperativeApproach)
  )
  @Post("create")
  create(@Body() dto: CooperativeApproachCreateDto, @Request() req) {
    return this.cooperativeApproachService.create(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CooperativeApproach, true)
  )
  @Post("query")
  query(@Body() query: QueryDto, @Request() req) {
    return this.cooperativeApproachService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CooperativeApproach)
  )
  @Get("get")
  getById(@Query("id") cooperativeApproachId: string, @Request() req) {
    return this.cooperativeApproachService.getById(cooperativeApproachId);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CooperativeApproach)
  )
  @Put("update")
  update(@Body() dto: CooperativeApproachUpdateDto, @Request() req) {
    return this.cooperativeApproachService.update(dto, req.user);
  }
}
