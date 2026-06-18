export type RegionalDashboardSummary = {
  dataStatus?: "real" | "fallback";
  projectionAvailable?: boolean;
  projectionErrors?: string[];
  sectionStatus?: Partial<
    Record<
      "projects" | "issuance" | "trades" | "retirements" | "accounts",
      "real" | "fallback"
    >
  >;
  accountSummary?: {
    totalAccounts?: number;
    accountTypes?: Array<{
      label?: string;
      count?: number;
      value?: string;
    }>;
  };
  metrics?: {
    totalIssuedCredits?: number;
    activeProjectCount?: number;
    transferVolume?: number;
    retiredCredits?: number;
    averageOtcPrice?: number;
    otcTradeCount?: number;
    otcTradeValue?: number;
  };
  recentProjectRegistrations?: Array<Record<string, any>>;
  recentTrades?: Array<Record<string, any>>;
  supervisoryAlerts?: Array<Record<string, any> | string>;
  regionalMetrics?: Array<{
    city?: string;
    province?: string;
    accountCount?: number;
    projectCount?: number;
    issuedCredits?: number;
    soldCredits?: number;
    boughtCredits?: number;
    retiredCredits?: number;
    availableBalance?: number;
    tradeValue?: number;
    governanceScore?: number;
    governanceBand?: "neutral" | "pressure" | "improving" | "balanced" | "leading";
    governanceScoreBreakdown?: {
      base: number;
      project: number;
      supply: number;
      trading: number;
      retirement: number;
      closureBonus: number;
      unclosedDemandPenalty: number;
    };
  }>;
};

export type DemoRole = "GOVERNMENT" | "ENTERPRISE" | "FINANCE" | "OPERATOR";

export type DemoUser = {
  id: string;
  account: string;
  role: DemoRole;
  organizationId: string;
  organizationName: string;
};

export type DemoSession = {
  sessionId: string;
  user: DemoUser;
};

export type DemoRegionIndicator = {
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

export type DemoIndicatorSource = Pick<
  DemoRegionIndicator,
  | "id"
  | "sourceLabel"
  | "sourceUrl"
  | "sourceDocument"
  | "sourceYear"
  | "caliber"
  | "methodologyNote"
  | "verified"
  | "verifiedBy"
  | "verifiedAt"
  | "truthStatus"
>;

export type DemoIndicatorsResponse = {
  truthStatus: "REAL_PUBLIC_DATA";
  verifiedOnly: boolean;
  items: DemoRegionIndicator[];
};

export type DemoRegistryHolding = {
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

export type DemoTradingHolding = {
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

export type DemoTradingListing = {
  id: string;
  tradingHoldingId: string;
  enterpriseId: string;
  quantity: number;
  unitPrice: number;
  listedAmount: number;
  status: "LISTED" | "DEAL_CONFIRMED";
  truthStatus: "SIMULATED_DEMO_DATA";
};

export type DemoTradingDeal = {
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

export type DemoFinanceApplication = {
  id: string;
  enterpriseId: string;
  valuationId: string;
  requestedAmount: number;
  purpose: string;
  status: "SUBMITTED" | "SIMULATED_APPROVED" | "SIMULATED_REJECTED";
  pledgeStatus: "NOT_LOCKED" | "PLEDGE_LOCKED";
  reviewDisclaimer: string;
  truthStatus: "SIMULATED_DEMO_DATA";
};

export type DemoSupervisionSummary = {
  publicIndicators: {
    truthStatus: "REAL_PUBLIC_DATA";
    count: number;
  };
  simulatedTradingActivity: {
    truthStatus: "SIMULATED_DEMO_DATA";
    transferCount: number;
    listingCount: number;
    dealCount: number;
    totalConfirmedQuantity: number;
  };
  simulatedFinancingIntent: {
    truthStatus: "SIMULATED_DEMO_DATA";
    applicationCount: number;
    approvedCount: number;
    pledgeLockedCount: number;
  };
  internalAssessmentTags: {
    truthStatus: "INTERNAL_DEMO_LOGIC";
    tags: string[];
  };
};

export type DemoContractPreview = {
  title: string;
  legalEffect: string;
  truthStatus: "SIMULATED_DEMO_DOCUMENT";
};

export type DemoStatusCertificate = {
  title: string;
  settlementBoundary: string;
  truthStatus: "SIMULATED_DEMO_DOCUMENT";
};

const getRegionalApiBase = () =>
  (import.meta.env.VITE_REGIONAL_MARKET_API_BASE ?? "").replace(/\/$/, "");

export const fetchRegionalDashboardSummary =
  async (): Promise<RegionalDashboardSummary> => {
    const response = await fetch(
      `${getRegionalApiBase()}/regional/dashboard/summary`
    );

    if (!response.ok) {
      throw new Error(`Regional dashboard request failed: ${response.status}`);
    }

    return response.json();
  };

const postJson = async <T>(path: string, body: Record<string, unknown>): Promise<T> => {
  const response = await fetch(`${getRegionalApiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Regional demo request failed: ${response.status}`);
  }

  return response.json();
};

export const loginRegionalDemo = (account = "gov_demo") =>
  postJson<DemoSession>("/regional/demo/session/login", { account });

export const switchRegionalDemoRole = (sessionId: string, role: DemoRole) =>
  postJson<DemoSession>("/regional/demo/session/switch-role", {
    sessionId,
    role,
  });

export const fetchRegionalDemoIndicators =
  async (): Promise<DemoIndicatorsResponse> => {
    const response = await fetch(
      `${getRegionalApiBase()}/regional/demo/indicators?verifiedOnly=true`
    );

    if (!response.ok) {
      throw new Error(`Regional demo indicators request failed: ${response.status}`);
    }

    return response.json();
  };

export const fetchRegionalDemoIndicatorSource = async (
  indicatorId: string
): Promise<DemoIndicatorSource> => {
  const response = await fetch(
    `${getRegionalApiBase()}/regional/demo/indicators/${indicatorId}/source`
  );

  if (!response.ok) {
    throw new Error(`Regional demo indicator source request failed: ${response.status}`);
  }

  return response.json();
};

export const fetchRegionalDemoRegistryHoldings = async (): Promise<{
  truthStatus: "SIMULATED_DEMO_DATA";
  items: DemoRegistryHolding[];
}> => {
  const response = await fetch(
    `${getRegionalApiBase()}/regional/demo/registry/holdings`
  );

  if (!response.ok) {
    throw new Error(`Regional demo registry request failed: ${response.status}`);
  }

  return response.json();
};

export const transferRegionalDemoToTrading = (
  actorRole: DemoRole,
  holdingId: string,
  quantity: number
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    registryHolding: DemoRegistryHolding;
    tradingHolding: DemoTradingHolding;
  }>("/regional/demo/registry/transfers-to-trading", {
    actorRole,
    holdingId,
    quantity,
  });

export const createRegionalDemoListing = (
  actorRole: DemoRole,
  tradingHoldingId: string,
  quantity: number,
  unitPrice: number
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    listing: DemoTradingListing;
  }>("/regional/demo/trading/listings", {
    actorRole,
    tradingHoldingId,
    quantity,
    unitPrice,
  });

export const confirmRegionalDemoDeal = (
  actorRole: DemoRole,
  listingId: string,
  buyerOrganizationId: string,
  quantity: number
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    deal: DemoTradingDeal;
  }>("/regional/demo/trading/deals", {
    actorRole,
    listingId,
    buyerOrganizationId,
    quantity,
  });

export const fetchRegionalDemoContractPreview = async (
  dealId: string
): Promise<DemoContractPreview> => {
  const response = await fetch(
    `${getRegionalApiBase()}/regional/demo/trading/deals/${dealId}/contract-preview`
  );

  if (!response.ok) {
    throw new Error(`Regional demo contract request failed: ${response.status}`);
  }

  return response.json();
};

export const fetchRegionalDemoStatusCertificate = async (
  dealId: string
): Promise<DemoStatusCertificate> => {
  const response = await fetch(
    `${getRegionalApiBase()}/regional/demo/trading/deals/${dealId}/status-certificate`
  );

  if (!response.ok) {
    throw new Error(`Regional demo certificate request failed: ${response.status}`);
  }

  return response.json();
};

export const createRegionalDemoFinanceValuation = (
  actorRole: DemoRole,
  enterpriseId: string,
  assetId: string,
  quantity: number,
  unitPrice: number,
  discountFactor: number
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    valuation: {
      id: string;
      assessedAmount: number;
      disclaimer: string;
    };
  }>("/regional/demo/finance/valuations", {
    actorRole,
    enterpriseId,
    assetId,
    quantity,
    unitPrice,
    discountFactor,
  });

export const createRegionalDemoFinanceApplication = (
  actorRole: DemoRole,
  enterpriseId: string,
  valuationId: string,
  requestedAmount: number,
  purpose: string
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    application: DemoFinanceApplication;
  }>("/regional/demo/finance/applications", {
    actorRole,
    enterpriseId,
    valuationId,
    requestedAmount,
    purpose,
  });

export const reviewRegionalDemoFinanceApplication = (
  actorRole: DemoRole,
  applicationId: string,
  result: "APPROVED" | "REJECTED",
  reviewerNote: string
) =>
  postJson<{
    truthStatus: "SIMULATED_DEMO_DATA";
    application: DemoFinanceApplication;
  }>(`/regional/demo/finance/applications/${applicationId}/review`, {
    actorRole,
    result,
    reviewerNote,
  });

export const fetchRegionalDemoSupervisionSummary =
  async (): Promise<DemoSupervisionSummary> => {
    const response = await fetch(
      `${getRegionalApiBase()}/regional/demo/supervision/summary`
    );

    if (!response.ok) {
      throw new Error(
        `Regional demo supervision request failed: ${response.status}`
      );
    }

    return response.json();
  };

export const resetRegionalDemo = (actorRole: DemoRole) =>
  postJson<{
    status: "RESET";
    reset: Record<string, boolean>;
  }>("/regional/demo/reset", { actorRole });
