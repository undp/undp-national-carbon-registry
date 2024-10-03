import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreditIssuanceCertificateDto } from "src/dto/credit.issuance.certificate.dto";
import { IssueCreditsDto } from "src/dto/issue.credits.dto";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { RejectMonitoringReportDto } from "src/dto/reject.monitoring.report.dto";
import { RejectVerificationReportDto } from "src/dto/reject.verification.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { VerifyMonitoringReportDto } from "src/dto/verify.monitoring.report.dto";
import { VerifyVerificationReportDto } from "src/dto/verify.verification.report.dto";
import { User } from "src/entities/user.entity";
import { CompanyRole } from "src/enum/company.role.enum";
import { HelperService } from "src/util/helpers.service";

@Injectable()
export class VerificationService {
  constructor(private helperService: HelperService) {}

  issueCredits(issueCreditsDto: IssueCreditsDto, user: User) {
    if (user.companyRole !== CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.issueCreditsWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  creditIssuanceCertificate(
    creditIssuanceCertificateDto: CreditIssuanceCertificateDto,
    user: User
  ) {
    if (user.companyRole !== CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.creditIssuanceCertificateWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  rejectVerificationReport(
    rejectVerificationReportDto: RejectVerificationReportDto,
    user: User
  ) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.rejectVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  verifyVerificationReport(body: VerifyVerificationReportDto, user: User) {
    if (user.companyRole !== CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  uploadVerificationReport(body: VerificationReportDto, user: User) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.uploadVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  rejectMonitoringReport(body: RejectMonitoringReportDto, user: User) {
    if (user.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.rejectMonitoringReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  verifyMonitoringReport(body: VerifyMonitoringReportDto, user: User) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyMonitoringReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
  async uploadMonitoringReport(
    monitoringReport: MonitoringReportDto,
    user: User
  ) {
    if (user.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.uploadMonitoringReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
