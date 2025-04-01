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
import { CreditRetireRequestDto } from "../dto/credit.retire.request.dto";
import { CounterService } from "../util/counter.service";
import { CounterType } from "../util/counter.type.enum";
import { CreditRetireActionDto } from "../dto/credit.retire.action.dto";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";
import { DocumentManagementService } from "../document-management/document-management.service";
import { ProjectAuditLogType } from "../enum/project.audit.log.type.enum";
import { DataResponseDto } from "../dto/data.response.dto";
import { DataResponseMessageDto } from "../dto/data.response.message";
import { BasicResponseDto } from "../dto/basic.response.dto";

@Injectable()
export class CreditTransactionsManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly companyService: CompanyService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    @InjectRepository(CreditBlocksEntity)
    private creditBlocksEntityRepository: Repository<CreditBlocksEntity>,
    private readonly counterService: CounterService,
    @InjectRepository(CreditTransactionsEntity)
    private creditTransactionsEntityRepository: Repository<CreditTransactionsEntity>,
    private readonly documentManagementService: DocumentManagementService
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
            "creditTransaction.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockDoesNotOwnBySender",
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
            "creditTransaction.notEnoughCreditAmount",
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
      await this.documentManagementService.logProjectStage(
        creditBlock.projectRefId,
        ProjectAuditLogType.CREDIT_TRANSFERED,
        user.id,
        undefined,
        {
          amount: creditTransferDto.amount,
          toCompanyId: creditTransferDto.receiverCompanyId,
          fromCompanyId: creditBlock.ownerCompanyId,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditsTransferred",
          []
        ),
        {
          amount: creditTransferDto.amount,
          toCompanyId: creditTransferDto.receiverCompanyId,
          fromCompanyId: creditBlock.ownerCompanyId,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async createRetireRequest(
    creditRetireRequestDto: CreditRetireRequestDto,
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
      const creditBlock = await this.creditBlocksEntityRepository.findOne({
        where: { creditBlockId: creditRetireRequestDto.creditBlockId },
      });
      if (!creditBlock) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditBlock.ownerCompanyId != companyId) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.creditBlockDoesNotOwnBySender",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        creditBlock.creditAmount - creditBlock.reservedCreditAmount <
        creditRetireRequestDto.amount
      ) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "creditTransaction.notEnoughCreditAmount",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      const newRetireId = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      await this.programmeLedgerService.addRetireRequest(
        newRetireId,
        creditRetireRequestDto,
        user
      );

      await this.documentManagementService.logProjectStage(
        creditBlock.projectRefId,
        ProjectAuditLogType.RETIRE_REQUESTED,
        user.id,
        undefined,
        {
          amount: creditRetireRequestDto.amount,
          remarks: creditRetireRequestDto.remarks,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.retirementReqCreated",
          []
        ),
        {
          amount: creditRetireRequestDto.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async creditRetirementAction(
    retirementAction: CreditRetireActionDto,
    user: User
  ) {
    try {
      const creditRetireRequest =
        await this.creditTransactionsEntityRepository.findOne({
          where: { id: retirementAction.transferId },
        });
      if (!creditRetireRequest) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditRetirementRequestNotExists",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (creditRetireRequest.status != CreditTransactionStatusEnum.PENDING) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "project.creditRetirementRequestNotPending",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
      if (
        retirementAction.action == RetirementACtionEnum.ACCEPT ||
        retirementAction.action == RetirementACtionEnum.REJECT
      ) {
        if (user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) {
          throw new HttpException(
            this.helperService.formatReqMessagesString("project.notDNA", []),
            HttpStatus.BAD_REQUEST
          );
        }
      } else if (retirementAction.action == RetirementACtionEnum.CANCEL) {
        if (user.companyRole != CompanyRole.PROJECT_DEVELOPER) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notProjectParticipant",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
        if (user.companyId != creditRetireRequest.senderId) {
          throw new HttpException(
            this.helperService.formatReqMessagesString(
              "project.notOwnRetirementRequest",
              []
            ),
            HttpStatus.BAD_REQUEST
          );
        }
      }
      await this.programmeLedgerService.retirementRequestAction(
        creditRetireRequest,
        retirementAction,
        user
      );

      const auditLogTypes: Record<RetirementACtionEnum, ProjectAuditLogType> = {
        [RetirementACtionEnum.ACCEPT]: ProjectAuditLogType.RETIRE_APPROVED,
        [RetirementACtionEnum.REJECT]: ProjectAuditLogType.RETIRE_REJECTED,
        [RetirementACtionEnum.CANCEL]: ProjectAuditLogType.RETIRE_CANCELLED,
      };

      const logType = auditLogTypes[retirementAction.action];

      await this.documentManagementService.logProjectStage(
        creditRetireRequest.projectRefId,
        logType,
        user.id,
        undefined,
        {
          amount: creditRetireRequest.amount,
          remarks: retirementAction.remarks,
        }
      );
      return new DataResponseMessageDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "creditTransaction.creditRetirementReqAction",
          [retirementAction.action.toLowerCase()]
        ),
        {
          amount: creditRetireRequest.amount,
        }
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  public async handleTransactionRecords(
    creditBlock: CreditBlocksEntity,
    em: EntityManager
  ) {
    if (creditBlock.txType == TxType.ISSUE) {
      const id = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      const newIssueRecord = plainToClass(CreditTransactionsEntity, {
        id: id,
        senderId: creditBlock.previousOwnerCompanyId,
        recieverId: creditBlock.ownerCompanyId,
        type: CreditTransactionTypesEnum.ISSUED,
        status: CreditTransactionStatusEnum.COMPLETED,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: creditBlock.creditAmount,
        projectRefId: creditBlock.projectRefId,
      });
      await em.save(CreditTransactionsEntity, newIssueRecord);
    } else if (creditBlock.txType == TxType.TRANSFER) {
      const id = await this.counterService.incrementCount(
        CounterType.CREDIT_TRANSACTIONS,
        0
      );
      const newTranferRecord = plainToClass(CreditTransactionsEntity, {
        id: id,
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
    } else if (creditBlock.txType == TxType.RETIRE_REQ) {
      const newRetireReq =
        creditBlock.transactionRecords[
          creditBlock.transactionRecords.length - 1
        ];
      const txData: CreditRetireRequestDto = creditBlock.txData;
      const newTranferRecord = plainToClass(CreditTransactionsEntity, {
        id: newRetireReq.id,
        senderId: creditBlock.ownerCompanyId,
        recieverId: 0,
        type: CreditTransactionTypesEnum.RETIRED,
        status: CreditTransactionStatusEnum.PENDING,
        creditBlockId: creditBlock.creditBlockId,
        serialNumber: creditBlock.serialNumber,
        amount: txData.amount,
        projectRefId: creditBlock.projectRefId,
        retirementType: txData.retirementType,
        remarks: txData.remarks,
        country: txData.country,
      });
      await em.save(CreditTransactionsEntity, newTranferRecord);
    } else if (creditBlock.txType == TxType.RETIRE) {
      const txData: CreditRetireActionDto = creditBlock.txData;
      const transactionRecordIndex = creditBlock.transactionRecords.findIndex(
        (e) => e.id == txData.transferId
      );
      const retireRequestRecord =
        creditBlock.transactionRecords[transactionRecordIndex];
      let updatedTranferRecord: CreditTransactionsEntity;
      if (retireRequestRecord.status == CreditTransactionStatusEnum.COMPLETED) {
        updatedTranferRecord = plainToClass(CreditTransactionsEntity, {
          status: retireRequestRecord.status,
          creditBlockId: creditBlock.creditBlockId,
          serialNumber: creditBlock.serialNumber,
        });
      } else {
        updatedTranferRecord = plainToClass(CreditTransactionsEntity, {
          status: retireRequestRecord.status,
        });
      }
      await em.update(
        CreditTransactionsEntity,
        { id: txData.transferId },
        updatedTranferRecord
      );
    }
  }
}
