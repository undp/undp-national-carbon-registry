export type RegionalDashboardSummary = {
  dataStatus?: "real" | "fallback";
  projectionAvailable?: boolean;
  projectionErrors?: string[];
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
  regionalMetrics?: Array<Record<string, any>>;
};

const getRegionalApiBase = () =>
  import.meta.env.VITE_REGIONAL_MARKET_API_BASE ?? "http://127.0.0.1:3001";

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
