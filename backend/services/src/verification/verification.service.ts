import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { DataResponseDto } from "src/dto/data.response.dto";
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
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProgrammeSlService } from "../programme-sl/programme-sl.service";
import { CreditIssueCertificateGenerator } from "../util/creditIssueCertificate.gen";
import { DateUtilService } from "../util/dateUtil.service";
import { HelperService } from "src/util/helpers.service";
import { SLCFSerialNumberGeneratorService } from "../util/slcfSerialNumberGenerator.service";
import { TxRefGeneratorService } from "../util/txRef-generator.service";
import { EntityManager, Repository } from "typeorm";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { EmailTemplates } from "../email-helper/email.template";
import { ConfigService } from "@nestjs/config";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { DocType } from "../enum/document.type";
import { CNCertificateIssueDto } from "../dto/cncertificateIssue.dto";
import { CarbonNeutralCertificateGenerator } from "../util/carbonNeutralCertificate.gen";
import { CreditRetirementSlService } from "../creditRetirement-sl/creditRetirementSl.service";
import { ProgrammeAuditLogSl } from "../entities/programmeAuditLogSl.entity";
import { ProgrammeAuditLogType } from "src/enum/programmeAuditLogType.enum";

@Injectable()
export class VerificationService {
  constructor(
    private helperService: HelperService,
    @InjectEntityManager() private entityManager: EntityManager,
    @InjectRepository(VerificationRequestEntity)
    private verificationRequestRepository: Repository<VerificationRequestEntity>,
    @InjectRepository(DocumentEntity)
    private documentRepository: Repository<DocumentEntity>,
    private programmeSlService: ProgrammeSlService,
    private programmeLedgerService: ProgrammeLedgerService,
    private creditIssueCertificateGenerator: CreditIssueCertificateGenerator,
    private dateUtilService: DateUtilService,
    private serialGenerator: SLCFSerialNumberGeneratorService,
    private txRefGen: TxRefGeneratorService,
    private emailHelperService: EmailHelperService,
    private configService: ConfigService,
    private fileHandler: FileHandlerInterface,
    private carbonNeutralCertificateGenerator: CarbonNeutralCertificateGenerator,
    private creditRetirementSlService: CreditRetirementSlService,
    @InjectRepository(ProgrammeAuditLogSl)
    private programmeAuditSlRepo: Repository<ProgrammeAuditLogSl>
  ) {}

  //MARK: create Monitoring Report
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

    const docContent = JSON.parse(monitoringReportDto.content);

    if (
      docContent.annexures.optionalDocuments &&
      docContent.annexures.optionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of docContent.annexures.optionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.MONITORING_REPORT_ANNEXURES_OPTIONAL_DOCUMENT,
            monitoringReportDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      docContent.annexures.optionalDocuments = docUrls;
    }

    if (
      docContent.projectActivity.projectActivityLocationsList &&
      docContent.projectActivity.projectActivityLocationsList.length > 0
    ) {
      for (const location of docContent.projectActivity.projectActivityLocationsList) {
        if (location.optionalDocuments && location.optionalDocuments.length > 0) {
          const docUrls = [];
          for (const doc of location.optionalDocuments) {
            let docUrl;

            if (this.isValidHttpUrl(doc)) {
              docUrl = doc;
            } else {
              docUrl = await this.uploadDocument(
                DocType.MONITORING_REPORT_LOCATION_OF_PROJECT_ACTIVITY_OPTIONAL_DOCUMENT,
                monitoringReportDto.programmeId,
                doc
              );
            }
            docUrls.push(docUrl);
          }

          location.optionalDocuments = docUrls;
        }
      }
    }

    if (
      docContent.quantifications.optionalDocuments &&
      docContent.quantifications.optionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of docContent.quantifications.optionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.MONITORING_REPORT_QUANTIFICATIONS_OPTIONAL_DOCUMENT,
            monitoringReportDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      docContent.quantifications.optionalDocuments = docUrls;
    }

    const savedReport = await this.entityManager.transaction(async (em) => {
      const monitoringReportDocument = new DocumentEntity();
      monitoringReportDocument.userId = user.id;
      monitoringReportDocument.companyId = user.companyId;
      monitoringReportDocument.programmeId = monitoringReportDto.programmeId;
      monitoringReportDocument.status = DocumentStatus.PENDING;
      monitoringReportDocument.type = DocumentTypeEnum.MONITORING_REPORT;
      monitoringReportDocument.createdTime = new Date().getTime();
      monitoringReportDocument.updatedTime = new Date().getTime();
      monitoringReportDocument.content = docContent;

      const verificationRequest: VerificationRequestEntity =
        await this.verificationRequestRepository.findOne({
          where: {
            programmeId: monitoringReportDto.programmeId,
          },
          order: { id: "DESC" },
        });

      if (
        verificationRequest &&
        verificationRequest.status === VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED
      ) {
        await em.update(
          VerificationRequestEntity,
          {
            id: verificationRequest.id,
          },
          {
            status: VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED,
            userId: user.id,
            updatedTime: new Date().getTime(),
          }
        );

        const lastMonitoringDocument = await this.documentRepository.findOne({
          where: {
            verificationRequestId: verificationRequest.id,
            type: DocumentTypeEnum.MONITORING_REPORT,
          },
          order: {
            createdTime: "DESC",
          },
        });
        monitoringReportDocument.version = lastMonitoringDocument
          ? lastMonitoringDocument.version + 1
          : 1;
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
        monitoringReportDocument.version = 1;
      }
      return await em.save(monitoringReportDocument);
    });

    //send email to SLCF
    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.MONITORING_CREATE,
      null,
      monitoringReportDto.programmeId
    );

    if (savedReport) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = monitoringReportDto.programmeId;
      log.logType = ProgrammeAuditLogType.MONITORING_CREATE;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, savedReport);
  }

  //MARK: Verify Monitoring Report
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
    let verificationRequest: VerificationRequestEntity;
    await this.entityManager.transaction(async (em) => {
      verificationRequest = await this.verificationRequestRepository.findOne({
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

      const log = new ProgrammeAuditLogSl();
      log.programmeId = verificationRequest.programmeId;
      log.logType = verifyReportDto.verify
        ? ProgrammeAuditLogType.MONITORING_APPROVED
        : ProgrammeAuditLogType.MONITORING_REJECTED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    });

    //send email to Project Participant
    // if (verifyReportDto.verify) {
    await this.emailHelperService.sendEmailToProjectParticipant(
      verifyReportDto.verify
        ? EmailTemplates.MONITORING_APPROVED
        : EmailTemplates.MONITORING_REJECTED,
      null,
      verificationRequest.programmeId
    );
    // } else {
    //   await this.emailHelperService.sendEmailToProjectParticipant(
    //     EmailTemplates.MONITORING_REJECTED,
    //     null,
    //     verificationRequest.programmeId
    //   );
    // }
  }

  //MARK: create Verification Report
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

    const docContent = JSON.parse(verificationReportDto.content);

    if (
      docContent.annexures.optionalDocuments &&
      docContent.annexures.optionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of docContent.annexures.optionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.VERIFICATION_REPORT_ANNEXURES_OPTIONAL_DOCUMENT,
            verificationReportDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      docContent.annexures.optionalDocuments = docUrls;
    }

    if (
      docContent.verificationFinding.optionalDocuments &&
      docContent.verificationFinding.optionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of docContent.verificationFinding.optionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.VERIFICATION_REPORT_VERIFICATION_FINDING_OPTIONAL_DOCUMENT,
            verificationReportDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      docContent.verificationFinding.optionalDocuments = docUrls;
    }

    if (
      docContent.verificationOpinion.signature1 &&
      docContent.verificationOpinion.signature1.length > 0
    ) {
      const signUrls = [];
      for (const sign of docContent.verificationOpinion.signature1) {
        let signUrl;

        if (this.isValidHttpUrl(sign)) {
          signUrl = sign;
        } else {
          signUrl = await this.uploadDocument(
            DocType.VERIFICATION_REPORT_VERIFICATION_OPINION_SIGN_1,
            verificationReportDto.programmeId,
            sign
          );
        }
        signUrls.push(signUrl);
      }
      docContent.verificationOpinion.signature1 = signUrls;
    }

    if (
      docContent.verificationOpinion.signature2 &&
      docContent.verificationOpinion.signature2.length > 0
    ) {
      const signUrls = [];
      for (const sign of docContent.verificationOpinion.signature2) {
        let signUrl;

        if (this.isValidHttpUrl(sign)) {
          signUrl = sign;
        } else {
          signUrl = await this.uploadDocument(
            DocType.VERIFICATION_REPORT_VERIFICATION_OPINION_SIGN_1,
            verificationReportDto.programmeId,
            sign
          );
        }
        signUrls.push(signUrl);
      }
      docContent.verificationOpinion.signature2 = signUrls;
    }

    const programme = await this.programmeSlService.getProjectById(
      verificationReportDto.programmeId
    );

    const creditReceived =
      (Number(programme.creditBalance) || 0) +
      (Number(programme.creditFrozen) || 0) +
      (Number(programme.creditRetired) || 0) +
      (Number(programme.creditTransferred) || 0);

    if (programme.creditEst - creditReceived < Number(docContent?.projectDetails?.verifiedScer)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.cannotIssueMoreThanEstimatedCredits",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const verificationReportDocument = new DocumentEntity();
    verificationReportDocument.userId = user.id;
    verificationReportDocument.companyId = user.companyId;

    verificationReportDocument.programmeId = verificationReportDto.programmeId;
    verificationReportDocument.status = DocumentStatus.PENDING;
    verificationReportDocument.type = DocumentTypeEnum.VERIFICATION_REPORT;
    verificationReportDocument.createdTime = new Date().getTime();
    verificationReportDocument.updatedTime = new Date().getTime();
    verificationReportDocument.content = docContent;

    const savedReport = await this.entityManager.transaction(async (em) => {
      const verificationRequest = await this.verificationRequestRepository.findOne({
        where: {
          programmeId: verificationReportDto.programmeId,
        },
        order: {
          id: "DESC",
        },
      });
      if (
        verificationRequest &&
        (verificationRequest.status == VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED ||
          verificationRequest.status == VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED)
      ) {
        await em.update(
          VerificationRequestEntity,
          {
            id: verificationRequest.id,
          },
          {
            status: VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED,
            userId: user.id,
            monitoringStartDate: docContent?.projectDetails?.monitoringPeriodStart,
            monitoringEndDate: docContent?.projectDetails?.monitoringPeriodEnd,
            creditAmount: docContent?.projectDetails?.verifiedScer,

            updatedTime: new Date().getTime(),
          }
        );
        const lastVerificationDocument = await this.documentRepository.findOne({
          where: {
            verificationRequestId: verificationRequest.id,
            type: DocumentTypeEnum.VERIFICATION_REPORT,
          },
          order: {
            id: "DESC",
          },
        });
        verificationReportDocument.verificationRequestId = verificationRequest.id;
        verificationReportDocument.version = lastVerificationDocument
          ? lastVerificationDocument.version + 1
          : 1;
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "verification.verificationRequestDoesNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      return await em.save(verificationReportDocument);
    });

    //send email to SLCF
    await this.emailHelperService.sendEmailToExCom(
      EmailTemplates.VERIFICATION_CREATE,
      null,
      verificationReportDto.programmeId
    );

    if (savedReport) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = verificationReportDto.programmeId;
      log.logType = ProgrammeAuditLogType.VERIFICATION_CREATE;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, savedReport);
  }

  //MARK: verify Verification Report
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

    const verificationRequest = await this.verificationRequestRepository.findOneBy({
      id: verifyReportDto.verificationRequestId,
    });

    if (!verificationRequest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verificationRequestDoesNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    let updatedProgramme;
    let isInitialCreditIssue = false;
    if (verifyReportDto.verify === true) {
      const programme = await this.programmeSlService.getProjectById(
        verificationRequest.programmeId
      );

      isInitialCreditIssue = !programme.creditStartSerialNumber;
      const txRef = this.txRefGen.getCreditIssueApproveRef(user, programme, verificationRequest);

      updatedProgramme = await this.programmeLedgerService.issueSlCredits(
        verificationRequest,
        programme.purposeOfCreditDevelopment,
        programme.company.companyId,
        txRef
      );
    }

    let certificateUrl = undefined;
    let creditIssueCertificateSerial = undefined;
    if (updatedProgramme) {
      const previousCreditIssueCertificateSerial = await this.getPreviousCertificateSerial(
        verificationRequest.programmeId,
        "CI"
      );
      creditIssueCertificateSerial = this.serialGenerator.generateCreditIssueCertificateNumber(
        updatedProgramme.serialNo,
        previousCreditIssueCertificateSerial
      );
      certificateUrl = await this.getCreditIssuanceCertificateURL(
        verificationRequest,
        creditIssueCertificateSerial,
        isInitialCreditIssue
      );

      const hostAddress = this.configService.get("host");
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        updatedProgramme.companyId,
        EmailTemplates.CREDIT_ISSUANCE_SL,
        {
          programmeName: updatedProgramme.title,
          credits: verificationRequest.creditAmount,
          serialNumber: updatedProgramme.serialNo,
          pageLink: hostAddress + `/programmeManagementSLCF/view/${updatedProgramme.programmeId}`,
        }
      );

      const logs: ProgrammeAuditLogSl[] = [];

      const VerificationApprovedLog = new ProgrammeAuditLogSl();
      VerificationApprovedLog.programmeId = verificationRequest.programmeId;
      VerificationApprovedLog.logType = ProgrammeAuditLogType.VERIFICATION_APPROVED;
      VerificationApprovedLog.userId = user.id;
      logs.push(VerificationApprovedLog);

      const creditIssueLog = new ProgrammeAuditLogSl();
      creditIssueLog.programmeId = verificationRequest.programmeId;
      creditIssueLog.logType = ProgrammeAuditLogType.CREDIT_ISSUED;
      creditIssueLog.data = { creditIssued: Number(verificationRequest.creditAmount) };
      creditIssueLog.userId = user.id;
      logs.push(creditIssueLog);

      await this.programmeAuditSlRepo.save(logs);
    }

    await this.entityManager.transaction(async (em) => {
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
          creditIssueCertificateUrl: certificateUrl,
          verificationSerialNo: creditIssueCertificateSerial,
        }
      );

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

    //send email to Project Participant and SLCF
    await this.emailHelperService.sendEmailToSLCFAdmins(
      verifyReportDto.verify
        ? EmailTemplates.VERIFICATION_APPROVED
        : EmailTemplates.VERIFICATION_REJECTED,
      null,
      verificationRequest.programmeId
    );

    if (!verifyReportDto.verify) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = verificationRequest.programmeId;
      log.logType = ProgrammeAuditLogType.VERIFICATION_REJECTED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }
  }

  //MARK: approve Carbon Neutral Certificate
  async approveCarbonNeutralCertificate(cNCertificateIssueDto: CNCertificateIssueDto, user: User) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const verificationRequest = await this.verificationRequestRepository.findOneBy({
      id: cNCertificateIssueDto.verificationRequestId,
    });

    if (!verificationRequest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verificationRequestDoesNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    let carbonNeutralCertificateSerial = undefined;
    let carbonNeutralCertUrl = undefined;
    const programme = await this.programmeSlService.getProjectById(verificationRequest.programmeId);

    if (cNCertificateIssueDto.approve) {
      const previousCarbonNeutralCertificateSerial = await this.getPreviousCertificateSerial(
        verificationRequest.programmeId,
        "CNC"
      );
      carbonNeutralCertificateSerial = this.serialGenerator.generateCarbonNeutralCertificateNumber(
        previousCarbonNeutralCertificateSerial
      );

      const neutralData = {
        projectName: programme.title,
        companyName: programme.company.name,
        scope: cNCertificateIssueDto.scope,
        certificateNo: carbonNeutralCertificateSerial,
        issueDate: this.dateUtilService.formatCustomDate(),
        creditAmount: await this.creditRetirementSlService.getCreditAmountSum(
          programme.company.companyId,
          cNCertificateIssueDto.assessmentPeriodStart,
          cNCertificateIssueDto.assessmentPeriodEnd
        ),
        orgBoundary: cNCertificateIssueDto.orgBoundary,
        assessmentYear: cNCertificateIssueDto.year,
        assessmentPeriod: `${this.dateUtilService.formatCustomDate(
          cNCertificateIssueDto.assessmentPeriodStart
        )} - ${this.dateUtilService.formatCustomDate(cNCertificateIssueDto.assessmentPeriodEnd)}`,
      };
      carbonNeutralCertUrl =
        await this.carbonNeutralCertificateGenerator.generateCarbonNeutralCertificate(
          neutralData,
          false
        );
    }

    const updatedRequest = await this.verificationRequestRepository.update(
      {
        id: cNCertificateIssueDto.verificationRequestId,
      },
      {
        carbonNeutralCertificateRequested: false,
        carbonNeutralCertificateSerialNo: carbonNeutralCertificateSerial,
        carbonNeutralCertificateUrl: carbonNeutralCertUrl,
      }
    );

    const hostAddress = this.configService.get("host");
    await this.emailHelperService.sendEmailToOrganisationAdmins(
      programme.company.companyId,
      cNCertificateIssueDto.approve
        ? EmailTemplates.CARBON_NEUTRAL_SL_REQUEST_APPROVED
        : EmailTemplates.CARBON_NEUTRAL_SL_REQUEST_REJECTED,
      {
        programmeName: programme.title,
        remark: cNCertificateIssueDto.orgBoundary,
        pageLink: hostAddress + `/programmeManagementSLCF/view/${programme.programmeId}`,
      }
    );

    console.log(carbonNeutralCertUrl);
    return updatedRequest;
  }

  //MARK: get Credit Issuance Certificate URL
  async getCreditIssuanceCertificateURL(
    verificationRequest: VerificationRequestEntity,
    verificationSerialNo: string,
    isInitialCreditIssue: boolean
  ) {
    const programme = await this.programmeSlService.getProjectById(verificationRequest.programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.programmeNotExist", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const blockStart = isInitialCreditIssue
      ? programme.creditStartSerialNumber
      : this.serialGenerator.calculateCreditSerialNumber(
          programme.creditStartSerialNumber,
          programme.creditBalance > 0
            ? programme.creditBalance - verificationRequest.creditAmount
            : 0
        );
    const blockEnd = this.serialGenerator.calculateCreditSerialNumber(
      programme.creditStartSerialNumber,
      programme.creditBalance - 1
    );

    const certificateData = {
      projectName: programme.title,
      companyName: programme.company.name,
      creditType: programme.purposeOfCreditDevelopment,
      certificateNo: verificationSerialNo,
      issueDate: this.dateUtilService.formatCustomDate(),
      issuedCredits: verificationRequest.creditAmount,
      monitoringStartDate: this.dateUtilService.formatCustomDate(
        verificationRequest.monitoringStartDate
      ),
      monitoringEndDate: this.dateUtilService.formatCustomDate(
        verificationRequest.monitoringEndDate
      ),
      startCreditSerialNo: blockStart,
      endCreditSerialNo: blockEnd,
    };

    const url = await this.creditIssueCertificateGenerator.generateCreditIssueCertificate(
      certificateData
    );

    return url;
  }

  //MARK: Aggregate Documents
  aggregateDocuments(rawData) {
    const results = rawData.reduce((acc, data) => {
      let vr = acc[data.vr_id];
      if (!vr) {
        vr = {
          id: data.vr_id,
          programmeId: data.programmeId,
          status: data.vr_status,
          verificationSerialNo: data.verificationSerialNo,
          creditIssueCertificateUrl: data.creditIssueCertificateUrl,
          carbonNeutralCertificateRequested: data.carbonNeutralCertificateRequested,
          carbonNeutralCertificateUrl: data.carbonNeutralCertificateUrl,
          createdTime: data.vr_createdTime,
          documents: [],
        };
        acc[data.vr_id] = vr;
      }

      if (data.d_id) {
        // Check if there is a document in this row
        vr.documents.push({
          id: data.d_id,
          type: data.d_type,
          content: data.d_content,
          status: data.d_status,
          version: data.d_version,
          createdTime: data.d_createdTime,
        });
      }

      return acc;
    }, {});

    return Object.values(results); // Convert the accumulated results into an array
  }

  //MARK: Query Verification Requests By ProgrammeId
  async queryVerificationRequestsByProgrammeId(programmeId: string, user: User): Promise<any> {
    const programme = await this.programmeSlService.getProjectById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.programmeNotExist", [programmeId]),
        HttpStatus.BAD_REQUEST
      );
    }

    const rawResults = await this.entityManager.query(
      `
        SELECT 
            vr.id AS vr_id, vr."programmeId" AS "programmeId", vr.status AS vr_status, vr."createdTime" AS "vr_createdTime", 
            vr."verificationSerialNo" AS "verificationSerialNo", vr."creditIssueCertificateUrl" AS "creditIssueCertificateUrl",
            vr."carbonNeutralCertificateRequested" AS "carbonNeutralCertificateRequested", vr."carbonNeutralCertificateUrl" AS "carbonNeutralCertificateUrl",
            d.id AS d_id, d.type AS d_type, d.content AS d_content, d.status AS d_status, d.version AS d_version, d."createdTime" AS "d_createdTime"
        FROM 
            verification_request_entity vr
        LEFT JOIN 
            document_entity d ON d."verificationRequestId" = vr.id
        WHERE 
            vr."programmeId" = $1
        ORDER BY 
            vr.id DESC
    `,
      [programmeId]
    );

    return this.aggregateDocuments(rawResults);
  }

  // MARK: Request Carbon Neutral Certificate
  async requestCarbonNeutralCertificate(verificationRequestId: number, user: User) {
    if (user.companyRole !== CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.requestCarbonNeutralCertificateReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const verificationRequest = await this.verificationRequestRepository.findOneBy({
      id: verificationRequestId,
    });

    if (!verificationRequest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verificationRequestDoesNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedVerificationRequest = await this.entityManager.transaction(async (em) => {
      await em.update(
        VerificationRequestEntity,
        {
          id: verificationRequestId,
        },
        {
          carbonNeutralCertificateRequested: true,
        }
      );
    });

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.CARBON_NEUTRAL_SL_REQUESTED,
      {},
      verificationRequest.programmeId
    );

    return updatedVerificationRequest;
  }

  async getPreviousCertificateSerial(programmeId: string, type: string) {
    const latestVerifiedRequest = await this.verificationRequestRepository.findOne({
      where: {
        programmeId: programmeId,
        status: VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED,
      },
      order: {
        createdTime: "DESC",
      },
    });

    return type === "CNC"
      ? latestVerifiedRequest?.carbonNeutralCertificateSerialNo
      : latestVerifiedRequest?.verificationSerialNo;
  }

  private isValidHttpUrl(attachment: string): boolean {
    let url;

    try {
      url = new URL(attachment);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }

  private async uploadDocument(type: DocType, id: string, data: string) {
    let filetype;
    try {
      filetype = this.getFileExtension(data);
      data = data.split(",")[1];
      if (filetype == undefined) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programme.invalidDocumentUpload", []),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (Exception: any) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.invalidDocumentUpload", []),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    const response: any = await this.fileHandler.uploadFile(
      `documents/${this.helperService.enumToString(DocType, type)}${
        id ? "_" + id : ""
      }_${Date.now()}.${filetype}`,
      data
    );
    if (response) {
      return response;
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.docUploadFailed", []),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private fileExtensionMap = new Map([
    ["pdf", "pdf"],
    ["vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
    ["vnd.ms-excel", "xls"],
    ["vnd.ms-powerpoint", "ppt"],
    ["vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
    ["msword", "doc"],
    ["vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
    ["csv", "csv"],
    ["png", "png"],
    ["jpeg", "jpg"],
  ]);

  private getFileExtension = (file: string): string => {
    let fileType = file.split(";")[0].split("/")[1];
    fileType = this.fileExtensionMap.get(fileType);
    return fileType;
  };
}
