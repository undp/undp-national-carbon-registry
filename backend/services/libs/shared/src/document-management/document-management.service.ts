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

@Injectable()
export class DocumentManagementService {
  constructor(
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly helperService: HelperService,
    private readonly emailHelperService: EmailHelperService,
    private readonly auditLogService: AuditLogsService,
    private readonly companyServie: CompanyService
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
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

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

  public async updateDocumentEntity(
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
