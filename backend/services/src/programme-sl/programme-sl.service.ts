import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { instanceToPlain, plainToClass } from "class-transformer";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, QueryFailedError, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { User } from "../entities/user.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { CountryService } from "../util/country.service";
import { CounterType } from "../util/counter.type.enum";
import { CounterService } from "../util/counter.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { CompanyService } from "../company/company.service";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { UserService } from "../user/user.service";
import { HelperService } from "../util/helpers.service";
import { LocationInterface } from "../location/location.interface";
import { AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { DocType } from "../enum/document.type";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { ObjectionLetterGen } from "../util/objection.letter.gen";
import { AuthorizationLetterGen } from "../util/authorisation.letter.gen";
import { LetterOfIntentRequestGen } from "../util/letter.of.intent.request.gen";
import { LetterOfIntentResponseGen } from "../util/letter.of.intent.response.gen";
import { LetterOfAuthorisationRequestGen } from "../util/letter.of.authorisation.request.gen";
import { DataExportService } from "../util/data.export.service";
import { LetterSustainableDevSupportLetterGen } from "../util/letter.sustainable.dev.support";
import { ProgrammeSlDto } from "../dto/programmeSl.dto";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";
import { EmailTemplates } from "../email-helper/email.template";
import { CMADto } from "../dto/cma.dto";
import { DocumentEntity } from "../entities/document.entity";
import { DocumentTypeEnum } from "src/enum/document.type.enum";
import { DocumentStatus } from "src/enum/document.status";
import { DataResponseDto } from "src/dto/data.response.dto";
import { use } from "passport";
import { GetDocDto } from "src/dto/getDoc.dto";
import { DataListResponseDto } from "src/dto/data.list.response";
import { Company } from "src/entities/company.entity";

@Injectable()
export class ProgrammeSlService {
  constructor(
    private authLetterGen: AuthorizationLetterGen,
    private programmeLedger: ProgrammeLedgerService,
    private counterService: CounterService,
    private configService: ConfigService,
    private companyService: CompanyService,
    private userService: UserService,
    private locationService: LocationInterface,
    private helperService: HelperService,
    private emailHelperService: EmailHelperService,
    private readonly countryService: CountryService,
    private letterGen: ObjectionLetterGen,
    private logger: Logger,
    private asyncOperationsInterface: AsyncOperationsInterface,
    @InjectEntityManager() private entityManager: EntityManager,
    private fileHandler: FileHandlerInterface,
    private letterOfIntentRequestGen: LetterOfIntentRequestGen,
    private letterOfIntentResponseGen: LetterOfIntentResponseGen,
    private letterOfAuthorisationRequestGen: LetterOfAuthorisationRequestGen,
    private letterSustainableDevSupportLetterGen: LetterSustainableDevSupportLetterGen,
    private dataExportService: DataExportService,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    @InjectRepository(ProgrammeSl)
    private programmeSlRepo: Repository<ProgrammeSl>,
    private readonly programmeLedgerService: ProgrammeLedgerService
  ) {}

  async create(programmeSlDto: ProgrammeSlDto, user: User): Promise<ProgrammeSl | undefined> {
    if (user.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notProjectParticipant", []),
        HttpStatus.BAD_REQUEST
      );
    }
    const programme: ProgrammeSl = this.toSlProgramme(programmeSlDto);

    const companyId = user.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    programme.programmeId = await this.counterService.incrementCount(CounterType.PROGRAMME_SL, 3);
    programme.projectProposalStage = ProjectProposalStage.SUBMITTED_INF;
    programme.companyId = companyId;
    programme.txType = TxType.CREATE_SL;
    programme.txTime = new Date().getTime();
    programme.createdTime = programme.txTime;
    programme.updatedTime = programme.txTime;

    const docUrls = [];

    if (programmeSlDto && programmeSlDto.additionalDocuments.length > 0) {
      programmeSlDto.additionalDocuments.forEach(async (doc) => {
        const docUrl = await this.uploadDocument(
          DocType.INF_ADDITIONAL_DOCUMENT,
          programme.programmeId,
          doc
        );
        docUrls.push(docUrl);
      });

      programme.additionalDocuments = docUrls;
    }

    let savedProgramme = await this.programmeLedger.createProgrammeSl(programme);

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.PROGRAMME_SL_CREATE,
      null,
      savedProgramme.programmeId,
      companyId
    );

    return savedProgramme;
  }

  async createCMA(cmaDto: CMADto, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notProjectParticipant", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (user.companyId != cmaDto.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.cannotCreateCMAForOtherProjectParticipants",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const companyId = user.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      cmaDto.content.projectActivity.additionalDocuments &&
      cmaDto.content.projectActivity.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of cmaDto.content.projectActivity.additionalDocuments) {
        const docUrl = await this.uploadDocument(
          DocType.CMA_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
          cmaDto.programmeId,
          doc
        );
        docUrls.push(docUrl);
      }
      cmaDto.content.projectActivity.additionalDocuments = docUrls;
    }

    if (cmaDto.content.projectActivity.locationsOfProjectActivity.length > 0) {
      for (const location of cmaDto.content.projectActivity.locationsOfProjectActivity) {
        if (location.additionalDocuments && location.additionalDocuments.length > 0) {
          const docUrls = [];
          for (const doc of location.additionalDocuments) {
            const docUrl = await this.uploadDocument(
              DocType.CMA_LOCATION_OF_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
              cmaDto.programmeId,
              doc
            );
            docUrls.push(docUrl);
          }

          location.additionalDocuments = docUrls;
        }
      }
    }

    if (
      cmaDto.content.appendix.additionalDocuments &&
      cmaDto.content.appendix.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of cmaDto.content.appendix.additionalDocuments) {
        const docUrl = await this.uploadDocument(
          DocType.CMA_APPENDIX_ADDITIONAL_DOCUMENT,
          cmaDto.programmeId,
          doc
        );
        docUrls.push(docUrl);
      }
      cmaDto.content.appendix.additionalDocuments = docUrls;
    }

    const cmaDoc = new DocumentEntity();
    cmaDoc.content = JSON.stringify(cmaDto.content);
    cmaDoc.programmeId = cmaDto.programmeId;
    cmaDoc.companyId = user.companyId;
    cmaDoc.userId = user.id;
    cmaDoc.type = DocumentTypeEnum.CMA;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.CMA,
      companyId,
      cmaDto.programmeId
    );
    cmaDoc.version = lastVersion + 1;
    cmaDoc.status = DocumentStatus.PENDING;
    cmaDoc.createdTime = new Date().getTime();
    cmaDoc.updatedTime = cmaDoc.createdTime;

    await this.documentRepo.insert(cmaDoc);

    //updating proposal stage in programme
    const updatedProgramme = await this.programmeLedger.updateProgrammeSlProposalStage(
      cmaDto.programmeId,
      TxType.CREATE_CMA
    );

    await this.programmeSlRepo
      .update(
        {
          programmeId: cmaDto.programmeId,
        },
        {
          projectProposalStage: updatedProgramme.projectProposalStage,
          txTime: updatedProgramme.txTime,
          updatedTime: updatedProgramme.updatedTime,
        }
      )
      .catch((err) => {
        throw err;
      });

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.CMA_CREATE,
      null,
      cmaDto.programmeId,
      companyId
    );

    return new DataResponseDto(HttpStatus.OK, cmaDoc);
  }

  async getDocs(getDocDto: GetDocDto, user: User): Promise<DataResponseDto> {
    const documents = await this.documentRepo.find({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
        companyId: user.companyId,
      },
      order: {
        version: "DESC",
      },
    });
    return new DataResponseDto(HttpStatus.OK, documents);
  }

  async getProjectById(programmeId: string): Promise<any> {
    let project: ProgrammeSl = await this.programmeLedgerService.getProgrammeSlById(programmeId);
    const company: Company = await this.companyService.findByCompanyId(project.companyId);
    let updatedProject = {
      ...project,
      company: company,
    };
    console.log(JSON.stringify(updatedProject));
    return updatedProject;
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

  private toSlProgramme(programmeSlDto: ProgrammeSlDto): ProgrammeSl {
    const data = instanceToPlain(programmeSlDto);
    return plainToClass(ProgrammeSl, data);
  }

  private getFileExtension = (file: string): string => {
    let fileType = file.split(";")[0].split("/")[1];
    fileType = this.fileExtensionMap.get(fileType);
    return fileType;
  };

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

  private async getLastDocumentVersion(
    docType: DocumentTypeEnum,
    companyId: number,
    programmeId: string
  ): Promise<number> {
    const documents = await this.documentRepo.find({
      where: {
        companyId: companyId,
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
}
