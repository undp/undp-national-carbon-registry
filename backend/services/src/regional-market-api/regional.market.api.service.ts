import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketProjectionService } from "@app/shared/regional-market/regional-market-projection.service";
import { QueryDto } from "@app/shared/dto/query.dto";

type DemoRole = "GOVERNMENT" | "ENTERPRISE" | "FINANCE" | "OPERATOR";

type DemoUser = {
  id: string;
  account: string;
  role: DemoRole;
  organizationId: string;
  organizationName: string;
};

type DemoRegionIndicator = {
  id: string;
  regionCode: string;
  regionName: string;
  indicatorCode: string;
  indicatorName: string;
  dimension: string;
  period: string;
  value: number;
  targetValue: number | null;
  unit: string;
  caliber: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceDocument: string | null;
  sourceYear: number;
  verified: boolean;
  verifiedBy: string;
  verifiedAt: string;
  methodologyNote: string;
  truthStatus: "REAL_PUBLIC_DATA" | "UNVERIFIED_SOURCE_CANDIDATE";
  displayOrder: number;
};

type DemoRegistryHolding = {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  assetName: string;
  projectName: string;
  totalQuantity: number;
  availableQuantity: number;
  lockedQuantity: number;
  unit: string;
  status: "REGISTRY_AVAILABLE" | "PLEDGE_LOCKED";
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoTradingHolding = {
  id: string;
  registryHoldingId: string;
  enterpriseId: string;
  assetName: string;
  totalQuantity: number;
  availableQuantity: number;
  listedQuantity: number;
  unit: string;
  status: "AVAILABLE_FOR_LISTING" | "LISTED" | "DEAL_CONFIRMED";
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoTransferToTrading = {
  id: string;
  holdingId: string;
  tradingHoldingId: string;
  quantity: number;
  status: "TRANSFERRED_TO_TRADING";
  createdAt: string;
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoTradingListing = {
  id: string;
  tradingHoldingId: string;
  enterpriseId: string;
  quantity: number;
  unitPrice: number;
  listedAmount: number;
  status: "LISTED" | "DEAL_CONFIRMED";
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoTradingDeal = {
  id: string;
  listingId: string;
  buyerOrganizationId: string;
  sellerEnterpriseId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "CONFIRMED";
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoFinanceValuation = {
  id: string;
  enterpriseId: string;
  assetId: string;
  quantity: number;
  unitPrice: number;
  discountFactor: number;
  assessedAmount: number;
  formula: string;
  disclaimer: "融资测算结果仅用于演示";
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoFinanceApplication = {
  id: string;
  enterpriseId: string;
  valuationId: string;
  requestedAmount: number;
  purpose: string;
  status: "SUBMITTED" | "SIMULATED_APPROVED" | "SIMULATED_REJECTED";
  pledgeStatus: "NOT_LOCKED" | "PLEDGE_LOCKED";
  reviewDisclaimer: "模拟审批不代表银行授信";
  reviewerNote?: string;
  truthStatus: "SIMULATED_DEMO_DATA";
};

type DemoState = {
  registryHoldings: DemoRegistryHolding[];
  tradingHoldings: DemoTradingHolding[];
  transfers: DemoTransferToTrading[];
  listings: DemoTradingListing[];
  deals: DemoTradingDeal[];
  valuations: DemoFinanceValuation[];
  financeApplications: DemoFinanceApplication[];
};

const DEMO_USERS: Record<string, DemoUser> = {
  gov_demo: {
    id: "user-gov-demo",
    account: "gov_demo",
    role: "GOVERNMENT",
    organizationId: "org-gov-demo",
    organizationName: "河南省区域绿色发展演示专班",
  },
  enterprise_demo: {
    id: "user-enterprise-demo",
    account: "enterprise_demo",
    role: "ENTERPRISE",
    organizationId: "org-enterprise-demo",
    organizationName: "郑州绿能制造演示企业",
  },
  finance_demo: {
    id: "user-finance-demo",
    account: "finance_demo",
    role: "FINANCE",
    organizationId: "org-finance-demo",
    organizationName: "中原绿色金融演示机构",
  },
  operator_demo: {
    id: "user-operator-demo",
    account: "operator_demo",
    role: "OPERATOR",
    organizationId: "org-operator-demo",
    organizationName: "阶段零演示操作台",
  },
};

const ROLE_TO_ACCOUNT: Record<DemoRole, string> = {
  GOVERNMENT: "gov_demo",
  ENTERPRISE: "enterprise_demo",
  FINANCE: "finance_demo",
  OPERATOR: "operator_demo",
};

const DEMO_REGION_INDICATORS: DemoRegionIndicator[] = [
  {
    id: "s12-henan-gdp-2025",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "GDP_CURRENT_PRICE",
    indicatorName: "地区生产总值",
    dimension: "economy",
    period: "2025",
    value: 66632.79,
    targetValue: null,
    unit: "亿元",
    caliber: "初步核算，绝对数按现价，增长速度按不变价格计算。",
    sourceLabel: "河南省统计局 2025年河南省国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Codex source check, 2026-06-17",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "年度宏观公开指标，用于S12经济底座展示。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 10,
  },
  {
    id: "s12-henan-industrial-energy-consumption-2025",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "INDUSTRIAL_ENERGY_CONSUMPTION_GROWTH",
    indicatorName: "规模以上工业综合能源消费量增速",
    dimension: "energy",
    period: "2025",
    value: -0.6,
    targetValue: null,
    unit: "%",
    caliber: "规模以上工业综合能源消费量同比变化。",
    sourceLabel: "河南省统计局 2025年河南省国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Codex source check, 2026-06-17",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "能源消费强度相关公开指标；不得替代全社会碳排放核算。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 20,
  },
  {
    id: "s12-zhengzhou-gdp-2025",
    regionCode: "410100",
    regionName: "郑州市",
    indicatorCode: "GDP_CURRENT_PRICE",
    indicatorName: "地区生产总值",
    dimension: "economy",
    period: "2025",
    value: 15244.6,
    targetValue: null,
    unit: "亿元",
    caliber: "初步核算，绝对数按现价，增长速度按不变价格计算。",
    sourceLabel: "郑州市统计局 2025年郑州市国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Codex source check, 2026-06-17",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "重点地市经济底座指标。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 30,
  },
  {
    id: "s12-zhengzhou-power-consumption-2025",
    regionCode: "410100",
    regionName: "郑州市",
    indicatorCode: "TOTAL_ELECTRICITY_CONSUMPTION",
    indicatorName: "全社会用电量",
    dimension: "energy",
    period: "2025",
    value: 726.6,
    targetValue: null,
    unit: "亿千瓦时",
    caliber: "年度全社会用电量，同比增速在来源公报中列示。",
    sourceLabel: "郑州市统计局 2025年郑州市国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.zhengzhou.gov.cn/tjgb/10017864.jhtml",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Codex source check, 2026-06-17",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "能源活动相关公开指标；不等同于碳排放量。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 40,
  },
  {
    id: "s12-henan-afforestation-area-2025",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "AFFORESTATION_AREA",
    indicatorName: "完成造林面积",
    dimension: "ecology",
    period: "2025",
    value: 44.8,
    targetValue: null,
    unit: "千公顷",
    caliber: "年度完成造林面积，来源公报资源、环境和应急管理章节。",
    sourceLabel: "河南省统计局 2025年河南省国民经济和社会发展统计公报",
    sourceUrl: "https://tjj.henan.gov.cn/2026/04-09/3341308.html",
    sourceDocument: null,
    sourceYear: 2026,
    verified: true,
    verifiedBy: "Codex source check, 2026-06-17",
    verifiedAt: "2026-06-17T00:00:00+08:00",
    methodologyNote: "生态/碳汇相关公开指标；不等同于经核算碳汇量。",
    truthStatus: "REAL_PUBLIC_DATA",
    displayOrder: 50,
  },
  {
    id: "s12-candidate-carbon-intensity",
    regionCode: "410000",
    regionName: "河南省",
    indicatorCode: "CARBON_INTENSITY_CANDIDATE",
    indicatorName: "单位地区生产总值碳排放强度候选指标",
    dimension: "carbon",
    period: "2025",
    value: 0,
    targetValue: null,
    unit: "待核验",
    caliber: "缺少阶段零可公开核验来源，禁止作为真实公开数据上屏。",
    sourceLabel: "待核验候选来源",
    sourceUrl: "",
    sourceDocument: null,
    sourceYear: 2026,
    verified: false,
    verifiedBy: "",
    verifiedAt: "",
    methodologyNote: "用于测试 verifiedOnly 过滤；不得在真实公开指标区展示。",
    truthStatus: "UNVERIFIED_SOURCE_CANDIDATE",
    displayOrder: 999,
  },
];

const createInitialDemoState = (): DemoState => ({
  registryHoldings: [
    {
      id: "reg-holding-enterprise-forest-2025",
      enterpriseId: "org-enterprise-demo",
      enterpriseName: "郑州绿能制造演示企业",
      assetName: "区域绿色权益演示资产-林业2025",
      projectName: "伏牛山生态修复演示项目",
      totalQuantity: 5000,
      availableQuantity: 5000,
      lockedQuantity: 0,
      unit: "吨",
      status: "REGISTRY_AVAILABLE",
      truthStatus: "SIMULATED_DEMO_DATA",
    },
    {
      id: "reg-holding-enterprise-energy-2025",
      enterpriseId: "org-enterprise-demo",
      enterpriseName: "郑州绿能制造演示企业",
      assetName: "区域绿色权益演示资产-节能2025",
      projectName: "高效电机替换演示项目",
      totalQuantity: 3200,
      availableQuantity: 3200,
      lockedQuantity: 0,
      unit: "吨",
      status: "REGISTRY_AVAILABLE",
      truthStatus: "SIMULATED_DEMO_DATA",
    },
  ],
  tradingHoldings: [],
  transfers: [],
  listings: [],
  deals: [],
  valuations: [],
  financeApplications: [],
});

@Injectable()
export class RegionalMarketAPIService {
  private demoState = createInitialDemoState();

  constructor(
    private readonly regionalMarketService: RegionalMarketService,
    private readonly regionalMarketProjectionService: RegionalMarketProjectionService
  ) {}

  getInfo() {
    return this.regionalMarketService.getBoundary();
  }

  queryProjects(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryProjects(query, abilityCondition, user);
  }

  getProjectById(programmeId: string, user?: any) {
    return this.regionalMarketService.getProjectById(programmeId, user);
  }

  queryCreditBalances(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryCreditBalances(
      query,
      abilityCondition,
      user
    );
  }

  queryTransfers(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryTransfers(query, abilityCondition, user);
  }

  queryRetirements(query: QueryDto, abilityCondition?: any, user?: any) {
    return this.regionalMarketService.queryRetirements(
      query,
      abilityCondition,
      user
    );
  }

  createProjectDocument(documentDto: any, user?: any) {
    return this.regionalMarketService.createProjectDocument(documentDto, user);
  }

  performProjectDocumentAction(actionDto: any, user?: any) {
    return this.regionalMarketService.performProjectDocumentAction(actionDto, user);
  }

  issueProjectCredits(issueDto: any, user?: any) {
    return this.regionalMarketService.issueProjectCredits(
      issueDto.activity,
      issueDto.creditVerified,
      issueDto.companyId,
      issueDto.document,
      issueDto.txRef,
      user
    );
  }

  executeOtcTrade(dto: any, user?: any) {
    return this.regionalMarketService.executeOtcTrade(dto, user);
  }

  getDashboardSummary() {
    return this.regionalMarketProjectionService.getDashboardSummary();
  }

  loginDemoSession(account: string) {
    const user = DEMO_USERS[account];
    if (!user || account === "operator_demo") {
      throw new BadRequestException({
        error: {
          code: "DEMO_INVALID_ACCOUNT",
          message: "Unknown phase-zero demo account.",
        },
      });
    }

    return this.demoSessionForUser(user);
  }

  switchDemoRole(role: string) {
    const account = ROLE_TO_ACCOUNT[role as DemoRole];
    if (!account) {
      throw new BadRequestException({
        error: {
          code: "DEMO_INVALID_ROLE",
          message: "Unknown phase-zero demo role.",
        },
      });
    }

    return this.demoSessionForUser(DEMO_USERS[account]);
  }

  getDemoSessionMe(role?: string) {
    if (role) {
      return this.switchDemoRole(role);
    }

    return this.demoSessionForUser(DEMO_USERS.gov_demo);
  }

  listDemoIndicators(query: Record<string, any> = {}) {
    const verifiedOnly = query.verifiedOnly !== "false";
    const regionCode = query.regionCode;
    const dimension = query.dimension;

    const items = DEMO_REGION_INDICATORS.filter((indicator) => {
      if (verifiedOnly && !indicator.verified) return false;
      if (regionCode && indicator.regionCode !== regionCode) return false;
      if (dimension && indicator.dimension !== dimension) return false;
      return true;
    }).sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      truthStatus: "REAL_PUBLIC_DATA",
      verifiedOnly,
      items,
    };
  }

  getDemoIndicatorSource(id: string) {
    const indicator = DEMO_REGION_INDICATORS.find((item) => item.id === id);
    if (!indicator) {
      throw new NotFoundException({
        error: {
          code: "DEMO_INDICATOR_NOT_FOUND",
          message: "Demo indicator was not found.",
        },
      });
    }

    return {
      id: indicator.id,
      sourceLabel: indicator.sourceLabel,
      sourceUrl: indicator.sourceUrl,
      sourceDocument: indicator.sourceDocument,
      sourceYear: indicator.sourceYear,
      caliber: indicator.caliber,
      methodologyNote: indicator.methodologyNote,
      verified: indicator.verified,
      verifiedBy: indicator.verifiedBy,
      verifiedAt: indicator.verifiedAt,
      truthStatus: indicator.truthStatus,
    };
  }

  listDemoRegistryHoldings() {
    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      items: this.demoState.registryHoldings,
    };
  }

  transferDemoRegistryHoldingToTrading(dto: {
    holdingId: string;
    quantity: number;
  }) {
    const registryHolding = this.demoState.registryHoldings.find(
      (holding) => holding.id === dto.holdingId
    );
    if (!registryHolding) {
      throw new NotFoundException({
        error: {
          code: "DEMO_REGISTRY_HOLDING_NOT_FOUND",
          message: "Demo registry holding was not found.",
        },
      });
    }
    if (
      registryHolding.status !== "REGISTRY_AVAILABLE" ||
      registryHolding.lockedQuantity > 0
    ) {
      throw new BadRequestException({
        error: {
          code: "DEMO_REGISTRY_HOLDING_PLEDGE_LOCKED",
          message: "Demo registry holding is locked by financing intent.",
        },
      });
    }
    if (dto.quantity > registryHolding.availableQuantity) {
      throw new BadRequestException({
        error: {
          code: "DEMO_TRANSFER_QUANTITY_UNAVAILABLE",
          message: "Requested transfer quantity exceeds available demo holding.",
        },
      });
    }

    registryHolding.availableQuantity -= dto.quantity;
    const tradingHolding: DemoTradingHolding = {
      id: `trading-holding-${this.demoState.tradingHoldings.length + 1}`,
      registryHoldingId: registryHolding.id,
      enterpriseId: registryHolding.enterpriseId,
      assetName: registryHolding.assetName,
      totalQuantity: dto.quantity,
      availableQuantity: dto.quantity,
      listedQuantity: 0,
      unit: registryHolding.unit,
      status: "AVAILABLE_FOR_LISTING",
      truthStatus: "SIMULATED_DEMO_DATA",
    };
    const transfer: DemoTransferToTrading = {
      id: `transfer-${this.demoState.transfers.length + 1}`,
      holdingId: registryHolding.id,
      tradingHoldingId: tradingHolding.id,
      quantity: dto.quantity,
      status: "TRANSFERRED_TO_TRADING",
      createdAt: new Date().toISOString(),
      truthStatus: "SIMULATED_DEMO_DATA",
    };

    this.demoState.tradingHoldings.push(tradingHolding);
    this.demoState.transfers.push(transfer);

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      transfer,
      registryHolding,
      tradingHolding,
    };
  }

  listDemoTradingHoldings() {
    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      items: this.demoState.tradingHoldings,
    };
  }

  createDemoTradingListing(dto: {
    tradingHoldingId: string;
    quantity: number;
    unitPrice: number;
  }) {
    const tradingHolding = this.demoState.tradingHoldings.find(
      (holding) => holding.id === dto.tradingHoldingId
    );
    if (!tradingHolding) {
      throw new NotFoundException({
        error: {
          code: "DEMO_TRADING_HOLDING_NOT_FOUND",
          message: "Transfer demo asset into trading context before listing.",
        },
      });
    }
    if (dto.quantity > tradingHolding.availableQuantity) {
      throw new BadRequestException({
        error: {
          code: "DEMO_LISTING_QUANTITY_UNAVAILABLE",
          message: "Requested listing quantity exceeds available trading holding.",
        },
      });
    }

    tradingHolding.availableQuantity -= dto.quantity;
    tradingHolding.listedQuantity += dto.quantity;
    tradingHolding.status = "LISTED";
    const listing: DemoTradingListing = {
      id: `listing-${this.demoState.listings.length + 1}`,
      tradingHoldingId: tradingHolding.id,
      enterpriseId: tradingHolding.enterpriseId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      listedAmount: roundCurrency(dto.quantity * dto.unitPrice),
      status: "LISTED",
      truthStatus: "SIMULATED_DEMO_DATA",
    };

    this.demoState.listings.push(listing);

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      listing,
      tradingHolding,
    };
  }

  confirmDemoTradingDeal(dto: {
    listingId: string;
    buyerOrganizationId: string;
    quantity: number;
  }) {
    const listing = this.demoState.listings.find(
      (item) => item.id === dto.listingId
    );
    if (!listing) {
      throw new NotFoundException({
        error: {
          code: "DEMO_LISTING_NOT_FOUND",
          message: "Demo listing was not found.",
        },
      });
    }
    if (listing.status !== "LISTED") {
      throw new BadRequestException({
        error: {
          code: "DEMO_LISTING_ALREADY_CONFIRMED",
          message: "Demo listing has already been confirmed.",
        },
      });
    }
    if (dto.quantity > listing.quantity) {
      throw new BadRequestException({
        error: {
          code: "DEMO_DEAL_QUANTITY_UNAVAILABLE",
          message: "Requested deal quantity exceeds listed demo quantity.",
        },
      });
    }

    listing.status = "DEAL_CONFIRMED";
    const tradingHolding = this.demoState.tradingHoldings.find(
      (holding) => holding.id === listing.tradingHoldingId
    );
    if (tradingHolding) {
      tradingHolding.listedQuantity -= dto.quantity;
      tradingHolding.status = "DEAL_CONFIRMED";
    }
    const deal: DemoTradingDeal = {
      id: `deal-${this.demoState.deals.length + 1}`,
      listingId: listing.id,
      buyerOrganizationId: dto.buyerOrganizationId,
      sellerEnterpriseId: listing.enterpriseId,
      quantity: dto.quantity,
      unitPrice: listing.unitPrice,
      totalAmount: roundCurrency(dto.quantity * listing.unitPrice),
      status: "CONFIRMED",
      truthStatus: "SIMULATED_DEMO_DATA",
    };

    this.demoState.deals.push(deal);

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      deal,
      listing,
    };
  }

  getDemoTradingDealContractPreview(id: string) {
    const deal = this.getDemoDealOrThrow(id);

    return {
      id: `contract-preview-${deal.id}`,
      dealId: deal.id,
      title: "演示合同预览",
      legalEffect: "演示文本，不具法律效力",
      parties: {
        sellerEnterpriseId: deal.sellerEnterpriseId,
        buyerOrganizationId: deal.buyerOrganizationId,
      },
      quantity: deal.quantity,
      unitPrice: deal.unitPrice,
      totalAmount: deal.totalAmount,
      truthStatus: "SIMULATED_DEMO_DOCUMENT",
    };
  }

  getDemoTradingDealStatusCertificate(id: string) {
    const deal = this.getDemoDealOrThrow(id);

    return {
      id: `status-certificate-${deal.id}`,
      dealId: deal.id,
      title: "模拟成交状态凭证",
      status: deal.status,
      settlementBoundary: "不含资金清算或银行结算",
      quantity: deal.quantity,
      totalAmount: deal.totalAmount,
      truthStatus: "SIMULATED_DEMO_DOCUMENT",
    };
  }

  getDemoFinanceProfile(enterpriseId: string) {
    const assets = this.demoState.registryHoldings.filter(
      (holding) => holding.enterpriseId === enterpriseId
    );
    if (!assets.length) {
      throw new NotFoundException({
        error: {
          code: "DEMO_ENTERPRISE_PROFILE_NOT_FOUND",
          message: "Demo enterprise profile was not found.",
        },
      });
    }

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      enterpriseId,
      enterpriseName: assets[0].enterpriseName,
      esgModel: "ESG demo-v1 为内部演示模型",
      assets,
    };
  }

  createDemoFinanceValuation(dto: {
    enterpriseId: string;
    assetId: string;
    quantity: number;
    unitPrice: number;
    discountFactor: number;
  }) {
    const asset = this.demoState.registryHoldings.find(
      (holding) =>
        holding.id === dto.assetId && holding.enterpriseId === dto.enterpriseId
    );
    if (!asset) {
      throw new NotFoundException({
        error: {
          code: "DEMO_FINANCE_ASSET_NOT_FOUND",
          message: "Demo finance asset was not found.",
        },
      });
    }
    if (dto.quantity > asset.totalQuantity) {
      throw new BadRequestException({
        error: {
          code: "DEMO_VALUATION_QUANTITY_UNAVAILABLE",
          message: "Requested valuation quantity exceeds demo asset quantity.",
        },
      });
    }

    const valuation: DemoFinanceValuation = {
      id: `valuation-${this.demoState.valuations.length + 1}`,
      enterpriseId: dto.enterpriseId,
      assetId: dto.assetId,
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discountFactor: dto.discountFactor,
      assessedAmount: roundCurrency(
        dto.quantity * dto.unitPrice * dto.discountFactor
      ),
      formula: "demo asset quantity x demo price x discount factor",
      disclaimer: "融资测算结果仅用于演示",
      truthStatus: "SIMULATED_DEMO_DATA",
    };

    this.demoState.valuations.push(valuation);

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      valuation,
    };
  }

  createDemoFinanceApplication(dto: {
    enterpriseId: string;
    valuationId: string;
    requestedAmount: number;
    purpose: string;
  }) {
    const valuation = this.demoState.valuations.find(
      (item) => item.id === dto.valuationId && item.enterpriseId === dto.enterpriseId
    );
    if (!valuation) {
      throw new NotFoundException({
        error: {
          code: "DEMO_VALUATION_NOT_FOUND",
          message: "Create demo valuation before submitting financing intent.",
        },
      });
    }
    if (dto.requestedAmount > valuation.assessedAmount) {
      throw new BadRequestException({
        error: {
          code: "DEMO_REQUESTED_AMOUNT_EXCEEDS_VALUATION",
          message: "Requested amount exceeds demo valuation.",
        },
      });
    }

    const application: DemoFinanceApplication = {
      id: `finance-application-${this.demoState.financeApplications.length + 1}`,
      enterpriseId: dto.enterpriseId,
      valuationId: dto.valuationId,
      requestedAmount: dto.requestedAmount,
      purpose: dto.purpose,
      status: "SUBMITTED",
      pledgeStatus: "NOT_LOCKED",
      reviewDisclaimer: "模拟审批不代表银行授信",
      truthStatus: "SIMULATED_DEMO_DATA",
    };

    this.demoState.financeApplications.push(application);

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      application,
    };
  }

  reviewDemoFinanceApplication(
    id: string,
    dto: { result: string; reviewerNote?: string }
  ) {
    const application = this.demoState.financeApplications.find(
      (item) => item.id === id
    );
    if (!application) {
      throw new NotFoundException({
        error: {
          code: "DEMO_FINANCE_APPLICATION_NOT_FOUND",
          message: "Demo finance application was not found.",
        },
      });
    }

    application.status =
      dto.result === "APPROVED" ? "SIMULATED_APPROVED" : "SIMULATED_REJECTED";
    application.pledgeStatus =
      dto.result === "APPROVED" ? "PLEDGE_LOCKED" : "NOT_LOCKED";
    application.reviewerNote = dto.reviewerNote;

    if (dto.result === "APPROVED") {
      const valuation = this.demoState.valuations.find(
        (item) => item.id === application.valuationId
      );
      const asset = this.demoState.registryHoldings.find(
        (holding) => holding.id === valuation?.assetId
      );
      if (asset) {
        asset.status = "PLEDGE_LOCKED";
        asset.lockedQuantity = Math.max(asset.lockedQuantity, valuation?.quantity ?? 0);
      }
    }

    return {
      truthStatus: "SIMULATED_DEMO_DATA",
      application,
    };
  }

  getDemoSupervisionSummary() {
    return {
      publicIndicators: {
        truthStatus: "REAL_PUBLIC_DATA",
        count: DEMO_REGION_INDICATORS.filter((indicator) => indicator.verified)
          .length,
        items: DEMO_REGION_INDICATORS.filter((indicator) => indicator.verified),
      },
      simulatedTradingActivity: {
        truthStatus: "SIMULATED_DEMO_DATA",
        transferCount: this.demoState.transfers.length,
        listingCount: this.demoState.listings.length,
        dealCount: this.demoState.deals.length,
        totalConfirmedQuantity: this.demoState.deals.reduce(
          (sum, deal) => sum + deal.quantity,
          0
        ),
      },
      simulatedFinancingIntent: {
        truthStatus: "SIMULATED_DEMO_DATA",
        applicationCount: this.demoState.financeApplications.length,
        approvedCount: this.demoState.financeApplications.filter(
          (application) => application.status === "SIMULATED_APPROVED"
        ).length,
        pledgeLockedCount: this.demoState.financeApplications.filter(
          (application) => application.pledgeStatus === "PLEDGE_LOCKED"
        ).length,
      },
      internalAssessmentTags: {
        truthStatus: "INTERNAL_DEMO_LOGIC",
        tags: ["demo-v1", "simulated-activity-separated", "operator-resettable"],
      },
    };
  }

  resetDemo() {
    this.demoState = createInitialDemoState();

    return {
      status: "RESET",
      preserved: {
        verifiedIndicators: DEMO_REGION_INDICATORS.filter(
          (indicator) => indicator.verified
        ).length,
      },
      reset: {
        sessions: true,
        demoTransactions: true,
        financeState: true,
        registryHoldings: true,
        tradingHoldings: true,
      },
    };
  }

  private demoSessionForUser(user: DemoUser) {
    const sessionSuffix = user.account.replace("_demo", "");

    return {
      sessionId: `demo-session-${sessionSuffix}`,
      user,
    };
  }

  private getDemoDealOrThrow(id: string) {
    const deal = this.demoState.deals.find((item) => item.id === id);
    if (!deal) {
      throw new NotFoundException({
        error: {
          code: "DEMO_DEAL_NOT_FOUND",
          message: "Demo deal was not found.",
        },
      });
    }

    return deal;
  }
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;
