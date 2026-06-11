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
      dataStatus: "real",
      projectionAvailable: true,
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

  it("falls back to empty market metrics when trade storage is unavailable", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest
        .fn()
        .mockRejectedValue(new Error("repository unavailable")),
      queryTrades: jest.fn(),
    };
    const service = new RegionalMarketProjectionService(
      marketTradeExecutionService as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      dataStatus: "fallback",
      projectionAvailable: false,
      projectionErrors: ["repository unavailable"],
      metrics: {
        transferVolume: 0,
        averageOtcPrice: 0,
        otcTradeCount: 0,
        otcTradeValue: 0,
      },
      recentTrades: [],
    });
    expect(marketTradeExecutionService.queryTrades).not.toHaveBeenCalled();
  });
});
