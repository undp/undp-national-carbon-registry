import { Injectable, Optional } from "@nestjs/common";
import { MarketTradeExecutionService } from "./market-trade-execution.service";

@Injectable()
export class RegionalMarketProjectionService {
  constructor(
    @Optional()
    private readonly marketTradeExecutionService?: MarketTradeExecutionService
  ) {}

  async getDashboardSummary() {
    const emptyTradeSummary = {
      tradeCount: 0,
      totalAmount: 0,
      totalValue: 0,
      averagePrice: 0,
    };
    let tradeSummary = emptyTradeSummary;
    let recentTrades = [];
    let dataStatus = "fallback";
    let projectionAvailable = false;
    const projectionErrors: string[] = [];

    if (this.marketTradeExecutionService) {
      try {
        tradeSummary = await this.marketTradeExecutionService.getTradeSummary();
        recentTrades = await this.marketTradeExecutionService.queryTrades({
          take: 10,
        });
        dataStatus = "real";
        projectionAvailable = true;
      } catch (error) {
        tradeSummary = emptyTradeSummary;
        recentTrades = [];
        projectionErrors.push(
          error instanceof Error ? error.message : "trade projection unavailable"
        );
      }
    } else {
      projectionErrors.push("market trade projection service unavailable");
    }

    return {
      dataStatus,
      projectionAvailable,
      projectionErrors,
      metrics: {
        totalIssuedCredits: 0,
        activeProjectCount: 0,
        transferVolume: tradeSummary.totalAmount,
        retiredCredits: 0,
        averageOtcPrice: tradeSummary.averagePrice,
        otcTradeCount: tradeSummary.tradeCount,
        otcTradeValue: tradeSummary.totalValue,
      },
      recentProjectRegistrations: [],
      recentTrades,
      supervisoryAlerts: [],
      regionalMetrics: [],
      generatedAt: new Date().toISOString(),
    };
  }
}
