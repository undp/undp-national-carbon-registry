import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { CreditRetirementRequestSlDto } from "../dto/creditRetirementRequestSl.dto";
import { User } from "../entities/user.entity";
import { HelperService } from "../util/helpers.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { CreditType } from "../enum/creditType.enum";
import { CompanyService } from "../company/company.service";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { RetirementStatusSl } from "../enum/retirementStatusSl.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EmailHelperService } from "../email-helper/email-helper.service";
import { EmailTemplates } from "../email-helper/email.template";
import { CreditRetirementStatusUpdateSlDto } from "../dto/creditRetirementStatusUpdateSl.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { ConfigService } from "@nestjs/config";
import { Company } from "../entities/company.entity";
import { TxRefGeneratorService } from "../util/txRef-generator.service";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { SLCFSerialNumberGeneratorService } from "../util/slcfSerialNumberGenerator.service";
import { VoluntarilyCancellationCertificateGenerator } from "../util/voluntarilyCancellationCertificate.gen";
import { QueryDto } from "../dto/query.dto";
import { DataListResponseDto } from "../dto/data.list.response";
import { CreditRetirementSlView } from "../entities/creditRetirementSl.view.entity";

@Injectable()
export class CreditRetirementSlService {
  constructor(
    private readonly logger: Logger,
    private programmeLedger: ProgrammeLedgerService,
    private helperService: HelperService,
    private companyService: CompanyService,
    @InjectRepository(CreditRetirementSl) private retirementRepo: Repository<CreditRetirementSl>,
    @InjectRepository(CreditRetirementSlView)
    private retirementViewRepo: Repository<CreditRetirementSlView>,
    private emailHelperService: EmailHelperService,
    private configService: ConfigService,
    private txRefGeneratorService: TxRefGeneratorService,
    private counterService: CounterService,
    private serialGenerator: SLCFSerialNumberGeneratorService,
    private voluntarilyCancellationCertificateGenerator: VoluntarilyCancellationCertificateGenerator
  ) {}

  //MARK: Create Retirement
  async createCreditRetirementRequest(
    creditRetirementDto: CreditRetirementRequestSlDto,
    user: User
  ) {
    this.logger.log(
      `SL Credit Retirement request by ${creditRetirementDto.fromCompanyId}-${
        user.id
      } received ${JSON.stringify(creditRetirementDto)}`
    );

    if (user.companyId != creditRetirementDto.fromCompanyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.cannotRetireForOthers", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (creditRetirementDto.creditType == CreditType.TRACK_1 && !creditRetirementDto.toCompanyId) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.toCompanyIdRequired", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.programmeLedger.getProgrammeSlById(
      creditRetirementDto.programmeId
    );

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.programmeNotExist", [
          creditRetirementDto.programmeId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme.projectProposalStage != ProjectProposalStage.AUTHORISED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditRetirementSl.programmeNotInCreditIssuedState",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    if (programme.purposeOfCreditDevelopment !== creditRetirementDto.creditType) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.creditTypeMismatch", []),
        HttpStatus.BAD_REQUEST
      );
    }

    if (!programme.creditBalance || programme.creditBalance < creditRetirementDto.creditAmount) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.insufficientCredit", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const fromCompany = await this.companyService.findByCompanyId(
      creditRetirementDto.fromCompanyId
    );

    if (!fromCompany) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.companyDoesNotExist", [
          creditRetirementDto.fromCompanyId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    if (fromCompany) {
      if (!fromCompany.slcfAccountBalance) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditRetirementSl.insufficientCompanyCredit",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        !fromCompany.slcfAccountBalance[creditRetirementDto.creditType] ||
        fromCompany.slcfAccountBalance[creditRetirementDto.creditType] <
          creditRetirementDto.creditAmount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditRetirementSl.insufficientCompanyCredit",
            [creditRetirementDto.fromCompanyId, creditRetirementDto.creditType]
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    let toCompany;
    if (creditRetirementDto.toCompanyId) {
      toCompany = await this.companyService.findByCompanyId(creditRetirementDto.toCompanyId);

      if (!toCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("company.companyDoesNotExist", [
            creditRetirementDto.toCompanyId,
          ]),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    const requestId = await this.counterService.incrementCount(
      CounterType.RETIREMENT_REQUEST_SL,
      4
    );
    const previousRef = await this.findLatestTxRefByProgrammeId(creditRetirementDto.programmeId);

    const retirement = new CreditRetirementSl();
    retirement.requestId = requestId;
    retirement.programmeId = creditRetirementDto.programmeId;
    retirement.creditType = creditRetirementDto.creditType;
    retirement.fromCompanyId = creditRetirementDto.fromCompanyId;
    retirement.toCompanyId = creditRetirementDto.toCompanyId;
    retirement.creditAmount = creditRetirementDto.creditAmount;
    retirement.comment = creditRetirementDto.comment;
    retirement.status = RetirementStatusSl.PENDING;
    retirement.txRef = this.serialGenerator.generateRetirementReferenceNumber(
      creditRetirementDto.programmeId,
      previousRef
    );

    const creditRetirementRequest = await this.retirementRepo.save(retirement);

    if (creditRetirementRequest) {
      await this.emailHelperService.sendEmailToSLCFAdmins(
        creditRetirementDto.creditType === CreditType.TRACK_1
          ? EmailTemplates.CREDIT_TRANSFER_SL_REQUEST
          : EmailTemplates.CREDIT_RETIRE_SL_REQUEST,
        { credits: creditRetirementDto.creditAmount },
        programme.programmeId,
        fromCompany.companyId
      );
    }

    return creditRetirementRequest;
  }

  //MARK: Query Retirements
  async queryRetirements(query: QueryDto, abilityCondition: string, user: User): Promise<any> {
    let queryBuilder = await this.retirementViewRepo
      .createQueryBuilder("credit_retirements")
      .where(
        this.helperService.generateWhereSQL(
          query,
          this.helperService.parseMongoQueryToSQLWithTable("credit_retirements", abilityCondition)
        )
      );

    // if (
    //   query.filterBy !== null &&
    //   query.filterBy !== undefined &&
    //   query.filterBy.key === "ministryLevel"
    // ) {
    //   queryBuilder = queryBuilder.andWhere(
    //     "programme_transfer.programmeSectoralScope IN (:...allowedScopes)",
    //     {
    //       allowedScopes: query.filterBy.value,
    //     }
    //   );
    // }

    const resp = await queryBuilder
      .orderBy(
        query?.sort?.key && this.helperService.generateSortCol(query?.sort?.key),
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
        e.toCompany = e.toCompany.length > 0 && e.toCompany[0] === null ? [] : e.toCompany;

        // if (e.toCompanyMeta && e.toCompanyMeta.country) {
        //   e.toCompanyMeta["countryName"] = await this.countryService.getCountryName(
        //     e.toCompanyMeta.country
        //   );
        // }
      }
    }

    return new DataListResponseDto(
      resp.length > 0 ? resp[0] : undefined,
      resp.length > 1 ? resp[1] : undefined
    );
  }

  //MARK: Update Status
  async updateCreditRetirementRequestStatus(dto: CreditRetirementStatusUpdateSlDto, user: User) {
    const retirementRequest = await this.retirementRepo.findOneBy({
      requestId: dto.requestId,
    });

    if (!retirementRequest) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.requestNotExist", [
          dto.requestId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    if (retirementRequest.status !== RetirementStatusSl.PENDING) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.notPendingRequest", [
          dto.requestId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    const programme = await this.programmeLedger.getProgrammeSlById(retirementRequest.programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.programmeNotExist", [
          retirementRequest.programmeId,
        ]),
        HttpStatus.BAD_REQUEST
      );
    }

    const companyCF = await this.companyService.findOrganizationByCountryAndCompanyRole(
      this.configService.get("systemCountryCode"),
      CompanyRole.CLIMATE_FUND
    );

    switch (dto.status) {
      case RetirementStatusSl.APPROVED:
        return await this.approveCreditRetirementRequest(
          user,
          programme,
          retirementRequest,
          companyCF,
          dto.comment
        );
        break;

      case RetirementStatusSl.REJECTED:
        return await this.rejectCreditRetirementRequest(
          user,
          programme,
          retirementRequest,
          dto.comment
        );
        break;

      case RetirementStatusSl.CANCELLED:
        return await this.cancelCreditRetirementRequest(
          user,
          programme,
          retirementRequest,
          dto.comment
        );
        break;

      default:
        throw new HttpException(
          this.helperService.formatReqMessagesString("creditRetirementSl.incorrectStatus", [
            dto.status,
          ]),
          HttpStatus.BAD_REQUEST
        );
        break;
    }
  }

  //MARK: Approve Retirement
  async approveCreditRetirementRequest(
    user: User,
    programme: ProgrammeSl,
    retirementRequest: CreditRetirementSl,
    climateFundOrg: Company,
    remark: string
  ) {
    if (!this.isSLCFAdminOrManager(user)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAUth", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const userOrg = await this.companyService.findByCompanyId(user.companyId);
    const fromCompany = await this.companyService.findByCompanyId(retirementRequest.fromCompanyId);
    const toCompany = await this.companyService.findByCompanyId(retirementRequest.toCompanyId);

    const previousCreditStartSerial = programme.creditStartSerialNumber;
    const endCreditSerial = this.serialGenerator.calculateCreditSerialNumber(
      previousCreditStartSerial,
      retirementRequest.creditAmount - 1
    );

    const txRef = this.txRefGeneratorService.getCreditTransferRequestApproveRef(
      user,
      userOrg,
      fromCompany,
      toCompany,
      retirementRequest
    );

    try {
      await this.programmeLedger.approveCreditTransfer(
        retirementRequest,
        climateFundOrg.companyId,
        txRef
      );
    } catch (error) {
      this.logger.error("Approve Credit Retirement Request Failed due to {}", error);
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditRetirementSl.retirementReqApproveFailed",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const certificateData = {
      companyName: fromCompany.name,
      noOfSCERs: retirementRequest.creditAmount,
      yearVerified: new Date().getFullYear(),
      transactionReference: retirementRequest.txRef,
      dateOfTransaction: this.formatCustomDate(retirementRequest.createdTime),
      startSerialNumber: previousCreditStartSerial,
      endSerialNumber: endCreditSerial,
      totalSCERs: retirementRequest.creditAmount,
      documentDate: this.formatCustomDate(),
      projectName: programme.title,
      projectProponent: fromCompany.name,
    };

    const url =
      await this.voluntarilyCancellationCertificateGenerator.generateVoluntaryCancellationCertificate(
        certificateData
      );

    const updatedRequest = await this.retirementRepo.update(
      {
        requestId: retirementRequest.requestId,
      },
      {
        status: RetirementStatusSl.APPROVED,
        approvedTime: new Date().getTime(),
        voluntaryCancelationCertificateUrl: url,
      }
    );

    if (updatedRequest) {
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        programme.companyId,
        retirementRequest.creditType === CreditType.TRACK_1
          ? EmailTemplates.CREDIT_TRANSFER_SL_REQUEST_APPROVED
          : EmailTemplates.CREDIT_RETIRE_SL_REQUEST_APPROVED,
        {
          programmeName: programme.title,
          credits: retirementRequest.creditAmount,
          serialNumber: programme.serialNo,
          remark,
        }
      );
    }

    return new BasicResponseDto(
      HttpStatus.OK,
      this.helperService.formatReqMessagesString(
        "creditRetirementSl.retirementReqApproveSuccess",
        []
      )
    );
  }

  //MARK: Reject Retirement
  async rejectCreditRetirementRequest(
    user: User,
    programme: ProgrammeSl,
    retirementRequest: CreditRetirementSl,
    remark: string
  ) {
    if (!this.isSLCFAdminOrManager(user)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAUth", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedRequest = await this.retirementRepo.update(
      {
        requestId: retirementRequest.requestId,
      },
      {
        status: RetirementStatusSl.REJECTED,
      }
    );

    if (updatedRequest) {
      await this.emailHelperService.sendEmailToOrganisationAdmins(
        programme.companyId,
        programme.purposeOfCreditDevelopment === CreditType.TRACK_1
          ? EmailTemplates.CREDIT_TRANSFER_SL_REQUEST_REJECTED
          : EmailTemplates.CREDIT_RETIRE_SL_REQUEST_REJECTED,
        {
          programmeName: programme.title,
          credits: retirementRequest.creditAmount,
          serialNumber: programme.serialNo,
          remark,
        }
      );
    }

    return new BasicResponseDto(
      HttpStatus.OK,
      this.helperService.formatReqMessagesString(
        "creditRetirementSl.retirementReqRejectSuccess",
        []
      )
    );
  }

  //MARK: Cancel Retirement
  async cancelCreditRetirementRequest(
    user: User,
    programme: ProgrammeSl,
    retirementRequest: CreditRetirementSl,
    remark: string
  ) {
    if (!this.isProjectParticipant(user)) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAUth", []),
        HttpStatus.BAD_REQUEST
      );
    }

    const updatedRequest = await this.retirementRepo.update(
      {
        requestId: retirementRequest.requestId,
      },
      {
        status: RetirementStatusSl.CANCELLED,
      }
    );

    if (updatedRequest) {
      await this.emailHelperService.sendEmailToSLCFAdmins(
        programme.purposeOfCreditDevelopment === CreditType.TRACK_1
          ? EmailTemplates.CREDIT_TRANSFER_SL_REQUEST_CANCELED
          : EmailTemplates.CREDIT_RETIRE_SL_REQUEST_CANCELED,
        {
          credits: retirementRequest.creditAmount,
          remark,
        },
        programme.programmeId,
        programme.companyId
      );
    }

    return new BasicResponseDto(
      HttpStatus.OK,
      this.helperService.formatReqMessagesString(
        "creditRetirementSl.retirementReqCancelSuccess",
        []
      )
    );
  }

  //MARK: isSLCFAdminOrManager
  isSLCFAdminOrManager(user: User) {
    return (
      user.companyRole === CompanyRole.CLIMATE_FUND &&
      (user.role === Role.Admin || user.role === Role.Manager)
    );
  }

  //MARK: isProjectParticipant
  isProjectParticipant(user: User) {
    return (
      user.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
      (user.role === Role.Admin || user.role === Role.Manager)
    );
  }

  //MARK: findLatestTxRefByProgrammeId
  async findLatestTxRefByProgrammeId(programmeId: string): Promise<string> {
    // Retrieve all requests for the given programmeId, ordered by createdTime in descending order
    const requests = await this.retirementRepo.find({
      where: { programmeId: programmeId },
      order: { createdTime: "DESC" },
    });

    if (requests.length === 0) {
      return null;
    }

    // Return the txRef of the latest request (the first in the sorted list)
    return requests[0].txRef;
  }

  //MARK: formatCustomDate
  formatCustomDate(epoch?) {
    // If an epoch is provided, create a Date object for that epoch; otherwise, use the current date
    const date = epoch ? new Date(parseInt(epoch, 10)) : new Date();

    // Extract year, month, and day
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth returns 0-11, so add 1 to adjust to 1-12
    const day = date.getDate();

    // Pad the month and day to ensure they are always two digits
    const formattedMonth = month.toString().padStart(2, "0");
    const formattedDay = day.toString().padStart(2, "0");

    // Return the formatted date string in YYYY/MM/DD format
    return `${year}/${formattedMonth}/${formattedDay}`;
  }
}
