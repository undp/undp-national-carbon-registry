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
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { DocType } from "../enum/document.type";
import { UserService } from "../user/user.service";

@Injectable()
export class DocumentManagementService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly helperService: HelperService,
    private readonly emailHelperService: EmailHelperService,
    private readonly auditLogService: AuditLogsService,
    private readonly companyServie: CompanyService,
    private fileHandler: FileHandlerInterface,
    private readonly userService: UserService
  ) {}
  async addDocument(addDocumentDto: BaseDocumentDto, user: User) {
    try {
      const project = await this.programmeLedgerService.getProjectById(
        addDocumentDto.projectRefId
      );
      const newDoc = new DocumentEntity();
      newDoc.content = JSON.stringify(addDocumentDto.data);
      newDoc.programmeId = project.refId;
      newDoc.companyId = project.companyId;
      newDoc.userId = user.id;
      newDoc.type = addDocumentDto.documentType;
      const lastVersion = await this.getLastDocumentVersion(
        addDocumentDto.documentType,
        project.refId
      );
      newDoc.version = lastVersion + 1;
      newDoc.status = DocumentStatus.PENDING;
      newDoc.createdTime = new Date().getTime();
      newDoc.updatedTime = newDoc.createdTime;

      let updateProjectProposalStage: UpdateProjectProposalStageDto;
      switch (addDocumentDto.documentType) {
        case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT:
          if (user.companyId != project.companyId) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.notAuthorised",
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
          updateProjectProposalStage = {
            programmeId: addDocumentDto.projectRefId,
            txType: TxType.CREATE_PDD,
          };
          const doc = await this.documentRepository.save(newDoc); //not a good method to handle this, ledger table can be used to gerantee the consistency
          const response = await this.updateProposalStage(
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
          break;

        case DocumentTypeEnum.VALIDATION_REPORT:
          const validationReportDto: ValidationReportDto = plainToInstance(
            ValidationReportDto,
            addDocumentDto.data
          );

          const errors = await validate(validationReportDto);
          if (errors.length > 0) {
            console.log("validation failed");
            throw new HttpException(errors, HttpStatus.BAD_REQUEST);
          }

          if (user.companyRole !== CompanyRole.INDEPENDENT_CERTIFIER) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "project.notAuthorised",
                []
              ),
              HttpStatus.UNAUTHORIZED
            );
          }

          if (
            ![
              ProjectProposalStage.PDD_APPROVED_BY_DNA,
              ProjectProposalStage.REJECTED_VALIDATION,
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

          await this.createValidationReport(validationReportDto, newDoc);

          updateProjectProposalStage = {
            programmeId: validationReportDto.programmeId,
            txType: TxType.CREATE_VALIDATION_REPORT,
          };

          const documentResponse = await this.documentRepository.insert(newDoc); //not a good method to handle this, ledger table can be used to gerantee the consistency

          await this.updateProposalStage(updateProjectProposalStage, user);

          await this.logProjectStage(
            project.refId,
            ProjectAuditLogType.VALIDATION_REPORT_SUBMITTED,
            user.id
          );

          await this.emailHelperService.sendEmailToExCom(
            EmailTemplates.VALIDATION_SUBMITTED,
            null,
            addDocumentDto.projectRefId
          );

          break;
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  private async createValidationReport(
    validationReportDto: ValidationReportDto,
    newDoc: DocumentEntity
  ): Promise<void> {
    if (
      validationReportDto.content.ghgProjectDescription
        .locationsOfProjectActivity &&
      validationReportDto.content.ghgProjectDescription
        .locationsOfProjectActivity.length > 0
    ) {
      for (const location of validationReportDto.content.ghgProjectDescription
        .locationsOfProjectActivity) {
        if (
          location.additionalDocuments &&
          location.additionalDocuments.length > 0
        ) {
          const docUrls = [];
          for (const doc of location.additionalDocuments) {
            let docUrl = this.isValidHttpUrl(doc)
              ? doc
              : await this.uploadDocument(
                  DocType.VALIDATION_REPORT_LOCATION_OF_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
                  validationReportDto.programmeId,
                  doc
                );
            docUrls.push(docUrl);
          }
          location.additionalDocuments = docUrls;
        }
      }
    }

    await this.processValidatorSignature(
      validationReportDto,
      "validator1Signature"
    );
    await this.processValidatorSignature(
      validationReportDto,
      "validator2Signature"
    );

    if (
      validationReportDto.content.appendix.additionalDocuments &&
      validationReportDto.content.appendix.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of validationReportDto.content.appendix
        .additionalDocuments) {
        let docUrl = this.isValidHttpUrl(doc)
          ? doc
          : await this.uploadDocument(
              DocType.VALIDATION_REPORT_APPENDIX_ADDITIONAL_DOCUMENT,
              validationReportDto.programmeId,
              doc
            );
        docUrls.push(docUrl);
      }
      validationReportDto.content.appendix.additionalDocuments = docUrls;
    }

    validationReportDto.content.projectDetails.reportID = `SLCCS/VDR/${new Date().getFullYear()}/${
      newDoc.programmeId
    }/${newDoc.version}`;
  }

  private async processValidatorSignature(
    validationReportDto: ValidationReportDto,
    signatureField: "validator1Signature" | "validator2Signature"
  ): Promise<void> {
    if (validationReportDto.content.validationOpinion[signatureField]) {
      let signUrl = this.isValidHttpUrl(
        validationReportDto.content.validationOpinion[signatureField]
      )
        ? validationReportDto.content.validationOpinion[signatureField]
        : await this.uploadDocument(
            DocType.VALIDATION_REPORT_VALIDATOR_SIGN,
            validationReportDto.programmeId,
            validationReportDto.content.validationOpinion[signatureField]
          );
      validationReportDto.content.validationOpinion[signatureField] = signUrl;
    }
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

  async approve(
    refId: string,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    try {
      const existingDocument = await this.documentRepository.findOne({
        where: { id: Number(refId) },
      });
      if (
        !existingDocument ||
        ![DocumentStatus.PENDING, DocumentStatus.IC_APPROVED].includes(
          existingDocument?.status
        )
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noValidDocument",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      switch (existingDocument.type) {
        case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT:
          {
            await this.performPDDAction(existingDocument, requestData, user);
          }
          break;

        case DocumentTypeEnum.VALIDATION_REPORT:
          {
            await this.performVRAction(existingDocument, requestData, user);
          }
          break;
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async reject(
    refId: string,
    requestData: DocumentActionRequestDto,
    user: User
  ) {
    try {
      const existingDocument = await this.documentRepository.findOne({
        where: { id: Number(refId) },
      });
      if (
        !existingDocument ||
        ![DocumentStatus.PENDING, DocumentStatus.IC_APPROVED].includes(
          existingDocument?.status
        )
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noValidDocument",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      switch (existingDocument.type) {
        case DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT:
          {
            await this.performPDDAction(existingDocument, requestData, user);
          }
          break;

        case DocumentTypeEnum.VALIDATION_REPORT:
          {
            await this.performVRAction(existingDocument, requestData, user);
          }
          break;
      }
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
        docType = DocumentTypeEnum.VALIDATION_REPORT;
        docStatus = DocumentStatus.DNA_APPROVED;
        break;
      case TxType.REJECT_VALIDATION:
        docType = DocumentTypeEnum.VALIDATION_REPORT;
        docStatus = DocumentStatus.DNA_REJECTED;
        break;
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
    userId: number
  ): Promise<void> {
    const log = new AuditEntity();
    log.refId = refId;
    log.logType = type;
    log.userId = userId;

    await this.auditLogService.save(log);
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

      if (!project.independentCertifiers.includes(user.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const ICCompany = await this.companyServie.findByCompanyId(
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
          user.id
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
      if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notAuthorised",
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
          user.id
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
          EmailTemplates.PDD_DNA_REJECT_TO_IC,
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

  async performVRAction(
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

      if (user.companyRole !== CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
      const DNACompany = await this.companyServie.findByCompanyId(
        user.companyId
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
            DocumentTypeEnum.VALIDATION_REPORT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VALIDATION_REJECTED,
          { organisationName: DNACompany.name, remark: requestData.remarks },
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.VALIDATION_DNA_REJECTED,
          user.id
        );
      } else if (requestData.action === DocumentStatus.DNA_APPROVED) {
        const updateProjectProposalStage = {
          programmeId: project.refId,
          txType: TxType.APPROVE_VALIDATION,
        };
        await this.updateProposalStage(
          updateProjectProposalStage,
          user,
          this.getDocumentTxRef(
            DocumentTypeEnum.VALIDATION_REPORT,
            document.id,
            user.id
          )
        );
        await this.emailHelperService.sendEmailToICAdmins(
          EmailTemplates.VALIDATION_APPROVED,
          {},
          project.refId
        );
        await this.logProjectStage(
          project.refId,
          ProjectAuditLogType.VALIDATION_DNA_APPROVED,
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

  public getDocumentTxRef(
    docType: DocumentTypeEnum,
    documentId: number,
    lastActionByUserId?: number
  ) {
    return `${docType}#${documentId}${
      lastActionByUserId ? `#${lastActionByUserId}` : ``
    }`;
  }
}
