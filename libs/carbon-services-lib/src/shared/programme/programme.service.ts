import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ProgrammeDto } from "../dto/programme.dto";
import { instanceToPlain, plainToClass } from "class-transformer";
import { ProgrammeStage } from "../enum/programme-status.enum";
import {
  AgricultureConstants,
  AgricultureCreationRequest,
  calculateCredit,
  SolarConstants,
  SolarCreationRequest,
} from "@undp/carbon-credit-calculator";
import { QueryDto } from "../dto/query.dto";
import { InjectEntityManager, InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, QueryFailedError, Repository } from "typeorm";
import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { DataResponseDto } from "../dto/data.response.dto";
import { ConstantUpdateDto } from "../dto/constants.update.dto";
import { ProgrammeApprove } from "../dto/programme.approve";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { ConfigService } from "@nestjs/config";
import { TypeOfMitigation, sectorMitigationTypesListMapped } from "../enum/typeofmitigation.enum";
import { ProgrammeTransferRequest } from "../dto/programme.transfer.request";
import { User } from "../entities/user.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { TransferStatus } from "../enum/transform.status.enum";
import { ProgrammeTransferApprove } from "../dto/programme.transfer.approve";
import { ProgrammeTransferReject } from "../dto/programme.transfer.reject";
import { CompanyRole } from "../enum/company.role.enum";
import { ProgrammeCertify } from "../dto/programme.certify";
import { ProgrammeTransferViewEntityQuery } from "../entities/programmeTransfer.view.entity";
import { ProgrammeRetire } from "../dto/programme.retire";
import { ProgrammeTransferCancel } from "../dto/programme.transfer.cancel";
import { CompanyState } from "../enum/company.state.enum";
import { ProgrammeReject } from "../dto/programme.reject";
import { ProgrammeIssue } from "../dto/programme.issue";
import { RetireType } from "../enum/retire.type.enum";
import { use } from "passport";
import { SystemActionType } from "../enum/system.action.type";
import { DataResponseMessageDto } from "../dto/data.response.message";
import { ProgrammeDocumentDto } from "../dto/programme.document.dto";
import { MitigationProperties } from "../dto/mitigation.properties";
import { OwnershipUpdateDto } from "../dto/ownership.update";
import { MitigationAddDto } from "../dto/mitigation.add.dto";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { ProgrammeAcceptedDto } from "../dto/programme.accepted.dto";
import { CountryService } from "../util/country.service";
import { Programme } from "../entities/programme.entity";
import { ConstantEntity } from "../entities/constants.entity";
import { CounterType } from "../util/counter.type.enum";
import { DataListResponseDto } from "../dto/data.list.response";
import { CounterService } from "../util/counter.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { CompanyService } from "../company/company.service";
import { EmailTemplates } from "../email-helper/email.template";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { UserService } from "../user/user.service";
import { Company } from "../entities/company.entity";
import { HelperService } from "../util/helpers.service";
import { ProgrammeQueryEntity } from "../entities/programme.view.entity";
import { LocationInterface } from "../location/location.interface";
import { AsyncAction, AsyncOperationsInterface } from "../async-operations/async-operations.interface";
import { NDCActionDto } from "../dto/ndc.action.dto";
import { Investment } from "../entities/investment.entity";
import { InvestmentStatus } from "../enum/investment.status";
import { InvestmentRequestDto } from "../dto/investment.request.dto";
import { InvestmentView } from "../entities/investment.view.entity";
import { DocType } from "../enum/document.type";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { ProgrammeDocument } from "../entities/programme.document";
import { NDCAction } from "../entities/ndc.action.entity";
import { NDCActionType } from "../enum/ndc.action.enum";
import { DocumentStatus } from "../enum/document.status";
import { ObjectionLetterGen } from "../util/objection.letter.gen";
import { ProgrammeDocumentViewEntity } from "../entities/document.view.entity";
import { SectoralScope } from "@undp/serial-number-gen";
import { Sector } from "../enum/sector.enum";
import { sectoralScopesMapped } from "../sectoralSecor.mapped";
import { NDCStatus } from "../enum/ndc.status";
import { NDCActionViewEntity } from "../entities/ndc.view.entity";
import { DocumentAction } from "../dto/document.action";
import { InvestmentApprove } from "../dto/investment.approve";
import { InvestmentReject } from "../dto/investment.reject";
import { InvestmentCancel } from "../dto/investment.cancel";
import { NdcFinancing } from "../dto/ndc.financing";
import { PRECISION } from "@undp/carbon-credit-calculator/dist/esm/calculator";

export declare function PrimaryGeneratedColumn(
  options: PrimaryGeneratedColumnType
): Function;

@Injectable()
export class ProgrammeService {
  private userNameCache: any = {};

  constructor(
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
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    @InjectRepository(ProgrammeQueryEntity)
    private programmeViewRepo: Repository<ProgrammeQueryEntity>,
    @InjectRepository(ProgrammeTransferViewEntityQuery)
    private programmeTransferViewRepo: Repository<ProgrammeTransferViewEntityQuery>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(ProgrammeTransfer)
    private programmeTransferRepo: Repository<ProgrammeTransfer>,
    @InjectRepository(ConstantEntity)
    private constantRepo: Repository<ConstantEntity>,
    private logger: Logger,
    private asyncOperationsInterface: AsyncOperationsInterface,
    @InjectRepository(Investment)
    private investmentRepo: Repository<Investment>,
    @InjectRepository(InvestmentView)
    private investmentViewRepo: Repository<InvestmentView>,
    @InjectEntityManager() private entityManager: EntityManager,
    private fileHandler: FileHandlerInterface,
    @InjectRepository(ProgrammeDocument)
    private documentRepo: Repository<ProgrammeDocument>,
    @InjectRepository(ProgrammeDocumentViewEntity)
    private documentViewRepo: Repository<ProgrammeDocumentViewEntity>,
    @InjectRepository(NDCAction) private ndcActionRepo: Repository<NDCAction>,
    @InjectRepository(NDCActionViewEntity)
    private ndcActionViewRepo: Repository<NDCActionViewEntity>,
  ) {}

  private toProgramme(programmeDto: ProgrammeDto): Programme {
    const data = instanceToPlain(programmeDto);
    this.logger.verbose("Converted programme", JSON.stringify(data));
    return plainToClass(Programme, data);
  }

  private async doInvestment(
    transfer: Investment,
    user: string,
    programme: Programme,
    investor: Company
  ) {
   
    const companyIndex = programme.companyId.map(e => Number(e)).indexOf(Number(transfer.fromCompanyId));
    const toCompanyIndex = programme.companyId.map(e => Number(e)).indexOf(Number(transfer.toCompanyId));

    // Cannot be <= 0 
    if (toCompanyIndex < 0) {
      programme.creditOwnerPercentage[companyIndex] -= transfer.percentage
      programme.creditOwnerPercentage.push(transfer.percentage);

      programme.proponentPercentage[companyIndex] -= transfer.percentage
      programme.proponentPercentage.push(transfer.percentage);

      programme.companyId.push(Number(transfer.toCompanyId));
      programme.proponentTaxVatId.push(investor.taxId);
    } else {
      programme.proponentPercentage[toCompanyIndex] += transfer.percentage
      programme.creditOwnerPercentage[toCompanyIndex] += transfer.percentage
      programme.creditOwnerPercentage[companyIndex] -= transfer.percentage
      programme.proponentPercentage[companyIndex] -= transfer.percentage
    }

    let ownerTaxId;
    if (programme.proponentTaxVatId.length > companyIndex) {
      ownerTaxId = programme.proponentTaxVatId[companyIndex];
    }

    const resp = await this.programmeLedger.updateOwnership(programme.externalId, programme.companyId, programme.proponentTaxVatId, programme.proponentPercentage, transfer.toCompanyId, transfer.fromCompanyId, transfer.shareFromOwner);

    const savedProgramme = await this.entityManager
      .transaction(async (em) => {
        return await em.update(
          Investment,
          {
            requestId: transfer.requestId
          }, {
            status: InvestmentStatus.APPROVED,
            txTime: new Date().getTime()
          }
        )
      })
      .catch((err: any) => {
        console.log(err);
        if (err instanceof QueryFailedError) {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        } else {
          this.logger.error(`Programme add error ${err}`);
        }
        return err;
      });

    if (savedProgramme.affected > 0) {
      return new DataResponseDto(HttpStatus.OK, resp);
    }

    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "programme.internalErrorStatusUpdating",
        []
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
  
  async addInvestment(req: InvestmentRequestDto, requester: User) {
    this.logger.log(
      `Programme investment request by ${requester.companyId}-${
        requester.id
      } received ${JSON.stringify(req)}`
    );

    if (
      req.percentage &&
      req.percentage.reduce((a, b) => a + b, 0) <= 0
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.percentage>0",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (req.fromCompanyIds.length > 1) {
      if (!req.percentage) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.percentagesNeedsToDefineForMultipleComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      } else if (req.fromCompanyIds.length != req.percentage.length) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidCompPercentageForGivenComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    if (
      req.fromCompanyIds &&
      req.percentage &&
      req.fromCompanyIds.length != req.percentage.length
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidCompPercentageForGivenComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const indexTo = req.fromCompanyIds.indexOf(req.toCompanyId);
    if (indexTo >= 0 && req.percentage[indexTo] > 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.cantTransferCreditWithinSameComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.findById(req.programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    this.logger.verbose(`Investment on programme ${JSON.stringify(programme)}`);

    if (
      requester.companyRole != CompanyRole.GOVERNMENT &&
      ![...req.fromCompanyIds, req.toCompanyId].includes(requester.companyId)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.cantInitiateTransferForOtherComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!req.fromCompanyIds) {
      req.fromCompanyIds = programme.companyId;
    }
    if (!programme.creditOwnerPercentage) {
      programme.creditOwnerPercentage = [100];
    }

    if (!programme.proponentPercentage) {
      programme.proponentPercentage = [100];
    }

    const requestedCompany = await this.companyService.findByCompanyId(
      requester.companyId
    );

    const allInvestmentList: Investment[] = [];
    const autoApproveInvestmentList: Investment[] = [];

    const hostAddress = this.configService.get("host");

    const ownershipMap = {};
    const propPerMap = {}

    for (const i in programme.companyId) {
      ownershipMap[programme.companyId[i]] = programme.creditOwnerPercentage[i];
      propPerMap[programme.companyId[i]] = programme.proponentPercentage[i];
    }

    // for(const i in req.fromCompanyIds) {
    //   if (ownershipMap[req.fromCompanyIds[i]] - req.percentage[i] < 0) {

    //   }
    // }

    programme.companyId = programme.companyId.map(c => Number(c))
    const fromCompanyListMap = {};

    const percSum = req.percentage.reduce((a, b) => a + b, 0)
    for (const j in req.fromCompanyIds) {
      const fromCompanyId = req.fromCompanyIds[j];
      this.logger.log(
        `Transfer request from ${fromCompanyId} to programme owned by ${programme.companyId}`
      );
      const fromCompany = await this.companyService.findByCompanyId(
        fromCompanyId
      );
      fromCompanyListMap[fromCompanyId] = fromCompany;

      if (programme.companyId.indexOf(fromCompanyId) < 0) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.fromCompInReqIsNotOwnerOfProgramme",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (req.percentage[j] <= 0 ) {
        continue;
      }

      if (!ownershipMap[fromCompanyId] ||  ownershipMap[fromCompanyId] < req.percentage[j] || !propPerMap[fromCompanyId] || propPerMap[fromCompanyId] < req.percentage) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidCompPercentageForGivenComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      const investment = plainToClass(Investment, req);
      investment.programmeId = req.programmeId;
      investment.fromCompanyId = fromCompanyId;
      investment.toCompanyId = req.toCompanyId;
      investment.initiator = requester.id;
      investment.initiatorCompanyId = requester.companyId;
      investment.txTime = new Date().getTime();
      investment.createdTime = investment.txTime;
      investment.percentage = req.percentage[j];
      investment.shareFromOwner = parseFloat((investment.percentage * 100 / propPerMap[fromCompanyId]).toFixed(6))
      investment.amount = Math.round(req.amount * req.percentage[j]/percSum)
      investment.status = InvestmentStatus.PENDING;
      if (requester.companyId == fromCompanyId) {
        autoApproveInvestmentList.push(investment);
      }
      allInvestmentList.push(investment);
    }
    const results = await this.investmentRepo.insert(allInvestmentList);
    console.log(results);
    for (const i in allInvestmentList) {
      allInvestmentList[i].requestId = results.identifiers[i].requestId;
    }

    let updateProgramme = undefined;
    for (const trf of autoApproveInvestmentList) {
      this.logger.log(`Investment send received ${trf}`);
      const toCompany = await this.companyService.findByCompanyId(
        trf.toCompanyId
      );
      console.log("To Company", toCompany);
      updateProgramme = (
        await this.doInvestment(
          trf,
          `${this.getUserRef(requester)}#${toCompany.companyId}#${
            toCompany.name
          }#${fromCompanyListMap[trf.fromCompanyId].companyId}#${
            fromCompanyListMap[trf.fromCompanyId].name
          }`,
          programme,
          toCompany
        )
      ).data;
    }
    if (updateProgramme) {
      return new DataResponseDto(HttpStatus.OK, updateProgramme);
    }

    return new DataListResponseDto(allInvestmentList, allInvestmentList.length);
  }

  private async getCreditRequest(
    ndcActionDto: NDCActionDto,
    programme: Programme,
    constants: ConstantEntity
  ) {
    switch (ndcActionDto.typeOfMitigation) {
      case TypeOfMitigation.AGRICULTURE:
        const ar = new AgricultureCreationRequest();
        ar.duration = programme.endTime - programme.startTime;
        ar.durationUnit = "s";
        ar.landArea = ndcActionDto.agricultureProperties.landArea;
        ar.landAreaUnit = ndcActionDto.agricultureProperties.landAreaUnit;
        if (constants) {
          ar.agricultureConstants = constants.data as AgricultureConstants;
        }
        return ar;
      case TypeOfMitigation.SOLAR:
        const sr = new SolarCreationRequest();
        sr.buildingType = ndcActionDto.solarProperties.consumerGroup;
        sr.energyGeneration = ndcActionDto.solarProperties.energyGeneration;
        sr.energyGenerationUnit =
          ndcActionDto.solarProperties.energyGenerationUnit;
        if (constants) {
          sr.solarConstants = constants.data as SolarConstants;
        }
        return sr;
    }
    return null;
  }

  async uploadDocument(type: DocType, id: string, data: string) {
    let filetype = type == DocType.METHODOLOGY_DOCUMENT ? "xlsx" : "pdf";
    if(type === DocType.MONITORING_REPORT){
      //determine filetype of base64 data
      try {
        filetype = data.split(';')[0].split('/')[1];
        if(filetype === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet'){
          filetype = 'xlsx'
        }else if(filetype === 'vnd.ms-excel'){
          filetype = 'xls'
        }
        data = data.split(',')[1];
      }
      catch(Exception:any){
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidDocumentUpload",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
    const response: any = await this.fileHandler.uploadFile(
      `documents/${this.helperService.enumToString(DocType, type)}${
        id ? "_" + id : ""
      }.${filetype}`,
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

  private async createNDCActionId(ndcAction: NDCActionDto, programmeId: string) {
    const id = await this.counterService.incrementCount(
      CounterType.NDC_ACTION,
      3
    );

    const type =
      ndcAction.action == NDCActionType.Mitigation
        ? "M"
        : ndcAction.action == NDCActionType.Adaptation
        ? "A"
        : ndcAction.action == NDCActionType.Enablement
        ? "E"
        : "C";
    return `${programmeId}-${type}-${id}`;
  }

  async calcCreditNDCAction(ndcAction: NDCAction, program: Programme) {

    if ((ndcAction.action === NDCActionType.Mitigation || ndcAction.action === NDCActionType.CrossCutting) && ndcAction.typeOfMitigation) {
      let constants = await this.getLatestConstant(ndcAction.typeOfMitigation);
      const req = await this.getCreditRequest(ndcAction, program, constants);
      if (req) {
        try {
          
          if (!ndcAction.ndcFinancing) {
            ndcAction.ndcFinancing = new NdcFinancing();
          }
          try {
            const crdts = await calculateCredit(req);
            ndcAction.ndcFinancing.systemEstimatedCredits = crdts;
          } catch (err) {
            this.logger.log(`Credit calculate failed ${err.message}`);
            ndcAction.ndcFinancing.systemEstimatedCredits = 0;
            // throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
          }
      
          ndcAction.constantVersion = constants
            ? String(constants.version)
            : "default";
        } catch(e) {
          throw new HttpException(e, HttpStatus.BAD_REQUEST)
        }
      }
    }
    
    return ndcAction;
  }

  async checkTotalUserEstimatedCredits(
    ndcAction: NDCAction,
    program: Programme
  ) {
    const ndcActions = await this.ndcActionRepo.find({
      where: {
        programmeId: program.programmeId,
      },
    });

    let totalUserEstimatedCredits: number = ndcAction.ndcFinancing
      ? ndcAction.ndcFinancing.userEstimatedCredits
      : 0;

    ndcActions.forEach((ndcAction: NDCAction) => {
      if (
        ndcAction.ndcFinancing &&
        ndcAction.ndcFinancing.userEstimatedCredits
      ) {
        totalUserEstimatedCredits +=
          ndcAction.ndcFinancing.userEstimatedCredits;
      }
    });

    if (totalUserEstimatedCredits > program.creditEst) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.totalUserEstimateCreditsInvalidMsg",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
  }


  async calcAddNDCFields(ndcAction: NDCAction, programme: Programme) {
    ndcAction.programmeId = programme.programmeId;
    ndcAction.externalId = programme.externalId;
    ndcAction.txTime = new Date().getTime();
    ndcAction.createdTime = ndcAction.txTime;
    ndcAction.sector = programme.sector;
    ndcAction.status = NDCStatus.PENDING;
  }

  private getExpectedDoc(type: DocType) {
    if (type == DocType.METHODOLOGY_DOCUMENT) {
      return DocType.DESIGN_DOCUMENT;
    }
    if (type == DocType.MONITORING_REPORT) {
      return DocType.METHODOLOGY_DOCUMENT;
    }
    if (type == DocType.VERIFICATION_REPORT) {
      return DocType.MONITORING_REPORT;
    }
  }

  async approveDocumentPre(d: ProgrammeDocument, pr: Programme, certifierId: number, ndc: NDCAction) {
    if (d.type == DocType.METHODOLOGY_DOCUMENT) {
    } else {
      if (d.type == DocType.VERIFICATION_REPORT) {
        if (ndc) {
          ndc.status = NDCStatus.APPROVED;
        }
      }

      await this.queueDocument(AsyncActionType.DocumentUpload, {
        type: this.helperService.enumToString(DocType, d.type),
        data: d.url,
        externalId: d.externalId,
        actionId: d.actionId
      }, d.type, certifierId, pr);
    }
    return ndc;
  }

  async approveDocumentCommit(em: EntityManager, d: ProgrammeDocument, ndc: NDCAction, certifierId: number, program: Programme) {
    
    console.log('NDC COmmit', ndc)
    if (ndc) {
      await em.update(
        NDCAction,
        {
          id: ndc.id,
        },
        {
          status: ndc.status,
        }
      );
    }
    
    if (certifierId && program) {
      await this.programmeLedger.updateCertifier(program.programmeId, certifierId, true, "TODO", d.type == DocType.METHODOLOGY_DOCUMENT ? ProgrammeStage.APPROVED : undefined);
    } else if(program && d.type == DocType.METHODOLOGY_DOCUMENT) {
      await this.programmeLedger.updateProgrammeStatus(program.programmeId, ProgrammeStage.APPROVED, ProgrammeStage.AWAITING_AUTHORIZATION, "TODO");
    }
  }

  async docAction(documentAction: DocumentAction, user: User) {
    const d = await this.documentRepo.findOne({
      where: {
        id: documentAction.id,
      },
    });
    if (!d) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.documentNotExist",
          []
          ),
          HttpStatus.BAD_REQUEST
          );
        }
    const pr = await this.findById(d.programmeId);

    if (d.status == DocumentStatus.ACCEPTED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.documentAlreadyAccepted",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    let ndc: NDCAction;

    let program;
    let cid;
    if(d.remark){
      const documentCreatedUser = await this.userService.findById(Number(d.remark));
      if(documentCreatedUser){
        cid = (documentCreatedUser.companyRole === CompanyRole.CERTIFIER ? Number(documentCreatedUser.companyId): undefined);
      }
    }

    if (documentAction.status == DocumentStatus.ACCEPTED) {
      if (d.actionId) {
        ndc = await this.ndcActionRepo.findOne({
          where: {
            id: d.actionId,
          },
        });
      }
      program = await this.findById(d.programmeId);
      ndc = await this.approveDocumentPre(d, pr, cid, ndc);
    }

    const resp = await this.entityManager.transaction(async (em) => {
      if (documentAction.status === DocumentStatus.ACCEPTED) {
         await this.approveDocumentCommit(em, d, ndc, cid, program);
      }
      return await em.update(
        ProgrammeDocument,
        {
          id: documentAction.id,
        },
        {
          status: documentAction.status,
          remark: documentAction.remark,
        }
      );
      
    });

    return new BasicResponseDto(
      HttpStatus.OK,
      this.helperService.formatReqMessagesString(
        "programme.actionSuccessful",
        []
      )
    );
  }

  async addDocument(documentDto: ProgrammeDocumentDto, user: User) {
    const programme = await this.findById(documentDto.programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    let permissionForMinistryLevel = false;

    const expected = this.getExpectedDoc(documentDto.type);
    if (expected) {
      let whr = {
        programmeId: documentDto.programmeId,
        status: DocumentStatus.ACCEPTED,
        type: expected,
      };
      if (documentDto.actionId && documentDto.type === DocType.VERIFICATION_REPORT) {
        whr["actionId"] = documentDto.actionId;
      }
      const approvedDesign = await this.documentRepo.findOne({
        where: whr,
      });

      console.log('Where', whr)

      if (!approvedDesign) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidDocumentUpload",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    let whr = {
      programmeId: documentDto.programmeId,
      type: documentDto.type,
    };
    if (documentDto.actionId) {
      whr["actionId"] = documentDto.actionId;
    }
    const currentDoc = await this.documentRepo.findOne({
      where: whr,
    });

    const url = await this.uploadDocument(
      documentDto.type,
      programme.programmeId + (documentDto.actionId ? ('_' + documentDto.actionId) : ''),
      documentDto.data
    );
    const dr = new ProgrammeDocument();
    dr.programmeId = programme.programmeId;
    dr.externalId = programme.externalId;
    dr.status = DocumentStatus.PENDING;
    dr.type = documentDto.type;
    dr.actionId = documentDto.actionId;
    dr.txTime = new Date().getTime();
    dr.url = url;
    dr.remark = user.id.toString();

    let ndc: NDCAction;
    if (user.companyRole === CompanyRole.GOVERNMENT || 
       (documentDto.type !== DocType.VERIFICATION_REPORT &&  
        permissionForMinistryLevel)) {
      this.logger.log(
        `Approving document since the user is ${user.companyRole}`
      );
      dr.status = DocumentStatus.ACCEPTED;
      if (dr.actionId) {
        ndc = await this.ndcActionRepo.findOne({
          where: {
            id: dr.actionId,
          },
        });
      }
      ndc = await this.approveDocumentPre(dr, programme, undefined, ndc);
    }

    let resp = await this.entityManager.transaction(async (em) => {
      if (dr.status === DocumentStatus.ACCEPTED) {
        await this.approveDocumentCommit(em, dr, ndc, undefined, programme);
      }
      if (!currentDoc) {
        return await em.save(dr);
      } else {
        return await em.update(ProgrammeDocument, whr, {
          status: dr.status,
          txTime: dr.txTime,
          url: dr.url,
          remark: dr.remark
        });
      }
    });
    return new DataResponseDto(HttpStatus.OK, resp);
  }

  async queueDocument(action: AsyncActionType, req: any, docType: DocType, certifierId: number, programme: Programme) {

    // if (certifierId) {
    //   const comp = await this.companyService.findByCompanyId(certifierId);
    //   if (comp) {
    //     req['certifierTaxId'] = comp.taxId;
    //   }
    // }

    if (action === AsyncActionType.DocumentUpload && docType === DocType.DESIGN_DOCUMENT) {
      const orgNames = await this.companyService.queryNames({
        size: 10,
        page: 1,
        filterAnd: [{
          key: 'companyId',
          operation: 'IN',
          value: programme.companyId
        }],
        filterOr: undefined,
        sort: undefined
      }, undefined) ;

      console.log('Company names', orgNames)
      const url = await this.letterGen.generateReport(orgNames.data.map(e => e['name']), programme.title, programme.programmeId)

      const dr = new ProgrammeDocument();
      dr.programmeId = programme.programmeId;
      dr.externalId = programme.externalId;
      dr.status = DocumentStatus.ACCEPTED;
      dr.type = DocType.NO_OBJECTION_LETTER;
      dr.txTime = new Date().getTime();
      dr.url = url;
      await this.documentRepo.save(dr);

      // await this.asyncOperationsInterface.addAction({
      //   actionType: AsyncActionType.DocumentUpload,
      //   actionProps: {
      //     type: this.helperService.enumToString(DocType, dr.type),
      //     data: dr.url,
      //     externalId: dr.externalId
      //   },
      // });
    }

    // await this.asyncOperationsInterface.addAction({
    //   actionType: action,
    //   actionProps: req,
    // });
  }

  async create(programmeDto: ProgrammeDto, user: User): Promise<Programme | undefined> {
    this.logger.verbose("ProgrammeDTO received", programmeDto);
    const programme: Programme = this.toProgramme(programmeDto);
    this.logger.verbose("Programme create", programme);

    if (
      programmeDto.proponentTaxVatId.length > 1 &&
      (!programmeDto.proponentPercentage ||
        programmeDto.proponentPercentage.length !=
          programmeDto.proponentTaxVatId.length)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.proponentPercMustDefinedForEvryProponentTaxId",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentPercentage &&
      programmeDto.proponentTaxVatId.length !=
        programmeDto.proponentPercentage.length
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.proponentPercAndTaxIdsNotMatched",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentPercentage &&
      programmeDto.proponentPercentage.reduce((a, b) => a + b, 0) != 100
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.proponentPercSum=100",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentTaxVatId.length !==
      new Set(programmeDto.proponentTaxVatId).size
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.duplicatedProponentTaxIds",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const pr = await this.findByExternalId(programmeDto.externalId);
    if (pr) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeExistsWithSameExetrnalId",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const programmeSector = programmeDto.sector;
    const programmeSectoralScopeValue = programmeDto.sectoralScope;
    const programmeSectoralScopeKey = Object.keys(SectoralScope).find(
      (key) => SectoralScope[key] === programmeSectoralScopeValue
    );
    if (
      programmeSector !== String(Sector.Health) &&
    programmeSector !== String(Sector.Education) &&
      programmeSector !== String(Sector.Hospitality)
    ) {
      if (
        !sectoralScopesMapped[programmeSector].includes(
          programmeSectoralScopeKey
        )
      ) {
        throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.wrongSectorAndScopeMapping",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
      }
    }

    const companyIds = [];
    const companyNames = [];
    for (const taxId of programmeDto.proponentTaxVatId) {
      const projectCompany = await this.companyService.findByTaxId(taxId);
      if (!projectCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.proponentTaxIdNotInSystem",
            [taxId]
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (projectCompany.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.proponentIsNotAProgrammeDev",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      companyIds.push(projectCompany.companyId);
      companyNames.push(projectCompany.name);
    }

    programme.programmeId = await this.counterService.incrementCount(
      CounterType.PROGRAMME,
      3
    );
    programme.countryCodeA2 = this.configService.get("systemCountry");

    
    programme.programmeProperties.carbonPriceUSDPerTon = parseFloat((programme.programmeProperties.estimatedProgrammeCostUSD / programme.creditEst).toFixed(PRECISION))
    programme.programmeProperties.creditYear = new Date(
      programme.startTime * 1000
    ).getFullYear();
    // programme.constantVersion = constants
    //   ? String(constants.version)
    //   : "default";
    programme.currentStage = ProgrammeStage.AWAITING_AUTHORIZATION;
    programme.companyId = companyIds;
    programme.txTime = new Date().getTime();
    if (programme.proponentPercentage) {
      programme.creditOwnerPercentage = programme.proponentPercentage;
    }
    programme.createdTime = programme.txTime;
    if (!programme.creditUnit) {
      programme.creditUnit = this.configService.get("defaultCreditUnit");
    }
    programme.emissionReductionExpected = programme.creditEst;

    let orgNamesList = "";
    if (companyNames.length > 1) {
      const lastItem = companyNames.pop();
      orgNamesList = companyNames.join(",") + " and " + lastItem;
    } else {
      orgNamesList = companyNames[0];
    }

    if (programme.companyId.length === 1 && !programme.proponentPercentage) {
      programme.proponentPercentage = [100];
      programme.creditOwnerPercentage = [100];
    }

    if (programmeDto.designDocument) {
      programmeDto.designDocument = await this.uploadDocument(
        DocType.DESIGN_DOCUMENT,
        programme.programmeId,
        programmeDto.designDocument
      );
    }

    let ndcAc: NDCAction = undefined;
    if (programmeDto.ndcAction) {
      const data = instanceToPlain(programmeDto.ndcAction);
      ndcAc = plainToClass(NDCAction, data);
      ndcAc.id = await this.createNDCActionId(programmeDto.ndcAction, programme.programmeId);
      ndcAc.coBenefitsProperties = programmeDto.ndcAction.coBenefitsProperties;
      await this.calcCreditNDCAction(ndcAc, programme);
      this.calcAddNDCFields(ndcAc, programme);

      programmeDto.ndcAction.id = ndcAc.id;
      programmeDto.ndcAction.programmeId = programme.programmeId;
      programmeDto.ndcAction.externalId = programme.externalId;
      programmeDto.ndcAction.ndcFinancing = ndcAc.ndcFinancing;
      programmeDto.ndcAction.constantVersion = ndcAc.constantVersion;
    }

    let dr;
    if (programmeDto.designDocument) {
      dr = new ProgrammeDocument();
      dr.programmeId = programme.programmeId;
      dr.externalId = programme.externalId;
      dr.status = DocumentStatus.PENDING;
      dr.type = DocType.DESIGN_DOCUMENT;
      dr.txTime = new Date().getTime();
      dr.url = programmeDto.designDocument;
    }

    let monitoringReport;

    if (ndcAc && programmeDto.ndcAction.monitoringReport) {
      monitoringReport = new ProgrammeDocument();
      monitoringReport.programmeId = programme.programmeId;
      monitoringReport.externalId = programme.externalId;
      monitoringReport.actionId = ndcAc.id;
      monitoringReport.status = DocumentStatus.PENDING;
      monitoringReport.type = DocType.MONITORING_REPORT;
      monitoringReport.txTime = new Date().getTime();
      monitoringReport.url = await this.uploadDocument(
        DocType.MONITORING_REPORT,
        programme.programmeId + '_' + ndcAc.id,
        programmeDto.ndcAction.monitoringReport
      );
    }

    if (
      [CompanyRole.CERTIFIER, CompanyRole.GOVERNMENT].includes(user.companyRole)
    ) {
      const certifierId =
        user.companyRole === CompanyRole.CERTIFIER
          ? Number(user.companyId)
          : undefined;
      if (dr) {
        this.logger.log(
          `Approving design document since the user is ${user.companyRole}`
        );
        dr.status = DocumentStatus.ACCEPTED;
        await this.queueDocument(
          AsyncActionType.DocumentUpload,
          {
          type: this.helperService.enumToString(DocType, dr.type),
          data: dr.url,
          externalId: dr.externalId,
            actionId: dr.actionId,
          },
          dr.type,
          certifierId,
          programme
        );

        if (certifierId) {
          programme.certifierId = [certifierId];
        }
      }
      if (monitoringReport) {
        this.logger.log(`Approving monitoring report since the user is ${user.companyRole}`)
        monitoringReport.status = DocumentStatus.ACCEPTED;

        if (certifierId) {
          programme.certifierId = [certifierId]
        }

        await this.queueDocument(AsyncActionType.DocumentUpload, {
          type: this.helperService.enumToString(DocType, monitoringReport.type),
          data: monitoringReport.url,
          externalId: monitoringReport.externalId,
          actionId: monitoringReport.actionId
        }, monitoringReport.type, user.companyRole === CompanyRole.CERTIFIER ? Number(user.companyId): undefined, programme);
      }
    }

    // TODO: Make this transaction
    await this.entityManager
      .transaction(async (em) => {
        if (ndcAc) {
          await em.save<NDCAction>(ndcAc);
          if (monitoringReport) {
            await em.save<ProgrammeDocument>(monitoringReport);
          }
        }
        if (dr) {
          await em.save<ProgrammeDocument>(dr);
        }
      })
      .catch((err: any) => {
        console.log(err);
        if (err instanceof QueryFailedError) {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        } else {
          this.logger.error(`Programme add error ${err}`);
        }
        return err;
      });

    const savedProgramme = await this.programmeLedger.createProgramme(
      programme
    );

    if (savedProgramme) {
      const hostAddress = this.configService.get("host");
      await this.emailHelperService.sendEmailToGovernmentAdmins(
        EmailTemplates.PROGRAMME_CREATE,
        {
          organisationName: orgNamesList,
          programmePageLink:
            hostAddress +
            `/programmeManagement/view?id=${programme.programmeId}`,
        }
      );
    }

    return savedProgramme;
  }

  async addNDCAction(ndcActionDto: NDCActionDto, user: User): Promise<DataResponseDto> {
    console.log('testing ndcActionDto',ndcActionDto);
    if (!ndcActionDto.programmeId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
          ),
          HttpStatus.BAD_REQUEST
          );
        }
        
        const program = await this.findById(ndcActionDto.programmeId);
        if (!program) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.programmeNotExist",
              []
              ),
              HttpStatus.BAD_REQUEST
      );
    }
    
    const data = instanceToPlain(ndcActionDto);
    const ndcAction: NDCAction = plainToClass(NDCAction, data);
    const programmeId = ndcAction.programmeId;
    const programmeDetails = await this.findById(programmeId);
    const programmeSectorFromDetails = programmeDetails?.sector;
    if(ndcAction.action === NDCActionType.Mitigation) {
      if(!sectorMitigationTypesListMapped[programmeSectorFromDetails].includes(ndcAction.typeOfMitigation)) {
        throw new HttpException(
            this.helperService.formatReqMessagesString(
              "programme.wrongMItigationSectorMapping",
              []
              ),
              HttpStatus.BAD_REQUEST
      );
      }
    }
    ndcAction.id = await this.createNDCActionId(
      ndcActionDto,
      program.programmeId
    );

    if (
      ndcActionDto.coBenefitsProperties &&
      (ndcActionDto.coBenefitsProperties as any).assessmentDetails
    ) {
      const document = (ndcActionDto.coBenefitsProperties as any)
        .assessmentDetails.document;
      if (document) {
        const filetype = "pdf";
        const response: any = await this.fileHandler.uploadFile(
          `documents/FEASIBILITY_REPORT${"_" + ndcAction.id}.${filetype}`,
          document
        );
        (ndcActionDto.coBenefitsProperties as any).assessmentDetails.document =
          response;
      }
    }

    ndcAction.coBenefitsProperties = ndcActionDto.coBenefitsProperties;
    await this.checkTotalUserEstimatedCredits(ndcAction, program);
    await this.calcCreditNDCAction(ndcAction, program);
    console.log("testing ndcAction", ndcAction);
    this.calcAddNDCFields(ndcAction, program);

    if (ndcAction.action == NDCActionType.Enablement && ndcAction.enablementProperties.report) {
      const filetype = "pdf";
      const response: any = await this.fileHandler.uploadFile( `documents/ENABLEMENT_REPORT${ "_" + ndcAction.id}.${filetype}`, ndcAction.enablementProperties.report);
      ndcAction.enablementProperties.report = response
    }


    let dr;
    let programmeUpdate = undefined;
    if (ndcActionDto.monitoringReport) {
      dr = new ProgrammeDocument();
      dr.programmeId = program.programmeId;
      dr.externalId = program.externalId;
      dr.actionId = ndcAction.id;
      dr.status = DocumentStatus.PENDING;
      dr.type = DocType.MONITORING_REPORT;
      dr.txTime = new Date().getTime();
      dr.url = await this.uploadDocument(
        DocType.MONITORING_REPORT,
        program.programmeId,
        ndcActionDto.monitoringReport
      );

      if ([CompanyRole.CERTIFIER, CompanyRole.GOVERNMENT].includes(user.companyRole) && dr) {
        this.logger.log(`Approving document since the user is ${user.companyRole}`)
        dr.status = DocumentStatus.ACCEPTED;

        const certifierId = (user.companyRole === CompanyRole.CERTIFIER ? Number(user.companyId): undefined);
        if (certifierId) {
          await this.programmeLedger.updateCertifier(program.programmeId, certifierId, true, user.name)
        }
      }
    }
    const saved = await this.entityManager
      .transaction(async (em) => {
        const n = await em.save<NDCAction>(ndcAction);
        if (dr) {
          await em.save<ProgrammeDocument>(dr);
        }
        return n;
      })
      .catch((err: any) => {
        console.log(err);
        if (err instanceof QueryFailedError) {
          throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        } else {
          this.logger.error(`NDC Action add error ${err}`);
        }
        return err;
      });
    return new DataResponseDto(HttpStatus.OK, saved);
  }

  async queryNdcActions(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    let queryBuilder = await this.ndcActionViewRepo
      .createQueryBuilder("ndcaction")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "ndcaction",
            abilityCondition
          ),
          "ndcaction"
        )
      );

    const resp = await  queryBuilder.orderBy(
        query?.sort?.key &&
          `"ndcaction".${this.helperService.generateSortCol(query?.sort?.key)}`,
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

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async queryDocuments(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    let resp = await this.documentViewRepo
      .createQueryBuilder("programmedocument")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "programmedocument",
            abilityCondition
          ),
          "programmedocument"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"programmedocument".${this.helperService.generateSortCol(
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

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async findById(id: any): Promise<Programme | undefined> {
    return await this.programmeRepo.findOneBy({
      programmeId: id,
    });
  }

  async transferReject(req: ProgrammeTransferReject, approver: User) {
    this.logger.log(
      `Programme reject ${JSON.stringify(req)} ${approver.companyId}`
    );

    const pTransfer = await this.programmeTransferRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!pTransfer) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.transferReqNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (pTransfer.status == TransferStatus.CANCELLED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejAlreadyCancelled",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !pTransfer.isRetirement &&
      pTransfer.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForTransferReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
    if (pTransfer.isRetirement && pTransfer.toCompanyId != approver.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForRetirementReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    const result = await this.programmeTransferRepo
      .update(
        {
          requestId: req.requestId,
          status: TransferStatus.PENDING,
        },
        {
          status: pTransfer.isRetirement
            ? TransferStatus.NOTRECOGNISED
            : TransferStatus.REJECTED,
          txTime: new Date().getTime(),
          txRef: `${req.comment}#${approver.companyId}#${approver.id}`,
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });

    const initiatorCompanyDetails = await this.companyService.findByCompanyId(
      pTransfer.initiatorCompanyId
    );

    if (result.affected > 0) {
      if (pTransfer.isRetirement) {
        const countryName = await this.countryService.getCountryName(
          pTransfer.toCompanyMeta.country
        );
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          pTransfer.fromCompanyId,
          EmailTemplates.CREDIT_RETIREMENT_NOT_RECOGNITION,
          {
            credits: pTransfer.creditAmount,
            country: countryName,
          },
          0,
          pTransfer.programmeId
        );
      } else if (
        initiatorCompanyDetails.companyRole === CompanyRole.GOVERNMENT
      ) {
        await this.emailHelperService.sendEmailToGovernmentAdmins(
          EmailTemplates.CREDIT_TRANSFER_GOV_REJECTED,
          { credits: pTransfer.creditAmount },
          pTransfer.programmeId,
          pTransfer.fromCompanyId
        );
      } else {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          pTransfer.initiatorCompanyId,
          EmailTemplates.CREDIT_TRANSFER_REJECTED,
          { credits: pTransfer.creditAmount },
          pTransfer.fromCompanyId,
          pTransfer.programmeId
        );
      }
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.transferReqRejectSuccess",
          []
        )
      );
    }

    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "programme.noPendReqFound",
        []
      ),
      HttpStatus.BAD_REQUEST
    );
  }

  async getTransferByProgrammeId(
    programmeId: string,
    abilityCondition: string,
    user: User
  ): Promise<any> {
    const query: QueryDto = {
      page: 1,
      size: 30,
      filterAnd: [
        {
          key: "programmeId",
          operation: "=",
          value: String(programmeId),
        },
      ],
      filterOr: undefined,
      sort: undefined,
    };

    const resp = await this.programmeTransferViewRepo
      .createQueryBuilder("programme_transfer")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "programme_transfer",
            abilityCondition
          )
        )
      )
      .orderBy(
        query?.sort?.key &&
          this.helperService.generateSortCol(query?.sort?.key),
        query?.sort?.order
      )
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getManyAndCount();

    if (resp && resp.length > 0) {
      for (const e of resp[0]) {
        console.log(e);
        e.certifier =
          e.certifier.length > 0 && e.certifier[0] === null ? [] : e.certifier;
        if (
          e.isRetirement &&
          e.retirementType == RetireType.CROSS_BORDER &&
          e.toCompanyMeta.country
        ) {
          e.toCompanyMeta["countryName"] =
            await this.countryService.getCountryName(e.toCompanyMeta.country);
        }

        let usrId = undefined;
        let userCompany = undefined;
        if (e["txRef"] != undefined && e["txRef"] != null) {
          const parts = e["txRef"]?.split("#");
          if (parts.length > 2) {
            usrId = parts[2];
            userCompany = parts[1];
          }
        } else {
          usrId = e["initiator"];
          userCompany = e["initiatorCompanyId"];
        }

        if (
          user.companyRole === CompanyRole.GOVERNMENT ||
          Number(userCompany) === Number(user.companyId)
        ) {
          e["userName"] = await this.getUserName(usrId);
        }
      }
    }
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async queryProgrammeTransfers(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<any> {
    const resp = await this.programmeTransferViewRepo
      .createQueryBuilder("programme_transfer")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "programme_transfer",
            abilityCondition
          )
        )
      )
      .orderBy(
        query?.sort?.key &&
          this.helperService.generateSortCol(query?.sort?.key),
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getManyAndCount();

    if (resp && resp.length > 0) {
      for (const e of resp[0]) {
        e.certifier =
          e.certifier.length > 0 && e.certifier[0] === null ? [] : e.certifier;

        if (e.toCompanyMeta && e.toCompanyMeta.country) {
          e.toCompanyMeta["countryName"] =
            await this.countryService.getCountryName(e.toCompanyMeta.country);
        }
      }
    }
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async transferApprove(req: ProgrammeTransferApprove, approver: User) {
    // TODO: Handle transaction, can happen
    console.log("Approver", approver);
    const transfer = await this.programmeTransferRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!transfer) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.transferReqNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (transfer.status == TransferStatus.CANCELLED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejAlreadyCancelled",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      transfer.status == TransferStatus.APPROVED ||
      transfer.status == TransferStatus.RECOGNISED
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.transferAlreadyApproved",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !transfer.isRetirement &&
      transfer.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForTransferReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }
    if (transfer.isRetirement && transfer.toCompanyId != approver.companyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForRetirementReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    const receiver = await this.companyService.findByCompanyId(
      transfer.toCompanyId
    );
    const giver = await this.companyService.findByCompanyId(
      transfer.fromCompanyId
    );

    if (receiver.state === CompanyState.SUSPENDED) {
      await this.companyService.companyTransferCancel(
        transfer.toCompanyId,
        `${transfer.comment}#${approver.companyId}#${approver.id}#${SystemActionType.SUSPEND_AUTO_CANCEL}#${receiver.name}`
      );
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.receiveCompanySuspended",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (giver.state === CompanyState.SUSPENDED) {
      await this.companyService.companyTransferCancel(
        transfer.fromCompanyId,
        `${transfer.comment}#${approver.companyId}#${approver.id}#${SystemActionType.SUSPEND_AUTO_CANCEL}#${receiver.name}`
      );
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.cerditSendingCompSuspended",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (transfer.status != TransferStatus.PROCESSING) {
      const trq = await this.programmeTransferRepo
        .update(
          {
            requestId: req.requestId,
            status: TransferStatus.PENDING,
          },
          {
            status: TransferStatus.PROCESSING,
            txTime: new Date().getTime(),
          }
        )
        .catch((err) => {
          this.logger.error(err);
          return err;
        });

      if (trq.affected <= 0) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.noPendingTransferReq",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const initiatorCompanyDetails = await this.companyService.findByCompanyId(
      transfer.initiatorCompanyId
    );

    const transferResult = await this.doTransfer(
      transfer,
      `${this.getUserRef(approver)}#${receiver.companyId}#${receiver.name}#${
        giver.companyId
      }#${giver.name}`,
      req.comment,
      transfer.isRetirement
    );

    if (transferResult.statusCode === 200) {
      if (transfer.isRetirement) {
        const countryName = await this.countryService.getCountryName(
          transfer.toCompanyMeta.country
        );
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.fromCompanyId,
          EmailTemplates.CREDIT_RETIREMENT_RECOGNITION,
          {
            credits: transfer.creditAmount,
            country: countryName,
          },
          0,
          transfer.programmeId
        );
      } else if (
        initiatorCompanyDetails.companyRole === CompanyRole.GOVERNMENT
      ) {
        await this.emailHelperService.sendEmailToGovernmentAdmins(
          EmailTemplates.CREDIT_TRANSFER_GOV_ACCEPTED_TO_INITIATOR,
          { credits: transfer.creditAmount },
          transfer.programmeId,
          approver.companyId
        );
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.toCompanyId,
          EmailTemplates.CREDIT_TRANSFER_GOV_ACCEPTED_TO_RECEIVER,
          {
            credits: transfer.creditAmount,
            government: initiatorCompanyDetails.name,
          },
          transfer.fromCompanyId,
          transfer.programmeId
        );
      } else {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.toCompanyId,
          EmailTemplates.CREDIT_TRANSFER_ACCEPTED,
          { credits: transfer.creditAmount },
          approver.companyId,
          transfer.programmeId
        );
      }
    }

    return transferResult;
  }

  private async doTransfer(
    transfer: ProgrammeTransfer,
    user: string,
    reason: string,
    isRetirement: boolean
  ) {
    const hostAddress = this.configService.get("host");
    const programme = await this.programmeLedger.transferProgramme(
      transfer,
      user,
      reason,
      isRetirement
    );

    this.logger.log("Programme updated");
    const result = await this.programmeTransferRepo
      .update(
        {
          requestId: transfer.requestId,
        },
        {
          status: transfer.isRetirement
            ? TransferStatus.RECOGNISED
            : TransferStatus.APPROVED,
          txTime: new Date().getTime(),
          authTime: new Date().getTime(),
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      const transfers = await this.programmeTransferRepo.find({
        where: {
          programmeId: programme.programmeId,
          status: TransferStatus.PENDING,
        },
      });

      for (let transfer of transfers) {
        const companyIndex = programme.companyId.indexOf(
          transfer.fromCompanyId
        );
        const companyProponent = programme.creditOwnerPercentage[companyIndex];
        const creditBalance =
          (programme.creditBalance * companyProponent) / 100;
        if (transfer.creditAmount > creditBalance) {
          const result = await this.programmeTransferRepo
            .update(
              {
                requestId: transfer.requestId,
              },
              {
                status: TransferStatus.CANCELLED,
                txTime: new Date().getTime(),
                authTime: new Date().getTime(),
                txRef: `#${SystemActionType.LOW_CREDIT_AUTO_CANCEL}#`,
              }
            )
            .catch((err) => {
              this.logger.error(err);
              return err;
            });

          if (result.affected === 0) {
            throw new HttpException(
              this.helperService.formatReqMessagesString(
                "programme.internalErrorStatusUpdating",
                []
              ),
              HttpStatus.INTERNAL_SERVER_ERROR
            );
          } else {
            if (transfer.isRetirement) {
              const countryName = await this.countryService.getCountryName(
                transfer.toCompanyMeta.country
              );

              await this.emailHelperService.sendEmailToOrganisationAdmins(
                transfer.fromCompanyId,
                EmailTemplates.CREDIT_RETIREMENT_CANCEL_SYS_TO_INITIATOR,
                {
                  credits: transfer.creditAmount,
                  serialNumber: programme.serialNo,
                  programmeName: programme.title,
                  country: countryName,
                  pageLink: hostAddress + "/creditTransfers/viewAll",
                }
              );

              await this.emailHelperService.sendEmailToGovernmentAdmins(
                EmailTemplates.CREDIT_RETIREMENT_CANCEL_SYS_TO_GOV,
                {
                  credits: transfer.creditAmount,
                  serialNumber: programme.serialNo,
                  programmeName: programme.title,
                  pageLink: hostAddress + "/creditTransfers/viewAll",
                  country: countryName,
                },
                "",
                transfer.initiatorCompanyId
              );
            } else {
              await this.emailHelperService.sendEmailToOrganisationAdmins(
                transfer.initiatorCompanyId,
                EmailTemplates.CREDIT_TRANSFER_CANCELLATION_SYS_TO_INITIATOR,
                {
                  credits: transfer.creditAmount,
                  serialNumber: programme.serialNo,
                  programmeName: programme.title,
                  pageLink: hostAddress + "/creditTransfers/viewAll",
                },
                transfer.toCompanyId
              );

              await this.emailHelperService.sendEmailToOrganisationAdmins(
                transfer.fromCompanyId,
                EmailTemplates.CREDIT_TRANSFER_CANCELLATION_SYS_TO_SENDER,
                {
                  credits: transfer.creditAmount,
                  serialNumber: programme.serialNo,
                  programmeName: programme.title,
                  pageLink: hostAddress + "/creditTransfers/viewAll",
                },
                transfer.toCompanyId,
                "",
                transfer.initiatorCompanyId
              );
            }
          }
        }
      }

      return new DataResponseDto(HttpStatus.OK, programme);
    }

    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "programme.internalErrorStatusUpdating",
        []
      ),
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async transferCancel(req: ProgrammeTransferCancel, requester: User) {
    this.logger.log(
      `Programme transfer cancel by ${requester.companyId}-${
        requester.id
      } received ${JSON.stringify(req)}`
    );

    const transfer = await this.programmeTransferRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!transfer) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.transferReqNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (transfer.status != TransferStatus.PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejCancelledReq",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.programmeTransferRepo
      .update(
        {
          requestId: req.requestId,
          status: TransferStatus.PENDING,
        },
        {
          status: TransferStatus.CANCELLED,
          txTime: new Date().getTime(),
          txRef: `${req.comment}#${requester.companyId}#${requester.id}`,
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      const initiatorCompanyDetails = await this.companyService.findByCompanyId(
        transfer.initiatorCompanyId
      );
      if (transfer.isRetirement) {
        const countryName = await this.countryService.getCountryName(
          transfer.toCompanyMeta.country
        );
        await this.emailHelperService.sendEmailToGovernmentAdmins(
          EmailTemplates.CREDIT_RETIREMENT_CANCEL,
          {
            credits: transfer.creditAmount,
            organisationName: initiatorCompanyDetails.name,
            country: countryName,
          },
          transfer.programmeId
        );
      } else if (
        initiatorCompanyDetails.companyRole === CompanyRole.GOVERNMENT
      ) {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.fromCompanyId,
          EmailTemplates.CREDIT_TRANSFER_GOV_CANCELLATION,
          {
            credits: transfer.creditAmount,
            government: initiatorCompanyDetails.name,
          },
          transfer.toCompanyId,
          transfer.programmeId
        );
      } else {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.fromCompanyId,
          EmailTemplates.CREDIT_TRANSFER_CANCELLATION,
          { credits: transfer.creditAmount },
          transfer.initiatorCompanyId,
          transfer.programmeId
        );
      }
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.transferCancelSuccess",
          []
        )
      );
    }
    return new BasicResponseDto(
      HttpStatus.BAD_REQUEST,
      this.helperService.formatReqMessagesString(
        "programme.transferReqNotExistinGiv",
        []
      )
    );
  }

  async transferRequest(req: ProgrammeTransferRequest, requester: User) {
    this.logger.log(
      `Programme transfer request by ${requester.companyId}-${
        requester.id
      } received ${JSON.stringify(req)}`
    );

    // TODO: Move this to casl factory
    // if (requester.role == Role.ViewOnly) {
    //     throw new HttpException("View only user cannot create requests", HttpStatus.FORBIDDEN)
    // }

    // if (![CompanyRole.GOVERNMENT, CompanyRole.PROGRAMME_DEVELOPER].includes(requester.companyRole)) {
    //     throw new HttpException("Unsupported company role", HttpStatus.FORBIDDEN)
    // }

    if (
      req.companyCredit &&
      req.companyCredit.reduce((a, b) => a + b, 0) <= 0
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.companytotalAmount>0",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (req.fromCompanyIds.length > 1) {
      if (!req.companyCredit) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.companyCreditNeedsToDefineForMultipleComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      } else if (req.fromCompanyIds.length != req.companyCredit.length) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidCompCreditForGivenComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    if (
      req.fromCompanyIds &&
      req.companyCredit &&
      req.fromCompanyIds.length != req.companyCredit.length
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidCompCreditFromGivenComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const indexTo = req.fromCompanyIds.indexOf(req.toCompanyId);
    if (indexTo >= 0 && req.companyCredit[indexTo] > 0) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.cantTransferCreditWithinSameComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.programmeLedger.getProgrammeById(
      req.programmeId
    );

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`);

    if (programme.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotInCreditIssuedState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    // if (programme.creditBalance - (programme.creditFrozen ? programme.creditFrozen.reduce((a, b) => a + b, 0) : 0) < req.creditAmount) {
    //     throw new HttpException("Not enough balance for the transfer", HttpStatus.BAD_REQUEST)
    // }
    if (
      requester.companyRole != CompanyRole.GOVERNMENT &&
      ![...req.fromCompanyIds, req.toCompanyId].includes(requester.companyId)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.cantInitiateTransferForOtherComp",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!req.fromCompanyIds) {
      req.fromCompanyIds = programme.companyId;
    }
    if (!programme.creditOwnerPercentage) {
      programme.creditOwnerPercentage = [100];
    }
    if (!req.companyCredit) {
      req.companyCredit = programme.creditOwnerPercentage.map(
        (p, i) =>
          (programme.creditBalance * p) / 100 -
          (programme.creditFrozen ? programme.creditFrozen[i] : 0)
      );
    }

    const requestedCompany = await this.companyService.findByCompanyId(
      requester.companyId
    );

    const allTransferList: ProgrammeTransfer[] = [];
    const autoApproveTransferList: ProgrammeTransfer[] = [];
    const ownershipMap = {};
    const frozenCredit = {};

    for (const i in programme.companyId) {
      ownershipMap[programme.companyId[i]] = programme.creditOwnerPercentage[i];
      if (programme.creditFrozen) {
        frozenCredit[programme.companyId[i]] = programme.creditFrozen[i];
      }
    }

    const hostAddress = this.configService.get("host");

    const fromCompanyListMap = {};
    for (const j in req.fromCompanyIds) {
      const fromCompanyId= req.fromCompanyIds[j];
      this.logger.log(
        `Transfer request from ${fromCompanyId} to programme owned by ${programme.companyId}`
      );
      const fromCompany = await this.companyService.findByCompanyId(
        fromCompanyId
      );
      fromCompanyListMap[fromCompanyId] = fromCompany;
      //const intCompanyIds = programme.companyId.map((id)=>{return Number(id)})

      if (!programme.companyId.includes(fromCompanyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.fromCompInReqIsNotOwnerOfProgramme",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      console.log(
        programme.creditBalance,
        ownershipMap[fromCompanyId],
        frozenCredit[fromCompanyId]
      );
      const companyAvailableCredit =
        (programme.creditBalance * ownershipMap[fromCompanyId]) / 100 -
        (frozenCredit[fromCompanyId] ? frozenCredit[fromCompanyId] : 0);

      let transferCompanyCredit;
      if (req.fromCompanyIds.length == 1 && !req.companyCredit) {
        transferCompanyCredit = companyAvailableCredit;
      } else {
        transferCompanyCredit = req.companyCredit[j];
      }

      if (companyAvailableCredit < transferCompanyCredit) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.companyHaveNoEnoughBalanceForTransfer",
            [fromCompany.name, companyAvailableCredit]
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (transferCompanyCredit == 0) {
        continue;
      }

      const transfer = new ProgrammeTransfer();
      transfer.programmeId = req.programmeId;
      transfer.fromCompanyId = fromCompanyId;
      transfer.toCompanyId = req.toCompanyId;
      transfer.initiator = requester.id;
      transfer.initiatorCompanyId = requester.companyId;
      transfer.txTime = new Date().getTime();
      transfer.createdTime = transfer.txTime;
      transfer.comment = req.comment;
      transfer.creditAmount = transferCompanyCredit;
      transfer.toAccount = req.toAccount;
      transfer.isRetirement = false;

      if (requester.companyId != fromCompanyId) {
        transfer.status = TransferStatus.PENDING;
      } else {
        transfer.status = TransferStatus.PROCESSING;
        autoApproveTransferList.push(transfer);
      }
      allTransferList.push(transfer);
    }
    const results = await this.programmeTransferRepo.insert(allTransferList);
    console.log(results);
    for (const i in allTransferList) {
      allTransferList[i].requestId = results.identifiers[i].requestId;
    }

    let updateProgramme = undefined;
    for (const trf of autoApproveTransferList) {
      this.logger.log(`Credit send received ${trf}`);
      const toCompany = await this.companyService.findByCompanyId(
        trf.toCompanyId
      );
      console.log("To Company", toCompany);
      updateProgramme = (
        await this.doTransfer(
          trf,
          `${this.getUserRef(requester)}#${toCompany.companyId}#${
            toCompany.name
          }#${fromCompanyListMap[trf.fromCompanyId].companyId}#${
            fromCompanyListMap[trf.fromCompanyId].name
          }`,
          req.comment,
          false
        )
      ).data;
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        trf.toCompanyId,
        EmailTemplates.CREDIT_SEND_DEVELOPER,
        {
          organisationName: requestedCompany.name,
          credits: trf.creditAmount,
          programmeName: programme.title,
          serialNumber: programme.serialNo,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        }
      );
    }
    if (updateProgramme) {
      return new DataResponseDto(HttpStatus.OK, updateProgramme);
    }

    allTransferList.forEach(async (transfer) => {
      if (requester.companyRole === CompanyRole.GOVERNMENT) {
        if (transfer.toCompanyId === requester.companyId) {
          await this.emailHelperService.sendEmailToOrganisationAdmins(
            transfer.fromCompanyId,
            EmailTemplates.CREDIT_TRANSFER_REQUISITIONS,
            {
              organisationName: requestedCompany.name,
              credits: transfer.creditAmount,
              programmeName: programme.title,
              serialNumber: programme.serialNo,
              pageLink: hostAddress + "/creditTransfers/viewAll",
            }
          );
        } else {
          await this.emailHelperService.sendEmailToOrganisationAdmins(
            transfer.fromCompanyId,
            EmailTemplates.CREDIT_TRANSFER_GOV,
            {
              credits: transfer.creditAmount,
              programmeName: programme.title,
              serialNumber: programme.serialNo,
              pageLink: hostAddress + "/creditTransfers/viewAll",
              government: requestedCompany.name,
            },
            transfer.toCompanyId
          );
        }
      } else if (requester.companyId != transfer.fromCompanyId) {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.fromCompanyId,
          EmailTemplates.CREDIT_TRANSFER_REQUISITIONS,
          {
            organisationName: requestedCompany.name,
            credits: transfer.creditAmount,
            programmeName: programme.title,
            serialNumber: programme.serialNo,
            pageLink: hostAddress + "/creditTransfers/viewAll",
          }
        );
      }
    });

    return new DataListResponseDto(allTransferList, allTransferList.length);
  }

  // async addDocument(document: ProgrammeDocumentDto): Promise<DataResponseDto | undefined> {
  //   this.logger.log('Add Document triggered')

  //   const certifierId = (await this.companyService.findByTaxId(document.certifierTaxId))?.companyId;
  //   const resp = await this.programmeLedger.addDocument(document.externalId, document.actionId, document.data, document.type, 0, certifierId);
  //   return new DataResponseDto(HttpStatus.OK, resp);
  // }

  async programmeAccept(accept: ProgrammeAcceptedDto): Promise<DataResponseDto | undefined> {
    this.logger.log('Add accept triggered')
    const certifierId = (await this.companyService.findByTaxId(accept.certifierTaxId))?.companyId;
    const resp = await this.programmeLedger.addDocument(accept.externalId, undefined, accept.data, accept.type, accept.creditEst, certifierId);
    return new DataResponseDto(HttpStatus.OK, resp);
  }

  // async addMitigation(mitigation: MitigationAddDto): Promise<DataResponseDto | undefined> {
  //   this.logger.log('Add mitigation triggered')
  //   const resp = await this.programmeLedger.addMitigation(mitigation.externalId, mitigation.mitigation);
  //   return new DataResponseDto(HttpStatus.OK, resp);
  // }


  async query(
    query: QueryDto,
    abilityCondition: string
  ): Promise<DataListResponseDto> {
    const skip = query.size * query.page - query.size;
    let resp = await this.programmeViewRepo
      .createQueryBuilder("programme")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "programme",
            abilityCondition
          ),
          "programme"
        )
      )
      .orderBy(
        query?.sort?.key &&
          `"programme".${this.helperService.generateSortCol(query?.sort?.key)}`,
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
      resp[0] = resp[0].map((e) => {
        e.certifier =
          e.certifier.length > 0 && e.certifier[0] === null ? [] : e.certifier;
        e.company =
          e.company.length > 0 && e.company[0] === null ? [] : e.company;
        return e;
      });
    }

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  async getProgrammeEventsByExternalId(externalId: string): Promise<any> {
    return await this.programmeLedger.getProgrammeHistoryByExternalId(externalId);
  }


  async getProgrammeEvents(programmeId: string, user: User): Promise<any> {
    const resp = await this.programmeLedger.getProgrammeHistory(programmeId);
    if (resp == null) {
      return [];
    }
    for (const el of resp) {
      const refs = this.getCompanyIdAndUserIdFromRef(el.data.txRef);
      if (
        refs &&
        (user.companyRole === CompanyRole.GOVERNMENT ||
          Number(refs?.companyId) === Number(user.companyId))
      ) {
        el.data["userName"] = await this.getUserName(refs.id);
      }
    }
    return resp;
  }

  async updateCustomConstants(
    customConstantType: TypeOfMitigation,
    constants: ConstantUpdateDto
  ) {
    let config;
    if (customConstantType == TypeOfMitigation.AGRICULTURE) {
      config = new AgricultureConstants();
      const recv = instanceToPlain(constants.agricultureConstants);
      for (const key in recv) {
        if (recv.hasOwnProperty(key) && recv[key] != undefined) {
          config[key] = recv[key];
        }
      }
    } else if (customConstantType == TypeOfMitigation.SOLAR) {
      config = new SolarConstants();
      const recv = instanceToPlain(constants.solarConstants);
      for (const key in recv) {
        if (recv.hasOwnProperty(key) && recv[key] != undefined) {
          config[key] = recv[key];
        }
      }
    }

    const existing = await this.getLatestConstant(customConstantType);
    if (existing && JSON.stringify(existing.data) == JSON.stringify(config)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.noDiffInConfigFromThePrevVersion",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const resp = await this.constantRepo.save({
      id: customConstantType,
      data: config,
    });
    return new DataResponseDto(HttpStatus.OK, resp);
  }

  async getLatestConstant(customConstantType: TypeOfMitigation) {
    return await this.constantRepo.findOne({
      where: [{ id: customConstantType }],
      order: { version: "DESC" },
    });
  }

  async certify(req: ProgrammeCertify, add: boolean, user: User) {
    this.logger.log(
      `Programme ${req.programmeId} certification received by ${user.id}`
    );

    if (add && user.companyRole != CompanyRole.CERTIFIER) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("programme.unAuth", []),
        HttpStatus.FORBIDDEN
      );
    }

    if (
      !add &&
      ![CompanyRole.CERTIFIER, CompanyRole.GOVERNMENT].includes(
        user.companyRole
      )
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.certifierOrGovCanOnlyPerformCertificationRevoke",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    let certifierId;
    if (user.companyRole === CompanyRole.GOVERNMENT) {
      if (!req.certifierId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.certifierIdRequiredForGov",
            []
          ),
          HttpStatus.FORBIDDEN
        );
      }
      certifierId = req.certifierId;
    } else {
      certifierId = user.companyId;
    }

    const userCompany = await this.companyRepo.findOne({
      where: { companyId: user.companyId },
    });
    if (userCompany && userCompany.state === CompanyState.SUSPENDED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.organisationDeactivated",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    const updated = await this.programmeLedger.updateCertifier(
      req.programmeId,
      certifierId,
      add,
      this.getUserRefWithRemarks(user, req.comment)
    );
    updated.company = await this.companyRepo.find({
      where: { companyId: In(updated.companyId) },
    });
    if (updated && updated.certifierId && updated.certifierId.length > 0) {
      updated.certifier = await this.companyRepo.find({
        where: { companyId: In(updated.certifierId) },
      });
    }

    if (add) {
      await this.emailHelperService.sendEmailToProgrammeOwnerAdmins(
        req.programmeId,
        EmailTemplates.PROGRAMME_CERTIFICATION,
        {},
        user.companyId
      );
    } else {
      if (user.companyRole === CompanyRole.GOVERNMENT) {
        await this.emailHelperService.sendEmailToProgrammeOwnerAdmins(
          req.programmeId,
          EmailTemplates.PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME,
          {},
          req.certifierId,
          user.companyId
        );
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          req.certifierId,
          EmailTemplates.PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT,
          {},
          user.companyId,
          req.programmeId
        );
      } else {
        await this.emailHelperService.sendEmailToProgrammeOwnerAdmins(
          req.programmeId,
          EmailTemplates.PROGRAMME_CERTIFICATION_REVOKE_BY_CERT,
          {},
          user.companyId
        );
      }
    }

    if (add) {
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.certifyPendingProgramme",
          []
        ),
        updated
      );
    } else {
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.certificationRevocation",
          []
        ),
        updated
      );
    }
  }

  async retireProgramme(req: ProgrammeRetire, requester: User) {
    this.logger.log(
      `Programme ${req.programmeId} retiring Comment: ${req.comment} type: ${req.type}`
    );

    if (
      req.companyCredit &&
      req.companyCredit.reduce((a, b) => a + b, 0) <= 0
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.totalAmount>0",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (req.fromCompanyIds && req.fromCompanyIds.length > 1) {
      if (
        req.companyCredit &&
        req.fromCompanyIds.length != req.companyCredit.length
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.invalidCompCreditForGivenComp",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // if (req.type === RetireType.CROSS_BORDER && !req.toCompanyMeta.country) {
    //     throw new HttpException("Country is required for cross border retirement", HttpStatus.BAD_REQUEST)
    // }

    const programme = await this.programmeLedger.getProgrammeById(
      req.programmeId
    );

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`);

    if (programme.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotInCreditIssuedState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!programme.creditOwnerPercentage) {
      programme.creditOwnerPercentage = [100];
    }
    const requestedCompany = await this.companyService.findByCompanyId(
      requester.companyId
    );
    const toCompany = await this.companyService.findGovByCountry(
      this.configService.get("systemCountry")
    );

    if (requestedCompany.companyRole != CompanyRole.GOVERNMENT) {
      if (!req.fromCompanyIds) {
        req.fromCompanyIds = [requester.companyId];
      }

      if (!programme.companyId.includes(requester.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.govOrProgrammeOwnerOnlyCreditRetirement",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (!req.fromCompanyIds.includes(requester.companyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.reqNotIncludedInFromCompanyId",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (req.fromCompanyIds.length > 1) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.notAllowedToRetireOtherCompCredits",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (req.type !== RetireType.CROSS_BORDER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.programmeDevAllowedInitiateOnlyCrossBorderTransfer",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (!req.companyCredit) {
        const reqIndex = programme.companyId.indexOf(requester.companyId);
        req.companyCredit = [
          (programme.creditBalance *
            programme.creditOwnerPercentage[reqIndex]) /
            100 -
            (programme.creditFrozen ? programme.creditFrozen[reqIndex] : 0),
        ];
      }
    } else {
      if (!req.fromCompanyIds) {
        req.fromCompanyIds = programme.companyId;
      }
      if (!req.companyCredit) {
        req.companyCredit = programme.creditOwnerPercentage.map(
          (p, i) =>
            (programme.creditBalance * p) / 100 -
            (programme.creditFrozen ? programme.creditFrozen[i] : 0)
        );
      }
    }

    const allTransferList: ProgrammeTransfer[] = [];
    const autoApproveTransferList: ProgrammeTransfer[] = [];
    const ownershipMap = {};
    const frozenCredit = {};

    for (const i in programme.companyId) {
      ownershipMap[programme.companyId[i]] = programme.creditOwnerPercentage[i];
      if (programme.creditFrozen) {
        frozenCredit[programme.companyId[i]] = programme.creditFrozen[i];
      }
    }

    const fromCompanyMap = {};
    for (const j in req.fromCompanyIds) {
      const fromCompanyId = req.fromCompanyIds[j];
      this.logger.log(
        `Retire request from ${fromCompanyId} to programme owned by ${programme.companyId}`
      );
      const fromCompany = await this.companyService.findByCompanyId(
        fromCompanyId
      );
      fromCompanyMap[fromCompanyId] = fromCompany;
      if (!programme.companyId.includes(fromCompanyId)) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.retireReqFromCOmpOwnTheProgramme",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const companyAvailableCredit =
        (programme.creditBalance * ownershipMap[fromCompanyId]) / 100 -
        (frozenCredit[fromCompanyId] ? frozenCredit[fromCompanyId] : 0);

      let transferCompanyCredit;
      if (req.fromCompanyIds.length == 1 && !req.companyCredit) {
        transferCompanyCredit = companyAvailableCredit;
      } else {
        transferCompanyCredit = req.companyCredit[j];
      }

      if (
        req.type != RetireType.CROSS_BORDER &&
        transferCompanyCredit < companyAvailableCredit
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.requiredToRetireFullCreditAmountForGivenRetirementType",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (companyAvailableCredit < transferCompanyCredit) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "programme.companyHaveNoEnoughBalanceForTransfer",
            [fromCompany.name, companyAvailableCredit]
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (transferCompanyCredit == 0) {
        continue;
      }

      const transfer = new ProgrammeTransfer();
      transfer.programmeId = req.programmeId;
      transfer.fromCompanyId = fromCompanyId;
      transfer.toCompanyId = toCompany.companyId;
      transfer.initiator = requester.id;
      transfer.initiatorCompanyId = requester.companyId;
      transfer.txTime = new Date().getTime();
      transfer.createdTime = transfer.txTime;
      transfer.comment = req.comment;
      transfer.creditAmount = transferCompanyCredit;
      transfer.toAccount =
        req.type == RetireType.CROSS_BORDER ? "international" : "local";
      transfer.isRetirement = true;
      transfer.toCompanyMeta = req.toCompanyMeta;
      transfer.retirementType = req.type;
      // await this.programmeTransferRepo.save(transfer);

      const hostAddress = this.configService.get("host");
      if (requester.companyId != toCompany.companyId) {
        transfer.status = TransferStatus.PENDING;
        await this.emailHelperService.sendEmailToGovernmentAdmins(
          EmailTemplates.CREDIT_RETIREMENT_BY_DEV,
          {
            credits: transfer.creditAmount,
            programmeName: programme.title,
            serialNumber: programme.serialNo,
            organisationName: fromCompany.name,
            pageLink: hostAddress + "/creditTransfers/viewAll",
          }
        );
      } else {
        transfer.status = TransferStatus.PROCESSING;
        autoApproveTransferList.push(transfer);
        const reason =
          req.type === RetireType.CROSS_BORDER
            ? "cross border transfer"
            : transfer.retirementType === RetireType.LEGAL_ACTION
            ? "legal action"
            : "other";
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          fromCompany.companyId,
          EmailTemplates.CREDIT_RETIREMENT_BY_GOV,
          {
            credits: transfer.creditAmount,
            programmeName: programme.title,
            serialNumber: programme.serialNo,
            government: toCompany.name,
            reason: reason,
            pageLink: hostAddress + "/creditTransfers/viewAll",
          }
        );
      }
      allTransferList.push(transfer);
    }
    const results = await this.programmeTransferRepo.insert(allTransferList);
    console.log(results);
    for (const i in allTransferList) {
      allTransferList[i].requestId = results.identifiers[i].requestId;
    }

    let updateProgramme = undefined;
    for (const trf of autoApproveTransferList) {
      this.logger.log(`Retire auto approve received ${trf}`);
      updateProgramme = (
        await this.doTransfer(
          trf,
          `${this.getUserRef(requester)}#${toCompany.companyId}#${
            toCompany.name
          }#${fromCompanyMap[trf.fromCompanyId].companyId}#${
            fromCompanyMap[trf.fromCompanyId].name
          }`,
          req.comment,
          true
        )
      ).data;
    }
    if (updateProgramme) {
      return new DataResponseDto(HttpStatus.OK, updateProgramme);
    }
    return new DataListResponseDto(allTransferList, allTransferList.length);
  }

  async issueProgrammeCredit(req: ProgrammeIssue, user: User) {
    this.logger.log(
      `Programme ${req.programmeId} approve. Comment: ${req.comment}`
    );
    const program = await this.programmeLedger.getProgrammeById(
      req.programmeId
    );
    if (!program) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (program.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.notInAUthorizedState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (program.creditEst - program.creditIssued < req.issueAmount) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.issuedCreditAmountcantExceedPendingCredit",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    let updated: any = await this.programmeLedger.issueProgrammeStatus(
      req.programmeId,
      this.configService.get("systemCountry"),
      program.companyId,
      req.issueAmount,
      this.getUserRefWithRemarks(user, req.comment)
    );
    if (!updated) {
      return new BasicResponseDto(
        HttpStatus.BAD_REQUEST,
        this.helperService.formatReqMessagesString(
          "programme.notFOundAPendingProgrammeForTheId",
          [req.programmeId]
        )
      );
    }

    // const issueCReq: AsyncAction = {
    //   actionType: AsyncActionType.IssueCredit,
    //   actionProps: {
    //     externalId: program.externalId,
    //     issueAmount: req.issueAmount,
    //   },
    // };
    // await this.asyncOperationsInterface.AddAction(
    //   issueCReq
    // );

    const hostAddress = this.configService.get("host");
    updated.companyId.forEach(async (companyId) => {
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        companyId,
        EmailTemplates.CREDIT_ISSUANCE,
        {
          programmeName: updated.title,
          credits: req.issueAmount,
          serialNumber: updated.serialNo,
          pageLink:
            hostAddress + `/programmeManagement/view?id=${updated.programmeId}`,
        }
      );
    });

    const companyData = await this.companyService.findByCompanyIds({
      companyIds: program.companyId,
    });

    const suspendedCompanies = companyData.filter(
      (company) => company.state == CompanyState.SUSPENDED
    );

    if (suspendedCompanies.length > 0) {
      updated = await this.programmeLedger.freezeIssuedCredit(
        req.programmeId,
        req.issueAmount,
        this.getUserRef(user),
        suspendedCompanies
      );
      if (!updated) {
        return new BasicResponseDto(
          HttpStatus.BAD_REQUEST,
          this.helperService.formatReqMessagesString(
            "programme.internalErrorCreditFreezing",
            [req.programmeId]
          )
        );
      }
    }

    updated.company = await this.companyRepo.find({
      where: { companyId: In(updated.companyId) },
    });
    if (updated.certifierId && updated.certifierId.length > 0) {
      updated.certifier = await this.companyRepo.find({
        where: { companyId: In(updated.certifierId) },
      });
    }

    return new DataResponseDto(HttpStatus.OK, updated);
  }

  async approveProgramme(req: ProgrammeApprove, user: User) {
    this.logger.log(
      `Programme ${req.programmeId} approve. Comment: ${req.comment}`
    );
    const program = await this.programmeLedger.getProgrammeById(
      req.programmeId
    );
    if (!program) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (program.currentStage != ProgrammeStage.APPROVED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.notInPendingState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    if (program.creditEst < req.issueAmount) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.issuedCreditCannotExceedEstCredit",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const updated: any = await this.programmeLedger.authProgrammeStatus(
      req.programmeId,
      this.configService.get("systemCountry"),
      program.companyId,
      req.issueAmount,
      this.getUserRefWithRemarks(user, req.comment)
    );
    if (!updated) {
      return new BasicResponseDto(
        HttpStatus.BAD_REQUEST,
        this.helperService.formatReqMessagesString(
          "programme.inotFOundAPendingProgrammeForTheId",
          [req.programmeId]
        )`Does not found a pending programme for the given programme id ${req.programmeId}`
      );
    }

    // const authRe: AsyncAction = {
    //   actionType: AsyncActionType.AuthProgramme,
    //   actionProps: {
    //     externalId: program.externalId,
    //     issueAmount: req.issueAmount,
    //     serialNo: updated.serialNo
    //   },
    // };
    // await this.asyncOperationsInterface.AddAction(
    //   authRe
    // );

    updated.company = await this.companyRepo.find({
      where: { companyId: In(updated.companyId) },
    });
    if (updated.certifierId && updated.certifierId.length > 0) {
      updated.certifier = await this.companyRepo.find({
        where: { companyId: In(updated.certifierId) },
      });
    }

    const hostAddress = this.configService.get("host");
    let authDate = new Date(updated.txTime);
    let date = authDate.getDate().toString().padStart(2, "0");
    let month = authDate.toLocaleString("default", { month: "long" });
    let year = authDate.getFullYear();
    let formattedDate = `${date} ${month} ${year}`;

    updated.company.forEach(async (company) => {
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        company.companyId,
        EmailTemplates.PROGRAMME_AUTHORISATION,
        {
          programmeName: updated.title,
          authorisedDate: formattedDate,
          serialNumber: updated.serialNo,
          programmePageLink:
            hostAddress + `/programmeManagement/view?id=${updated.programmeId}`,
        }
      );
    });

    return new DataResponseDto(HttpStatus.OK, updated);
  }

  async rejectProgramme(req: ProgrammeReject, user: User) {
    this.logger.log(
      `Programme ${req.programmeId} reject. Comment: ${req.comment}`
    );
    const programme = await this.findById(req.programmeId);
    const currentStage = programme.currentStage;
    if (currentStage === ProgrammeStage.REJECTED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.rejectAlreadyRejectedProg",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    const updated = await this.programmeLedger.updateProgrammeStatus(
      req.programmeId,
      ProgrammeStage.REJECTED,
      ProgrammeStage.APPROVED,
      this.getUserRefWithRemarks(user, req.comment)
    );
    if (!updated) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.programmeNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    // const authRe: AsyncAction = {
    //   actionType: AsyncActionType.RejectProgramme,
    //   actionProps: {
    //     externalId: programme.externalId,
    //     comment: req.comment
    //   },
    // };
    // await this.asyncOperationsInterface.AddAction(
    //   authRe
    // );

    await this.emailHelperService.sendEmailToProgrammeOwnerAdmins(
      req.programmeId,
      EmailTemplates.PROGRAMME_REJECTION,
      { reason: req.comment }
    );

    return new BasicResponseDto(HttpStatus.OK, "Successfully updated");
  }

  private getUserName = async (usrId: string) => {
    this.logger.debug(`Getting user [${usrId}]`);
    if (usrId == "undefined" || usrId == "null") {
      return null;
    }
    const userId = Number(usrId);
    if (userId == undefined || userId == null || isNaN(userId)) {
      return null;
    }
    if (this.userNameCache[userId]) {
      this.logger.debug(
        `Getting user - cached ${userId} ${this.userNameCache[userId]}`
      );
      return this.userNameCache[userId];
    }
    const user = await this.userService.findById(Number(userId));
    this.logger.debug(`Getting user - user ${user}`);
    if (user) {
      this.logger.debug(`Getting user - user ${user.name}`);
      this.userNameCache[userId] = user.name;
      return user.name;
    }
    return null;
  };

  private getCompanyIdAndUserIdFromRef = (ref: string) => {
    if (!ref) {
      return null;
    }
    if (ref == CompanyRole.API.toString()) {
      return null;
    }

    const parts = ref.split("#");
    if (parts.length > 2) {
      return {
        id: parts[2],
        companyId: Number(parts[0]),
      };
    }
    if (parts.length > 0) {
      return {
        companyId: Number(parts[0]),
      };
    }
    return null;
  };

  async findByExternalId(externalId: string): Promise<Programme | undefined> {
    return await this.programmeRepo.findOne({
      where: {
        externalId: externalId,
      },
    });
  }

  async regenerateRegionCoordinates() {
    this.logger.log(`Regenrate coordinates:`)
    const allProgrammes = await this.programmeRepo.find();
    for (const programme of allProgrammes) {
      const programmeProperties = programme.programmeProperties;
      let address: any[] = [];
      if (programmeProperties.geographicalLocation) {
        for (
          let index = 0;
          index < programmeProperties.geographicalLocation.length;
          index++
        ) {
          address.push(programmeProperties.geographicalLocation[index]);
        }
      }
      await this.locationService.getCoordinatesForRegion([...address]).then(
        (response: any) => {
          console.log(
            "response from forwardGeoCoding function -> ",
            response
          );
          programme.geographicalLocationCordintes = [...response];
        }
      );

      const result = await this.programmeRepo
      .update(
        {
          programmeId: programme.programmeId,
        },
        {
          geographicalLocationCordintes: programme.geographicalLocationCordintes
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });
      this.logger.log(`Updated programme: ${programme.programmeId} ${programme.geographicalLocationCordintes}`)
    }
  }
  private getUserRef = (user: any) => {
    return `${user.companyId}#${user.companyName}#${user.id}`;
  };

  private getUserRefWithRemarks = (user: any, remarks: string) => {
    return `${user.companyId}#${user.companyName}#${user.id}#${remarks}`;
  };

  async queryInvestment(query: QueryDto, abilityCondition: any, user: User) {
    let queryBuilder = await this.investmentViewRepo
      .createQueryBuilder("investment")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable(
            "investment",
            abilityCondition
          )
        )
      )

      const resp = await  queryBuilder.orderBy(
        query?.sort?.key &&
          this.helperService.generateSortCol(query?.sort?.key),
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .offset(query.size * query.page - query.size)
      .limit(query.size)
      .getManyAndCount();
    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }
  async investmentCancel(req: InvestmentCancel, requester: User) {
    this.logger.log(
      `Investment cancel by ${requester.companyId}-${
        requester.id
      } received ${JSON.stringify(req)}`
    );

    const investment = await this.investmentRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!investment) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.investmentReqDoesNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (investment.status != InvestmentStatus.PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejCancelledReq",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const result = await this.investmentRepo
      .update(
        {
          requestId: req.requestId,
          status: InvestmentStatus.PENDING,
        },
        {
          status: InvestmentStatus.CANCELLED,
          txTime: new Date().getTime(),
          txRef: `${req.comment}#${requester.companyId}#${requester.id}`,
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.investmentCancelSuccess",
          []
        )
      );
    }
    return new BasicResponseDto(
      HttpStatus.BAD_REQUEST,
      this.helperService.formatReqMessagesString(
        "programme.investmentReqNotExistinGiv",
        []
      )
    );
  }

  async investmentReject(req: InvestmentReject, approver: User) {
    this.logger.log(
      `Investment reject ${JSON.stringify(req)} ${approver.companyId}`
    );

    const investment = await this.investmentRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!investment) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.investmentReqDoesNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (investment.status != InvestmentStatus.PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejCancelledReq",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      investment.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForInvestmentReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    const result = await this.investmentRepo
      .update(
        {
          requestId: req.requestId,
          status: InvestmentStatus.PENDING,
        },
        {
          status: InvestmentStatus.REJECTED,
          txTime: new Date().getTime(),
          txRef: `${req.comment}#${approver.companyId}#${approver.id}`,
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });


    if (result.affected > 0) {
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "programme.investmentReqRejectSuccess",
          []
        )
      );
    }

    throw new HttpException(
      this.helperService.formatReqMessagesString(
        "programme.noPendReqFound",
        []
      ),
      HttpStatus.BAD_REQUEST
    );
  }
  async investmentApprove(req: InvestmentApprove, approver: User) {
    const investment = await this.investmentRepo.findOneBy({
      requestId: req.requestId,
    });

    if (!investment) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.investmentReqDoesNotExist",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (investment.status == InvestmentStatus.CANCELLED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.acceptOrRejAlreadyCancelled",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (investment.status == InvestmentStatus.APPROVED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.investmentAlreadyApproved",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      investment.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "programme.invalidApproverForInvestmentReq",
          []
        ),
        HttpStatus.FORBIDDEN
      );
    }

    const receiver = await this.companyService.findByCompanyId(
      investment.toCompanyId
    );
    const giver = await this.companyService.findByCompanyId(
      investment.fromCompanyId
    );

    const initiatorCompanyDetails = await this.companyService.findByCompanyId(
      investment.initiatorCompanyId
    );

    const programme = await this.findById(investment.programmeId);

    const transferResult = await this.doInvestment(
      investment,
      `${this.getUserRef(approver)}#${receiver.companyId}#${receiver.name}#${
        giver.companyId
      }#${giver.name}`,
      programme,
      receiver
    );

    return transferResult;
  }

}

