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
    private configService: ConfigService
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
        verificationRequest.creditAmount = 1;
        const saved = await em.save(verificationRequest);
        monitoringReportDocument.verificationRequestId = saved.id;
      }
      return await em.save(monitoringReportDocument);
    });

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
    if (verifyReportDto.verify === true) {
      const programme = await this.programmeSlService.getProjectById(
        verificationRequest.programmeId
      );

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
      const previousCreditIssueCertificateSerial =
        await this.getPreviousCreditIssueCertificateSerial(verificationRequest.programmeId);
      creditIssueCertificateSerial = this.serialGenerator.generateCreditIssueCertificateNumber(
        updatedProgramme.serialNo,
        previousCreditIssueCertificateSerial
      );
      certificateUrl = await this.getCreditIssuanceCertificateURL(
        verificationRequest,
        creditIssueCertificateSerial
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
  }

  //MARK: get Credit Issuance Certificate URL
  async getCreditIssuanceCertificateURL(
    verificationRequest: VerificationRequestEntity,
    verificationSerialNo: string
  ) {
    const programme = await this.programmeSlService.getProjectById(verificationRequest.programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.programmeNotExist", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const blockStart = this.serialGenerator.calculateCreditSerialNumber(
      programme.creditStartSerialNumber,
      programme.creditBalance - verificationRequest.creditAmount + 1
    );
    const blockEnd = this.serialGenerator.calculateCreditSerialNumber(
      programme.creditStartSerialNumber,
      programme.creditBalance
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
          createdTime: data.d_createdTime,
        });
      }

      return acc;
    }, {});

    return Object.values(results); // Convert the accumulated results into an array
  }

  //MARK: Query Verification Requests By ProgrammeId
  async queryVerificationRequestsByProgrammeId(
    programmeId: string,
    user: User
  ): Promise<any> {
    
    const programme = await this.programmeSlService.getProjectById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.programmeNotExist", [
          programmeId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    const rawResults = await this.entityManager.query(
      `
        SELECT 
            vr.id AS vr_id, vr."programmeId" AS "programmeId", vr.status AS vr_status, vr."createdTime" AS "vr_createdTime", 
            vr."verificationSerialNo" AS "verificationSerialNo", vr."creditIssueCertificateUrl" AS "creditIssueCertificateUrl",
            d.id AS d_id, d.type AS d_type, d.content AS d_content, d.status AS d_status, d."createdTime" AS "d_createdTime"
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

  async getPreviousCreditIssueCertificateSerial(programmeId: string) {
    const latestVerifiedRequest = await this.verificationRequestRepository.findOne({
      where: {
        programmeId: programmeId,
        status: VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED,
      },
      order: {
        createdTime: "DESC",
      },
    });

    return latestVerifiedRequest?.verificationSerialNo;
  }
}
