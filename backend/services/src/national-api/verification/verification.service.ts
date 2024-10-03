import { Injectable } from "@nestjs/common";
import { CreditIssuanceCertificateDto } from "src/dto/credit.issuance.certificate.dto";
import { IssueCreditsDto } from "src/dto/issue.credits.dto";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { RejectMonitoringReportDto } from "src/dto/reject.monitoring.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { VerifyMonitoringReportDto } from "src/dto/verify.monitoring.report.dto";
import { VerifyVerificationReportDto } from "src/dto/verify.verification.report.dto";
import { User } from "src/entities/user.entity";

@Injectable()
export class VerificationService {
  issueCredits(issueCreditsDto: IssueCreditsDto, user: any) {
    throw new Error("Method not implemented.");
  }
  creditIssuanceCertificate(
    creditIssuanceCertificateDto: CreditIssuanceCertificateDto,
    user: any
  ) {
    throw new Error("Method not implemented.");
  }
  verifyVerificationReport(body: VerifyVerificationReportDto, user: any) {
    throw new Error("Method not implemented.");
  }
  uploadVerificationReport(body: VerificationReportDto, user: any) {
    throw new Error("Method not implemented.");
  }
  rejectMonitoringReport(body: RejectMonitoringReportDto, user: any) {
    throw new Error("Method not implemented.");
  }
  verifyMonitoringReport(body: VerifyMonitoringReportDto, user: any) {
    throw new Error("Method not implemented.");
  }
  async uploadMonitoringReport(
    monitoringReport: MonitoringReportDto,
    user: User
  ) {
    throw new Error("Method not implemented.");
  }
}
