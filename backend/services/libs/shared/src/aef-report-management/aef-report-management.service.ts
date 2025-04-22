import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { HelperService } from "../util/helpers.service";
import { EntityManager, Repository } from "typeorm";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { TxType } from "../enum/txtype.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { plainToClass } from "class-transformer";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";
import { AefActionTypeEnum } from "../enum/aef.action.type.enum";
import { CreditRetireActionDto } from "../dto/credit.retire.action.dto";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { InjectRepository } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { RetirementACtionEnum } from "../enum/retirement.action.enum";
import { CreditRetirementTypeEnum } from "../enum/credit.retirement.type.enum";
import { ConfigService } from "@nestjs/config";
import { QueryDto } from "../dto/query.dto";
import { User } from "../entities/user.entity";
import { DataListResponseDto } from "../dto/data.list.response";
import { CompanyRole } from "../enum/company.role.enum";
import { Role } from "../casl/role.enum";

@Injectable()
export class AefReportManagementService {
  constructor(
    private readonly helperService: HelperService,
    private readonly programmeLedgerService: ProgrammeLedgerService,
    private readonly serialNumberManagementService: SerialNumberManagementService,
    @InjectRepository(CreditTransactionsEntity)
    private creditTransactionsEntityRepository: Repository<CreditTransactionsEntity>,
    private readonly configService: ConfigService,
    @InjectRepository(AefActionsTableEntity)
    private aefActionsTableEntityRepository: Repository<AefActionsTableEntity>
  ) {}

  public async handleAefRecord(
    creditBlock: CreditBlocksEntity,
    em: EntityManager
  ) {
    if (
      ![TxType.ISSUE, TxType.TRANSFER, TxType.RETIRE].includes(
        creditBlock.txType
      )
    ) {
      return;
    }
    const project = await this.programmeLedgerService.getProjectById(
      creditBlock.projectRefId
    );
    const newAefActionRecord = plainToClass(AefActionsTableEntity, {
      creditBlockStartId: this.serialNumberManagementService.getBlockStartId(
        creditBlock.serialNumber
      ),
      creditBlockEndId: this.serialNumberManagementService.getBlockEndId(
        creditBlock.serialNumber
      ),
      creditAmount: creditBlock.creditAmount,
      vintage: this.serialNumberManagementService.getVintage(
        creditBlock.serialNumber
      ),
      sector: project.sector,
      sectoralScope: project.sectoralScope,
      projectAuthorizationTime: project.projectAuthorizationTime,
      authorizationId: project.authorizationId,
      actionTime: creditBlock.txTime,
      aquiringParty: this.configService.get("AEF.defaultAquiringParty"),
    });
    if (creditBlock.txType == TxType.ISSUE) {
      newAefActionRecord.actionType = AefActionTypeEnum.AUTHORIZATION;
    } else if (creditBlock.txType == TxType.TRANSFER) {
      newAefActionRecord.actionType = AefActionTypeEnum.TRANSFER;
    } else if (creditBlock.txType == TxType.RETIRE) {
      const txData: CreditRetireActionDto = creditBlock.txData;
      if (txData.action == RetirementACtionEnum.ACCEPT) {
        const retireTrasaction =
          await this.creditTransactionsEntityRepository.findOne({
            where: { id: txData.transactionId },
          });
        if (
          retireTrasaction.retirementType ==
          CreditRetirementTypeEnum.CROSS_BORDER_TRANSACTIONS
        ) {
          newAefActionRecord.actionType =
            AefActionTypeEnum.CROSS_BOARDER_TRANSFER;
          newAefActionRecord.aquiringParty = retireTrasaction.country;
        } else {
          newAefActionRecord.actionType = AefActionTypeEnum.RETIRE;
        }
      } else {
        return;
      }
    }
    await em.save(AefActionsTableEntity, newAefActionRecord);
  }

  public async queryAefRecords(
    query: QueryDto,
    abilityCondition: string,
    user: User
  ): Promise<DataListResponseDto> {
    if (
      user.companyRole != CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
      ![Role.Admin, Role.Root].includes(user.role)
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("aef.unauthorized", []),
        HttpStatus.UNAUTHORIZED
      );
    }
    const resp = await this.aefActionsTableEntityRepository
      .createQueryBuilder("aefRecord")
      .where(this.helperService.generateWhereSQL(query, abilityCondition))
      .orderBy(
        query?.sort?.key && `"${query?.sort?.key}"`,
        query?.sort?.order,
        query?.sort?.nullFirst !== undefined
          ? query?.sort?.nullFirst === true
            ? "NULLS FIRST"
            : "NULLS LAST"
          : undefined
      )
      .skip(query.size * query.page - query.size)
      .take(query.size)
      .getManyAndCount();
    const records = resp[0];
    const staticFields = this.configService.get("AEF");
    const updatedRecords = records.map((record) => ({
      ...record,
      ...staticFields,
    }));
    return new DataListResponseDto(
      updatedRecords,
      resp.length > 1 ? resp[1] : undefined
    );
  }
}
