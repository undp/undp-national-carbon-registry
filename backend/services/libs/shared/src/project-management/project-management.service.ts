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

@Injectable()
export class ProjectManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly counterService: CounterService,
    private fileHandler: FileHandlerInterface,
    private readonly programmeLedger: ProgrammeLedgerService
  ) {}

  async create(projectDataDto: ProjectDataDto, user: User): Promise<any> {
    let projectDto = JSON.parse(projectDataDto.data);
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notProjectParticipant",
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
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const project = plainToClass(ProjectEntity, projectDto);
    project.refId = await this.counterService.incrementCount(
      CounterType.PROJECT,
      4
    );
    project.projectProposalStage = ProjectProposalStage.PENDING;
    project.companyId = companyId;
    project.txType = TxType.CREATE_PROJECT;
    project.txTime = new Date().getTime();

    // const docUrls = [];
    // if (projectDto.additionalDocuments?.length > 0) {
    //   projectDto.additionalDocuments.forEach(async (doc) => {
    //     const docUrl = await this.uploadDocument(
    //       DocType.INF_ADDITIONAL_DOCUMENT,
    //       project.refId,
    //       doc
    //     );
    //     docUrls.push(docUrl);
    //   });
    // }

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
