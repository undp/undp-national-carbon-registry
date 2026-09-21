import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Post,
  Put,
  Body,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { PoliciesGuardEx } from "@app/shared/casl/policy.guard";
import { InitialReportService } from "@app/shared/initial-report/initial-report.service";
import { InitialReport } from "@app/shared/entities/initial.report.entity";
import { InitialReportCreateDto } from "@app/shared/dto/initial.report.create.dto";
import { InitialReportUpdateDto } from "@app/shared/dto/initial.report.update.dto";
import { InitialReportCooperativeApproachDto } from "@app/shared/dto/initial.report.cooperative.approach.dto";
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

  // onlyInject was previously `true` here — see the identical fix (and
  // rationale) on CooperativeApproachController's query endpoint.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, InitialReport)
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
  getById(@Query("reportNumber") reportNumber: string, @Request() req) {
    return this.initialReportService.getById(reportNumber);
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
  @Post("cooperativeApproach/add")
  addCooperativeApproach(
    @Body() dto: InitialReportCooperativeApproachDto,
    @Request() req
  ) {
    return this.initialReportService.addCooperativeApproach(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, InitialReport)
  )
  @Put("cooperativeApproach/remove")
  removeCooperativeApproach(
    @Body() dto: InitialReportCooperativeApproachDto,
    @Request() req
  ) {
    return this.initialReportService.removeCooperativeApproach(dto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, InitialReport)
  )
  @Put("submit")
  submit(@Query("reportNumber") reportNumber: string, @Request() req) {
    return this.initialReportService.submitReport(reportNumber, req.user);
  }

  // Discards the current Draft state — deletes the report outright if
  // it was never filed, or reverts to the last submitted version if it
  // was reopened. See InitialReportService.discardDraft.
  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Update, InitialReport)
  )
  @Put("discardDraft")
  discardDraft(@Query("reportNumber") reportNumber: string, @Request() req) {
    return this.initialReportService.discardDraft(reportNumber, req.user);
  }

  // The meaning is unchanged from the old per-approach model — "can this
  // cooperative approach authorize ITMOs" — only the implementation
  // (a join through the link table) is new.
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

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, InitialReport)
  )
  @Get("versions")
  getVersions(@Query("reportNumber") reportNumber: string) {
    return this.initialReportService.getVersions(reportNumber);
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, InitialReport)
  )
  @Get("version")
  getVersion(
    @Query("reportNumber") reportNumber: string,
    @Query("major", ParseIntPipe) major: number,
    @Query("minor", ParseIntPipe) minor: number
  ) {
    return this.initialReportService.getVersion(reportNumber, major, minor);
  }
}
