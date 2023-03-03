import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ProgrammeDto } from "../dto/programme.dto";
import { Programme } from "../entities/programme.entity";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { instanceToPlain, plainToClass } from "class-transformer";
import { ProgrammeStage } from "../enum/programme-status.enum";
import {
  AgricultureConstants,
  AgricultureCreationRequest,
  calculateCredit,
  SolarConstants,
  SolarCreationRequest,
} from "carbon-credit-calculator";
import { QueryDto } from "../dto/query.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { PrimaryGeneratedColumnType } from "typeorm/driver/types/ColumnTypes";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { ConstantEntity } from "../entities/constants.entity";
import { DataResponseDto } from "../dto/data.response.dto";
import { ConstantUpdateDto } from "../dto/constants.update.dto";
import { ProgrammeApprove } from "../dto/programme.approve";
import { DataListResponseDto } from "../dto/data.list.response";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { ConfigService } from "@nestjs/config";
import { TypeOfMitigation } from "../enum/typeofmitigation.enum";
import { CompanyService } from "../company/company.service";
import { ProgrammeTransferRequest } from "../dto/programme.transfer.request";
import { EmailService } from "../email/email.service";
import { EmailTemplates } from "../email/email.template";
import { User } from "../entities/user.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { TransferStatus } from "../enum/transform.status.enum";
import { ProgrammeTransferApprove } from "../dto/programme.transfer.approve";
import { ProgrammeTransferReject } from "../dto/programme.transfer.reject";
import { Company } from "../entities/company.entity";
import { HelperService } from "../util/helpers.service";
import { CompanyRole } from "../enum/company.role.enum";
import { ProgrammeCertify } from "../dto/programme.certify";
import { ProgrammeQueryEntity } from "../entities/programme.view.entity";
import { ProgrammeTransferViewEntityQuery } from "../entities/programmeTransfer.view.entity";
import { ProgrammeRetire } from "../dto/programme.retire";
import { ProgrammeTransferCancel } from "../dto/programme.transfer.cancel";
import { CompanyState } from "../enum/company.state.enum";
import { ProgrammeReject } from "../dto/programme.reject";
import { ProgrammeIssue } from "../dto/programme.issue";
import { RetireType } from "../enum/retire.type.enum";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { UserService } from "../user/user.service";
import { use } from "passport";
import { SystemActionType } from "../enum/system.action.type";
import { CountryService } from "../util/country.service";

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
    private emailService: EmailService,
    private helperService: HelperService,
    private emailHelperService: EmailHelperService,
    private readonly countryService: CountryService,
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
    private logger: Logger
  ) {}

  private toProgramme(programmeDto: ProgrammeDto): Programme {
    const data = instanceToPlain(programmeDto);
    this.logger.verbose("Converted programme", JSON.stringify(data));
    return plainToClass(Programme, data);
  }

  private async getCreditRequest(
    programmeDto: ProgrammeDto,
    constants: ConstantEntity
  ) {
    switch (programmeDto.typeOfMitigation) {
      case TypeOfMitigation.AGRICULTURE:
        const ar = new AgricultureCreationRequest();
        ar.duration = programmeDto.endTime - programmeDto.startTime;
        ar.durationUnit = "s";
        ar.landArea = programmeDto.agricultureProperties.landArea;
        ar.landAreaUnit = programmeDto.agricultureProperties.landAreaUnit;
        if (constants) {
          ar.agricultureConstants = constants.data as AgricultureConstants;
        }
        return ar;
      case TypeOfMitigation.SOLAR:
        const sr = new SolarCreationRequest();
        sr.buildingType = programmeDto.solarProperties.consumerGroup;
        sr.energyGeneration = programmeDto.solarProperties.energyGeneration;
        sr.energyGenerationUnit =
          programmeDto.solarProperties.energyGenerationUnit;
        if (constants) {
          sr.solarConstants = constants.data as SolarConstants;
        }
        return sr;
    }
    throw Error(
      "Not implemented for mitigation type " + programmeDto.typeOfMitigation
    );
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
        "Transfer request does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    if (pTransfer.status == TransferStatus.CANCELLED) {
      throw new HttpException(
        "Transfer request already cancelled",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !pTransfer.isRetirement &&
      pTransfer.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        "Invalid approver for the transfer request",
        HttpStatus.FORBIDDEN
      );
    }
    if (pTransfer.isRetirement && pTransfer.toCompanyId != approver.companyId) {
      throw new HttpException(
        "Invalid approver for the retirement request",
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
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          pTransfer.fromCompanyId,
          EmailTemplates.CREDIT_RETIREMENT_NOT_RECOGNITION,
          {
            credits: pTransfer.creditAmount,
            country: pTransfer.toCompanyMeta.country,
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
      return new BasicResponseDto(HttpStatus.OK, "Successfully rejected");
    }

    throw new HttpException(
      "No pending transfer request found",
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
            e.toCompanyMeta['countryName'] = await this.countryService.getCountryName(e.toCompanyMeta.country)
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
        "Transfer request does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    if (transfer.status == TransferStatus.CANCELLED) {
      throw new HttpException(
        "Transfer request already cancelled",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      transfer.status == TransferStatus.APPROVED ||
      transfer.status == TransferStatus.RECOGNISED
    ) {
      throw new HttpException(
        "Transfer already approved",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      !transfer.isRetirement &&
      transfer.fromCompanyId != approver.companyId
    ) {
      throw new HttpException(
        "Invalid approver for the transfer request",
        HttpStatus.FORBIDDEN
      );
    }
    if (transfer.isRetirement && transfer.toCompanyId != approver.companyId) {
      throw new HttpException(
        "Invalid approver for the retirement request",
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
        "Receive company suspended",
        HttpStatus.BAD_REQUEST
      );
    }

    if (giver.state === CompanyState.SUSPENDED) {
      await this.companyService.companyTransferCancel(
        transfer.fromCompanyId,
        `${transfer.comment}#${approver.companyId}#${approver.id}#${SystemActionType.SUSPEND_AUTO_CANCEL}#${receiver.name}`
      );
      throw new HttpException(
        "Credit sending company suspended",
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
          "No pending transfer request found",
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

    if(transferResult.statusCode === 200){
      if (transfer.isRetirement) {
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          transfer.fromCompanyId,
          EmailTemplates.CREDIT_RETIREMENT_RECOGNITION,
          {
            credits: transfer.creditAmount,
            country: transfer.toCompanyMeta.country,
          },
          0,
          transfer.programmeId
        );
      } else if (initiatorCompanyDetails.companyRole === CompanyRole.GOVERNMENT) {
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
        }
      )
      .catch((err) => {
        this.logger.error(err);
        return err;
      });

    if (result.affected > 0) {
      return new DataResponseDto(HttpStatus.OK, programme);
    }

    throw new HttpException(
      "Internal error on status updating",
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
        "Transfer request does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    if (transfer.status != TransferStatus.PENDING) {
      throw new HttpException(
        "Transfer already processed",
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
        await this.emailHelperService.sendEmailToGovernmentAdmins(
          EmailTemplates.CREDIT_RETIREMENT_CANCEL,
          {
            credits: transfer.creditAmount,
            organisationName: initiatorCompanyDetails.name,
            country: transfer.toCompanyMeta.country,
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
      return new BasicResponseDto(HttpStatus.OK, "Successfully cancelled");
    }
    return new BasicResponseDto(
      HttpStatus.BAD_REQUEST,
      "Transfer request does not exist in the giv"
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
        "Total Amount should be greater than 0",
        HttpStatus.BAD_REQUEST
      );
    }

    if (req.fromCompanyIds.length > 1) {
      if (!req.companyCredit) {
        throw new HttpException(
          "Company credit needs to define for multiple companies",
          HttpStatus.BAD_REQUEST
        );
      } else if (req.fromCompanyIds.length != req.companyCredit.length) {
        throw new HttpException(
          "Invalid company credit for given companies",
          HttpStatus.BAD_REQUEST
        );
      }
    }
    
    if (req.fromCompanyIds && req.companyCredit && req.fromCompanyIds.length != req.companyCredit.length) {
        throw new HttpException(
            "Invalid company credit for given from companies",
            HttpStatus.BAD_REQUEST
          );
    }

    const indexTo = req.fromCompanyIds.indexOf(req.toCompanyId);
    if (indexTo >= 0 && req.companyCredit[indexTo] > 0) {
      throw new HttpException(
        "Cannot transfer credit within the same company",
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.programmeLedger.getProgrammeById(
      req.programmeId
    );

    if (!programme) {
      throw new HttpException(
        "Programme does not exist",
        HttpStatus.BAD_REQUEST
      );
    }
    this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`);

    if (programme.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        "Programme is not in credit issued state",
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
        "Cannot initiate transfers for other companies",
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
      const fromCompanyId = req.fromCompanyIds[j];
      this.logger.log(
        `Transfer request from ${fromCompanyId} to programme owned by ${programme.companyId}`
      );
      const fromCompany = await this.companyService.findByCompanyId(
        fromCompanyId
      );
      fromCompanyListMap[fromCompanyId] = fromCompany;

      if (!programme.companyId.includes(fromCompanyId)) {
        throw new HttpException(
          "From company mentioned in the request does own the programme",
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
          `Company ${fromCompany.name} does not have enough balance for the transfer. Available: ${companyAvailableCredit}`,
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

  async create(programmeDto: ProgrammeDto): Promise<Programme | undefined> {
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
        "Proponent percentage must defined for each proponent tax id",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentPercentage &&
      programmeDto.proponentTaxVatId.length !=
        programmeDto.proponentPercentage.length
    ) {
      throw new HttpException(
        "Proponent percentage and number of tax ids does not match",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentPercentage &&
      programmeDto.proponentPercentage.reduce((a, b) => a + b, 0) != 100
    ) {
      throw new HttpException(
        "Proponent percentage sum must be equals to 100",
        HttpStatus.BAD_REQUEST
      );
    }

    if (
      programmeDto.proponentTaxVatId.length !==
      new Set(programmeDto.proponentTaxVatId).size
    ) {
      throw new HttpException(
        "Proponent tax id cannot be duplicated",
        HttpStatus.BAD_REQUEST
      );
    }

    const companyIds = [];
    const companyNames = [];
    for (const taxId of programmeDto.proponentTaxVatId) {
      const projectCompany = await this.companyService.findByTaxId(taxId);
      if (!projectCompany) {
        throw new HttpException(
          "Proponent tax id does not exist in the system",
          HttpStatus.BAD_REQUEST
        );
      }

      if (projectCompany.companyRole != CompanyRole.PROGRAMME_DEVELOPER) {
        throw new HttpException(
          "Proponent is not a programme developer",
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
    const constants = await this.getLatestConstant(
      programmeDto.typeOfMitigation
    );

    const req = await this.getCreditRequest(programmeDto, constants);
    try {
      programme.creditEst = Math.round(await calculateCredit(req));
    } catch (err) {
      this.logger.log(`Credit calculate failed ${err.message}`);
      throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
    }

    if (programme.creditEst <= 0) {
      throw new HttpException(
        "Not enough credits to create the programme",
        HttpStatus.BAD_REQUEST
      );
    }
    // programme.creditBalance = programme.creditIssued;
    // programme.creditChange = programme.creditIssued;
    programme.programmeProperties.creditYear = new Date(
      programme.startTime * 1000
    ).getFullYear();
    programme.constantVersion = constants
      ? String(constants.version)
      : "default";
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
    const savedProgramme = await this.programmeLedger.createProgramme(programme);
    if(savedProgramme){
      const hostAddress = this.configService.get("host");
      await this.emailHelperService.sendEmailToGovernmentAdmins(
        EmailTemplates.PROGRAMME_CREATE,
        {
          organisationName: orgNamesList,
          programmePageLink:
            hostAddress + `/programmeManagement/view?id=${programme.programmeId}`,
        }
      );
    }

    return savedProgramme;
  }

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
        query?.sort?.key && `"programme"."${query?.sort?.key}"`,
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
        "Not difference in the config from the previous version",
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
        "Programme certification can perform only by certifier",
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
        "Programme certification revoke can perform only by certifier or government",
        HttpStatus.FORBIDDEN
      );
    }

    let certifierId;
    if (user.companyRole === CompanyRole.GOVERNMENT) {
      if (!req.certifierId) {
        throw new HttpException(
          "certifierId required for government user",
          HttpStatus.FORBIDDEN
        );
      }
      certifierId = req.certifierId;
    } else {
      certifierId = user.companyId;
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

    return new DataResponseDto(HttpStatus.OK, updated);
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
        "Total Amount should be greater than 0",
        HttpStatus.BAD_REQUEST
      );
    }

    if (req.fromCompanyIds && req.fromCompanyIds.length > 1) {
      if (
        req.companyCredit &&
        req.fromCompanyIds.length != req.companyCredit.length
      ) {
        throw new HttpException(
          "Invalid company credit for given companies",
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
        "Programme does not exist",
        HttpStatus.BAD_REQUEST
      );
    }
    this.logger.verbose(`Transfer programme ${JSON.stringify(programme)}`);

    if (programme.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        "Programme is not in credit issued state",
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
          "Credit retirement can initiate only the government or programme owner",
          HttpStatus.BAD_REQUEST
        );
      }

      if (!req.fromCompanyIds.includes(requester.companyId)) {
        throw new HttpException(
          "Requester does not included in the from company id",
          HttpStatus.BAD_REQUEST
        );
      }

      if (req.fromCompanyIds.length > 1) {
        throw new HttpException(
          "Does not allow to retire other company credits",
          HttpStatus.BAD_REQUEST
        );
      }

      if (req.type !== RetireType.CROSS_BORDER) {
        throw new HttpException(
          "Programme developer allowed to initiate only cross border transfers",
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
          "Retire request from company does own the programme",
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
          `Required to retire the full credit amount for the given retirement type`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (companyAvailableCredit < transferCompanyCredit) {
        throw new HttpException(
          `Company ${fromCompany.name} does not have enough balance for the transfer. Available: ${companyAvailableCredit}`,
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
        await this.emailHelperService.sendEmailToOrganisationAdmins(
          fromCompany.companyId,
          EmailTemplates.CREDIT_RETIREMENT_BY_GOV,
          {
            credits: transfer.creditAmount,
            programmeName: programme.title,
            serialNumber: programme.serialNo,
            government: toCompany.name,
            reason: req.comment,
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
        "Programme does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    if (program.currentStage != ProgrammeStage.AUTHORISED) {
      throw new HttpException(
        "Programme is not in authorised state",
        HttpStatus.BAD_REQUEST
      );
    }
    if (program.creditEst - program.creditIssued < req.issueAmount) {
      throw new HttpException(
        "Programme issue credit amount can not exceed pending credit amount",
        HttpStatus.BAD_REQUEST
      );
    }
    const updated: any = await this.programmeLedger.issueProgrammeStatus(
      req.programmeId,
      this.configService.get("systemCountry"),
      program.companyId,
      req.issueAmount,
      this.getUserRefWithRemarks(user, req.comment)
    );
    if (!updated) {
      return new BasicResponseDto(
        HttpStatus.BAD_REQUEST,
        `Does not found a pending programme for the given programme id ${req.programmeId}`
      );
    }

    updated.company = await this.companyRepo.find({
      where: { companyId: In(updated.companyId) },
    });
    if (updated.certifierId && updated.certifierId.length > 0) {
      updated.certifier = await this.companyRepo.find({
        where: { companyId: In(updated.certifierId) },
      });
    }

    const hostAddress = this.configService.get("host");
    updated.company.forEach(async (company) => {
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        company.companyId,
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
        "Programme does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    if (program.currentStage != ProgrammeStage.AWAITING_AUTHORIZATION) {
      throw new HttpException(
        "Programme is not in pending state",
        HttpStatus.BAD_REQUEST
      );
    }
    if (program.creditEst < req.issueAmount) {
      throw new HttpException(
        "Programme issue credit amount can not exceed estimated credit amount",
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
        `Does not found a pending programme for the given programme id ${req.programmeId}`
      );
    }

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
    let date = authDate.getDate().toString().padStart(2,"0");
    let month = authDate.toLocaleString('default', { month: 'long' });
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

    const updated = await this.programmeLedger.updateProgrammeStatus(
      req.programmeId,
      ProgrammeStage.REJECTED,
      ProgrammeStage.AWAITING_AUTHORIZATION,
      this.getUserRefWithRemarks(user, req.comment)
    );
    if (!updated) {
      throw new HttpException(
        "Programme does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

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
    if (userId == undefined || userId == null) {
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

  private getUserRef = (user: any) => {
    return `${user.companyId}#${user.companyName}#${user.id}`;
  };

  private getUserRefWithRemarks = (user: any, remarks: string) => {
    return `${user.companyId}#${user.companyName}#${user.id}#${remarks}`;
  };
}
