import { CreditTransactionsManagementService } from "../credit-transactions-management/credit-transactions-management.service";
import { DocumentManagementService } from "../document-management/document-management.service";
import { QueryDto } from "../dto/query.dto";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { ProjectManagementService } from "../project-management/project-management.service";
import { Injectable, Optional } from "@nestjs/common";
import { MarketTradeExecutionService } from "./market-trade-execution.service";

@Injectable()
export class RegionalMarketService {
  constructor(
    @Optional()
    private readonly projectManagementService?: ProjectManagementService,
    @Optional()
    private readonly creditTransactionsManagementService?: CreditTransactionsManagementService,
    @Optional()
    private readonly documentManagementService?: DocumentManagementService,
    @Optional()
    private readonly programmeLedgerService?: ProgrammeLedgerService,
    @Optional()
    private readonly marketTradeExecutionService?: MarketTradeExecutionService
  ) {}

  getBoundary() {
    return {
      subsystem: "regional-carbon-market",
      mode: "registry-otc-settlement",
      cashSettlementMode: "offline",
    };
  }

  async queryProjects(query: QueryDto, abilityCondition?: any, user?: any) {
    this.assertProvider(this.projectManagementService, "ProjectManagementService");
    return this.projectManagementService.query(query, abilityCondition, user);
  }

  async getProjectById(programmeId: string, user?: any) {
    this.assertProvider(this.projectManagementService, "ProjectManagementService");
    return this.projectManagementService.getProjectById(programmeId, user);
  }

  async queryCreditBalances(
    query: QueryDto,
    abilityCondition?: any,
    user?: any
  ) {
    this.assertProvider(
      this.creditTransactionsManagementService,
      "CreditTransactionsManagementService"
    );
    return this.creditTransactionsManagementService.queryCreditBalances(
      query,
      abilityCondition,
      user
    );
  }

  async queryTransfers(query: QueryDto, abilityCondition?: any, user?: any) {
    this.assertProvider(
      this.creditTransactionsManagementService,
      "CreditTransactionsManagementService"
    );
    return this.creditTransactionsManagementService.queryTransfers(
      query,
      abilityCondition,
      user
    );
  }

  async queryRetirements(query: QueryDto, abilityCondition?: any, user?: any) {
    this.assertProvider(
      this.creditTransactionsManagementService,
      "CreditTransactionsManagementService"
    );
    return this.creditTransactionsManagementService.queryRetirements(
      query,
      abilityCondition,
      user
    );
  }

  async createProjectDocument(documentDto: any, user?: any) {
    this.assertProvider(this.documentManagementService, "DocumentManagementService");
    return this.documentManagementService.addDocument(documentDto, user);
  }

  async performProjectDocumentAction(actionDto: any, user?: any) {
    this.assertProvider(this.documentManagementService, "DocumentManagementService");
    return this.documentManagementService.verify(actionDto, user);
  }

  async issueProjectCredits(
    activity: any,
    creditVerified: any[],
    companyId: number,
    document: any,
    txRef: string,
    user?: any
  ) {
    this.assertProvider(this.programmeLedgerService, "ProgrammeLedgerService");
    return this.programmeLedgerService.issueCredits(
      activity,
      creditVerified,
      companyId,
      document,
      txRef,
      user
    );
  }

  async executeOtcTrade(dto: any, user?: any) {
    this.assertProvider(
      this.creditTransactionsManagementService,
      "CreditTransactionsManagementService"
    );
    this.assertProvider(
      this.marketTradeExecutionService,
      "MarketTradeExecutionService"
    );

    const registryTransaction: any =
      await this.creditTransactionsManagementService.transferCredits(
        dto.transfer,
        user
      );
    const marketTrade =
      await this.marketTradeExecutionService.createFromTransfer({
        creditTransactionId: registryTransaction?.id,
        creditBlockId:
          registryTransaction?.creditBlockId ?? dto.transfer?.creditBlockId,
        sellerCompanyId: dto.transfer?.senderId,
        buyerCompanyId: dto.transfer?.recieverId ?? dto.transfer?.receiverId,
        projectRefId: dto.transfer?.projectRefId,
        serialNumber: dto.transfer?.serialNumber,
        amount: dto.transfer?.amount,
        unitPrice: dto.market?.unitPrice,
        totalPrice: dto.market?.totalPrice,
        currency: dto.market?.currency,
        tradeTime: dto.market?.tradeTime,
        settlementStatus: "SETTLED_OFFLINE",
      });

    return {
      registryTransaction,
      marketTrade,
      cashSettlementMode: "offline",
    };
  }

  private assertProvider<T>(provider: T | undefined, name: string): asserts provider is T {
    if (!provider) {
      throw new Error(`${name} is not available in the regional market module`);
    }
  }
}
