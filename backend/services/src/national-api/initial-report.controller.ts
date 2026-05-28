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
import { InitialReportService } from "@app/shared/initial-report/initial-report.service";
import { InitialReport } from "@app/shared/entities/initial.report.entity";
import { InitialReportCreateDto } from "@app/shared/dto/initial.report.create.dto";
import { InitialReportUpdateDto } from "@app/shared/dto/initial.report.update.dto";
import { QueryDto } from "@app/shared/dto/query.dto";

@ApiTags("Initial Report")
@ApiBearerAuth()
@Controller("initialReport")
export class InitialReportController {
  constructor(
    private readonly initialReportService: InitialReportService
  ) {}

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Create, InitialReport)
  )
  @Post("generate")
  generate(@Body() dto: InitialReportCreateDto, @Request() req) {
    return this.initialReportService.generateDraft(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, InitialReport, true)
  )
  @Post("query")
  query(@Body() query: QueryDto, @Request() req) {
    return this.initialReportService.query(query, req.abilityCondition);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, InitialReport)
  )
  @Get("get")
  getById(@Query("id") reportId: string, @Request() req) {
    return this.initialReportService.getById(reportId);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, InitialReport)
  )
  @Put("update")
  update(@Body() dto: InitialReportUpdateDto, @Request() req) {
    return this.initialReportService.update(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, InitialReport)
  )
  @Put("submit")
  submit(@Query("id") reportId: string, @Request() req) {
    return this.initialReportService.submitReport(reportId, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("check")
  async checkExists(
    @Query("cooperativeApproachId") cooperativeApproachId: string
  ) {
    const exists =
      await this.initialReportService.hasSubmittedReport(
        cooperativeApproachId
      );
    return { hasSubmittedReport: exists };
  }
}
