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
