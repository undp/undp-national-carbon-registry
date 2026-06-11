import { CreditTransactionsManagementService } from "../credit-transactions-management/credit-transactions-management.service";
import { QueryDto } from "../dto/query.dto";
import { ProjectManagementService } from "../project-management/project-management.service";
import { Injectable, Optional } from "@nestjs/common";

@Injectable()
export class RegionalMarketService {
  constructor(
    @Optional()
    private readonly projectManagementService?: ProjectManagementService,
    @Optional()
    private readonly creditTransactionsManagementService?: CreditTransactionsManagementService
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

  private assertProvider<T>(provider: T | undefined, name: string): asserts provider is T {
    if (!provider) {
      throw new Error(`${name} is not available in the regional market module`);
    }
  }
}
