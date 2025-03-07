import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ProjectDataDto } from "../dto/project.data.dto";
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
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
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

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly counterService: CounterService,
    private fileHandler: FileHandlerInterface,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    private readonly noObjectionLetterGenerateService: NoObjectionLetterGenerateService,
    @InjectRepository(ProjectViewEntity)
    private projectViewRepo: Repository<ProjectViewEntity>
  ) {}

  async create(projectCreateDto: ProjectCreateDto, user: User): Promise<any> {
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
    const projectCompany = await this.companyService.findByCompanyId(companyId);
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
      const ICCompany = await this.companyService.findByCompanyId(certifierId);
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
        const docUrl = await this.uploadDocument(
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

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.INITIAL_NOTIFICATION_FORM,
      project.refId
    );
    INFDoc.version = lastVersion + 1;
    INFDoc.status = DocumentStatus.PENDING;
    INFDoc.createdTime = new Date().getTime();
    INFDoc.updatedTime = INFDoc.createdTime;

    await this.documentRepo.insert(INFDoc);

    let savedProgramme = await this.programmeLedgerService.createProject(
      project
    );

    // await this.emailHelperService.sendEmailToSLCFAdmins(
    //   EmailTemplates.PROGRAMME_SL_CREATE,
    //   null,
    //   savedProgramme.programmeId
    // );

    // if (savedProgramme) {
    //   const log = new ProgrammeAuditLogSl();
    //   log.programmeId = savedProgramme.programmeId;
    //   log.logType = ProgrammeAuditLogType.CREATE;
    //   log.userId = user.id;

    //   await this.programmeAuditSlRepo.save(log);
    // }

    return savedProgramme;
  }

  async approveINF(refId: string, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("project.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const project = await this.programmeLedgerService.getProjectById(refId);

    const companyId = project.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

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
    const response = await this.updateProposalStage(
      updateProjectroposalStage,
      user
    );

    //send email to Project Participant
    // await this.emailHelperService.sendEmailToProjectParticipant(
    //   EmailTemplates.PROGRAMME_SL_APPROVED,
    //   null,
    //   programmeId
    // );

    // if (response) {
    //   const log = new ProgrammeAuditLogSl();
    //   log.programmeId = programmeId;
    //   log.logType = ProgrammeAuditLogType.INF_APPROVED;
    //   log.userId = user.id;

    //   await this.programmeAuditSlRepo.save(log);
    // }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async rejectINF(
    refId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("project.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const project = await this.programmeLedgerService.getProjectById(refId);

    const companyId = project.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

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

    const response = await this.updateProposalStage(
      updateProjectProposalStage,
      user
    );

    //send email to Project Participant
    // await this.emailHelperService.sendEmailToProjectParticipant(
    //   EmailTemplates.PROGRAMME_SL_REJECTED,
    //   { remark },
    //   programmeId
    // );

    // if (response) {
    //   const log = new ProgrammeAuditLogSl();
    //   log.programmeId = programmeId;
    //   log.logType = ProgrammeAuditLogType.INF_REJECTED;
    //   log.userId = user.id;
    //   log.data = { remark };

    //   await this.programmeAuditSlRepo.save(log);
    // }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async updateProposalStage(
    updateProposalStageDto: UpdateProjectProposalStageDto,
    user: User
  ): Promise<ProjectEntity> {
    const refId = updateProposalStageDto.programmeId;
    const txType = updateProposalStageDto.txType;
    const data = updateProposalStageDto.data;

    //updating proposal stage in programme
    const updatedProject =
      await this.programmeLedgerService.updateProjectProposalStage(
        refId,
        txType,
        data
      );

    return updatedProject;
  }
  private async getLastDocumentVersion(
    docType: DocumentTypeEnum,
    programmeId: string
  ): Promise<number> {
    const documents = await this.documentRepo.find({
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
}
