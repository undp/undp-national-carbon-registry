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
import { CaPreviewDto } from "@app/shared/dto/ca.preview.dto";
import { CaSaveDto } from "@app/shared/dto/ca.save.dto";
import { CorrespondingAdjustmentUpdateDto } from "@app/shared/dto/corresponding.adjustment.update.dto";
import { QueryDto } from "@app/shared/dto/query.dto";

@ApiTags("Corresponding Adjustment")
@ApiBearerAuth()
@Controller("correspondingAdjustment")
export class CorrespondingAdjustmentController {
  constructor(
    private readonly caService: CorrespondingAdjustmentService
  ) {}

  // The whole NDC period covering `year`, as the years-across table the
  // calculate form and the detail page render. Returns hasNdcTarget:false
  // at 200 (rather than a 400) when no period covers the year, because the
  // form polls this as the user types.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CorrespondingAdjustment)
  )
  @Get("periodSummary")
  getPeriodSummary(@Query("year") year: string) {
    return this.caService.getPeriodSummary(Number(year));
  }

  // Computes without persisting — the "Calculate" button. Guarded by
  // Read, not Create: a DNA-ViewOnly user (Read only, no Create/Update)
  // may calculate a preview even though save/submit below remain out of
  // reach — see CorrespondingAdjustmentService.previewCA's
  // assertCanView vs assertCanManage.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, CorrespondingAdjustment)
  )
  @Post("preview")
  preview(@Body() dto: CaPreviewDto, @Request() req) {
    return this.caService.previewCA(dto, req.user);
  }

  // Persists — "Save Draft" (submit:false) / "Submit" (submit:true).
  // One row per year: creates it, or overwrites it in place while Draft.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, CorrespondingAdjustment)
  )
  @Post("save")
  save(@Body() dto: CaSaveDto, @Request() req) {
    return this.caService.saveCA(dto, req.user);
  }

  // Averaging only: submits every Draft year of the NDC period at once,
  // available from 1 January after the period ends.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CorrespondingAdjustment)
  )
  @Put("finalizePeriod")
  finalizePeriod(@Query("year") year: string, @Request() req) {
    return this.caService.finalizePeriod(Number(year), req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CorrespondingAdjustment)
  )
  @Put("update")
  update(@Body() dto: CorrespondingAdjustmentUpdateDto, @Request() req) {
    return this.caService.update(dto, req.user);
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
  @Get("reconciliation")
  getReconciliation() {
    return this.caService.getReconciliationSummary();
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

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, CorrespondingAdjustment)
  )
  @Put("approve")
  approve(@Query("id") caId: string, @Request() req) {
    return this.caService.approve(caId, req.user);
  }
}
