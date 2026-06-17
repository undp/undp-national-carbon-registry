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
