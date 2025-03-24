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

  public transferCreditAmountFromBlock(
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
        if (creditBlock.reservedCreditAmount == 0) {
          creditBlock.ownerCompanyId = toCompanyId;
          creditBlock.previousOwnerCompanyId = fromCompanyId;
          creditBlock.txRef = this.getCreditBlockTxRef(
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txType = TxType.TRANSFER;
          creditBlock.txTime = txTime;
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
          creditBlock.txRef = this.getCreditBlockTxRef(
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txTime = txTime;
          creditBlock.txType = TxType.CREDIT_BLOCK_SPLIT;
          updatedBlocks.push(creditBlock);

          //create new block
          const newBlockId =
            this.serialNumberManagementService.getCreditBlockId(
              secondSerialNumber
            );
          const newBlock = plainToClass(CreditBlocksEntity, {
            creditBlockId: newBlockId,
            txRef: this.getCreditBlockTxRef(
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
          });
          newBlocks.push(newBlock);
        }
        break;
      } else {
        transferredCreditAmountFromBlock = creditBlock.creditAmount;
        if (creditBlock.reservedCreditAmount == 0) {
          //update current block
          creditBlock.ownerCompanyId = toCompanyId;
          creditBlock.previousOwnerCompanyId = fromCompanyId;
          creditBlock.txRef = this.getCreditBlockTxRef(
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txType = TxType.TRANSFER;
          creditBlock.txTime = txTime;
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
          creditBlock.txRef = this.getCreditBlockTxRef(
            fromCompanyId,
            toCompanyId,
            user.id
          );
          creditBlock.txTime = txTime;
          creditBlock.txType = TxType.CREDIT_BLOCK_SPLIT;
          updatedBlocks.push(creditBlock);

          //create new block
          const newBlockId =
            this.serialNumberManagementService.getCreditBlockId(
              secondSerialNumber
            );
          const newBlock = plainToClass(CreditBlocksEntity, {
            creditBlockId: newBlockId,
            txRef: this.getCreditBlockTxRef(
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
          });
          newBlocks.push(newBlock);
        }
      }
      processedCreditAmount += transferredCreditAmountFromBlock;
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

  public issueCreditBlock(
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
    });
    return newBlock;
  }

  public getCreditBlockTxRef(
    fromCompanyId: number,
    toCompanyId: number,
    actionByUserId: number
  ) {
    return `${fromCompanyId}#${toCompanyId}#${actionByUserId}`;
  }
}
