import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HelperService } from "../util/helpers.service";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { TxType } from "../enum/txtype.enum";
import { User } from "../entities/user.entity";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { plainToClass } from "class-transformer";
import { ProjectEntity } from "../entities/projects.entity";

@Injectable()
export class CreditBlocksManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly serialNumberManagementService: SerialNumberManagementService
  ) {}

  public transferCreditAmountFromBlocks(
    creditAmount: number,
    creditBlocks: CreditBlocksEntity[],
    fromCompanyId: number,
    toCompanyId: number,
    txTime: number,
    user: User
  ) {
    let updatedBlocks: CreditBlocksEntity[] = [];
    let newBlocks: CreditBlocksEntity[] = [];
    let processedCreditAmount = 0;
    for (const creditBlock of creditBlocks) {
      const unassignedAmountOfCreditBlock =
        creditBlock.creditAmount - creditBlock.reservedCreditAmount;
      if (unassignedAmountOfCreditBlock == 0) {
        continue;
      }
      const remainingCreditAmount = creditAmount - processedCreditAmount;
      let transferredCreditAmountFromBlock = 0;

      if (unassignedAmountOfCreditBlock >= remainingCreditAmount) {
        transferredCreditAmountFromBlock = remainingCreditAmount;
        if (
          creditBlock.reservedCreditAmount == 0 &&
          unassignedAmountOfCreditBlock == remainingCreditAmount
        ) {
          creditBlock.ownerCompanyId = toCompanyId;
          creditBlock.previousOwnerCompanyId = fromCompanyId;
          creditBlock.txRef = this.getCreditBlockTxRef(
            TxType.TRANSFER,
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txType = TxType.TRANSFER;
          creditBlock.txTime = txTime;
          creditBlock.isNotTransferred = false;
          updatedBlocks.push(creditBlock);
        } else {
          const { firstSerialNumber, secondSerialNumber } =
            this.serialNumberManagementService.splitCreditBlockSerialNumber(
              creditBlock.serialNumber,
              remainingCreditAmount
            );

          //update current block
          creditBlock.creditAmount =
            creditBlock.creditAmount - transferredCreditAmountFromBlock;
          creditBlock.serialNumber = firstSerialNumber;
          creditBlock.txType = TxType.CREDIT_BLOCK_SPLIT;
          creditBlock.txRef = this.getCreditBlockTxRef(
            TxType.CREDIT_BLOCK_SPLIT,
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txTime = txTime;
          updatedBlocks.push(creditBlock);

          //create new block
          const newBlockId =
            this.serialNumberManagementService.getCreditBlockId(
              secondSerialNumber
            );
          const newBlock = plainToClass(CreditBlocksEntity, {
            creditBlockId: newBlockId,
            txRef: this.getCreditBlockTxRef(
              TxType.TRANSFER,
              fromCompanyId,
              toCompanyId,
              user.id
            ),
            txTime: txTime,
            txType: TxType.TRANSFER,
            previousOwnerCompanyId: fromCompanyId,
            ownerCompanyId: toCompanyId,
            projectRefId: creditBlock.projectRefId,
            serialNumber: secondSerialNumber,
            vintage: creditBlock.vintage,
            creditAmount: transferredCreditAmountFromBlock,
            reservedCreditAmount: 0,
            transactionRecords: [],
            isNotTransferred: false,
          });
          newBlocks.push(newBlock);
        }
        processedCreditAmount += transferredCreditAmountFromBlock;
        break;
      } else {
        transferredCreditAmountFromBlock = unassignedAmountOfCreditBlock;
        if (creditBlock.reservedCreditAmount == 0) {
          //update current block
          creditBlock.ownerCompanyId = toCompanyId;
          creditBlock.previousOwnerCompanyId = fromCompanyId;
          creditBlock.txRef = this.getCreditBlockTxRef(
            TxType.TRANSFER,
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txType = TxType.TRANSFER;
          creditBlock.txTime = txTime;
          creditBlock.isNotTransferred = false;
          updatedBlocks.push(creditBlock);
        } else {
          const { firstSerialNumber, secondSerialNumber } =
            this.serialNumberManagementService.splitCreditBlockSerialNumber(
              creditBlock.serialNumber,
              transferredCreditAmountFromBlock
            );

          //update current block
          creditBlock.creditAmount =
            creditBlock.creditAmount - transferredCreditAmountFromBlock;
          creditBlock.serialNumber = firstSerialNumber;
          creditBlock.txType = TxType.CREDIT_BLOCK_SPLIT;
          creditBlock.txRef = this.getCreditBlockTxRef(
            TxType.CREDIT_BLOCK_SPLIT,
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txTime = txTime;
          updatedBlocks.push(creditBlock);

          //create new block
          const newBlockId =
            this.serialNumberManagementService.getCreditBlockId(
              secondSerialNumber
            );
          const newBlock = plainToClass(CreditBlocksEntity, {
            creditBlockId: newBlockId,
            txRef: this.getCreditBlockTxRef(
              TxType.TRANSFER,
              fromCompanyId,
              toCompanyId,
              user.id
            ),
            txTime: txTime,
            txType: TxType.TRANSFER,
            previousOwnerCompanyId: fromCompanyId,
            ownerCompanyId: toCompanyId,
            projectRefId: creditBlock.projectRefId,
            serialNumber: secondSerialNumber,
            vintage: creditBlock.vintage,
            creditAmount: transferredCreditAmountFromBlock,
            reservedCreditAmount: 0,
            transactionRecords: [],
            isNotTransferred: false,
          });
          newBlocks.push(newBlock);
        }
        processedCreditAmount += transferredCreditAmountFromBlock;
      }
    }
    if (processedCreditAmount < creditAmount) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "creditBlocks.senderDoesNotHaveEnoughCreditAmount",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }
    return { newBlocks, updatedBlocks };
  }

  public getNewCreditBlock(
    creditAmount: number,
    vintage: string,
    project: ProjectEntity,
    alreadyIssuedCredits: number,
    txTime: number,
    user: User
  ): CreditBlocksEntity {
    const serialNumber =
      this.serialNumberManagementService.getCreditBlockSerialNumber(
        project.serialNumber,
        creditAmount,
        vintage,
        alreadyIssuedCredits
      );
    const creditBlockId =
      this.serialNumberManagementService.getCreditBlockId(serialNumber);
    const newBlock = plainToClass(CreditBlocksEntity, {
      creditBlockId: creditBlockId,
      txRef: this.getCreditBlockTxRef(
        TxType.ISSUE,
        project.companyId,
        project.companyId,
        user.id
      ),
      txTime: txTime,
      txType: TxType.ISSUE,
      previousOwnerCompanyId: null,
      ownerCompanyId: project.companyId,
      projectRefId: project.refId,
      serialNumber: serialNumber,
      vintage: vintage,
      creditAmount: creditAmount,
      reservedCreditAmount: 0,
      transactionRecords: [],
      isNotTransferred: true,
    });
    return newBlock;
  }

  public getCreditBlockTxRef(
    txType: TxType,
    fromCompanyId: number,
    toCompanyId: number,
    actionByUserId: number,
    data?: string
  ) {
    return `${txType}#${fromCompanyId}#${toCompanyId}#${actionByUserId}${
      data ? `#${data}` : ``
    }`;
  }
}
