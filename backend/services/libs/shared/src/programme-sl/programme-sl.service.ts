import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
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
import { ObjectionLetterGen } from "../util/document-generators/objection.letter.gen";
import { AuthorizationLetterGen } from "../util/document-generators/authorisation.letter.gen";
import { LetterOfIntentRequestGen } from "../util/document-generators/letter.of.intent.request.gen";
import { LetterOfIntentResponseGen } from "../util/document-generators/letter.of.intent.response.gen";
import { LetterOfAuthorisationRequestGen } from "../util/document-generators/letter.of.authorisation.request.gen";
import { DataExportService } from "../util/data.export.service";
import { LetterSustainableDevSupportLetterGen } from "../util/document-generators/letter.sustainable.dev.support";
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
import { CostQuotationDto } from "../dto/costQuotation.dto";
import { ProjectRegistrationCertificateGenerator } from "../util/document-generators/projectRegistrationCertificate.gen";
import { DateUtilService } from "../util/dateUtil.service";
import { SLCFSerialNumberGeneratorService } from "../util/slcfSerialNumberGenerator.service";
import { UpdateProjectProposalStageDto } from "../dto/updateProjectProposalStage.dto";
import { ProjectProposalDto } from "../dto/projectProposal.dto";
import { ValidationAgreementDto } from "../dto/validationAgreement.dto";
import { CMAApproveDto } from "../dto/cmaApprove.dto";
import { ValidationReportDto } from "../dto/validationReport.dto";
import {
  ProjectCategory,
  SlProjectCategoryMap,
} from "../enum/projectCategory.enum";
import { ProjectGeography } from "../enum/projectGeography.enum";
import { ProgrammeAuditLogSl } from "../entities/programmeAuditLogSl.entity";
import { ProgrammeAuditLogType } from "../enum/programmeAuditLogType.enum";
import { CNCertificateIssueDto } from "../dto/cncertificateIssue.dto";
import { CarbonNeutralCertificateGenerator } from "../util/document-generators/carbonNeutralCertificate.gen";
import { CreditRetirementSlService } from "../creditRetirement-sl/creditRetirementSl.service";
import { Cache } from "cache-manager";

@Injectable()
export class ProgrammeSlService {
  constructor(
    private programmeLedger: ProgrammeLedgerService,
    private counterService: CounterService,
    private configService: ConfigService,
    private companyService: CompanyService,
    private helperService: HelperService,
    private emailHelperService: EmailHelperService,
    @InjectEntityManager() private entityManager: EntityManager,
    private fileHandler: FileHandlerInterface,
    @InjectRepository(DocumentEntity)
    private documentRepo: Repository<DocumentEntity>,
    @InjectRepository(ProgrammeSl)
    private programmeSlRepo: Repository<ProgrammeSl>,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private projectRegistrationCertificateGenerator: ProjectRegistrationCertificateGenerator,
    private dateUtilService: DateUtilService,
    private serialGenerator: SLCFSerialNumberGeneratorService,
    @InjectRepository(ProgrammeAuditLogSl)
    private programmeAuditSlRepo: Repository<ProgrammeAuditLogSl>,
    private carbonNeutralCertificateGenerator: CarbonNeutralCertificateGenerator,
    private creditRetirementSlService: CreditRetirementSlService,
    @Inject("CACHE_MANAGER") private cacheManager: Cache
  ) {}

  // MARK: Create Programme
  async create(
    programmeSlDto: ProgrammeSlDto,
    user: User
  ): Promise<ProgrammeSl | undefined> {
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notProjectParticipant",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const programme: ProgrammeSl = this.toSlProgramme(programmeSlDto);

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

    const ICCompany = await this.companyService.findByCompanyId(
      programmeSlDto.independantCertifierId
    );

    if (
      !ICCompany ||
      ICCompany.companyRole != CompanyRole.INDEPENDENT_CERTIFIER
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.noICExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme.projectCategory !== ProjectCategory.OTHER) {
      programme.otherProjectCategory = null;
    }

    if (programme.projectGeography === ProjectGeography.SINGLE) {
      if (
        programme.geographicalLocationCoordinates.length > 1 ||
        programme.geographicalLocationCoordinates.length < 1
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.shouldHaveOnlySingleCoordinateForSingleProjectGeography",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    } else if (programme.projectGeography === ProjectGeography.MULTIPLE) {
      if (programme.geographicalLocationCoordinates.length <= 1) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.shouldHaveMoreThanSingleCoordinateForMultipleProjectGeography",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    if (
      programme.projectCategory === ProjectCategory.AFFORESTATION ||
      programme.projectCategory === ProjectCategory.REFORESTATION ||
      programme.projectCategory === ProjectCategory.OTHER
    ) {
      programme.proposedProjectCapacity = null;
    }

    if (
      programme.projectCategory === ProjectCategory.RENEWABLE_ENERGY ||
      programme.projectCategory === ProjectCategory.OTHER
    ) {
      programme.speciesPlanted = null;
    }

    programme.programmeId = await this.counterService.incrementCount(
      CounterType.PROGRAMME_SL,
      4
    );
    programme.projectProposalStage = ProjectProposalStage.PENDING;
    programme.companyId = companyId;
    programme.txType = TxType.CREATE_SL;
    programme.txTime = new Date().getTime();
    programme.createdTime = programme.txTime;
    programme.updatedTime = programme.txTime;
    programme.proposalStageUpdatedTime = programme.txTime;

    const docUrls = [];

    if (programmeSlDto && programmeSlDto.additionalDocuments?.length > 0) {
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

    let savedProgramme = await this.programmeLedger.createProgrammeSl(
      programme
    );

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.PROGRAMME_SL_CREATE,
      null,
      savedProgramme.programmeId
    );

    if (savedProgramme) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = savedProgramme.programmeId;
      log.logType = ProgrammeAuditLogType.CREATE;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return savedProgramme;
  }

  async approveINF(programmeId: string, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_INF
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_INF,
    };
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //send email to Project Participant
    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.PROGRAMME_SL_APPROVED,
      null,
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.INF_APPROVED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async rejectINF(
    programmeId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_INF
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.REJECT_INF,
    };

    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //send email to Project Participant
    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.PROGRAMME_SL_REJECTED,
      { remark },
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.INF_REJECTED;
      log.userId = user.id;
      log.data = { remark };

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async createCostQuotation(
    costQuotationDto: CostQuotationDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
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
        this.helperService.formatReqMessagesString(
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
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

    if (
      costQuotationDto.content.signature &&
      costQuotationDto.content.signature.length > 0
    ) {
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
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = costQuotationDto.programmeId;
      log.logType = ProgrammeAuditLogType.CREATE_COST_QUOTATION;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, costQuotationDoc);
  }

  async createProjectProposal(
    projectProposalDto: ProjectProposalDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
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
        this.helperService.formatReqMessagesString(
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.SUBMITTED_COST_QUOTATION
    ) {
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
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = projectProposalDto.programmeId;
      log.logType = ProgrammeAuditLogType.CREATE_PROJECT_PROPOSAL;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, projectProposalDoc);
  }

  async createValidationAgreement(
    validationAgreementDto: ValidationAgreementDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
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
        this.helperService.formatReqMessagesString(
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.SUBMITTED_PROPOSAL
    ) {
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

    if (validationAgreementDto.content.climateFundWitnessSignature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_WITNESS1_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.climateFundWitnessSignature
      );

      validationAgreementDto.content.climateFundWitnessSignature = docUrl;
    }

    if (validationAgreementDto.content.projectParticipantWitnessSignature) {
      const docUrl = await this.uploadDocument(
        DocType.AGREEMENT_WITNESS2_SIGN,
        validationAgreementDto.programmeId,
        validationAgreementDto.content.projectParticipantWitnessSignature
      );

      validationAgreementDto.content.projectParticipantWitnessSignature =
        docUrl;
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
    validationAgreementDoc.content = JSON.stringify(
      validationAgreementDto.content
    );
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
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //send email to Project Participant
    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.PROJECT_PROPOSAL_SUBMITTED,
      null,
      validationAgreementDto.programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = validationAgreementDto.programmeId;
      log.logType = ProgrammeAuditLogType.CREATE_VALIDATION_AGREEMENT;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, validationAgreementDoc);
  }

  async approveProposal(
    programmeId: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_PROPOSAL,
    };
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //updating cost quotation document status
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

    //updating proposal document status
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

    //updating agreement document status
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

    //sending email to SLCF Admins
    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.PROJECT_PROPOSAL_ACCEPTED,
      null,
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.PROJECT_PROPOSAL_ACCEPTED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async rejectProposal(
    programmeId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.REJECT_PROPOSAL,
    };

    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //updating cost quotation document status
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

    //updating proposal document status
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

    //updating agreement document status
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

    //sending email to SLCF Admins
    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.PROJECT_PROPOSAL_REJECTED,
      { remark },
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.PROJECT_PROPOSAL_REJECTED;
      log.userId = user.id;
      log.data = { remark };

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async createCMA(cmaDto: CMADto, user: User): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notProjectParticipant",
          []
        ),
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

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      cmaDto.programmeId
    );

    if (
      !(
        programme?.projectProposalStage ===
          ProjectProposalStage.ACCEPTED_PROPOSAL ||
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
        this.helperService.formatReqMessagesString(
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      cmaDto.content.projectActivity.additionalDocuments &&
      cmaDto.content.projectActivity.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of cmaDto.content.projectActivity.additionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.CMA_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
            cmaDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      cmaDto.content.projectActivity.additionalDocuments = docUrls;
    }

    if (cmaDto.content.projectActivity.locationsOfProjectActivity.length > 0) {
      for (const location of cmaDto.content.projectActivity
        .locationsOfProjectActivity) {
        if (
          location.additionalDocuments &&
          location.additionalDocuments.length > 0
        ) {
          const docUrls = [];
          for (const doc of location.additionalDocuments) {
            let docUrl;

            if (this.isValidHttpUrl(doc)) {
              docUrl = doc;
            } else {
              docUrl = await this.uploadDocument(
                DocType.CMA_LOCATION_OF_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
                cmaDto.programmeId,
                doc
              );
            }
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
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.CMA_APPENDIX_ADDITIONAL_DOCUMENT,
            cmaDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      cmaDto.content.appendix.additionalDocuments = docUrls;
    }

    const cmaDoc = new DocumentEntity();
    cmaDoc.programmeId = cmaDto.programmeId;
    cmaDoc.companyId = user.companyId;
    cmaDoc.userId = user.id;
    cmaDoc.type = DocumentTypeEnum.CMA;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.CMA,
      cmaDto.programmeId
    );
    cmaDoc.version = lastVersion + 1;
    //updating cma report ID
    cmaDto.content.projectDetails.reportID = `SLCCS/CMA/${new Date().getFullYear()}/${
      cmaDoc.programmeId
    }/${cmaDoc.version}`;
    cmaDoc.content = JSON.stringify(cmaDto.content);
    cmaDoc.status = DocumentStatus.PENDING;
    cmaDoc.createdTime = new Date().getTime();
    cmaDoc.updatedTime = cmaDoc.createdTime;

    await this.documentRepo.insert(cmaDoc);

    //updating proposal stage in programme
    const updateProgrammeSlProposalStage = {
      programmeId: cmaDto.programmeId,
      txType: TxType.CREATE_CMA,
    };

    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.CMA_CREATE,
      null,
      cmaDto.programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = cmaDto.programmeId;
      log.logType = ProgrammeAuditLogType.CMA_CREATE;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, cmaDoc);
  }

  async approveCMA(
    cmaAppoveDto: CMAApproveDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programmeId = cmaAppoveDto.programmeId;
    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_CMA
    ) {
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

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_CMA,
      // data: data,
    };
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //updating document status
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

    //sending email to SLCF Admins
    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.CMA_APPROVED,
      null,
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.CMA_APPROVED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, siteVisitChecklistDoc);
  }

  async rejectCMA(
    programmeId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !== ProjectProposalStage.SUBMITTED_CMA
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.REJECT_CMA,
    };

    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //updating document status
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

    //sending email to SLCF Admins
    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.CMA_REJECTED,
      { remark },
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.CMA_REJECTED;
      log.userId = user.id;
      log.data = { remark };

      await this.programmeAuditSlRepo.save(log);
    }
    return new DataResponseDto(HttpStatus.OK, response);
  }

  async createValidationReport(
    validationReportDto: ValidationReportDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
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
        this.helperService.formatReqMessagesString(
          "programmeSl.noCompanyExistingInSystem",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !(
        programme?.projectProposalStage === ProjectProposalStage.APPROVED_CMA ||
        programme?.projectProposalStage ===
          ProjectProposalStage.REJECTED_VALIDATION
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
            let docUrl;

            if (this.isValidHttpUrl(doc)) {
              docUrl = doc;
            } else {
              docUrl = await this.uploadDocument(
                DocType.VALIDATION_REPORT_LOCATION_OF_PROJECT_ACTIVITY_ADDITIONAL_DOCUMENT,
                validationReportDto.programmeId,
                doc
              );
            }
            docUrls.push(docUrl);
          }
          location.additionalDocuments = docUrls;
        }
      }
    }

    if (validationReportDto.content.validationOpinion.validator1Signature) {
      let signUrl;

      if (
        this.isValidHttpUrl(
          validationReportDto.content.validationOpinion.validator1Signature
        )
      ) {
        signUrl =
          validationReportDto.content.validationOpinion.validator1Signature;
      } else {
        signUrl = await this.uploadDocument(
          DocType.VALIDATION_REPORT_VALIDATOR_SIGN,
          validationReportDto.programmeId,
          validationReportDto.content.validationOpinion.validator1Signature
        );
      }

      validationReportDto.content.validationOpinion.validator1Signature =
        signUrl;
    }

    if (validationReportDto.content.validationOpinion.validator2Signature) {
      let signUrl;

      if (
        this.isValidHttpUrl(
          validationReportDto.content.validationOpinion.validator2Signature
        )
      ) {
        signUrl =
          validationReportDto.content.validationOpinion.validator2Signature;
      } else {
        signUrl = await this.uploadDocument(
          DocType.VALIDATION_REPORT_VALIDATOR_SIGN,
          validationReportDto.programmeId,
          validationReportDto.content.validationOpinion.validator2Signature
        );
      }

      validationReportDto.content.validationOpinion.validator2Signature =
        signUrl;
    }

    if (
      validationReportDto.content.appendix.additionalDocuments &&
      validationReportDto.content.appendix.additionalDocuments.length > 0
    ) {
      const docUrls = [];
      for (const doc of validationReportDto.content.appendix
        .additionalDocuments) {
        let docUrl;

        if (this.isValidHttpUrl(doc)) {
          docUrl = doc;
        } else {
          docUrl = await this.uploadDocument(
            DocType.VALIDATION_REPORT_APPENDIX_ADDITIONAL_DOCUMENT,
            validationReportDto.programmeId,
            doc
          );
        }
        docUrls.push(docUrl);
      }
      validationReportDto.content.appendix.additionalDocuments = docUrls;
    }

    const validationReportDoc = new DocumentEntity();
    validationReportDoc.programmeId = validationReportDto.programmeId;
    validationReportDoc.companyId = companyId;
    validationReportDoc.userId = user.id;
    validationReportDoc.type = DocumentTypeEnum.VALIDATION_REPORT;

    const lastVersion = await this.getLastDocumentVersion(
      DocumentTypeEnum.VALIDATION_REPORT,
      validationReportDto.programmeId
    );
    validationReportDoc.version = lastVersion + 1;
    //updating validation report ID
    validationReportDto.content.projectDetails.reportID = `SLCCS/VDR/${new Date().getFullYear()}/${
      validationReportDoc.programmeId
    }/${validationReportDoc.version}`;
    validationReportDoc.content = JSON.stringify(validationReportDto.content);
    validationReportDoc.status = DocumentStatus.PENDING;
    validationReportDoc.createdTime = new Date().getTime();
    validationReportDoc.updatedTime = validationReportDoc.createdTime;

    const response = await this.documentRepo.insert(validationReportDoc);

    const updateProgrammeSlProposalStage = {
      programmeId: validationReportDto.programmeId,
      txType: TxType.CREATE_VALIDATION_REPORT,
    };
    await this.updateProposalStage(updateProgrammeSlProposalStage, user);

    //sendin email to Ex committee
    await this.emailHelperService.sendEmailToExCom(
      EmailTemplates.VALIDATION_SUBMITTED,
      null,
      validationReportDto.programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = validationReportDto.programmeId;
      log.logType = ProgrammeAuditLogType.VALIDATION_REPORT_CREATED;
      log.userId = user.id;

      await this.programmeAuditSlRepo.save(log);
    }

    return new DataResponseDto(HttpStatus.OK, validationReportDoc);
  }

  async approveValidation(
    programmeId: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.VALIDATION_PENDING
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const getDoctDto = {
      programmeId: programmeId,
      docType: DocumentTypeEnum.CMA,
    };
    const cmaDoc = await this.getDocLastVersion(getDoctDto, user);
    let parsedCMADoc;
    let creditEst;
    if (cmaDoc.data && cmaDoc.data.content) {
      parsedCMADoc = JSON.parse(cmaDoc.data.content);
    }

    if (
      parsedCMADoc &&
      parsedCMADoc.quantificationOfGHG &&
      parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions &&
      parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions
        .totalNetEmissionReductions
    ) {
      creditEst = Number(
        parsedCMADoc.quantificationOfGHG.netGHGEmissionReductions
          .totalNetEmissionReductions
      );
    }

    const serialNo =
      await this.serialGenerator.generateProjectRegistrationSerial(programmeId);
    const registrationCertificateUrl =
      await this.generateProjectRegistrationCertificate(programmeId, creditEst);

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.APPROVE_VALIDATION,
      data: {
        serialNo: serialNo,
        registrationCertificateUrl: registrationCertificateUrl,
        creditEst,
      },
    };
    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //update document status
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

    //send email to SLCF and Project Participant
    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.VALIDATION_APPROVED,
      null,
      programmeId
    );

    await this.emailHelperService.sendEmailToProjectParticipant(
      EmailTemplates.VALIDATION_APPROVED,
      null,
      programmeId
    );

    if (response) {
      const logs: ProgrammeAuditLogSl[] = [];

      const ValidationApprovedLog = new ProgrammeAuditLogSl();
      ValidationApprovedLog.programmeId = programmeId;
      ValidationApprovedLog.logType =
        ProgrammeAuditLogType.VALIDATION_REPORT_APPROVED;
      ValidationApprovedLog.userId = user.id;
      logs.push(ValidationApprovedLog);

      const authorisedLog = new ProgrammeAuditLogSl();
      authorisedLog.programmeId = programmeId;
      authorisedLog.logType = ProgrammeAuditLogType.AUTHORISED;
      authorisedLog.userId = user.id;
      logs.push(authorisedLog);

      await this.programmeAuditSlRepo.save(logs);
    }

    return new DataResponseDto(HttpStatus.OK, response);
  }

  async rejectValidation(
    programmeId: string,
    remark: string,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole != CompanyRole.EXECUTIVE_COMMITTEE) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.notAuthorised",
          []
        ),
        HttpStatus.UNAUTHORIZED
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    const companyId = programme.companyId;

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

    if (
      programme?.projectProposalStage !==
      ProjectProposalStage.VALIDATION_PENDING
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeIsNotInSuitableStageToProceed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const updateProgrammeSlProposalStage = {
      programmeId: programmeId,
      txType: TxType.REJECT_VALIDATION,
    };

    const response = await this.updateProposalStage(
      updateProgrammeSlProposalStage,
      user
    );

    //updating document status
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

    //sending email to SLCF Admins
    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.VALIDATION_REJECTED,
      { remark },
      programmeId
    );

    if (response) {
      const log = new ProgrammeAuditLogSl();
      log.programmeId = programmeId;
      log.logType = ProgrammeAuditLogType.VALIDATION_REPORT_REJECTED;
      log.userId = user.id;
      log.data = { remark };

      await this.programmeAuditSlRepo.save(log);
    }
    return new DataResponseDto(HttpStatus.OK, response);
  }

  async updateProposalStage(
    updateProposalStageDto: UpdateProjectProposalStageDto,
    user: User
  ): Promise<ProgrammeSl> {
    const programmeId = updateProposalStageDto.programmeId;
    const txType = updateProposalStageDto.txType;
    const data = updateProposalStageDto.data;

    //updating proposal stage in programme
    const updatedProgramme =
      await this.programmeLedger.updateProgrammeSlProposalStage(
        programmeId,
        txType,
        data
      );

    return updatedProgramme;
  }

  async getDocs(getDocDto: GetDocDto, user: User): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );
      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
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

  async getDocLastVersion(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );
      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
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

  async getVerificationDocLastVersion(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );
      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const document = await this.documentRepo.findOne({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
        verificationRequestId: getDocDto.verificationRequestId,
      },
      order: {
        version: "DESC",
      },
    });

    return new DataResponseDto(HttpStatus.OK, document);
  }

  async getDocVersions(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );

      if (!programme) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.programmeNotExist",
            []
          ),
          HttpStatus.NOT_FOUND
        );
      }

      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const documentVersions = await this.documentRepo.find({
      select: { version: true },
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
      },
      order: {
        version: "DESC",
      },
    });

    const versions = documentVersions.map((doc) => doc.version);

    return new DataResponseDto(HttpStatus.OK, versions);
  }

  async getVerificationDocVersions(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );

      if (!programme) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.programmeNotExist",
            []
          ),
          HttpStatus.NOT_FOUND
        );
      }

      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const documentVersions = await this.documentRepo.find({
      select: { version: true },
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
        verificationRequestId: getDocDto.verificationRequestId,
      },
      order: {
        version: "DESC",
      },
    });

    const versions = documentVersions.map((doc) => doc.version);

    return new DataResponseDto(HttpStatus.OK, versions);
  }

  async getDocByVersion(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );

      if (!programme) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.programmeNotExist",
            []
          ),
          HttpStatus.NOT_FOUND
        );
      }

      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const document = await this.documentRepo.findOne({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
        version: getDocDto.version,
      },
    });

    return new DataResponseDto(HttpStatus.OK, document);
  }

  async getVerificationDocByVersion(
    getDocDto: GetDocDto,
    user: User
  ): Promise<DataResponseDto> {
    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const programme = await this.programmeLedgerService.getProgrammeSlById(
        getDocDto.programmeId
      );

      if (!programme) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.programmeNotExist",
            []
          ),
          HttpStatus.NOT_FOUND
        );
      }

      if (user.companyId !== programme.companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programmeSl.notAuthorised",
            []
          ),
          HttpStatus.UNAUTHORIZED
        );
      }
    }
    const document = await this.documentRepo.findOne({
      where: {
        programmeId: getDocDto.programmeId,
        type: getDocDto.docType,
        version: getDocDto.version,
        verificationRequestId: getDocDto.verificationRequestId,
      },
    });

    return new DataResponseDto(HttpStatus.OK, document);
  }

  //MARK: Get Carbon Neutral Certs
  async getCarbonNeutralCertificateDocs(
    companyId: number
  ): Promise<DocumentEntity[]> {
    return await this.documentRepo.find({
      where: {
        companyId: companyId,
        type: DocumentTypeEnum.CARBON_NEUTRAL_CERTIFICATE,
      },
      order: {
        createdTime: "ASC",
      },
    });
  }

  // MARK: Request Carbon Neutral Certificate
  async requestCarbonNeutralCertificate(
    programmeId: string,
    companyId: number,
    user: User
  ) {
    if (
      user.companyRole !== CompanyRole.PROJECT_DEVELOPER ||
      companyId != user.companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.requestCarbonNeutralCertificateReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.programmeLedgerService.getProgrammeSlById(
      programmeId
    );

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programmeSl.programmeNotExist",
          []
        ),
        HttpStatus.NOT_FOUND
      );
    }

    const cncRequestDoc = new DocumentEntity();
    cncRequestDoc.companyId = companyId;
    cncRequestDoc.programmeId = programmeId;
    cncRequestDoc.userId = user.id;
    cncRequestDoc.type = DocumentTypeEnum.CARBON_NEUTRAL_CERTIFICATE;
    cncRequestDoc.version = 1;
    cncRequestDoc.createdTime = new Date().getTime();
    cncRequestDoc.updatedTime = cncRequestDoc.createdTime;

    const cncSavedRequest = await this.documentRepo.save(cncRequestDoc);

    await this.emailHelperService.sendEmailToSLCFAdmins(
      EmailTemplates.CARBON_NEUTRAL_SL_REQUESTED,
      {},
      programmeId
    );

    return cncSavedRequest;
  }

  //MARK: approve Carbon Neutral Certificate
  async approveCarbonNeutralCertificate(
    cNCertificateIssueDto: CNCertificateIssueDto,
    user: User
  ) {
    if (user.companyRole !== CompanyRole.CLIMATE_FUND) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.verifyVerificationReportWrongUser",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const cncRequest = await this.documentRepo.findOneBy({
      id: cNCertificateIssueDto.documentId,
    });

    if (!cncRequest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "verification.cncRequestDoesNotExists",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    let carbonNeutralCertificateSerial = undefined;
    let carbonNeutralCertUrl = undefined;
    const programme = await this.getProjectById(cncRequest.programmeId);

    if (cNCertificateIssueDto.approve) {
      const previousCarbonNeutralCertificateSerial =
        await this.getPreviousCNCertificateSerial();
      carbonNeutralCertificateSerial =
        this.serialGenerator.generateCarbonNeutralCertificateNumber(
          previousCarbonNeutralCertificateSerial
        );

      const neutralData = {
        projectName: programme.title,
        companyName: programme.company.name,
        scope: cNCertificateIssueDto.scope,
        certificateNo: carbonNeutralCertificateSerial,
        issueDate: this.dateUtilService.formatCustomDate(),
        creditAmount: await this.creditRetirementSlService.getCreditAmountSum(
          programme.company.companyId,
          cNCertificateIssueDto.assessmentPeriodStart,
          cNCertificateIssueDto.assessmentPeriodEnd
        ),
        orgBoundary: cNCertificateIssueDto.orgBoundary,
        assessmentYear: cNCertificateIssueDto.year,
        assessmentPeriod: `${this.dateUtilService.formatCustomDate(
          cNCertificateIssueDto.assessmentPeriodStart
        )} - ${this.dateUtilService.formatCustomDate(
          cNCertificateIssueDto.assessmentPeriodEnd
        )}`,
      };
      carbonNeutralCertUrl =
        await this.carbonNeutralCertificateGenerator.generateCarbonNeutralCertificate(
          neutralData,
          false
        );
    }

    const certificateContent = {
      serialNumber: carbonNeutralCertificateSerial,
      certificateUrl: carbonNeutralCertUrl,
    };

    if (!cNCertificateIssueDto.approve)
      certificateContent["remark"] = cNCertificateIssueDto.orgBoundary;

    const updatedRequest = await this.documentRepo.update(
      {
        id: cNCertificateIssueDto.documentId,
      },
      {
        content: JSON.stringify(certificateContent),
        status: cNCertificateIssueDto.approve
          ? DocumentStatus.ACCEPTED
          : DocumentStatus.REJECTED,
      }
    );

    const hostAddress = this.configService.get("host");
    await this.emailHelperService.sendEmailToOrganisationAdmins(
      programme.company.companyId,
      cNCertificateIssueDto.approve
        ? EmailTemplates.CARBON_NEUTRAL_SL_REQUEST_APPROVED
        : EmailTemplates.CARBON_NEUTRAL_SL_REQUEST_REJECTED,
      {
        programmeName: programme.title,
        remark: cNCertificateIssueDto.orgBoundary,
        pageLink:
          hostAddress +
          `/programmeManagementSLCF/view/${programme.programmeId}`,
      }
    );

    console.log(carbonNeutralCertUrl);
    return updatedRequest;
  }

  //MARK: Get Previous CNCertificate Serial
  async getPreviousCNCertificateSerial() {
    const latestApprovedCNCRequest = await this.documentRepo.findOne({
      where: {
        status: DocumentStatus.ACCEPTED,
        type: DocumentTypeEnum.CARBON_NEUTRAL_CERTIFICATE,
      },
      order: {
        createdTime: "DESC",
      },
    });

    return latestApprovedCNCRequest
      ? JSON.parse(latestApprovedCNCRequest.content).serialNumber
      : null;
  }

  //MARK: Query
  async query(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    const limit = query.size || 10;
    const offset = skip || 0;
    const sortKey = query?.sort?.key
      ? `programme_sl."${query.sort.key}"`
      : `"programme_sl"."createdTime"`;
    const sortOrder = query?.sort?.order || "DESC";

    if (user.companyRole === CompanyRole.PROJECT_DEVELOPER) {
      const filterAnd = {
        key: "companyId",
        operation: "=",
        value: user.companyId,
      };
      query.filterAnd.push(filterAnd);
    }

    let whereConditions = this.helperService.generateWhereSQL(
      query,
      this.helperService.parseMongoQueryToSQLWithTable(
        "programme_sl",
        abilityCondition
      ),
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
    return new DataListResponseDto(
      resp.length > 0 ? resp : undefined,
      totalCount
    );
  }

  // MARK: publicProgrammeDetails
  async getPublicProjectDetails(query: QueryDto) {
    const cacheKey = `programme_${JSON.stringify(query)}`;

    const cachedData = await this.cacheManager.get<DataListResponseDto>(
      cacheKey
    );
    if (cachedData) {
      console.log("Get project public data from cache");
      return cachedData;
    }
    console.log("Project data not in cache");

    const skip = query.size * query.page - query.size;
    const limit = query.size || 10;
    const offset = skip || 0;
    const sortKey = query?.sort?.key
      ? `programme_sl."${query.sort.key}"`
      : `"programme_sl"."createdTime"`;
    const sortOrder = query?.sort?.order || "DESC";

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
      WHERE
        "projectProposalStage" = 'AUTHORISED'
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
      WHERE
        "projectProposalStage" = 'AUTHORISED'
    `;

    const totalResult = await this.programmeSlRepo.query(totalQuery);
    const totalCount = parseInt(totalResult[0].count, 10);
    const result = new DataListResponseDto(
      resp.length > 0 ? resp : undefined,
      totalCount
    );
    // Cache set
    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  // MARK: getProjectById
  async getProjectById(programmeId: string): Promise<any> {
    let project: ProgrammeSl =
      await this.programmeLedgerService.getProgrammeSlById(programmeId);
    let company: Company;

    if (project && project.companyId) {
      company = await this.companyService.findByCompanyId(project.companyId);
    }

    let documents = await this.documentRepo.find({
      select: {
        version: true,
        createdTime: true,
        type: true,
      },
      where: {
        programmeId: programmeId,
      },
    });

    const lastVersions = documents.reduce((acc, doc) => {
      // If the type is not in the accumulator or the current document has a higher version, update it
      if (!acc[doc.type] || acc[doc.type].version < doc.version) {
        acc[doc.type] = doc;
      }
      return acc;
    }, {});

    let updatedProject = {
      ...project,
      company: company,
      documents: lastVersions,
    };
    return updatedProject;
  }

  async getDocumentById(docId: number): Promise<any> {
    const document = await this.documentRepo.findOne({
      where: {
        id: docId,
      },
    });
    return document;
  }

  // MARK: gen Reg Certificate
  async generateProjectRegistrationCertificate(
    programmeId: string,
    creditEst: string
  ) {
    const programme = await this.getProjectById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const certificateData = {
      projectName: programme.title,
      companyName: programme.company.name,
      creditType: programme.purposeOfCreditDevelopment,
      certificateNo: this.serialGenerator.generateProjectRegistrationSerial(
        programme.programmeId
      ),
      regDate: this.dateUtilService.formatCustomDate(programme.createdTime),
      issueDate: this.dateUtilService.formatCustomDate(),
      sector: SlProjectCategoryMap[programme.projectCategory],
      estimatedCredits: creditEst,
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

  private isValidHttpUrl(attachment: string): boolean {
    let url;

    try {
      url = new URL(attachment);
    } catch (_) {
      return false;
    }

    return url.protocol === "http:" || url.protocol === "https:";
  }
}
