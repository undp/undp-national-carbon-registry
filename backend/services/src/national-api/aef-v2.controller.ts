import { AefV2ReportService } from "@app/shared/aef-v2-registry/aef-v2-report.service";
import { AefV2ExportDto } from "@app/shared/aef-v2-registry/dto/aef.v2.export.dto";
import { AefV2QueryDto } from "@app/shared/aef-v2-registry/dto/aef.v2.query.dto";
import { AefV2SubmitDto, AefV2YearDto } from "@app/shared/aef-v2-registry/dto/aef.v2.submit.dto";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { AefReport } from "@app/shared/dto/aef.report";
import { DataResponseDto } from "@app/shared/dto/data.response.dto";
import { Body, Controller, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

// AEF V2 (@app/aef-v2) — coexists with the V1 endpoints on
// ReportsManagementController while V1 is phased out. See the module
// docblock on AefV2RegistryModule for the write-side wiring; this controller
// is read/orchestration only, forwarding to AefV2ReportService.
//
// The start-of-year rollover (new Table 1 Submission + frozen Table 4/5
// snapshots) is deliberately NOT exposed here or anywhere else over HTTP —
// it is cron-only. See AefV2SchedulerService (in-process, container
// deployments) and src/aef-rollover (one-shot, serverless deployments).
@Controller("aefV2")
export class AefV2Controller {
  constructor(private readonly aefV2ReportService: AefV2ReportService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, AefReport))
  @Post("query")
  async query(@Body() dto: AefV2QueryDto): Promise<DataResponseDto> {
    const result = await this.aefV2ReportService.query(dto.table, dto.reportedYear, dto.sort);
    return new DataResponseDto(HttpStatus.OK, result);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, AefReport))
  @Post("validate")
  async validate(@Body() dto: AefV2YearDto): Promise<DataResponseDto> {
    const issues = await this.aefV2ReportService.validate(dto.reportedYear);
    return new DataResponseDto(HttpStatus.OK, issues);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Manage, AefReport))
  @Post("submit")
  async submit(@Body() dto: AefV2SubmitDto): Promise<DataResponseDto> {
    const result = await this.aefV2ReportService.submit(dto.reportedYear, {
      submissionDate: dto.submissionDate,
      force: dto.force,
    });
    return new DataResponseDto(HttpStatus.OK, result);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, AefReport))
  @Post("download")
  async download(@Body() dto: AefV2ExportDto): Promise<DataResponseDto> {
    const result = await this.aefV2ReportService.download(dto.reportedYear, dto.fileType, dto.table);
    return new DataResponseDto(HttpStatus.OK, result);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, AefReport))
  @Post("config")
  async config(): Promise<DataResponseDto> {
    return new DataResponseDto(HttpStatus.OK, this.aefV2ReportService.config());
  }
}
