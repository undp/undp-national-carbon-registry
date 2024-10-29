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
import { DocumentTypeEnum } from "../enum/document.type.enum";
import { DocumentStatus } from "../enum/document.status";
import { DataResponseDto } from "../dto/data.response.dto";
import { use } from "passport";
import { GetDocDto } from "../dto/getDoc.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { Company } from "../entities/company.entity";
import { QueryDto } from "../dto/query.dto";
import { CostQuotationDto } from "src/dto/costQuotation.dto";
import { ProjectRegistrationCertificateGenerator } from "../util/projectRegistrationCertificate.gen";
import { DateUtilService } from "../util/dateUtil.service";
import { SLCFSerialNumberGeneratorService } from "../util/slcfSerialNumberGenerator.service";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { ProjectProposalDto } from "src/dto/projectProposal.dto";
import { ValidationAgreementDto } from "src/dto/validationAgreement.dto";
import { CMAApproveDto } from "src/dto/cmaApprove.dto";
import { ValidationReportDto } from "src/dto/validationReport.dto";

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
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private projectRegistrationCertificateGenerator: ProjectRegistrationCertificateGenerator,
    private dateUtilService: DateUtilService,
    private serialGenerator: SLCFSerialNumberGeneratorService
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

    programme.programmeId = await this.counterService.incrementCount(CounterType.PROGRAMME_SL, 4);
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

    const programme = await this.programmeLedgerService.getProgrammeSlById(cmaDto.programmeId);

    if (
      !(
        programme?.projectProposalStage === ProjectProposalStage.ACCEPTED_PROPOSAL ||
        programme?.projectProposalStage === ProjectProposalStage.REJECTED_CMA
      )
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
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

    const lastVersion = await this.getLastDocumentVersion(DocumentTypeEnum.CMA, cmaDto.programmeId);
    cmaDoc.version = lastVersion + 1;
    cmaDoc.status = DocumentStatus.PENDING;
    cmaDoc.createdTime = new Date().getTime();
    cmaDoc.updatedTime = cmaDoc.createdTime;

    await this.documentRepo.insert(cmaDoc);

    //updating proposal stage in programme
    const updateProgrammeSlProposalStage = {
      programmeId: cmaDto.programmeId,
      txType: TxType.CREATE_CMA,
    };

    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.CMA_CREATE,
      null,
      cmaDto.programmeId,
      companyId
    );

    return new DataResponseDto(HttpStatus.OK, cmaDoc);
  }

  async createCostQuotation(
    costQuotationDto: CostQuotationDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      costQuotationDto.programmeId
    );

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.APPROVED_INF) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (costQuotationDto.content.signature && costQuotationDto.content.signature.length > 0) {
      const docUrls = [];
      for (const sign of costQuotationDto.content.signature) {
        const docUrl = await this.uploadDocument(
          DocType.COST_QUOTATION_SIGN,
          costQuotationDto.programmeId,
          sign
        );
        docUrls.push(docUrl);
      }
      costQuotationDto.content.signature = docUrls;
    }

    const costQuotationDoc = new DocumentEntity();
    costQuotationDoc.content = JSON.stringify(costQuotationDto.content);
    costQuotationDoc.programmeId = costQuotationDto.programmeId;
    costQuotationDoc.companyId = companyId;
    costQuotationDoc.userId = user.id;
    costQuotationDoc.type = DocumentTypeEnum.COST_QUOTATION;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.COST_QUOTATION,
      costQuotationDto.programmeId
    );
    costQuotationDoc.version = lastVersion + 1;
    costQuotationDoc.status = DocumentStatus.PENDING;
    costQuotationDoc.createdTime = new Date().getTime();
    costQuotationDoc.updatedTime = costQuotationDoc.createdTime;

    await this.documentRepo.insert(costQuotationDoc);

    let data;

    if (costQuotationDto.content.totalCost) {
      data = {
        estimatedProjectCost: costQuotationDto.content.totalCost,
      };
    }

    const updateProgrammeSlProposalStage = {
      programmeId: costQuotationDto.programmeId,
      txType: TxType.CREATE_COST_QUOTATION,
      data: data,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, costQuotationDoc);
  }

  async createProjectProposal(
    projectProposalDto: ProjectProposalDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      projectProposalDto.programmeId
    );

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_COST_QUOTATION) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const projectProposalDoc = new DocumentEntity();
    projectProposalDoc.content = JSON.stringify(projectProposalDto.content);
    projectProposalDoc.programmeId = projectProposalDto.programmeId;
    projectProposalDoc.companyId = companyId;
    projectProposalDoc.userId = user.id;
    projectProposalDoc.type = DocumentTypeEnum.PROJECT_PROPOSAL;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.PROJECT_PROPOSAL,
      projectProposalDto.programmeId
    );
    projectProposalDoc.version = lastVersion + 1;
    projectProposalDoc.status = DocumentStatus.PENDING;
    projectProposalDoc.createdTime = new Date().getTime();
    projectProposalDoc.updatedTime = projectProposalDoc.createdTime;

    await this.documentRepo.insert(projectProposalDoc);

    const updateProgrammeSlProposalStage = {
      programmeId: projectProposalDto.programmeId,
      txType: TxType.CREATE_PROJECT_PROPOSAL,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, projectProposalDoc);
  }

  async createValidationAgreement(
    validationAgreementDto: ValidationAgreementDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      validationAgreementDto.programmeId
    );

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_PROPOSAL) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (validationAgreementDto.content.climateFundSignature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_CLIMATE_FUND_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.climateFundSignature
      );

      validationAgreementDto.content.climateFundSignature = docUrl;
    }

    if (validationAgreementDto.content.projectParticipantSignature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_PARTICIPANT_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.projectParticipantSignature
      );

      validationAgreementDto.content.projectParticipantSignature = docUrl;
    }

    if (validationAgreementDto.content.witness1Signature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_WITNESS1_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.witness1Signature
      );

      validationAgreementDto.content.witness1Signature = docUrl;
    }

    if (validationAgreementDto.content.witness2Signature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_WITNESS2_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.witness2Signature
      );

      validationAgreementDto.content.witness2Signature = docUrl;
    }

    if (validationAgreementDto.content.annexureADoc) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_APPENDIX,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.annexureADoc
      );
      validationAgreementDto.content.annexureADoc = docUrl;
    }

    if (validationAgreementDto.content.annexureBDoc) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_APPENDIX,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.annexureBDoc
      );
      validationAgreementDto.content.annexureBDoc = docUrl;
    }

    const validationAgreementDoc = new DocumentEntity();
    validationAgreementDoc.content = JSON.stringify(validationAgreementDto.content);
    validationAgreementDoc.programmeId = validationAgreementDto.programmeId;
    validationAgreementDoc.companyId = companyId;
    validationAgreementDoc.userId = user.id;
    validationAgreementDoc.type = DocumentTypeEnum.VALIDATION_AGREEMENT;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.VALIDATION_AGREEMENT,
      validationAgreementDto.programmeId
    );
    validationAgreementDoc.version = lastVersion + 1;
    validationAgreementDoc.status = DocumentStatus.PENDING;
    validationAgreementDoc.createdTime = new Date().getTime();
    validationAgreementDoc.updatedTime = validationAgreementDoc.createdTime;

    await this.documentRepo.insert(validationAgreementDoc);

    const updateProgrammeSlProposalStage = {
      programmeId: validationAgreementDto.programmeId,
      txType: TxType.CREATE_VALIDATION_AGREEMENT,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, validationAgreementDoc);
  }

  async approveCMA(cmaAppoveDto: CMAApproveDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programmeId = cmaAppoveDto.programmeId;
    const programme = await this.programmeLedgerService.getProgrammeSlById(programmeId);

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_CMA) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (cmaAppoveDto.content.validatorSignature) {
      const docUrl = await this.uploadDocument(
        DocType.SITE_VISIT_CHECKLIST_VALIDATOR_SIGN,
        programmeId,
        cmaAppoveDto.content.validatorSignature
      );

      cmaAppoveDto.content.validatorSignature = docUrl;
    }

    const siteVisitChecklistDoc = new DocumentEntity();
    siteVisitChecklistDoc.content = JSON.stringify(cmaAppoveDto.content);
    siteVisitChecklistDoc.programmeId = programmeId;
    siteVisitChecklistDoc.companyId = companyId;
    siteVisitChecklistDoc.userId = user.id;
    siteVisitChecklistDoc.type = DocumentTypeEnum.SITE_VISIT_CHECKLIST;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.SITE_VISIT_CHECKLIST,
      programmeId
    );
    siteVisitChecklistDoc.version = lastVersion + 1;
    siteVisitChecklistDoc.status = DocumentStatus.ACCEPTED;
    siteVisitChecklistDoc.createdTime = new Date().getTime();
    siteVisitChecklistDoc.updatedTime = siteVisitChecklistDoc.createdTime;

    await this.documentRepo.insert(siteVisitChecklistDoc);

    const getDoctDto = {
      programmeId: programmeId,
      docType: DocumentTypeEnum.CMA,
    };
    const cmaDoc = await this.getDocLastVersion(getDoctDto, user);
    let parsedCMADoc;
    let data;
    if (cmaDoc.data && cmaDoc.data.content) {
      parsedCMADoc = JSON.parse(cmaDoc.data.content);
    }

    if (
      parsedCMADoc &&
      parsedCMADoc.quantificationOfGHG &&
      parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions &&
      parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions.totalNetEmissionReductions
    ) {
      data = {
        creditEst: Number(
          parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions.totalNetEmissionReductions
        ),
      };
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_CMA,
      data: data,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, siteVisitChecklistDoc);
  }

  async createValidationReport(
    validationReportDto: ValidationReportDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      validationReportDto.programmeId
    );

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.APPROVED_CMA) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      validationReportDto.content.ghgProjectDescription.locationsOfProjectActivity &&
      validationReportDto.content.ghgProjectDescription.locationsOfProjectActivity.length > 0
    ) {
      for (const location of validationReportDto.content.ghgProjectDescription
        .locationsOfProjectActivity) {
        if (location.additionalDocuments && location.additionalDocuments.length > 0) {
          const docUrls = [];
          for (const doc of location.additionalDocuments) {
            const docUrl = await this.uploadDocument(
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

    if (validationReportDto.content.validationOpinion.validator1Signature) {
      const signUrl = await this.uploadDocument(
        DocType.VALIDATION_REPORT_VALIDATOR_SIGN,
        validationReportDto.programmeId,
        validationReportDto.content.validationOpinion.validator1Signature
      );

      validationReportDto.content.validationOpinion.validator1Signature = signUrl;
    }

    if (validationReportDto.content.validationOpinion.validator2Signature) {
      const signUrl = await this.uploadDocument(
        DocType.VALIDATION_REPORT_VALIDATOR_SIGN,
        validationReportDto.programmeId,
        validationReportDto.content.validationOpinion.validator2Signature
      );

      validationReportDto.content.validationOpinion.validator2Signature = signUrl;
    }

    if (
      validationReportDto.content.appendix.additionalDocuments &&
      validationReportDto.content.appendix.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of validationReportDto.content.appendix.additionalDocuments) {
        const docUrl = await this.uploadDocument(
          DocType.VALIDATION_REPORT_APPENDIX_ADDITIONAL_DOCUMENT,
          validationReportDto.programmeId,
          doc
        );
        docUrls.push(docUrl);
      }
      validationReportDto.content.appendix.additionalDocuments = docUrls;
    }

    const validationReportDoc = new DocumentEntity();
    validationReportDoc.content = JSON.stringify(validationReportDto.content);
    validationReportDoc.programmeId = validationReportDto.programmeId;
    validationReportDoc.companyId = companyId;
    validationReportDoc.userId = user.id;
    validationReportDoc.type = DocumentTypeEnum.VALIDATION_REPORT;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.VALIDATION_REPORT,
      validationReportDto.programmeId
    );
    validationReportDoc.version = lastVersion + 1;
    validationReportDoc.status = DocumentStatus.PENDING;
    validationReportDoc.createdTime = new Date().getTime();
    validationReportDoc.updatedTime = validationReportDoc.createdTime;

    await this.documentRepo.insert(validationReportDoc);

    const updateProgrammeSlProposalStage = {
      programmeId: validationReportDto.programmeId,
      txType: TxType.CREATE_VALIDATION_REPORT,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, validationReportDoc);
  }

  async approveValidation(programmeId: string, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(programmeId);

    const companyId = programme.companyId;

    const projectCompany = await this.companyService.findByCompanyId(companyId);

    if (!projectCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programmeSl.noCompanyExistingInSystem", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme?.projectProposalStage !== ProjectProposalStage.VALIDATION_PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const serialNo = await this.serialGenerator.generateProjectRegistrationSerial(programmeId);
    const registrationCertificateUrl = await this.generateProjectRegistrationCertificate(
      programmeId
    );

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_VALIDATION,
      data: {
        serialNo: serialNo,
        registrationCertificateUrl: registrationCertificateUrl,
      },
    };
    const response = await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    return new DataResponseDto(HttpStatus.OK, response.data);
  }

  async updateProposalStage(
    updateProposalStageDto: UpdateProjectProposalStageDto,
    user: User
  ): Promise<DataResponseDto> {
    const programmeId = updateProposalStageDto.programmeId;
    const txType = updateProposalStageDto.txType;
    const data = updateProposalStageDto.data;
    if (
      txType == TxType.APPROVE_INF ||
      txType == TxType.REJECT_INF ||
      txType == TxType.CREATE_COST_QUOTATION ||
      txType == TxType.CREATE_PROJECT_PROPOSAL ||
      txType == TxType.CREATE_VALIDATION_AGREEMENT ||
      txType == TxType.APPROVE_CMA ||
      txType == TxType.REJECT_CMA ||
      txType == TxType.CREATE_VALIDATION_REPORT
    ) {
      if (user.companyRole != CompanyRole.CLIMATE_FUND) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
          HttpStatus.UNAUTHORIZED
        );
      }
    } else if (txType == TxType.APPROVE_PROPOSAL || txType == TxType.REJECT_PROPOSAL) {
      if (user.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
          HttpStatus.UNAUTHORIZED
        );
      }
    } else if (txType == TxType.APPROVE_VALIDATION || txType == TxType.REJECT_VALIDATION) {
      if (user.companyRole != CompanyRole.EXECUTIVE_COMMITTEE) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
          HttpStatus.UNAUTHORIZED
        );
      }
    }

    //updating proposal stage in programme
    const updatedProgramme = await this.programmeLedger.updateProgrammeSlProposalStage(
      programmeId,
      txType,
      data
    );

    //updating document status
    if (txType == TxType.APPROVE_PROPOSAL) {
      const lastCostQuotationDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.COST_QUOTATION,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.COST_QUOTATION,
            version: lastCostQuotationDocVersion,
          },
          {
            status: DocumentStatus.ACCEPTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });

      const lastProposalDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.PROJECT_PROPOSAL,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.PROJECT_PROPOSAL,
            version: lastProposalDocVersion,
          },
          {
            status: DocumentStatus.ACCEPTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });

      const lastAgreementDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.VALIDATION_AGREEMENT,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.VALIDATION_AGREEMENT,
            version: lastAgreementDocVersion,
          },
          {
            status: DocumentStatus.ACCEPTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    } else if (txType == TxType.REJECT_PROPOSAL) {
      const lastCostQuotationDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.COST_QUOTATION,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.COST_QUOTATION,
            version: lastCostQuotationDocVersion,
          },
          {
            status: DocumentStatus.REJECTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });

      const lastProposalDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.PROJECT_PROPOSAL,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.PROJECT_PROPOSAL,
            version: lastProposalDocVersion,
          },
          {
            status: DocumentStatus.REJECTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });

      const lastAgreementDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.VALIDATION_AGREEMENT,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.VALIDATION_AGREEMENT,
            version: lastAgreementDocVersion,
          },
          {
            status: DocumentStatus.REJECTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    } else if (txType == TxType.APPROVE_CMA) {
      const lastCMADocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.CMA,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.CMA,
            version: lastCMADocVersion,
          },
          {
            status: DocumentStatus.ACCEPTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    } else if (txType == TxType.REJECT_CMA) {
      const lastCMADocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.CMA,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.CMA,
            version: lastCMADocVersion,
          },
          {
            status: DocumentStatus.REJECTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    } else if (txType == TxType.APPROVE_VALIDATION) {
      const lastValidationDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.VALIDATION_REPORT,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.VALIDATION_REPORT,
            version: lastValidationDocVersion,
          },
          {
            status: DocumentStatus.ACCEPTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    } else if (txType == TxType.REJECT_VALIDATION) {
      const lastValidationDocVersion = await this.getLastDocumentVersion(
        DocumentTypeEnum.VALIDATION_REPORT,
        programmeId
      );

      await this.documentRepo
        .update(
          {
            programmeId: programmeId,
            type: DocumentTypeEnum.VALIDATION_REPORT,
            version: lastValidationDocVersion,
          },
          {
            status: DocumentStatus.REJECTED,
            updatedTime: Date.now(),
          }
        )
        .catch((err) => {
          throw err;
        });
    }
    return new DataResponseDto(HttpStatus.OK, updatedProgramme);
  }

  async getDocs(getDocDto: GetDocDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(getDocDto.programmeId);
      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const documents = await this.documentRepo.find({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
      },
      order: {
        version: "DESC",
      },
    });
    return new DataResponseDto(HttpStatus.OK, documents);
  }

  async getDocLastVersion(getDocDto: GetDocDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROGRAMME_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(getDocDto.programmeId);
      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("programmeSl.notAuthorised", []),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const documents = await this.documentRepo.find({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
      },
      order: {
        version: "DESC",
      },
    });

    if (documents && documents.length > 0) {
      return new DataResponseDto(HttpStatus.OK, documents[0]);
    }
    return new DataResponseDto(HttpStatus.OK, null);
  }

  async query(query: QueryDto, abilityCondition: string): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const limit = query.size || 10;
    const offset = skip || 0;
    const sortKey = query?.sort?.key
      ? `programme_sl."${query.sort.key}"`
      : `"programme_sl"."createdTime"`;
    const sortOrder = query?.sort?.order || "DESC";

    let whereConditions = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable("programme_sl", abilityCondition),
      "programme_sl"
    );
    whereConditions = whereConditions ? `WHERE ${whereConditions}` : "";
    const rawQuery = `
  SELECT 
    programme_sl.*, 
    json_build_object(
            'companyId', c."companyId",
            'name', c."name",
            'companyRole', c."companyRole",
            'logo', c."logo",
            'email', c."email"
          ) as company
  FROM 
    programme_sl
  INNER JOIN 
    company c 
  ON 
    "programme_sl"."companyId" = c."companyId"

    ${whereConditions}
  ORDER BY 
    ${sortKey} ${sortOrder}
  LIMIT ${limit}
  OFFSET ${offset};
`;
    const resp = await this.programmeSlRepo.query(rawQuery);
    const totalQuery = `
    SELECT COUNT(*) 
    FROM 
    programme_sl
  INNER JOIN 
    company c 
  ON 
    "programme_sl"."companyId" = c."companyId"
    ${whereConditions}
    `;

    const totalResult = await this.programmeSlRepo.query(totalQuery);
    const totalCount = parseInt(totalResult[0].count, 10);
    return new DataListResponseDto(resp.length > 0 ? resp : undefined, totalCount);
  }
  // async query(
  //   query: QueryDto,
  //   abilityCondition: string
  // ): Promise<DataListResponseDto> {
  //   const skip = query.size * query.page - query.size;
  //   let resp = await this.programmeSlRepo
  //     .createQueryBuilder("programme_sl")
  //     .innerJoinAndSelect(
  //       "company",
  //       "c",
  //       "programme_sl.companyId = c.companyId"
  //     )
  //     .where(this.helperService.generateWhereSQL(query, null))
  //     .orderBy(
  //       query?.sort?.key &&
  //         `"programme_sl".${this.helperService.generateSortCol(
  //           query?.sort?.key
  //         )}`,
  //       query?.sort?.order,
  //       query?.sort?.nullFirst !== undefined
  //         ? query?.sort?.nullFirst === true
  //           ? "NULLS FIRST"
  //           : "NULLS LAST"
  //         : undefined
  //     )
  //     .offset(skip)
  //     .limit(query.size)
  //     .getManyAndCount();
  //   console.log(resp[0]);

  //   return new DataListResponseDto(
  //     resp.length > 0 ? resp[0] : undefined,
  //     resp.length > 1 ? resp[1] : undefined
  //   );
  // }

  // MARK: getProjectById
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

  // MARK: gen Reg Certificate
  async generateProjectRegistrationCertificate(programmeId: string) {
    const programme = await this.getProjectById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.programmeNotExist", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const certificateData = {
      projectName: programme.title,
      companyName: programme.company.name,
      creditType: programme.purposeOfCreditDevelopment,
      certificateNo: this.serialGenerator.generateProjectRegistrationSerial(programme.programmeId),
      regDate: this.dateUtilService.formatCustomDate(programme.createdTime),
      issueDate: this.dateUtilService.formatCustomDate(),
      sector: programme.projectCategory,
      estimatedCredits: programme.creditEst,
    };

    const url =
      await this.projectRegistrationCertificateGenerator.generateProjectRegistrationCertificate(
        certificateData,
        programme.programmeId
      );

    return url;
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
}
