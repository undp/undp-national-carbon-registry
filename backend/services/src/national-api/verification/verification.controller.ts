import { Body, Controller, Post, UseGuards, Request, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { VerifyReportDto } from "src/dto/verify.report.dto";
import { VerificationService } from "src/verification/verification.service";
import { PoliciesGuardEx } from "../../casl/policy.guard";
import { Action } from "../../casl/action.enum";
import { VerificationRequestEntity } from "../../entities/verification.request.entity";
import { CNCertificateIssueDto } from "../../dto/cncertificateIssue.dto";

@ApiTags("Verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post("createMonitoringReport")
  createMonitoringReport(@Body() monitoringReportDto: MonitoringReportDto, @Request() req) {
    return this.verificationService.createMonitoringReport(monitoringReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyMonitoringReport")
  verifyMonitoringReport(@Body() verifyReportDto: VerifyReportDto, @Request() req) {
    return this.verificationService.verifyMonitoringReport(verifyReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("createVerificationReport")
  createVerificationReport(@Body() verificationReportDto: VerificationReportDto, @Request() req) {
    return this.verificationService.createVerificationReport(verificationReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyVerificationReport")
  verifyVerificationReport(@Body() verifyReportDto: VerifyReportDto, @Request() req) {
    return this.verificationService.verifyVerificationReport(verifyReportDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, VerificationRequestEntity, true))
  @Get()
  async queryVerificationRequests(@Query("programmeId") programmeId: string, @Request() req) {
    return await this.verificationService.queryVerificationRequestsByProgrammeId(programmeId, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, VerificationRequestEntity, true))
  @Post("requestCarbonNeutralCertificate")
  async requestCarbonNeutralCertificate(@Body() body: {verificationRequestId: number}, @Request() req) {
    const { verificationRequestId } = body;
    return this.verificationService.requestCarbonNeutralCertificate(verificationRequestId, req.user);
  }

  @UseGuards(JwtAuthGuard, PoliciesGuardEx(true, Action.Read, VerificationRequestEntity, true))
  @Post("issueCarbonNeutralCertificate")
  async approveCarbonNeutralCertificate(@Body() cNCertificateIssueDto: CNCertificateIssueDto, @Request() req) {
    return this.verificationService.approveCarbonNeutralCertificate(cNCertificateIssueDto, req.user);
  }

  // @UseGuards(JwtAuthGuard)
  // @Post("creditIssuanceCertificate")
  // creditIssuanceCertificate(
  //   @Body() creditIssuanceCertificateDto: CreditIssuanceCertificateDto,
  //   @Request() req
  // ) {
  //   return this.verificationService.creditIssuanceCertificate(
  //     creditIssuanceCertificateDto,
  //     req.user
  //   );
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post("issueCredits")
  // issueCredits(@Body() issueCreditsDto: IssueCreditsDto, @Request() req) {
  //   return this.verificationService.issueCredits(issueCreditsDto, req.user);
  // }
}
