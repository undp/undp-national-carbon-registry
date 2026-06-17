import { Injectable, Optional } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "../entities/company.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { CompanyRole } from "../enum/company.role.enum";
import { CompanyState } from "../enum/company.state.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditTransactionTypesEnum } from "../enum/credit.transaction.types.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { CreditBlockRetirementsViewEntity } from "../view-entities/credit.block.retirements.view.entity";
import { MarketTradeExecutionService } from "./market-trade-execution.service";

type ProjectionSection =
  | "projects"
  | "issuance"
  | "trades"
  | "retirements"
  | "accounts";
type SectionStatus = "real" | "fallback";
type GovernanceBand = "neutral" | "pressure" | "improving" | "balanced" | "leading";

type GovernanceScoreBreakdown = {
  base: number;
  project: number;
  supply: number;
  trading: number;
  retirement: number;
  closureBonus: number;
  unclosedDemandPenalty: number;
};

interface SectionResult<T> {
  status: SectionStatus;
  errors: string[];
  value: T;
}

type RegionalCompanyContext = {
  id: number;
  name: string;
  city?: string;
  province?: string;
};

type RegionalMetric = {
  city: string;
  province?: string;
  accountCount: number;
  projectCount: number;
  issuedCredits: number;
  soldCredits: number;
  boughtCredits: number;
  retiredCredits: number;
  availableBalance: number;
  tradeValue: number;
  governanceScore: number;
  governanceBand: GovernanceBand;
  governanceScoreBreakdown: GovernanceScoreBreakdown;
};

type RegionalRetirementContext = {
  senderId?: number;
  creditAmount: number;
};

@Injectable()
export class RegionalMarketProjectionService {
  constructor(
    @Optional()
    private readonly marketTradeExecutionService?: MarketTradeExecutionService,
    @Optional()
    @InjectRepository(ProjectEntity)
    private readonly projectRepository?: Repository<ProjectEntity>,
    @Optional()
    @InjectRepository(CreditTransactionsEntity)
    private readonly creditTransactionsRepository?: Repository<CreditTransactionsEntity>,
    @Optional()
    @InjectRepository(CreditBlockRetirementsViewEntity)
    private readonly retirementRepository?: Repository<CreditBlockRetirementsViewEntity>,
    @Optional()
    @InjectRepository(Company)
    private readonly companyRepository?: Repository<Company>
  ) {}

  async getDashboardSummary() {
    const [
      projectProjection,
      issuanceProjection,
      tradeProjection,
      retirementProjection,
      accountProjection,
    ] =
      await Promise.all([
        this.projectProjection(),
        this.issuanceProjection(),
        this.tradeProjection(),
        this.retirementProjection(),
        this.accountProjection(),
      ]);
    const companyContext = await this.companyContextProjection();
    const retirementContext = await this.retirementContextProjection();
    const enrichedTrades = this.enrichRecentTrades(
      tradeProjection.value.recentTrades,
      companyContext
    );
    const aggregateTrades = this.enrichRecentTrades(
      tradeProjection.value.aggregateTrades,
      companyContext
    );
    const regionalMetrics = this.buildRegionalMetrics(
      companyContext,
      projectProjection.value.aggregateProjectRegistrations,
      aggregateTrades,
      retirementContext
    );

    const sectionStatus: Record<ProjectionSection, SectionStatus> = {
      projects: projectProjection.status,
      issuance: issuanceProjection.status,
      trades: tradeProjection.status,
      retirements: retirementProjection.status,
      accounts: accountProjection.status,
    };
    const projectionErrors = [
      ...projectProjection.errors,
      ...issuanceProjection.errors,
      ...tradeProjection.errors,
      ...retirementProjection.errors,
      ...accountProjection.errors,
    ];
    const projectionAvailable = Object.values(sectionStatus).every(
      (status) => status === "real"
    );

    return {
      dataStatus: projectionAvailable ? "real" : "fallback",
      projectionAvailable,
      projectionErrors,
      sectionStatus,
      metrics: {
        totalIssuedCredits: issuanceProjection.value.totalIssuedCredits,
        activeProjectCount: projectProjection.value.activeProjectCount,
        transferVolume: tradeProjection.value.tradeSummary.totalAmount,
        retiredCredits: retirementProjection.value.retiredCredits,
        averageOtcPrice: tradeProjection.value.tradeSummary.averagePrice,
        otcTradeCount: tradeProjection.value.tradeSummary.tradeCount,
        otcTradeValue: tradeProjection.value.tradeSummary.totalValue,
      },
      accountSummary: accountProjection.value,
      recentProjectRegistrations:
        projectProjection.value.recentProjectRegistrations,
      recentTrades: enrichedTrades,
      supervisoryAlerts: [],
      regionalMetrics,
      generatedAt: new Date().toISOString(),
    };
  }

  private async projectProjection(): Promise<
    SectionResult<{
      activeProjectCount: number;
      recentProjectRegistrations: Record<string, unknown>[];
      aggregateProjectRegistrations: Record<string, unknown>[];
    }>
  > {
    if (!this.projectRepository) {
      return this.fallback("projects", "project repository unavailable", {
        activeProjectCount: 0,
        recentProjectRegistrations: [],
        aggregateProjectRegistrations: [],
      });
    }

    try {
      const activeStages = [
        ProjectProposalStage.AUTHORISED,
        ProjectProposalStage.AUTHORIZED,
      ];
      const [activeProjectCount, recentProjects, aggregateProjects] = await Promise.all([
        this.projectRepository.count({
          where: activeStages.map((projectProposalStage) => ({
            projectProposalStage,
          })),
        }),
        this.projectRepository.find({
          where: activeStages.map((projectProposalStage) => ({
            projectProposalStage,
          })),
          order: { createTime: "DESC" },
          take: 10,
        }),
        this.projectRepository.find({
          where: activeStages.map((projectProposalStage) => ({
            projectProposalStage,
          })),
          order: { createTime: "DESC" },
        }),
      ]);
      const toProjectRegistration = (project: ProjectEntity) => ({
        id: project.refId,
        refId: project.refId,
        serialNumber: project.serialNumber,
        projectName: project.title,
        companyId: project.companyId,
        ownerName: String(project.companyId ?? ""),
        sector: project.sector,
        sectoralScope: project.sectoralScope,
        status: project.projectProposalStage,
        registeredAt: project.createTime
          ? new Date(Number(project.createTime)).toISOString()
          : null,
        creditEst: Number(project.creditEst ?? 0),
        creditIssued: Number(project.creditIssued ?? 0),
      });

      return {
        status: "real",
        errors: [],
        value: {
          activeProjectCount,
          recentProjectRegistrations: recentProjects.map(toProjectRegistration),
          aggregateProjectRegistrations: aggregateProjects.map(toProjectRegistration),
        },
      };
    } catch (error) {
      return this.fallback("projects", this.errorMessage(error), {
        activeProjectCount: 0,
        recentProjectRegistrations: [],
        aggregateProjectRegistrations: [],
      });
    }
  }

  private async issuanceProjection(): Promise<
    SectionResult<{ totalIssuedCredits: number }>
  > {
    if (!this.projectRepository) {
      return this.fallback("issuance", "project repository unavailable", {
        totalIssuedCredits: 0,
      });
    }

    try {
      const raw = await this.projectRepository
        .createQueryBuilder("project")
        .select("COALESCE(SUM(project.creditIssued), 0)", "issued")
        .getRawOne();

      return {
        status: "real",
        errors: [],
        value: { totalIssuedCredits: Number(raw?.issued ?? 0) },
      };
    } catch (projectError) {
      if (!this.creditTransactionsRepository) {
        return this.fallback("issuance", this.errorMessage(projectError), {
          totalIssuedCredits: 0,
        });
      }

      try {
        const raw = await this.creditTransactionsRepository
          .createQueryBuilder("transaction")
          .select("COALESCE(SUM(transaction.amount), 0)", "issued")
          .where("transaction.type = :type", {
            type: CreditTransactionTypesEnum.ISSUED,
          })
          .andWhere("transaction.status = :status", {
            status: CreditTransactionStatusEnum.COMPLETED,
          })
          .getRawOne();

        return {
          status: "real",
          errors: [],
          value: { totalIssuedCredits: Number(raw?.issued ?? 0) },
        };
      } catch (transactionError) {
        return this.fallback("issuance", this.errorMessage(transactionError), {
          totalIssuedCredits: 0,
        });
      }
    }
  }

  private async tradeProjection(): Promise<
    SectionResult<{
      tradeSummary: {
        tradeCount: number;
        totalAmount: number;
        totalValue: number;
        averagePrice: number;
      };
      recentTrades: unknown[];
      aggregateTrades: unknown[];
    }>
  > {
    const emptyTradeSummary = {
      tradeCount: 0,
      totalAmount: 0,
      totalValue: 0,
      averagePrice: 0,
    };

    if (!this.marketTradeExecutionService) {
      return this.fallback("trades", "market trade projection service unavailable", {
        tradeSummary: emptyTradeSummary,
        recentTrades: [],
        aggregateTrades: [],
      });
    }

    try {
      const [tradeSummary, recentTrades, aggregateTrades] = await Promise.all([
        this.marketTradeExecutionService.getTradeSummary(),
        this.marketTradeExecutionService.queryTrades({
          take: 10,
        }),
        this.marketTradeExecutionService.queryTrades({
          take: null,
        }),
      ]);

      return {
        status: "real",
        errors: [],
        value: { tradeSummary, recentTrades, aggregateTrades },
      };
    } catch (error) {
      return this.fallback("trades", this.errorMessage(error), {
        tradeSummary: emptyTradeSummary,
        recentTrades: [],
        aggregateTrades: [],
      });
    }
  }

  private async retirementProjection(): Promise<
    SectionResult<{ retiredCredits: number }>
  > {
    if (!this.retirementRepository) {
      return this.fallback("retirements", "retirement repository unavailable", {
        retiredCredits: 0,
      });
    }

    try {
      const raw = await this.retirementRepository
        .createQueryBuilder("retirement")
        .select("COALESCE(SUM(retirement.creditAmount), 0)", "retired")
        .where("retirement.status = :status", {
          status: CreditTransactionStatusEnum.COMPLETED,
        })
        .getRawOne();

      return {
        status: "real",
        errors: [],
        value: { retiredCredits: Number(raw?.retired ?? 0) },
      };
    } catch (error) {
      return this.fallback("retirements", this.errorMessage(error), {
        retiredCredits: 0,
      });
    }
  }

  private async accountProjection(): Promise<
    SectionResult<{
      totalAccounts: number;
      accountTypes: Array<{ label: string; count: number; value: string }>;
    }>
  > {
    const emptyAccountSummary = {
      totalAccounts: 0,
      accountTypes: [
        { label: "市场参与主体", count: 0, value: "0 家" },
        { label: "地方主管机构", count: 0, value: "0 家" },
        { label: "项目业主", count: 0, value: "0 家" },
        { label: "核证机构", count: 0, value: "0 家" },
      ],
    };

    if (!this.companyRepository) {
      return this.fallback("accounts", "company repository unavailable", {
        ...emptyAccountSummary,
      });
    }

    try {
      const rawCounts = await this.companyRepository
        .createQueryBuilder("company")
        .select("company.companyRole", "companyRole")
        .addSelect("COUNT(company.companyId)", "count")
        .where("company.state = :activeState", {
          activeState: CompanyState.ACTIVE,
        })
        .groupBy("company.companyRole")
        .getRawMany();

      const countsByRole = new Map<string, number>(
        rawCounts.map((row) => [
          String(row.companyRole),
          Number(row.count ?? 0),
        ])
      );
      const projectDeveloperCount =
        countsByRole.get(CompanyRole.PROJECT_DEVELOPER) ?? 0;
      const certifierCount =
        countsByRole.get(CompanyRole.INDEPENDENT_CERTIFIER) ?? 0;
      const localComplianceCount =
        (countsByRole.get(CompanyRole.DESIGNATED_NATIONAL_AUTHORITY) ?? 0) +
        (countsByRole.get(CompanyRole.MINISTRY) ?? 0);
      const totalAccounts = Array.from(countsByRole.values()).reduce(
        (sum, count) => sum + count,
        0
      );

      return {
        status: "real",
        errors: [],
        value: {
          totalAccounts,
          accountTypes: [
            this.accountType("市场参与主体", totalAccounts),
            this.accountType("地方主管机构", localComplianceCount),
            this.accountType("项目业主", projectDeveloperCount),
            this.accountType("核证机构", certifierCount),
          ],
        },
      };
    } catch (error) {
      return this.fallback("accounts", this.errorMessage(error), {
        ...emptyAccountSummary,
      });
    }
  }

  private accountType(label: string, count: number) {
    return {
      label,
      count,
      value: `${count.toLocaleString("zh-CN")} 家`,
    };
  }

  private async companyContextProjection(): Promise<
    Map<number, RegionalCompanyContext>
  > {
    if (!this.companyRepository) {
      return new Map();
    }

    try {
      const companies = await this.companyRepository.find({
        where: { state: CompanyState.ACTIVE },
      });

      return new Map(
        companies.map((company) => {
          const city = this.firstLocation(company.regions);
          const province = this.firstLocation(company.provinces);

          return [
            Number(company.companyId),
            {
              id: Number(company.companyId),
              name: String(company.name ?? company.companyId),
              city,
              province,
            },
          ];
        })
      );
    } catch {
      return new Map();
    }
  }

  private async retirementContextProjection(): Promise<RegionalRetirementContext[]> {
    if (!this.retirementRepository) {
      return [];
    }

    try {
      const retirements = await this.retirementRepository.find({
        where: { status: CreditTransactionStatusEnum.COMPLETED },
      });

      return retirements.map((retirement) => ({
        senderId: Number(retirement.senderId ?? 0),
        creditAmount: Number(retirement.creditAmount ?? 0),
      }));
    } catch {
      return [];
    }
  }

  private enrichRecentTrades(
    recentTrades: unknown[],
    companies: Map<number, RegionalCompanyContext>
  ) {
    return recentTrades.map((trade) => {
      const row = trade as Record<string, unknown>;
      const sellerCompanyId = Number(row.sellerCompanyId ?? 0);
      const buyerCompanyId = Number(row.buyerCompanyId ?? 0);
      const seller = companies.get(sellerCompanyId);
      const buyer = companies.get(buyerCompanyId);
      const sellerName =
        this.localizeCompanyName(
          String(row.sellerName ?? row.sellerCompanyName ?? seller?.name ?? "").trim()
        ) ||
        (sellerCompanyId ? `卖方 ${sellerCompanyId}` : "卖方");
      const buyerName =
        this.localizeCompanyName(
          String(row.buyerName ?? row.buyerCompanyName ?? buyer?.name ?? "").trim()
        ) ||
        (buyerCompanyId ? `买方 ${buyerCompanyId}` : "买方");

      return {
        ...row,
        sellerName,
        buyerName,
        sellerCity: row.sellerCity ?? seller?.city,
        buyerCity: row.buyerCity ?? buyer?.city,
        counterparty: `${sellerName} → ${buyerName}`,
      };
    });
  }

  private localizeCompanyName(name: string) {
    if (!name) {
      return "";
    }

    return name
      .replace(/Smoke Project Developer\s*(\d+)/gi, "区域项目业主$1")
      .replace(/Smoke Independent Certifier\s*(\d+)/gi, "区域核证机构$1")
      .replace(/Smoke Designated National Authority\s*(\d+)/gi, "区域主管机构$1")
      .replace(/Smoke Company\s*(\d+)/gi, "区域参与主体$1")
      .replace(/Smoke/gi, "区域");
  }

  private buildRegionalMetrics(
    companies: Map<number, RegionalCompanyContext>,
    recentProjects: Record<string, unknown>[],
    recentTrades: Array<Record<string, unknown>>,
    retirements: RegionalRetirementContext[]
  ): RegionalMetric[] {
    const metrics = new Map<string, RegionalMetric>();
    const ensureMetric = (city?: string, province?: string) => {
      if (!city) {
        return undefined;
      }

      if (!metrics.has(city)) {
        metrics.set(city, {
          city,
          province,
          accountCount: 0,
          projectCount: 0,
          issuedCredits: 0,
          soldCredits: 0,
          boughtCredits: 0,
          retiredCredits: 0,
          availableBalance: 0,
          tradeValue: 0,
          governanceScore: 60,
          governanceBand: "improving",
          governanceScoreBreakdown: this.emptyScoreBreakdown(),
        });
      }

      return metrics.get(city);
    };

    companies.forEach((company) => {
      const metric = ensureMetric(company.city, company.province);
      if (metric) {
        metric.accountCount += 1;
      }
    });

    recentProjects.forEach((project) => {
      const company = companies.get(Number(project.companyId ?? 0));
      const metric = ensureMetric(company?.city, company?.province);
      if (metric) {
        metric.projectCount += 1;
        metric.issuedCredits += Number(project.creditIssued ?? 0);
      }
    });

    recentTrades.forEach((trade) => {
      const amount = Number(trade.amount ?? 0);
      const totalPrice = Number(trade.totalPrice ?? 0);
      const sellerMetric = ensureMetric(
        String(trade.sellerCity ?? "") || undefined
      );
      const buyerMetric = ensureMetric(
        String(trade.buyerCity ?? "") || undefined
      );

      if (sellerMetric) {
        sellerMetric.soldCredits += amount;
        sellerMetric.tradeValue += totalPrice;
      }
      if (buyerMetric) {
        buyerMetric.boughtCredits += amount;
        buyerMetric.tradeValue += totalPrice;
      }
    });

    retirements.forEach((retirement) => {
      const company = companies.get(Number(retirement.senderId ?? 0));
      const metric = ensureMetric(company?.city, company?.province);

      if (metric) {
        metric.retiredCredits += retirement.creditAmount;
      }
    });

    return Array.from(metrics.values())
      .map((metric) => {
        const availableBalance =
          metric.issuedCredits +
          metric.boughtCredits -
          metric.soldCredits -
          metric.retiredCredits;
        const carbonActivity =
          metric.projectCount +
          metric.issuedCredits +
          metric.soldCredits +
          metric.boughtCredits +
          metric.retiredCredits;
        const governanceScoreBreakdown =
          carbonActivity > 0
            ? this.governanceScoreBreakdown(metric)
            : this.emptyScoreBreakdown();
        const rawGovernanceScore =
          governanceScoreBreakdown.base +
          governanceScoreBreakdown.project +
          governanceScoreBreakdown.supply +
          governanceScoreBreakdown.trading +
          governanceScoreBreakdown.retirement +
          governanceScoreBreakdown.closureBonus -
          governanceScoreBreakdown.unclosedDemandPenalty;
        const governanceScore =
          carbonActivity > 0 ? Math.max(50, Math.min(94, rawGovernanceScore)) : 66;

        const governanceBand: GovernanceBand =
          carbonActivity > 0 ? this.governanceBand(governanceScore) : "neutral";

        return {
          ...metric,
          availableBalance,
          governanceScore,
          governanceBand,
          governanceScoreBreakdown,
        };
      })
      .sort((a, b) => b.issuedCredits + b.boughtCredits - (a.issuedCredits + a.boughtCredits));
  }

  private emptyScoreBreakdown(): GovernanceScoreBreakdown {
    return {
      base: 66,
      project: 0,
      supply: 0,
      trading: 0,
      retirement: 0,
      closureBonus: 0,
      unclosedDemandPenalty: 0,
    };
  }

  private governanceScoreBreakdown(metric: RegionalMetric): GovernanceScoreBreakdown {
    const hasClosedLoop =
      metric.retiredCredits > 0 && (metric.boughtCredits > 0 || metric.issuedCredits > 0);

    return {
      base: 66,
      project: Math.min(4, metric.projectCount * 1.5),
      supply: Math.min(8, metric.issuedCredits / 2500 * 8),
      trading: Math.min(6, (metric.soldCredits + metric.boughtCredits) / 3000 * 5),
      retirement: Math.min(10, metric.retiredCredits / 200 * 8),
      closureBonus: hasClosedLoop ? 3 : 0,
      unclosedDemandPenalty:
        metric.boughtCredits > 0 && metric.retiredCredits === 0
          ? Math.min(6, metric.boughtCredits / 1000)
          : 0,
    };
  }

  private firstLocation(locations?: string[]) {
    const location = locations?.find((item) => String(item).trim().length > 0);
    return location ? String(location) : undefined;
  }

  private governanceBand(
    score: number
  ): Exclude<GovernanceBand, "neutral"> {
    if (score < 60) {
      return "pressure";
    }
    if (score < 70) {
      return "improving";
    }
    if (score < 84) {
      return "balanced";
    }
    return "leading";
  }

  private fallback<T>(
    section: ProjectionSection,
    error: string,
    value: T
  ): SectionResult<T> {
    return {
      status: "fallback",
      errors: [`${section}: ${error}`],
      value,
    };
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : "projection unavailable";
  }
}
