import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HelperService } from "../util/helpers.service";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { TxType } from "../enum/txtype.enum";
import { AccountType } from "../enum/account.type.enum";
import { User } from "../entities/user.entity";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { plainToClass } from "class-transformer";
import { ProjectEntity } from "../entities/projects.entity";

@Injectable()
export class CreditBlocksManagementService {
  // Draft -/CMA.5 para 132 — itmoSerial stable through splits.
  // Exposed as a static constant so the clause survives webpack
  // minification; used by infra/E2E verification to confirm the
  // built image contains the ¶132 propagation fix.
  public static readonly ITMO_SERIAL_LINEAGE_CLAUSE =
    "Draft -/CMA.5 para 132 — itmoSerial stable through splits";

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

          // Draft -/CMA.5 para 132 — itmoSerial stable through splits
          const { parentItmoSerial, childItmoSerial } =
            this.deriveSplitItmoSerials(
              creditBlock.itmoSerial,
              transferredCreditAmountFromBlock
            );

          //update current block
          creditBlock.creditAmount =
            creditBlock.creditAmount - transferredCreditAmountFromBlock;
          creditBlock.serialNumber = firstSerialNumber;
          if (parentItmoSerial !== undefined) {
            creditBlock.itmoSerial = parentItmoSerial;
          }
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
            // Draft -/CMA.5 para 132 — itmoSerial stable through splits
            itmoSerial: childItmoSerial,
            vintage: creditBlock.vintage,
            creditAmount: transferredCreditAmountFromBlock,
            reservedCreditAmount: 0,
            transactionRecords: [],
            // F15: this split child IS the transferred portion, so its
            // final state is transferred (isNotTransferred=false). But it
            // has a fresh creditBlockId with no predecessor row, so the
            // replicator can't tell whether this transfer is a *first*
            // transfer. Carry the parent's pre-split status here: if the
            // parent was never transferred, this child's transfer is a
            // first transfer (Dec 2/CMA.3 annex para 1(a)/2 — a partial
            // first transfer is still a first transfer). The split path
            // never mutates the parent's isNotTransferred, so reading it
            // here yields the pre-split value.
            isNotTransferred: false,
            firstTransferOnSplit: creditBlock.isNotTransferred,
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

          // Draft -/CMA.5 para 132 — itmoSerial stable through splits
          const { parentItmoSerial, childItmoSerial } =
            this.deriveSplitItmoSerials(
              creditBlock.itmoSerial,
              transferredCreditAmountFromBlock
            );

          //update current block
          creditBlock.creditAmount =
            creditBlock.creditAmount - transferredCreditAmountFromBlock;
          creditBlock.serialNumber = firstSerialNumber;
          if (parentItmoSerial !== undefined) {
            creditBlock.itmoSerial = parentItmoSerial;
          }
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
            // Draft -/CMA.5 para 132 — itmoSerial stable through splits
            itmoSerial: childItmoSerial,
            vintage: creditBlock.vintage,
            creditAmount: transferredCreditAmountFromBlock,
            reservedCreditAmount: 0,
            transactionRecords: [],
            // F15: this split child IS the transferred portion, so its
            // final state is transferred (isNotTransferred=false). But it
            // has a fresh creditBlockId with no predecessor row, so the
            // replicator can't tell whether this transfer is a *first*
            // transfer. Carry the parent's pre-split status here: if the
            // parent was never transferred, this child's transfer is a
            // first transfer (Dec 2/CMA.3 annex para 1(a)/2 — a partial
            // first transfer is still a first transfer). The split path
            // never mutates the parent's isNotTransferred, so reading it
            // here yields the pre-split value.
            isNotTransferred: false,
            firstTransferOnSplit: creditBlock.isNotTransferred,
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

    // Dec 6/CMA.4 Annex I para 5 — compose the 5-component ITMO
    // identifier alongside the registry-internal serialNumber. The ITMO
    // serial is what appears in AEF Actions / Holdings tables and in
    // cross-registry transfer notifications; the internal serialNumber
    // continues to drive block-split arithmetic.
    const blockStart = alreadyIssuedCredits ? alreadyIssuedCredits + 1 : 1;
    const blockEnd = blockStart + creditAmount - 1;
    const itmoSerial = this.serialNumberManagementService.getItmoSerial(
      project.refId,
      vintage,
      blockStart,
      blockEnd
    );

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
      itmoSerial: itmoSerial,
      vintage: vintage,
      creditAmount: creditAmount,
      reservedCreditAmount: 0,
      transactionRecords: [],
      isNotTransferred: true,
      accountType: AccountType.HOLDING,
      cooperativeApproachId: project.cooperativeApproachId || null,
      authorizationPurpose: project.authorizationPurpose || null,
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

  /**
   * Draft -/CMA.5 para 132 — itmoSerial stable through splits.
   * Given a parent itmoSerial of the form
   *   `{party}-{type}-{vintage}-{activityId}-{start}:{end}`
   * derive sub-range serials for the retained remainder (parent) and
   * the transferred portion (child). The transferred portion is taken
   * from the high end of the range so child = [end-amt+1, end] and
   * retained = [start, end-amt]. Returns `undefined` serials when the
   * parent serial is missing or not structured (legacy/opaque data).
   */
  private deriveSplitItmoSerials(
    parentItmoSerial: string | null | undefined,
    transferredAmount: number
  ): { parentItmoSerial?: string; childItmoSerial?: string } {
    // See CreditBlocksManagementService.ITMO_SERIAL_LINEAGE_CLAUSE
    // (Draft -/CMA.5 para 132 — itmoSerial stable through splits).
    if (!parentItmoSerial) {
      return { parentItmoSerial: undefined, childItmoSerial: undefined };
    }
    const parts = parentItmoSerial.split("-");
    if (parts.length < 5) {
      return { parentItmoSerial: undefined, childItmoSerial: undefined };
    }
    const rangeStr = parts[parts.length - 1];
    const colonIdx = rangeStr.indexOf(":");
    if (colonIdx < 0) {
      return { parentItmoSerial: undefined, childItmoSerial: undefined };
    }
    const startNum = Number(rangeStr.substring(0, colonIdx));
    const endNum = Number(rangeStr.substring(colonIdx + 1));
    if (!Number.isFinite(startNum) || !Number.isFinite(endNum)) {
      return { parentItmoSerial: undefined, childItmoSerial: undefined };
    }
    const prefix = parts.slice(0, parts.length - 1).join("-");
    const childStart = endNum - transferredAmount + 1;
    const childEnd = endNum;
    const retainedStart = startNum;
    const retainedEnd = endNum - transferredAmount;
    return {
      parentItmoSerial: `${prefix}-${retainedStart}:${retainedEnd}`,
      childItmoSerial: `${prefix}-${childStart}:${childEnd}`,
    };
  }
}
