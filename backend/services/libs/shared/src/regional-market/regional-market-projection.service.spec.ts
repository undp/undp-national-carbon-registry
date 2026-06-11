import { RegionalMarketProjectionService } from "./regional-market-projection.service";

describe("RegionalMarketProjectionService", () => {
  it("builds a dashboard summary projection", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 2,
        totalAmount: 300,
        totalValue: 12600,
        averagePrice: 42,
      }),
      queryTrades: jest.fn().mockResolvedValue([{ id: "TRADE-1" }]),
    };
    const service = new RegionalMarketProjectionService(
      marketTradeExecutionService as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      metrics: {
        totalIssuedCredits: 0,
        activeProjectCount: 0,
        transferVolume: 300,
        retiredCredits: 0,
        averageOtcPrice: 42,
      },
      recentTrades: [{ id: "TRADE-1" }],
      recentProjectRegistrations: [],
      supervisoryAlerts: [],
    });
  });
});
