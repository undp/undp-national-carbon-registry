import { AefReportManagementService } from "@app/shared/aef-report-management/aef-report-management.service";
import { JwtAuthGuard } from "@app/shared/auth/guards/jwt-auth.guard";
import { Action } from "@app/shared/casl/action.enum";
import { AppAbility } from "@app/shared/casl/casl-ability.factory";
import { CheckPolicies } from "@app/shared/casl/policy.decorator";
import { PoliciesGuard } from "@app/shared/casl/policy.guard";
import { AefExportDto } from "@app/shared/dto/aef.export.dto";
import { QueryDto } from "@app/shared/dto/query.dto";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { AefReportTypeEnum } from "@app/shared/enum/aef.report.type.enum";
import { Body, Request, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller("reportsManagement")
export class ReportsManagementController {
  constructor(private readonly aefReportManagementService: AefReportManagementService) {}
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Post("queryAefRecords")
  async queryAefRecords(@Body() queryDto: QueryDto, @Request() req): Promise<any> {
    return this.aefReportManagementService.queryAefRecords(
      queryDto,
      req.abilityCondition,
      req.user
    );
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @CheckPolicies((ability: AppAbility) => ability.can(Action.Read, ProjectEntity))
  @Post("downloadAefReport")
  async downloadAefReport(@Body() exportDto: AefExportDto, @Request() req): Promise<any> {
    return this.aefReportManagementService.downloadAefReport(
      exportDto,
      req.abilityCondition,
      req.user
    );
  }
}
