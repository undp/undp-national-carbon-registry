import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/shared/src/auth/guards/jwt-auth.guard";
import { MonitoringReportDto } from "src/shared/src/dto/monitoring.report.dto";
import { VerificationReportDto } from "src/shared/src/dto/verification.report.dto";
import { VerifyReportDto } from "src/shared/src/dto/verify.report.dto";
import { VerificationService } from "src/shared/src/verification/verification.service";
import { PoliciesGuardEx } from "../../shared/src/casl/policy.guard";
import { Action } from "../../shared/src/casl/action.enum";
import { VerificationRequestEntity } from "../../shared/src/entities/verification.request.entity";
import { CNCertificateIssueDto } from "../../shared/src/dto/cncertificateIssue.dto";

@ApiTags("Verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post("createMonitoringReport")
  createMonitoringReport(
    @Body() monitoringReportDto: MonitoringReportDto,
    @Request() req
  ) {
    return this.verificationService.createMonitoringReport(
      monitoringReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyMonitoringReport")
  verifyMonitoringReport(
    @Body() verifyReportDto: VerifyReportDto,
    @Request() req
  ) {
    return this.verificationService.verifyMonitoringReport(
      verifyReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("createVerificationReport")
  createVerificationReport(
    @Body() verificationReportDto: VerificationReportDto,
    @Request() req
  ) {
    return this.verificationService.createVerificationReport(
      verificationReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyVerificationReport")
  verifyVerificationReport(
    @Body() verifyReportDto: VerifyReportDto,
    @Request() req
  ) {
    return this.verificationService.verifyVerificationReport(
      verifyReportDto,
      req.user
    );
  }

  @ApiBearerAuth()
  @UseGuards(
    JwtAuthGuard,
    PoliciesGuardEx(true, Action.Read, VerificationRequestEntity, true)
  )
  @Get()
  async queryVerificationRequests(
    @Query("programmeId") programmeId: string,
    @Request() req
  ) {
    return await this.verificationService.queryVerificationRequestsByProgrammeId(
      programmeId,
      req.user
    );
  }
}
