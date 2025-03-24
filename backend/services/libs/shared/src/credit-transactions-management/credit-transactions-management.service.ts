import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { User } from "../entities/user.entity";
import { CreditTransferDto } from "../dto/credit.transfer.dto";
import { CompanyRole } from "../enum/company.role.enum";
import { HelperService } from "../util/helpers.service";
import { CompanyService } from "../company/company.service";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { EntityManager, Repository } from "typeorm";
import { TxType } from "../enum/txtype.enum";
import { plainToClass } from "class-transformer";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";

@Injectable()
export class CreditTransactionsManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(CreditBlocksEntity)
    private creditBlocksEntityRepository: Repository<CreditBlocksEntity>
  ) {}

  public async transferCredits(
    creditTransferDto: CreditTransferDto,
    user: User
  ) {
    try {
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
      const company = await this.companyService.findByCompanyId(companyId);
      if (!company) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const recieverCompany = await this.companyService.findByCompanyId(
        creditTransferDto.receiverCompanyId
      );
      if (!recieverCompany) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.noRecieverCompanyExistingInSystem",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (recieverCompany.companyRole != CompanyRole.PROJECT_DEVELOPER) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.recieverNotProjectParticipant",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: creditTransferDto.creditBlockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        creditTransferDto.amount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      await this.programmeLedgerService.transferCredits(
        creditTransferDto,
        creditBlock.projectRefId,
        user
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public createRetireRequest() {}

  public async handleTransactionRecords(
    creditBlock: CreditBlocksEntity,
    em: EntityManager
  ) {
    // if (creditBlock.txType == TxType.ISSUE) {
    //   const existingIssueRecord = await em.findOne(CreditTransactionsEntity, {
    //     where: {
    //       creditBlockId: creditBlock.creditBlockId,
    //       type: CreditTransactionTypesEnum.ISSUED,
    //     },
    //   });
    //   if (!existingIssueRecord) {
    //     const newIssueRecord = plainToClass(CreditTransactionsEntity, {
    //       senderId: creditBlock.previousOwnerCompanyId,
    //       recieverId: creditBlock.ownerCompanyId,
    //       type: CreditTransactionTypesEnum.ISSUED,
    //       status: CreditTransactionStatusEnum.COMPLETED,
    //       creditBlockId: creditBlock.creditBlockId,
    //       serialNumber: creditBlock.serialNumber,
    //       amount: creditBlock.creditAmount,
    //       projectRefId: creditBlock.projectRefId,
    //     });
    //     await em.save(CreditTransactionsEntity, newIssueRecord);
    //   }
    // }
    if (creditBlock.txType == TxType.TRANSFER) {
      const newTranferRecord = plainToClass(CreditTransactionsEntity, {
        senderId: creditBlock.previousOwnerCompanyId,
        recieverId: creditBlock.ownerCompanyId,
        type: CreditTransactionTypesEnum.TRANSFERED,
        status: CreditTransactionStatusEnum.COMPLETED,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: creditBlock.creditAmount,
        projectRefId: creditBlock.projectRefId,
      });
      await em.save(CreditTransactionsEntity, newTranferRecord);
    }
  }
}
