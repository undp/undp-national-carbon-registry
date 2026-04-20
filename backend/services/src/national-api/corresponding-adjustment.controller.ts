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
import { CorrespondingAdjustmentService } from "@app/shared/corresponding-adjustment/corresponding-adjustment.service";
import { CorrespondingAdjustment } from "@app/shared/entities/corresponding.adjustment.entity";
import { CaCalculateDto } from "@app/shared/dto/ca.calculate.dto";
import { QueryDto } from "@app/shared/dto/query.dto";

@ApiTags("Corresponding Adjustment")
@ApiBearerAuth()
@Controller("correspondingAdjustment")
export class CorrespondingAdjustmentController {
  constructor(
    private readonly caService: CorrespondingAdjustmentService
  ) {}

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, CorrespondingAdjustment)
  )
  @Post("calculate")
  calculate(@Body() dto: CaCalculateDto, @Request() req) {
    return this.caService.calculateCA(
      dto.year,
      dto.cooperativeApproachId,
      dto.ndcType,
      dto.caMethod,
      dto.ndcTarget,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CorrespondingAdjustment)
  )
  @Post("query")
  query(@Body() query: QueryDto, @Request() req) {
    return this.caService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CorrespondingAdjustment)
  )
  @Get("get")
  getById(@Query("id") caId: string, @Request() req) {
    return this.caService.getById(caId);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CorrespondingAdjustment)
  )
  @Put("submit")
  submit(@Query("id") caId: string, @Request() req) {
    return this.caService.submit(caId, req.user);
  }
}
