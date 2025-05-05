import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { BaseDocumentDto } from "../dto/base.document.dto";
import { User } from "../entities/user.entity";
import { DocumentEntity } from "../entities/document.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { HelperService } from "../util/helpers.service";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { ProjectEntity } from "../entities/projects.entity";
import { TxType } from "../enum/txtype.enum";
import { DocumentStatus } from "../enum/document.status";
import { EmailTemplates } from "../email-helper/email.template";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { AuditEntity } from "../entities/audit.entity";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { DocumentActionRequestDto } from "../dto/document.action.request.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { CompanyService } from "../company/company.service";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { ValidationReportDto } from "../dto/validationReport.dto";
import { plainToClass, plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DocType } from "../enum/document.type";
import { UserService } from "../user/user.service";
import { DocumentQueryDto } from "../dto/document.query.dto";
import { ActivityEntity } from "../entities/activity.entity";
import { ActivityStateEnum } from "../enum/activity.state.enum";
import { LetterOfAuthorisationRequestGen } from "../util/document-generators/letter.of.authorisation.request.gen";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { UserCompanyViewEntity } from "../view-entities/userCompany.view.entity";
import { ActivityVintageCreditsDto } from "../dto/activty.vintage.credits.dto";
import { Company } from "../entities/company.entity";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { ProjectCreateDto } from "../dto/project.create.dto";
import { DataResponseDto } from "../dto/data.response.dto";
import { NoObjectionLetterGenerateService } from "../util/document-generators/no.objection.letter.gen";
import { DocumentsViewEntity } from "../view-entities/documents.view.entity";
import { Role } from "../casl/role.enum";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { PositiveIntegerValidationDto } from "../dto/positive.integer.validation.dto";
import { ActivityVintageCreditsArrayDto } from "../dto/activty.vintage.credits.array.dto";
import { SECTOR_TO_SCOPES_MAP } from "../constants/inf.sector.sectoralScope.mapping.const";
import { CompanyState } from "../enum/company.state.enum";

@Injectable()
export class DocumentManagementService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(DocumentsViewEntity)
    private readonly documentsViewEntityRepository: Repository<DocumentsViewEntity>,
    @InjectRepository(ActivityEntity)
    private readonly activityEntityRepository: Repository<ActivityEntity>,
    @InjectRepository(UserCompanyViewEntity)
    private readonly userCompanyViewEntityRepository: Repository<UserCompanyViewEntity>,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly helperService: HelperService,
    private readonly emailHelperService: EmailHelperService,
    private readonly auditLogService: AuditLogsService,
    private readonly companyService: CompanyService,
    private fileHandler: FileHandlerInterface,
    private readonly letterOfAuthorizationGenerateService: LetterOfAuthorisationRequestGen,
    private readonly userService: UserService,
    private entityManager: EntityManager,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    private readonly counterService: CounterService,
    private readonly noObjectionLetterGenerateService: NoObjectionLetterGenerateService
  ) {}

  async addDocument(addDocumentDto: BaseDocumentDto, user: User) {
    try {
      let project: ProjectEntity;
      let projectRefId: string;
      let projectCompanyId: number;
      if (
        addDocumentDto.documentType ==
        DocumentTypeEnum.INITIAL_NOTIFICATION_FORM
      ) {
        projectRefId = await this.counterService.incrementCount(
          CounterType.PROJECT,
          4
        );
        projectCompanyId = user.companyId;
      } else {
        project = await this.programmeLedgerService.getProjectById(
          addDocumentDto.projectRefId
        );
        if (!project) {
          throw new HttpException(
            this.helperService.formatReqMessagesString("project.notExists", []),
            HttpStatus.UNAUTHORIZED
          );
        }
        projectRefId = project.refId;
        projectCompanyId = project.companyId;
      }
      const newDoc = new DocumentEntity();
      newDoc.content = addDocumentDto.data;
      newDoc.programmeId = projectRefId;
      newDoc.companyId = projectCompanyId;
      newDoc.userId = user.id;
      newDoc.type = addDocumentDto.documentType;
      const lastVersion = await this.getLastDocumentVersion(
        addDocumentDto.documentType,
        projectRefId
      );
      newDoc.version = lastVersion + 1;
      newDoc.status = DocumentStatus.PENDING;
      newDoc.createdTime = new Date().getTime();
      newDoc.updatedTime = newDoc.createdTime;

      let updateProjectProposalStage: UpdateProjectProposalStageDto;
      let lastActivity: ActivityEntity;
      let ICCompany: Company;

      switch (addDocumentDto.documentType) {
        case DocumentTypeEnum.INITIAL_NOTIFICATION_FORM: {
          if (
            user.companyRole !== CompanyRole.PROJECT_DEVELOPER ||
            user.role !== Role.Admin
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noPermission",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          const projectCompany = await this.companyService.findByCompanyId(
            projectCompanyId
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

          const projectCreateDto: ProjectCreateDto = plainToInstance(
            ProjectCreateDto,
            addDocumentDto.data
          );
          const errors = await validate(projectCreateDto);
          if (errors.length > 0) {
            throw new HttpException(errors.toString(), HttpStatus.BAD_REQUEST);
          }
          if (
            !SECTOR_TO_SCOPES_MAP[projectCreateDto.sector].includes(
              projectCreateDto.sectoralScope
            )
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invalidSectoralScopeForSector",
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
          project.refId = projectRefId;
          project.projectProposalStage = ProjectProposalStage.PENDING;
          project.companyId = projectCompanyId;
          project.txType = TxType.CREATE_PROJECT;
          project.txTime = new Date().getTime();
          project.createTime = project.txTime;
          project.updateTime = project.txTime;

          const docUrls = [];
          if (projectCreateDto.additionalDocuments?.length > 0) {
            for (const additionalDocument of projectCreateDto.additionalDocuments) {
              const docUrl = await this.uploadDocument(
                DocType.INF_ADDITIONAL_DOCUMENT,
                project.refId,
                additionalDocument
              );
              docUrls.push(docUrl);
            }
          }
          projectCreateDto.additionalDocuments = docUrls;

          newDoc.content = projectCreateDto;

          const infDoc = await this.documentRepository.save(newDoc);
          project.txRef = this.getDocumentTxRef(
            DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
            infDoc.id
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

          await this.logProjectStage(
            project.refId,
            ProjectAuditLogType.PENDING,
            user.id
          );
          return new DataResponseDto(HttpStatus.OK, {
            ...savedProgramme,
            createdTime: savedProgramme.createTime,
            company: {
              companyId: projectCompany.companyId,
              name: projectCompany.name,
              logo: projectCompany.logo,
            },
          });
        }
        case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT: {
          if (user.companyId != project.companyId || user.role !== Role.Admin) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noPddCreatePermission",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          if (
            ![
              ProjectProposalStage.APPROVED,
              ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER,
              ProjectProposalStage.PDD_REJECTED_BY_DNA,
            ].includes(project.projectProposalStage)
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.programmeIsNotInSuitableStageToProceed",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          const errors = await validate(
            plainToClass(PositiveIntegerValidationDto, {
              positiveInteger: newDoc.content.applicationOfMethodology
                ?.netGHGEmissionReductions?.totalNetEmissionReductions
                ? Number(
                    newDoc.content.applicationOfMethodology
                      .netGHGEmissionReductions.totalNetEmissionReductions
                  )
                : null,
            })
          );
          if (errors.length > 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invalidUserEstimatedCredits",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          updateProjectProposalStage = {
            programmeId: addDocumentDto.projectRefId,
            txType: TxType.CREATE_PDD,
          };
          await this.createPDD(newDoc.content, projectRefId);
          const doc = await this.documentRepository.save(newDoc); //not a good method to handle this, ledger table can be used to gerantee the consistency
          const updatedProgramme = await this.updateProposalStage(
            updateProjectProposalStage,
            user,
            this.getDocumentTxRef(
              DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
              doc.id
            )
          );
          await this.logProjectStage(
            project.refId,
            ProjectAuditLogType.PDD_SUBMITTED,
            user.id
          );
          await this.emailHelperService.sendEmailToICAdmins(
            EmailTemplates.PDD_CREATE,
            null,
            project.refId
          );
          return new DataResponseDto(HttpStatus.OK, updatedProgramme);
        }
        case DocumentTypeEnum.VALIDATION: {
          if (
            user.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER ||
            user.role !== Role.Admin
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noValidationCreatePermission",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          if (!project.independentCertifiers.includes(user.companyId)) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.icNotAssignedValidation",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }

          if (
            ![
              ProjectProposalStage.PDD_APPROVED_BY_DNA,
              ProjectProposalStage.VALIDATION_DNA_REJECTED,
            ].includes(project.projectProposalStage)
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.programmeIsNotInSuitableStageToProceed",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          const errors = await validate(
            plainToClass(PositiveIntegerValidationDto, {
              positiveInteger: newDoc.content.ghgProjectDescription
                ?.totalNetEmissionReductions
                ? Number(
                    newDoc.content.ghgProjectDescription
                      .totalNetEmissionReductions
                  )
                : null,
            })
          );
          if (errors.length > 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invalidUserEstimatedCredits",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }

          await this.createValidationReport(newDoc.content, projectRefId);

          updateProjectProposalStage = {
            programmeId: addDocumentDto.projectRefId,
            txType: TxType.CREATE_VALIDATION_REPORT,
          };

          const documentResponse = await this.documentRepository.save(newDoc); //not a good method to handle this, ledger table can be used to gerantee the consistency

          const updatedProgramme = await this.updateProposalStage(
            updateProjectProposalStage,
            user,
            this.getDocumentTxRef(
              DocumentTypeEnum.VALIDATION,
              documentResponse.id,
              user.id
            )
          );

          await this.logProjectStage(
            project.refId,
            ProjectAuditLogType.VALIDATION_REPORT_SUBMITTED,
            user.id
          );

          ICCompany = await this.companyService.findByCompanyId(user.companyId);

          await this.emailHelperService.sendEmailToPDAdmins(
            EmailTemplates.VALIDATION_SUBMITTED,
            {
              icOrganisationName: ICCompany.name,
            },
            addDocumentDto.projectRefId
          );

          await this.emailHelperService.sendEmailToDNAAdmins(
            EmailTemplates.VALIDATION_SUBMITTED_TO_DNA,
            {
              icOrganisationName: ICCompany.name,
            },
            addDocumentDto.projectRefId
          );
          return new DataResponseDto(HttpStatus.OK, updatedProgramme);
        }
        case DocumentTypeEnum.MONITORING: {
          if (user.companyId != project.companyId) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noMonitoringCreatePermission",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          if (project.projectProposalStage != ProjectProposalStage.AUTHORISED) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.programmeIsNotInSuitableStageToProceed",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          lastActivity = await this.getLastActivity(
            addDocumentDto.projectRefId
          );
          if (
            lastActivity &&
            addDocumentDto.activityRefId &&
            lastActivity.refId != addDocumentDto.activityRefId
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.docCanBeAddedOnlyToLastActivity",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            lastActivity &&
            ![
              ActivityStateEnum.MONITORING_REPORT_REJECTED,
              ActivityStateEnum.VERIFICATION_REPORT_VERIFIED,
            ].includes(lastActivity.state)
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.lastActivityNotInValidStateToUploadMonitoringReport",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            !newDoc.content.calcEmissionReductions?.netGHGEmissionReductions
              ?.yearlyGHGEmissionReductions ||
            newDoc.content.calcEmissionReductions?.netGHGEmissionReductions
              ?.yearlyGHGEmissionReductions.length <= 0
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invlaidCreditQuantityToIssue",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          const creditVerified: ActivityVintageCreditsDto[] = [];
          let amountToVerify = 0;
          newDoc.content.calcEmissionReductions?.netGHGEmissionReductions?.yearlyGHGEmissionReductions.map(
            (data: { vintage: string; netEmissionReductions: string }) => {
              const creditBlockToVerify = plainToClass(
                ActivityVintageCreditsDto,
                {
                  vintage: new Date(parseInt(data.vintage))
                    .getFullYear()
                    .toString(),
                  creditAmount: Number(data.netEmissionReductions),
                }
              );
              creditVerified.push(creditBlockToVerify);
              amountToVerify += creditBlockToVerify.creditAmount;
            }
          );
          const errors = await validate(
            plainToClass(ActivityVintageCreditsArrayDto, {
              vintageCreditArray: creditVerified,
            })
          );
          if (creditVerified.length <= 0 || errors.length > 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invlaidCreditVerifed",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          for (const creditBlockToVerify of creditVerified) {
            if (
              Number(creditBlockToVerify.vintage) > new Date().getFullYear()
            ) {
              throw new HttpException(
                this.helperService.formatReqMessagesString(
                  "project.greaterThanCurrentVintage",
                  []
                ),
                HttpStatus.BAD_REQUEST
              );
            }
          }
          const totalEstimatedCredits = project.creditEst
            ? Number(project.creditEst)
            : 0;
          const alreadyIssuedCredits = project.creditIssued
            ? Number(project.creditIssued)
            : 0;
          if (amountToVerify > totalEstimatedCredits - alreadyIssuedCredits) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.greaterThanRemainingEstimatedCredits",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          await this.createMonitoringReport(newDoc.content, projectRefId);
          let savedDoc: DocumentEntity;
          await this.entityManager
            .transaction(async (em) => {
              let documentVersion;
              let activityId;
              if (
                !lastActivity ||
                lastActivity.state ==
                  ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
              ) {
                const activity = new ActivityEntity();
                activity.projectRefId = project.refId;
                activity.version = lastActivity ? lastActivity.version + 1 : 1;
                activity.state = ActivityStateEnum.MONITORING_REPORT_UPLOADED;
                const savedActivity = await em.save(ActivityEntity, activity);

                activityId = savedActivity.id;
                documentVersion = 1;
              } else {
                const lastMonitoringReport = (
                  await em.find(DocumentEntity, {
                    where: {
                      activityId: lastActivity.id,
                      programmeId: project.refId,
                    },
                    order: {
                      version: "DESC",
                    },
                  })
                )[0];
                await em.update(
                  ActivityEntity,
                  { id: lastActivity.id },
                  { state: ActivityStateEnum.MONITORING_REPORT_UPLOADED }
                );
                activityId = lastActivity.id;
                documentVersion = lastMonitoringReport.version + 1;
              }
              newDoc.version = documentVersion;
              newDoc.activityId = activityId;
              savedDoc = await this.documentRepository.save(newDoc);
              await this.logProjectStage(
                project.refId,
                ProjectAuditLogType.MONITORING_REPORT_SUBMITTED,
                user.id,
                em
              );
            })
            .catch((error: any) => {
              throw new HttpException(
                error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            });
          await this.emailHelperService.sendEmailToICAdmins(
            EmailTemplates.MONITORING_UPLOADED,
            null,
            project.refId
          );
          return new DataResponseDto(HttpStatus.OK, savedDoc);
        }
        case DocumentTypeEnum.VERIFICATION: {
          if (
            user.companyRole != CompanyRole.INDEPENDENT_CERTIFIER ||
            user.role !== Role.Admin
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noVerificationCreatePermission",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          if (!project.independentCertifiers.includes(user.companyId)) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.icNotAssignedVerification",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }
          if (project.projectProposalStage != ProjectProposalStage.AUTHORISED) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.programmeIsNotInSuitableStageToProceed",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          lastActivity = await this.getLastActivity(
            addDocumentDto.projectRefId
          );
          if (!lastActivity) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.noActivity",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            lastActivity &&
            addDocumentDto.activityRefId &&
            lastActivity.refId != addDocumentDto.activityRefId
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.docCanBeAddedOnlyToLastActivity",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            ![
              ActivityStateEnum.MONITORING_REPORT_VERIFIED,
              ActivityStateEnum.VERIFICATION_REPORT_REJECTED,
            ].includes(lastActivity.state)
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.lastActivityNotInValidStateToUploadVerificationReport",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          if (
            !newDoc.content.ghgProjectDescription
              ?.estimatedNetEmissionReductions ||
            newDoc.content.ghgProjectDescription?.estimatedNetEmissionReductions
              .length <= 0
          ) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invlaidCreditQuantityToIssue",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          const creditVerified: ActivityVintageCreditsDto[] = [];
          let amountToVerify = 0;
          newDoc.content.ghgProjectDescription?.estimatedNetEmissionReductions?.map(
            (data: { vintage: string; netEmissionReductions: string }) => {
              const creditBlockToVerify = plainToClass(
                ActivityVintageCreditsDto,
                {
                  vintage: new Date(parseInt(data.vintage))
                    .getFullYear()
                    .toString(),
                  creditAmount: Number(data.netEmissionReductions),
                }
              );
              creditVerified.push(creditBlockToVerify);
              amountToVerify += creditBlockToVerify.creditAmount;
            }
          );
          const errors = await validate(
            plainToClass(ActivityVintageCreditsArrayDto, {
              vintageCreditArray: creditVerified,
            })
          );
          if (creditVerified.length <= 0 || errors.length > 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.invlaidCreditVerifed",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          for (const creditBlockToVerify of creditVerified) {
            if (
              Number(creditBlockToVerify.vintage) > new Date().getFullYear()
            ) {
              throw new HttpException(
                this.helperService.formatReqMessagesString(
                  "project.greaterThanCurrentVintage",
                  []
                ),
                HttpStatus.BAD_REQUEST
              );
            }
          }
          const totalEstimatedCredits = project.creditEst
            ? Number(project.creditEst)
            : 0;
          const alreadyIssuedCredits = project.creditIssued
            ? Number(project.creditIssued)
            : 0;
          if (amountToVerify > totalEstimatedCredits - alreadyIssuedCredits) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.greaterThanRemainingEstimatedCredits",
                []
              ),
              HttpStatus.BAD_REQUEST
            );
          }
          await this.createVerificationReport(newDoc.content, projectRefId);
          let savedDoc: DocumentEntity;
          await this.entityManager
            .transaction(async (em) => {
              let documentVersion;
              let activityId;
              await em.update(
                ActivityEntity,
                { id: lastActivity.id },
                {
                  state: ActivityStateEnum.VERIFICATION_REPORT_UPLOADED,
                }
              );
              activityId = lastActivity.id;
              const lastDocumentVersion = await this.getLastDocumentVersion(
                DocumentTypeEnum.VERIFICATION,
                project.refId
              );
              documentVersion = lastDocumentVersion + 1;

              newDoc.version = documentVersion;
              newDoc.activityId = activityId;
              savedDoc = await this.documentRepository.save(newDoc);
              await this.logProjectStage(
                project.refId,
                ProjectAuditLogType.VERIFICATION_REPORT_SUBMITTED,
                user.id,
                em
              );
            })
            .catch((error: any) => {
              throw new HttpException(
                error.message,
                HttpStatus.INTERNAL_SERVER_ERROR
              );
            });

          ICCompany = await this.companyService.findByCompanyId(user.companyId);

          await this.emailHelperService.sendEmailToPDAdmins(
            EmailTemplates.VERIFICATION_CREATE_TO_PD,
            { icOrganisationName: ICCompany.name },
            project.refId
          );

          await this.emailHelperService.sendEmailToDNAAdmins(
            EmailTemplates.VERIFICATION_CREATE_TO_DNA,
            { icOrganisationName: ICCompany.name },
            project.refId
          );
          return new DataResponseDto(HttpStatus.OK, savedDoc);
        }
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  private async createPDD(pddData: any, projectRefId: string) {
    const additionalDocumentFields = [
      {
        field: "appendix2Documents",
        type: DocType.PDD_APPENDIX_2_DOCUMENT,
      },
      {
        field: "appendix3Documents",
        type: DocType.PDD_APPENDIX_3_DOCUMENT,
      },
      {
        field: "appendix4Documents",
        type: DocType.PDD_APPENDIX_4_DOCUMENT,
      },
      {
        field: "appendix5Documents",
        type: DocType.PDD_APPENDIX_5_DOCUMENT,
      },
      {
        field: "appendix6Documents",
        type: DocType.PDD_APPENDIX_6_DOCUMENT,
      },
      {
        field: "appendix7Documents",
        type: DocType.PDD_APPENDIX_7_DOCUMENT,
      },
    ];

    if (pddData.appendix) {
      for (const docField of additionalDocumentFields) {
        if (
          pddData.appendix[docField.field] &&
          pddData.appendix[docField.field].length > 0
        ) {
          const docUrls = await this.uploadDocuments(
            docField.type,
            projectRefId,
            pddData.appendix[docField.field]
          );
          pddData.appendix[docField.field] = docUrls;
        }
      }
    }

    if (
      pddData?.projectActivity?.locationsOfProjectActivity &&
      pddData.projectActivity.locationsOfProjectActivity.length > 0
    ) {
      for (const location of pddData.projectActivity
        .locationsOfProjectActivity) {
        if (
          location.additionalDocuments &&
          location.additionalDocuments.length > 0
        ) {
          const docUrls = await this.uploadDocuments(
            DocType.PDD_LOCATION_OF_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
            projectRefId,
            location.additionalDocuments
          );
          location.additionalDocuments = docUrls;
        }
      }
    }
  }

  private async createValidationReport(
    validationData: any,
    projectRefId: string
  ): Promise<void> {
    if (
      validationData?.appendix?.appendix1Documents &&
      validationData.appendix.appendix1Documents.length > 0
    ) {
      const docUrls = await this.uploadDocuments(
        DocType.VALIDATION_APPENDIX_DOCS,
        projectRefId,
        validationData.appendix.appendix1Documents
      );
      validationData.appendix.appendix1Documents = docUrls;
    }
  }

  private async createMonitoringReport(
    monitoringData: any,
    projectRefId: string
  ) {
    if (
      monitoringData?.appendix?.a_uploadDoc &&
      monitoringData.appendix.a_uploadDoc.length > 0
    ) {
      const docUrls = await this.uploadDocuments(
        DocType.MONITORING_REPORT_APPENDIX_ADDITIONAL_DOC,
        projectRefId,
        monitoringData.appendix.a_uploadDoc
      );
      monitoringData.appendix.a_uploadDoc = docUrls;
    }

    if (
      monitoringData?.calcEmissionReductions?.ce_documentUpload &&
      monitoringData.calcEmissionReductions.ce_documentUpload.length > 0
    ) {
      const docUrls = await this.uploadDocuments(
        DocType.MONITORING_REPORT_BASELINE_EMISSION_ADDITIONAL_DOC,
        projectRefId,
        monitoringData.calcEmissionReductions.ce_documentUpload
      );
      monitoringData.calcEmissionReductions.ce_documentUpload = docUrls;
    }
  }

  private async createVerificationReport(
    verificationData: any,
    projectRefId: string
  ): Promise<void> {
    if (
      verificationData?.appendix?.appendix1Documents &&
      verificationData?.appendix?.appendix1Documents.length > 0
    ) {
      const docUrls = await this.uploadDocuments(
        DocType.VERIFICATION_REPORT_APPENDIX_ADDITIONAL_DOC,
        projectRefId,
        verificationData?.appendix?.appendix1Documents
      );
      verificationData.appendix.appendix1Documents = docUrls;
    }
  }

  public async uploadDocument(type: DocType, id: string, data: string) {
    let filetype;
    try {
      filetype = this.getFileExtension(data);
      data = data.split(",")[1];
      if (filetype == undefined) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.invalidDocumentUpload",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (Exception: any) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.invalidDocumentUpload",
          []
        ),
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
        this.helperService.formatReqMessagesString(
          "project.docUploadFailed",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async uploadDocuments(
    type: DocType,
    id: string,
    dataArray: string
  ): Promise<string[]> {
    const docUrls: string[] = [];
    for (const data of dataArray) {
      const docUrl = await this.uploadDocument(type, id, data);
      docUrls.push(docUrl);
    }
    return docUrls;
  }

  private getFileExtension = (file: string): string => {
    let fileType = file.split(";")[0].split("/")[1];
    fileType = this.fileExtensionMap.get(fileType);
    return fileType;
  };

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

  async verify(requestData: DocumentActionRequestDto, user: User) {
    try {
      const existingDocument = await this.documentRepository.findOne({
        where: { id: requestData.refId },
      });
      if (!existingDocument) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noValidDocument",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      switch (existingDocument.type) {
        case DocumentTypeEnum.INITIAL_NOTIFICATION_FORM: {
          await this.performINFAction(existingDocument, requestData, user);
          break;
        }
        case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT:
          {
            await this.performPDDAction(existingDocument, requestData, user);
          }
          break;
        case DocumentTypeEnum.VALIDATION:
          {
            await this.performValidationReportAction(
              existingDocument,
              requestData,
              user
            );
          }
          break;
        case DocumentTypeEnum.MONITORING:
          {
            await this.performMonitoringAction(
              existingDocument,
              requestData,
              user
            );
          }
          break;
        case DocumentTypeEnum.VERIFICATION:
          {
            await this.performVerificationAction(
              existingDocument,
              requestData,
              user
            );
          }
          break;
      }
      // Removed to throw common meaningful message
      // const documentTypeMap = {
      //   [DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT]: "pddRejected",
      //   [DocumentTypeEnum.VALIDATION]: "validationRejected",
      //   [DocumentTypeEnum.MONITORING]: "monitoringRejected",
      //   [DocumentTypeEnum.VERIFICATION]: "verificationRejected",
      // };

      // const response = documentTypeMap[existingDocument.type];

      // return new BasicResponseDto(
      //   HttpStatus.OK,
      //   this.helperService.formatReqMessagesString(`project.${response}`, [])
      // );
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(`project.success`, [])
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async getLastDocumentVersion(
    docType: DocumentTypeEnum,
    programmeId: string
  ): Promise<number> {
    const documents = await this.documentRepository.find({
      where: {
        programmeId: programmeId,
        type: docType,
      },
      order: {
        version: "DESC",
      },
    });

    if (documents.length > 0) {
      return documents[0].version;
    } else {
      return 0;
    }
  }

  async updateProposalStage(
    updateProposalStageDto: UpdateProjectProposalStageDto,
    user: User,
    txRef?: string
  ): Promise<ProjectEntity> {
    const refId = updateProposalStageDto.programmeId;
    const txType = updateProposalStageDto.txType;
    const data = updateProposalStageDto.data;

    //updating proposal stage in programme
    const updatedProject =
      await this.programmeLedgerService.updateProjectProposalStage(
        refId,
        txType,
        txRef,
        data
      );

    return updatedProject;
  }

  public async modifyDocumentEntity(
    projectRefId: string,
    txType: TxType,
    txTime: number,
    txRef: string,
    em: EntityManager
  ) {
    let docType: DocumentTypeEnum;
    let docStatus: DocumentStatus;
    switch (txType) {
      case TxType.APPROVE_INF:
        docType = DocumentTypeEnum.INITIAL_NOTIFICATION_FORM;
        docStatus = DocumentStatus.DNA_APPROVED;
        break;
      case TxType.REJECT_INF:
        docType = DocumentTypeEnum.INITIAL_NOTIFICATION_FORM;
        docStatus = DocumentStatus.DNA_REJECTED;
        break;
      case TxType.APPROVE_PDD_BY_IC:
        docType = DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT;
        docStatus = DocumentStatus.IC_APPROVED;
        break;
      case TxType.REJECT_PDD_BY_IC:
        docType = DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT;
        docStatus = DocumentStatus.IC_REJECTED;
        break;
      case TxType.APPROVE_PDD_BY_DNA:
        docType = DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT;
        docStatus = DocumentStatus.DNA_APPROVED;
        break;
      case TxType.REJECT_PDD_BY_DNA:
        docType = DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT;
        docStatus = DocumentStatus.DNA_REJECTED;
        break;
      case TxType.APPROVE_VALIDATION:
        docType = DocumentTypeEnum.VALIDATION;
        docStatus = DocumentStatus.DNA_APPROVED;
        break;
      case TxType.REJECT_VALIDATION:
        docType = DocumentTypeEnum.VALIDATION;
        docStatus = DocumentStatus.DNA_REJECTED;
        break;
      case TxType.APPROVE_MONITORING:
        docType = DocumentTypeEnum.MONITORING;
        docStatus = DocumentStatus.IC_APPROVED;
        const parts = txRef?.split("#");
        const monitoringDocumentId = parseInt(parts[1], 10);
        const monitoringDoc = await em.findOne(DocumentEntity, {
          where: {
            id: monitoringDocumentId,
            type: DocumentTypeEnum.MONITORING,
          },
        });
        await em.update(
          ActivityEntity,
          { id: monitoringDoc.activityId },
          { state: ActivityStateEnum.MONITORING_REPORT_VERIFIED }
        );
        break;
      case TxType.ISSUE:
        docType = DocumentTypeEnum.VERIFICATION;
        docStatus = DocumentStatus.DNA_APPROVED;
        const verificationDoc = await em.findOne(DocumentEntity, {
          where: {
            id: parseInt(txRef?.split("#")[1], 10),
            type: DocumentTypeEnum.VERIFICATION,
          },
        });
        const project = await em.findOne(ProjectEntity, {
          where: {
            refId: projectRefId,
          },
        });
        const activity = project.activities.find(
          (a) => a.id === verificationDoc.activityId
        );
        await em.update(
          ActivityEntity,
          { id: verificationDoc.activityId },
          {
            state: ActivityStateEnum.VERIFICATION_REPORT_VERIFIED,
            creditIssued: activity.creditIssued,
          }
        );
        break;
      default:
        return;
    }
    let updateWhere: QueryDeepPartialEntity<DocumentEntity>;
    if (txRef && txRef.split("#").length > 1) {
      const parts = txRef?.split("#");
      const documentId = parseInt(parts[1], 10);
      updateWhere = { id: documentId };
    } else {
      let lastDocumentVersion = await this.getLastDocumentVersion(
        docType,
        projectRefId
      );
      updateWhere = {
        programmeId: projectRefId,
        type: docType,
        version: lastDocumentVersion,
      };
    }
    let partialEntity: QueryDeepPartialEntity<DocumentEntity> = {
      status: docStatus,
      updatedTime: txTime,
    };
    if (txRef && txRef.split("#").length > 2) {
      const parts = txRef?.split("#");
      const lastActionByUserId = parseInt(parts[2], 10);
      partialEntity["lastActionByUserId"] = lastActionByUserId;
    }
    await em.update(DocumentEntity, updateWhere, partialEntity);
  }

  public async logProjectStage(
    refId: string,
    type: ProjectAuditLogType,
    userId: number,
    em?: EntityManager,
    data?: any
  ): Promise<void> {
    const log = new AuditEntity();
    log.refId = refId;
    log.logType = type;
    log.userId = userId;
    log.data = data;
    em ? await em.save(AuditEntity, log) : await this.auditLogService.save(log);
  }

  private async performINFAction(
    document: DocumentEntity,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    if (document.status !== DocumentStatus.PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.documentNotInPendingState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      (user.role !== Role.Admin && user.role !== Role.Root)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.noInfActionPermission",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const project = await this.programmeLedgerService.getProjectById(
      document.programmeId
    );
    if (!project) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("project.noProject", []),
        HttpStatus.BAD_REQUEST
      );
    }
    const companyId = project.companyId;
    const projectCompany = await this.companyService.findByCompanyId(companyId);
    if (requestData.action == DocumentStatus.DNA_APPROVED) {
      const noObjectionLetterUrl =
        await this.noObjectionLetterGenerateService.generateReport(
          projectCompany.name,
          project.title,
          project.refId
        );

      const updateProjectroposalStage: UpdateProjectProposalStageDto = {
        programmeId: document.programmeId,
        txType: TxType.APPROVE_INF,
        data: { noObjectionLetterUrl: noObjectionLetterUrl },
      };
      const response = await this.updateProposalStage(
        updateProjectroposalStage,
        user,
        this.getDocumentTxRef(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          document.id,
          user.id
        )
      );

      await this.emailHelperService.sendEmailToPDAdmins(
        EmailTemplates.INF_APPROVE,
        null,
        project.refId
      );

      await this.logProjectStage(
        project.refId,
        ProjectAuditLogType.APPROVED,
        user.id
      );
    } else if (requestData.action == DocumentStatus.DNA_REJECTED) {
      const updateProjectProposalStage = {
        programmeId: document.programmeId,
        txType: TxType.REJECT_INF,
      };

      await this.updateProposalStage(
        updateProjectProposalStage,
        user,
        this.getDocumentTxRef(
          DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
          document.id,
          user.id
        )
      );

      await this.emailHelperService.sendEmailToPDAdmins(
        EmailTemplates.INF_REJECT,
        null,
        project.refId
      );

      await this.logProjectStage(
        project.refId,
        ProjectAuditLogType.REJECTED,
        user.id,
        undefined,
        {
          remarks: requestData.remarks,
        }
      );
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.incorrectDocumentAction",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    return new DataResponseDto(HttpStatus.OK, "SUCCESS");
  }

  async performPDDAction(
    document: DocumentEntity,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    const project = await this.programmeLedgerService.getProjectById(
      document.programmeId
    );
    if (
      requestData.action === DocumentStatus.IC_APPROVED ||
      requestData.action === DocumentStatus.IC_REJECTED
    ) {
      if (document.status !== DocumentStatus.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.documentNotInPendingState",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        user.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER ||
        user.role !== Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noPddActionPermission",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (!project.independentCertifiers.includes(user.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.icNotAssigned",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const ICCompany = await this.companyService.findByCompanyId(
        user.companyId
      );
      if (requestData.action === DocumentStatus.IC_REJECTED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.REJECT_PDD_BY_IC,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.PDD_IC_REJECT,
          { icOrganisationName: ICCompany.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.PDD_REJECTED_BY_CERTIFIER,
          user.id,
          undefined,
          {
            remarks: requestData.remarks,
          }
        );
      } else if (requestData.action === DocumentStatus.IC_APPROVED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.APPROVE_PDD_BY_IC,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.PDD_APPROVAL_IC_TO_PD,
          { icOrganisationName: ICCompany.name },
          project.refId
        );
        await this.emailHelperService.sendEmailToDNAAdmins(
          EmailTemplates.PDD_APPROVAL_IC_TO_DNA,
          { icOrganisationName: ICCompany.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.PDD_APPROVED_BY_CERTIFIER,
          user.id
        );
      }
    } else if (
      requestData.action === DocumentStatus.DNA_APPROVED ||
      requestData.action === DocumentStatus.DNA_REJECTED
    ) {
      if (
        user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        (user.role !== Role.Admin && user.role !== Role.Root)
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noPddActionPermissionDna",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }

      if (document.status !== DocumentStatus.IC_APPROVED) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.documentNotInICApprovedState",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const certifiedByUserDetails =
        await this.userService.getUserProfileDetails(
          document.lastActionByUserId
        );

      if (requestData.action === DocumentStatus.DNA_REJECTED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.REJECT_PDD_BY_DNA,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.PDD_DNA_REJECT_TO_PD,
          null,
          project.refId
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.PDD_DNA_REJECT_TO_IC,
          { icOrganisationName: certifiedByUserDetails.Organisation.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.PDD_REJECTED_BY_DNA,
          user.id,
          undefined,
          {
            remarks: requestData.remarks,
          }
        );
      } else if (requestData.action === DocumentStatus.DNA_APPROVED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.APPROVE_PDD_BY_DNA,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.PDD_APPROVAL_DNA_TO_PD,
          null,
          project.refId
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.PDD_APPROVAL_DNA_TO_IC,
          { icOrganisationName: certifiedByUserDetails.Organisation.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.PDD_APPROVED_BY_DNA,
          user.id
        );
      }
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.incorrectDocumentAction",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async performValidationReportAction(
    document: DocumentEntity,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    const project = await this.programmeLedgerService.getProjectById(
      document.programmeId
    );

    if (
      requestData.action === DocumentStatus.DNA_APPROVED ||
      requestData.action === DocumentStatus.DNA_REJECTED
    ) {
      if (document.status !== DocumentStatus.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.documentNotInPendingState",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        user.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        (user.role !== Role.Admin && user.role !== Role.Root)
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noValidationActionPermission",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const vrSubmittedIC = await this.userService.getUserProfileDetails(
        document.lastActionByUserId
      );
      if (requestData.action === DocumentStatus.DNA_REJECTED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.REJECT_VALIDATION,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.VALIDATION,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VALIDATION_REJECTED_TO_IC,
          { icOrganisationName: vrSubmittedIC.Organisation.name },
          project.refId
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.VALIDATION_REJECTED_TO_PD,
          { icOrganisationName: vrSubmittedIC.Organisation.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.VALIDATION_DNA_REJECTED,
          user.id,
          undefined,
          {
            remarks: requestData.remarks,
          }
        );
      } else if (requestData.action === DocumentStatus.DNA_APPROVED) {
        const projectCompany = await this.companyService.findByCompanyId(
          project.companyId
        );

        const letterOfAuthorizationUrl =
          await this.letterOfAuthorizationGenerateService.generateLetter(
            project.refId,
            project.title,
            project.sectoralScope,
            projectCompany.name,
            []
          );
        const errors = await validate(
          plainToClass(PositiveIntegerValidationDto, {
            positiveInteger: document.content.ghgProjectDescription
              ?.totalNetEmissionReductions
              ? Number(
                  document.content.ghgProjectDescription
                    ?.totalNetEmissionReductions
                )
              : null,
          })
        );
        if (errors.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.invalidUserEstimatedCredits",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        const creditEst = Number(
          document.content.ghgProjectDescription?.totalNetEmissionReductions
        );
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.APPROVE_VALIDATION,
          data: {
            letterOfAuthorizationUrl: letterOfAuthorizationUrl,
            creditEst: creditEst,
            serialNumber:
              this.serialNumberManagementService.getProjectSerialNumber(
                Number(project.refId)
              ),
          },
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.VALIDATION,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.VALIDATION_APPROVED_TO_PD,
          { icOrganizationName: vrSubmittedIC.Organisation.name },
          project.refId
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VALIDATION_APPROVED_TO_IC,
          { icOrganisationName: vrSubmittedIC.Organisation.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.AUTHORISED,
          user.id
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.CREDITS_AUTHORISED,
          user.id,
          undefined,
          {
            amount: creditEst,
            toCompanyId: document.companyId,
          }
        );
      }
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.incorrectDocumentAction",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async performMonitoringAction(
    document: DocumentEntity,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    const project = await this.programmeLedgerService.getProjectById(
      document.programmeId
    );
    if (
      requestData.action === DocumentStatus.IC_APPROVED ||
      requestData.action === DocumentStatus.IC_REJECTED
    ) {
      if (document.status !== DocumentStatus.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.documentNotInPendingState",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        user.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER ||
        user.role !== Role.Admin
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noMonitoringActionPermission",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }

      if (!project.independentCertifiers.includes(user.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.icNotAssignedMonitoring",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const ICCompany = await this.companyService.findByCompanyId(
        user.companyId
      );
      const activity = await this.activityEntityRepository.findOne({
        where: { id: document.activityId },
      });
      if (requestData.action === DocumentStatus.IC_REJECTED) {
        await this.entityManager
          .transaction(async (em) => {
            await em.update(
              ActivityEntity,
              { id: document.activityId },
              { state: ActivityStateEnum.MONITORING_REPORT_REJECTED }
            );
            await em.update(
              DocumentEntity,
              { id: document.id },
              {
                lastActionByUserId: user.id,
                updatedTime: new Date().getTime(),
                status: DocumentStatus.IC_REJECTED,
              }
            );
            await this.logProjectStage(
              project.refId,
              ProjectAuditLogType.MONITORING_REPORT_REJECTED,
              user.id,
              em
            );
          })
          .catch((error: any) => {
            throw new HttpException(
              error.message,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          });
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.MONITORING_REJECT,
          { icOrganisationName: ICCompany.name, remarks: requestData.remarks },
          project.refId
        );
      } else if (requestData.action === DocumentStatus.IC_APPROVED) {
        activity.state = ActivityStateEnum.MONITORING_REPORT_VERIFIED;
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.APPROVE_MONITORING,
          data: activity,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.MONITORING,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.MONITORING_APPROVE,
          { icOrganisationName: ICCompany.name },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.MONITORING_REPORT_APPROVED,
          user.id
        );
      }
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.incorrectDocumentAction",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async performVerificationAction(
    document: DocumentEntity,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    const project = await this.programmeLedgerService.getProjectById(
      document.programmeId
    );

    const projectCompany = await this.companyService.findByCompanyId(
      project.companyId
    );
    if (projectCompany.state == CompanyState.SUSPENDED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.companyInDeactivatedState",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    if (
      requestData.action === DocumentStatus.DNA_APPROVED ||
      requestData.action === DocumentStatus.DNA_REJECTED
    ) {
      if (
        user.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
        (user.role !== Role.Admin && user.role !== Role.Root)
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noVerificationActionPermission",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }

      if (document.status !== DocumentStatus.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.documentNotInPendingState",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const activity = await this.activityEntityRepository.findOne({
        where: { id: document.activityId },
      });

      if (requestData.action === DocumentStatus.DNA_REJECTED) {
        await this.entityManager
          .transaction(async (em) => {
            await em.update(
              ActivityEntity,
              { id: document.activityId },
              { state: ActivityStateEnum.VERIFICATION_REPORT_REJECTED }
            );
            await em.update(
              DocumentEntity,
              { id: document.id },
              {
                lastActionByUserId: user.id,
                updatedTime: new Date().getTime(),
                status: DocumentStatus.DNA_REJECTED,
              }
            );
            await this.logProjectStage(
              project.refId,
              ProjectAuditLogType.VERIFICATION_REPORT_REJECTED,
              user.id,
              em
            );
          })
          .catch((error: any) => {
            throw new HttpException(
              error.message,
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          });

        const ICCompany = await this.userCompanyViewEntityRepository.findOne({
          where: { id: document.userId },
        });
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.VERIFICATION_REJECTED_TO_PD,
          {
            icOrganisationName: ICCompany.companyName,
            remarks: requestData.remarks,
          },
          project.refId
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VERIFICATION_REJECTED_TO_IC,
          {
            icOrganisationName: ICCompany.companyName,
            remarks: requestData.remarks,
          },
          project.refId
        );
      } else if (requestData.action === DocumentStatus.DNA_APPROVED) {
        if (
          !document.content.ghgProjectDescription
            ?.estimatedNetEmissionReductions ||
          document.content.ghgProjectDescription?.estimatedNetEmissionReductions
            .length <= 0
        ) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.invlaidCreditQuantityToIssue",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        const creditVerified: ActivityVintageCreditsDto[] = [];
        document.content.ghgProjectDescription?.estimatedNetEmissionReductions?.map(
          (data: { vintage: string; netEmissionReductions: string }) => {
            const creditBlockToVerify = plainToClass(
              ActivityVintageCreditsDto,
              {
                vintage: new Date(parseInt(data.vintage))
                  .getFullYear()
                  .toString(),
                creditAmount: Number(data.netEmissionReductions),
              }
            );
            creditVerified.push(creditBlockToVerify);
          }
        );
        const errors = await validate(
          plainToClass(ActivityVintageCreditsArrayDto, {
            vintageCreditArray: creditVerified,
          })
        );
        if (creditVerified.length <= 0 || errors.length > 0) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.invlaidCreditVerifed",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        await this.programmeLedgerService.issueCredits(
          activity,
          creditVerified,
          project.companyId,
          document,
          this.getDocumentTxRef(
            DocumentTypeEnum.VERIFICATION,
            document.id,
            user.id
          ),
          user
        );
        const ICCompany = await this.userCompanyViewEntityRepository.findOne({
          where: { id: document.userId },
        });
        await this.emailHelperService.sendEmailToPDAdmins(
          EmailTemplates.VERIFICATION_APPROVED_TO_PD,
          { icOrganisationName: ICCompany.companyName },
          project.refId
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VERIFICATION_APPROVED_TO_IC,
          { icOrganisationName: ICCompany.companyName },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.VERIFICATION_REPORT_APPROVED,
          user.id
        );

        const totalCredits = creditVerified.reduce(
          (sum: number, item: ActivityVintageCreditsDto) =>
            sum + item.creditAmount,
          0
        );

        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.CREDIT_ISSUED,
          user.id,
          undefined,
          { amount: totalCredits, toCompany: project.companyId }
        );
      }
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "project.incorrectDocumentAction",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }

  public getDocumentTxRef(
    docType: DocumentTypeEnum,
    documentId: number,
    lastActionByUserId?: number
  ) {
    return `${docType}#${documentId}${
      lastActionByUserId ? `#${lastActionByUserId}` : ``
    }`;
  }

  async query(query: DocumentQueryDto) {
    const lastDoc = await this.documentsViewEntityRepository.findOne({
      where: {
        documentType: query.documentType,
        refId: query.refId,
      },
      order: {
        version: "DESC",
      },
    });

    return { data: lastDoc };
  }

  async queryAll(programmeId: string) {
    const documents = await this.documentRepository.find({
      where: {
        programmeId: programmeId,
      },
      order: {
        createdTime: "ASC",
      },
    });

    return documents;
  }

  private async getLastActivity(projectRefId: string): Promise<ActivityEntity> {
    return this.activityEntityRepository.findOne({
      where: {
        projectRefId: projectRefId,
      },
      order: {
        version: "DESC",
      },
    });
  }
}
