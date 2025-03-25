import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { HelperService } from "../util/helpers.service";
import { CompanyService } from "../company/company.service";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { plainToClass } from "class-transformer";
import { ProjectEntity } from "../entities/projects.entity";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { DocType } from "../enum/document.type";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectCreateDto } from "../dto/project.create.dto";
import { DocumentEntity } from "../entities/document.entity";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DocumentStatus } from "../enum/document.status";
import { DataResponseDto } from "../dto/data.response.dto";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { NoObjectionLetterGenerateService } from "../util/document-generators/no.objection.letter.gen";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { ProjectViewEntity } from "../view-entities/project.view.entity";
import { ProjectDetailsViewEntity } from "../view-entities/projectDetails.view.entity";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { EmailTemplates } from "../email-helper/email.template";
import { DocumentManagementService } from "../document-management/document-management.service";

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly counterService: CounterService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    private readonly noObjectionLetterGenerateService: NoObjectionLetterGenerateService,
    @InjectRepository(ProjectViewEntity)
    private projectViewRepo: Repository<ProjectViewEntity>,
    @InjectRepository(ProjectDetailsViewEntity)
    private projectDetailsViewRepo: Repository<ProjectDetailsViewEntity>,
    private readonly emailHelperService: EmailHelperService,
    private readonly documentManagementService: DocumentManagementService,
    private readonly auditLogService: AuditLogsService
  ) {}

  async create(projectCreateDto: ProjectCreateDto, user: User): Promise<any> {
    try {
      if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notProjectParticipant",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const companyId = user.companyId;
      const projectCompany = await this.companyService.findByCompanyId(
        companyId
      );
      if (!projectCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      for (const certifierId of projectCreateDto.independentCertifiers) {
        const ICCompany = await this.companyService.findByCompanyId(
          certifierId
        );
        if (
          !ICCompany ||
          ICCompany.companyRole != CompanyRole.INDEPENDENT_CERTIFIER
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.noICExistingInSystem",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const project = plainToClass(ProjectEntity, projectCreateDto);
      project.refId = await this.counterService.incrementCount(
        CounterType.PROJECT,
        4
      );
      project.projectProposalStage = ProjectProposalStage.PENDING;
      project.companyId = companyId;
      project.txType = TxType.CREATE_PROJECT;
      project.txTime = new Date().getTime();
      project.createTime = project.txTime;
      project.updateTime = project.txTime;

      const docUrls = [];
      if (projectCreateDto.additionalDocuments?.length > 0) {
        projectCreateDto.additionalDocuments.forEach(async (doc) => {
          const docUrl = await this.documentManagementService.uploadDocument(
            DocType.INF_ADDITIONAL_DOCUMENT,
            project.refId,
            doc
          );
          docUrls.push(docUrl);
        });
      }
      projectCreateDto.additionalDocuments = docUrls;

      const INFDoc = new DocumentEntity();
      INFDoc.content = JSON.stringify(projectCreateDto);
      INFDoc.programmeId = project.refId;
      INFDoc.companyId = companyId;
      INFDoc.userId = user.id;
      INFDoc.type = DocumentTypeEnum.INITIAL_NOTIFICATION_FORM;

      const lastVersion =
        await this.documentManagementService.getLastDocumentVersion(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          project.refId
        );
      INFDoc.version = lastVersion + 1;
      INFDoc.status = DocumentStatus.PENDING;
      INFDoc.createdTime = new Date().getTime();
      INFDoc.updatedTime = INFDoc.createdTime;

      const doc = await this.documentRepo.save(INFDoc);
      project.txRef = this.documentManagementService.getDocumentTxRef(
        DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
        doc.id
      );
      let savedProgramme = await this.programmeLedgerService.createProject(
        project
      );

      await this.emailHelperService.sendEmailToDNAAdmins(
        EmailTemplates.INF_CREATE,
        null,
        project.refId
      );
      await this.emailHelperService.sendEmailToICAdmins(
        EmailTemplates.INF_ASSIGN,
        null,
        project.refId
      );

      await this.documentManagementService.logProjectStage(
        project.refId,
        ProjectAuditLogType.PENDING,
        user.id
      );
      return new DataResponseDto(HttpStatus.OK, savedProgramme);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async approveINF(refId: string, user: User): Promise<DataResponseDto> {
    try {
      if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const lastVersion =
        await this.documentManagementService.getLastDocumentVersion(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          refId
        );
      const infDoc = await this.documentRepo.findOne({
        where: {
          type: DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          programmeId: refId,
          version: lastVersion,
        },
      });

      const project = await this.programmeLedgerService.getProjectById(refId);
      if (!project) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("project.noProject", []),
          HttpStatus.BAD_REQUEST
        );
      }

      const companyId = project.companyId;

      const projectCompany = await this.companyService.findByCompanyId(
        companyId
      );

      if (!projectCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (project?.projectProposalStage !== ProjectProposalStage.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.programmeIsNotInSuitableStageToProceed",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const noObjectionLetterUrl =
        await this.noObjectionLetterGenerateService.generateReport(
          projectCompany.name,
          project.title,
          project.refId
        );

      const updateProjectroposalStage: UpdateProjectProposalStageDto = {
        programmeId: refId,
        txType: TxType.APPROVE_INF,
        data: { noObjectionLetterUrl: noObjectionLetterUrl },
      };
      const response = await this.documentManagementService.updateProposalStage(
        updateProjectroposalStage,
        user,
        this.documentManagementService.getDocumentTxRef(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          infDoc.id,
          user.id
        )
      );

      await this.emailHelperService.sendEmailToPDAdmins(
        EmailTemplates.INF_APPROVE,
        null,
        project.refId
      );

      await this.documentManagementService.logProjectStage(
        project.refId,
        ProjectAuditLogType.APPROVED,
        user.id
      );

      return new DataResponseDto(HttpStatus.OK, response);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async rejectINF(
    refId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    try {
      if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const lastVersion =
        await this.documentManagementService.getLastDocumentVersion(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          refId
        );
      const infDoc = await this.documentRepo.findOne({
        where: {
          type: DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          programmeId: refId,
          version: lastVersion,
        },
      });

      const project = await this.programmeLedgerService.getProjectById(refId);

      const companyId = project.companyId;

      const projectCompany = await this.companyService.findByCompanyId(
        companyId
      );

      if (!projectCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (project?.projectProposalStage !== ProjectProposalStage.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.programmeIsNotInSuitableStageToProceed",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const updateProjectProposalStage = {
        programmeId: refId,
        txType: TxType.REJECT_INF,
      };

      const response = await this.documentManagementService.updateProposalStage(
        updateProjectProposalStage,
        user,
        this.documentManagementService.getDocumentTxRef(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          infDoc.id,
          user.id
        )
      );

      await this.emailHelperService.sendEmailToPDAdmins(
        EmailTemplates.INF_REJECT,
        null,
        project.refId
      );

      await this.documentManagementService.logProjectStage(
        project.refId,
        ProjectAuditLogType.REJECTED,
        user.id
      );

      return new DataResponseDto(HttpStatus.OK, response);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async getLogs(refId: string) {
    return await this.auditLogService.getLogs(refId);
  }

  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    let resp = await this.projectViewRepo
      .createQueryBuilder("document_entity")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "document_entity",
            abilityCondition
          ),
          "document_entity"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"document_entity".${this.helperService.generateSortCol(
            query?.sort?.key
          )}`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .offset(skip)
      .limit(query.size)
      .getManyAndCount();

    if (resp.length > 0) {
      resp[0] = resp[0].map((e) => ({
        ...e,
        company: {
          companyId: e.companyId,
          name: e.name,
          logo: e.logo,
        },
      }));
    }

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getProjectById(programmeId: string): Promise<any> {
    if (!programmeId)
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "Project ID is required",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );

    const project = await this.projectDetailsViewRepo
      .createQueryBuilder("project")
      .where("project.projectId = :programmeId", { programmeId })
      .getOne();

    if (!project)
      throw new HttpException(
        this.helperService.formatReqMessagesString("Project not found", []),
        HttpStatus.NOT_FOUND
      );

    let parsedContent = null;
    if (project.content) {
      try {
        parsedContent = JSON.parse(project.content);
      } catch (error) {
        console.error("Error parsing content JSON:", error);
      }
    }

    const certifiers = await this.companyService.findByCompanyIds({
      companyIds: project.certifierId,
    });

    const certifiersInfo = certifiers?.map(
      ({ companyId, name, logo, companyRole }) => ({
        companyId,
        name,
        logo,
        companyRole,
      })
    );

    const allDocuments = await this.documentManagementService.queryAll(
      programmeId
    );

    const documents = {};
    allDocuments.forEach((doc) => {
      if (!documents[doc.type] || doc.version > documents[doc.type].version) {
        documents[doc.type] = {
          documentType: doc.type,
          refId: doc.id,
          version: doc.version,
        };
      }
    });

    const staticValues = {
      externalId: "EXT-CARB-45678",
      serialNo: "SL-CARB",
      countryCodeA2: "LK",
      projectCategory: "RENEWABLE_ENERGY",
      purposeOfCreditDevelopment: "Carbon sequestration",
      endTime: 1862601600000,
      creditFrozen: 1000,
      creditTransferred: 10000,
      constantVersion: "1.2.0",
      creditUnit: "tCO2e",
      typeOfMitigation: "REMOVAL",
      projectLocation: { latitude: 7.2906, longitude: 80.6337 },
      mitigationActions: [
        "Reforestation of degraded lands",
        "Sustainable forest management practices",
        "Community-based conservation",
      ],
      environmentalAssessmentRegistrationNo: "ENV-2023-LK-789",
      article6trade: true,
      registrationCertificateUrl:
        "https://registry.example.com/certificates/PRG-2024-00123.pdf",
      dsDivision: "Ambagamuwa",
      community: "Local indigenous communities",
      additionalDocuments: [],
      emissionReductionExpected: 25000,
      emissionReductionAchieved: 5000,
    };

    const programmeProperties = {
      estimatedProgrammeCostUSD: parsedContent.estimatedProjectCost,
      programmeCostUSD: 4000000,
      maxInternationalTransferAmount: "1000000",
      creditingPeriodInYears: 10,
      sourceOfFunding: ["Government"],
      grantEquivalentAmount: 2000000,
      carbonPriceUSDPerTon: 25,
      buyerCountryEligibility: "All",
      geographicalLocation: ["USA", "Canada"],
      greenHouseGasses: ["CO2", "CH4"],
      creditYear: 2025,
      programmeMaterials: [],
      projectMaterial: [],
    };

    const { content, ...projectWithoutContent } = project;

    const projectDetails = {
      ...projectWithoutContent,
      ...parsedContent,
      ...staticValues,
      documents,
      programmeProperties,
      company: {
        companyId: project.companyId,
        name: project.name,
        logo: project.logo,
        companyRole: project.companyRole,
        state: project.state,
      },
      certifier: certifiersInfo,
    };

    return projectDetails;
  }
}
