import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { CreditRetirementRequestSlDto } from "../dto/creditRetirementRequestSl.dto";
import { User } from "../entities/user.entity";
import { LedgerDBInterface } from "../ledger-db/ledger.db.interface";
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

@Injectable()
export class CreditRetirementSlService {
  constructor(
    private readonly logger: Logger,
    private programmeLedger: ProgrammeLedgerService,
    private helperService: HelperService,
    private companyService: CompanyService,
    @InjectRepository(CreditRetirementSl) private retirementRepo: Repository<CreditRetirementSl>,
    private emailHelperService: EmailHelperService
  ) {}
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

    if (programme.projectProposalStage != ProjectProposalStage.AUTHORIZED) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("creditRetirementSl.programmeNotInCreditIssuedState", []),
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
          this.helperService.formatReqMessagesString("creditRetirementSl.insufficientCompanyCredit", []),
          HttpStatus.BAD_REQUEST
        );
      }

      if (
        !fromCompany.slcfAccountBalance[creditRetirementDto.creditType] ||
        fromCompany.slcfAccountBalance[creditRetirementDto.creditType] <
          creditRetirementDto.creditAmount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString("creditRetirementSl.insufficientCompanyCredit", [
            creditRetirementDto.fromCompanyId,
            creditRetirementDto.creditType,
          ]),
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

    const retirement = new CreditRetirementSl();
    retirement.programmeId = creditRetirementDto.programmeId;
    retirement.creditType = creditRetirementDto.creditType;
    retirement.fromCompanyId = creditRetirementDto.fromCompanyId;
    retirement.toCompanyId = creditRetirementDto.toCompanyId;
    retirement.creditAmount = creditRetirementDto.creditAmount;
    retirement.comment = creditRetirementDto.comment;
    retirement.status = RetirementStatusSl.PENDING;

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
}
