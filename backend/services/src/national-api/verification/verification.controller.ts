import { Body, Controller, Post, UseGuards, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { CreditIssuanceCertificateDto } from "src/dto/credit.issuance.certificate.dto";
import { IssueCreditsDto } from "src/dto/issue.credits.dto";
import { VerifyReportDto } from "src/dto/verify.report.dto";
import { VerificationService } from "src/verification/verification.service";

@ApiTags("Verification")
@ApiBearerAuth()
@Controller("verification")
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @UseGuards(JwtAuthGuard)
  @Post("createMonitoringReport")
  uploadMonitoringReport(@Body() monitoringReportDto: MonitoringReportDto, @Request() req) {
    return this.verificationService.uploadMonitoringReport(monitoringReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyMonitoringReport")
  verifyMonitoringReport(@Body() verifyReportDto: VerifyReportDto, @Request() req) {
    return this.verificationService.verifyMonitoringReport(verifyReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("uploadVerificationReport")
  uploadVerificationReport(@Body() verificationReportDto: VerificationReportDto, @Request() req) {
    return this.verificationService.uploadVerificationReport(verificationReportDto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post("verifyVerificationReport")
  verifyVerificationReport(@Body() verifyReportDto: VerifyReportDto, @Request() req) {
    return this.verificationService.verifyVerificationReport(verifyReportDto, req.user);
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
