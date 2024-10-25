import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { CreditIssuanceCertificateDto } from "src/dto/credit.issuance.certificate.dto";
import { DataResponseDto } from "src/dto/data.response.dto";
import { IssueCreditsDto } from "src/dto/issue.credits.dto";
import { MonitoringReportDto } from "src/dto/monitoring.report.dto";
import { VerificationReportDto } from "src/dto/verification.report.dto";
import { VerifyReportDto } from "src/dto/verify.report.dto";
import { DocumentEntity } from "src/entities/document.entity";
import { User } from "src/entities/user.entity";
import { VerificationRequestEntity } from "src/entities/verification.request.entity";
import { CompanyRole } from "src/enum/company.role.enum";
import { DocumentStatus } from "src/enum/document.status";
import { DocumentTypeEnum } from "src/enum/document.type.enum";
import { VerificationRequestStatusEnum } from "src/enum/verification.request.status.enum";
import { HelperService } from "src/util/helpers.service";
import { EntityManager, Repository } from "typeorm";

@Injectable()
export class VerificationService {
  constructor(
    private helperService: HelperService,
    @InjectEntityManager() private entityManager: EntityManager,
    @InjectRepository(VerificationRequestEntity)
    private verificationRequestRepository: Repository<VerificationRequestEntity>,
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>
  ) {}

  issueCredits(issueCreditsDto: IssueCreditsDto, user: User) {
    if (user.companyRole !== CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("verification.issueCreditsWrongUser", []),
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

  async verifyVerificationReport(verifyReportDto: VerifyReportDto, user: User) {
    if (user.companyRole !== CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    await this.entityManager.transaction(async (em) => {
      const verificationRequest = await this.verificationRequestRepository.find({
        where: {
          id: verifyReportDto.verificationRequestId,
        },
      });
      if (verificationRequest) {
        await em.update(
          VerificationRequestEntity,
          {
            id: verifyReportDto.verificationRequestId,
          },
          {
            status: verifyReportDto.verify
              ? VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED
              : VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED,
            userId: user.id,
            updatedTime: new Date().getTime(),
          }
        );
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.verificationRequestDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
        return;
      }

      const verificationDocument = await this.documentRepository.find({
        where: {
          id: verifyReportDto.reportId,
        },
      });
      if (verificationDocument) {
        await em.update(
          DocumentEntity,
          {
            id: verifyReportDto.reportId,
          },
          {
            status: verifyReportDto.verify ? DocumentStatus.ACCEPTED : DocumentStatus.REJECTED,
            updatedTime: new Date().getTime(),
          }
        );
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.verificationReportDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
        return;
      }
    });
  }

  async createVerificationReport(verificationReportDto: VerificationReportDto, user: User) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.uploadVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const verificationDocument = await this.documentRepository.findOne({
      where: {
        programmeId: verificationReportDto.programmeId,
        type: DocumentTypeEnum.VERIFICATION_REPORT,
      },
      order: {
        createdTime: "DESC",
      },
    });

    const verificationReportDocument = new DocumentEntity();
    verificationReportDocument.userId = user.id;
    verificationReportDocument.companyId = user.companyId;
    verificationReportDocument.version = verificationDocument
      ? verificationDocument.version + 1
      : 1;
    verificationReportDocument.programmeId = verificationReportDto.programmeId;
    verificationReportDocument.status = DocumentStatus.PENDING;
    verificationReportDocument.type = DocumentTypeEnum.VERIFICATION_REPORT;
    verificationReportDocument.createdTime = new Date().getTime();
    verificationReportDocument.updatedTime = new Date().getTime();
    verificationReportDocument.content = verificationReportDto.content;

    const savedReport = await this.entityManager.transaction(async (em) => {
      const verificationRequest = await this.verificationRequestRepository.findOne({
        where: {
          programmeId: verificationReportDto.programmeId,
        },
      });
      if (verificationRequest) {
        await em.update(
          VerificationRequestEntity,
          {
            programmeId: verificationReportDto.programmeId,
          },
          {
            status: VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED,
            userId: user.id,
            updatedTime: new Date().getTime(),
          }
        );
        verificationReportDocument.verificationRequestId = verificationRequest.id;
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.verificationRequestDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
        return;
      }
      return await em.save(verificationReportDocument);
    });

    return new DataResponseDto(HttpStatus.OK, savedReport);
  }

  async verifyMonitoringReport(verifyReportDto: VerifyReportDto, user: User) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyMonitoringReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    await this.entityManager.transaction(async (em) => {
      const verificationRequest = await this.verificationRequestRepository.find({
        where: {
          id: verifyReportDto.verificationRequestId,
        },
      });
      if (verificationRequest) {
        await em.update(
          VerificationRequestEntity,
          {
            id: verifyReportDto.verificationRequestId,
          },
          {
            status: verifyReportDto.verify
              ? VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED
              : VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED,
            userId: user.id,
            updatedTime: new Date().getTime(),
          }
        );
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.verificationRequestDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
        return;
      }

      const monitoringDocument = await this.documentRepository.find({
        where: {
          id: verifyReportDto.reportId,
        },
      });
      if (monitoringDocument) {
        await em.update(
          DocumentEntity,
          {
            id: verifyReportDto.reportId,
          },
          {
            status: verifyReportDto.verify ? DocumentStatus.ACCEPTED : DocumentStatus.REJECTED,
            updatedTime: new Date().getTime(),
          }
        );
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.monitoringReportDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
        return;
      }
    });
  }
  async createMonitoringReport(monitoringReportDto: MonitoringReportDto, user: User) {
    if (user.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.uploadMonitoringReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const monitoringDocument = await this.documentRepository.findOne({
      where: {
        programmeId: monitoringReportDto.programmeId,
        type: DocumentTypeEnum.MONITORING_REPORT,
      },
      order: {
        createdTime: "DESC",
      },
    });
    const monitoringReportDocument = new DocumentEntity();
    monitoringReportDocument.userId = user.id;
    monitoringReportDocument.version = monitoringDocument ? monitoringDocument.version + 1 : 1;

    monitoringReportDocument.companyId = user.companyId;
    monitoringReportDocument.programmeId = monitoringReportDto.programmeId;
    monitoringReportDocument.status = DocumentStatus.PENDING;
    monitoringReportDocument.type = DocumentTypeEnum.MONITORING_REPORT;
    monitoringReportDocument.createdTime = new Date().getTime();
    monitoringReportDocument.updatedTime = new Date().getTime();
    monitoringReportDocument.content = JSON.parse(monitoringReportDto.content);
    const savedReport = await this.entityManager.transaction(async (em) => {
      const verificationRequest: VerificationRequestEntity =
        await this.verificationRequestRepository.findOne({
          where: {
            programmeId: monitoringReportDto.programmeId,
          },
        });
      if (verificationRequest) {
        await em.update(
          VerificationRequestEntity,
          {
            programmeId: monitoringReportDto.programmeId,
          },
          {
            status: VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED,
            userId: user.id,
            updatedTime: new Date().getTime(),
          }
        );
        monitoringReportDocument.verificationRequestId = verificationRequest.id;
      } else {
        const verificationRequest = new VerificationRequestEntity();
        verificationRequest.programmeId = monitoringReportDto.programmeId;
        verificationRequest.userId = user.id;
        verificationRequest.status = VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED;
        verificationRequest.createdTime = new Date().getTime();
        verificationRequest.updatedTime = new Date().getTime();
        const saved = await em.save(verificationRequest);
        monitoringReportDocument.verificationRequestId = saved.id;
      }
      return await em.save(monitoringReportDocument);
    });

    return new DataResponseDto(HttpStatus.OK, savedReport);
  }
}
