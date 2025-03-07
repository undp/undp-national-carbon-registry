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
    private readonly programmeLedger: ProgrammeLedgerService,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    @InjectRepository(ProjectViewEntity)
    private projectViewRepo: Repository<ProjectViewEntity>
  ) {}

  async create(projectCreateDto: ProjectCreateDto, user: User): Promise<any> {
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.notProjectParticipant",
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
          "programme.noCompanyExistingInSystem",
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
            "programme.noICExistingInSystem",
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

    let savedProgramme = await this.programmeLedger.createProject(project);

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
            "programme.invalidDocumentUpload",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (Exception: any) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidDocumentUpload",
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
          "programme.docUploadFailed",
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
}
