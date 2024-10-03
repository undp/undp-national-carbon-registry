import { Body, Controller, Post, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { VerificationService } from "./verification.service";
import { VerifyMonitoringReportDto } from "src/dto/verify.monitoring.report.dto";
import { RejectMonitoringReportDto } from "src/dto/reject.monitoring.report.dto";
import { VerifyVerificationReportDto } from "src/dto/verify.verification.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { CreditIssuanceCertificateDto } from "src/dto/credit.issuance.certificate.dto";
import { IssueCreditsDto } from "src/dto/issue.credits.dto";
import { RejectVerificationReportDto } from "src/dto/reject.verification.report.dto";

@ApiTags("Verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post("uploadMonitoringReport")
  uploadMonitoringReport(
    @Body() monitoringReportDto: MonitoringReportDto,
    @Request() req
  ) {
    return this.verificationService.uploadMonitoringReport(
      monitoringReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("rejectMonitoringReport")
  rejectMonitoringReport(
    @Body() rejectMonitoringReportDto: RejectMonitoringReportDto,
    @Request() req
  ) {
    return this.verificationService.rejectMonitoringReport(
      rejectMonitoringReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyMonitoringReport")
  verifyMonitoringReport(
    @Body() verifyMonitoringReportDto: VerifyMonitoringReportDto,
    @Request() req
  ) {
    return this.verificationService.verifyMonitoringReport(
      verifyMonitoringReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("uploadVerificationReport")
  uploadVerificationReport(
    @Body() verificationReportDto: VerificationReportDto,
    @Request() req
  ) {
    return this.verificationService.uploadVerificationReport(
      verificationReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyVerificationReport")
  verifyVerificationReport(
    @Body() verifyVerificationReportDto: VerifyVerificationReportDto,
    @Request() req
  ) {
    return this.verificationService.verifyVerificationReport(
      verifyVerificationReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("rejectVerificationReport")
  rejectVerificationReport(
    @Body() rejectVerificationReportDto: RejectVerificationReportDto,
    @Request() req
  ) {
    return this.verificationService.rejectVerificationReport(
      rejectVerificationReportDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("creditIssuanceCertificate")
  creditIssuanceCertificate(
    @Body() creditIssuanceCertificateDto: CreditIssuanceCertificateDto,
    @Request() req
  ) {
    return this.verificationService.creditIssuanceCertificate(
      creditIssuanceCertificateDto,
      req.user
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post("issueCredits")
  issueCredits(@Body() issueCreditsDto: IssueCreditsDto, @Request() req) {
    return this.verificationService.issueCredits(issueCreditsDto, req.user);
  }
}
