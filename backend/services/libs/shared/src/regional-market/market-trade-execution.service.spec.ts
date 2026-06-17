import { MarketTradeExecutionService } from "./market-trade-execution.service";

describe("MarketTradeExecutionService", () => {
  function createRepository() {
    return {
      create: jest.fn((data) => ({ id: "created", ...data })),
      save: jest.fn(async (entity) => ({ ...entity, id: "TRADE-1" })),
      find: jest.fn(async () => []),
      createQueryBuilder: jest.fn(),
    };
  }

  it("creates an OTC trade execution record from a registry transfer", async () => {
    const repo = createRepository();
    const service = new MarketTradeExecutionService(repo as any);

    await expect(
      service.createFromTransfer({
        creditTransactionId: "TX-1",
        creditBlockId: "CB-1",
        sellerCompanyId: 10,
        buyerCompanyId: 20,
        projectRefId: "PRJ-1",
        serialNumber: "SN-1",
        amount: 100,
        unitPrice: 42,
        currency: "CNY",
        tradeTime: new Date("2026-06-11T00:00:00.000Z"),
      })
    ).resolves.toMatchObject({
      id: "TRADE-1",
      totalPrice: 4200,
      settlementStatus: "SETTLED_OFFLINE",
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        creditTransactionId: "TX-1",
        amount: 100,
        unitPrice: 42,
        totalPrice: 4200,
      })
    );
  });

  it("queries recent OTC trades", async () => {
    const repo = createRepository();
    repo.find.mockResolvedValueOnce([{ id: "TRADE-1" }]);
    const service = new MarketTradeExecutionService(repo as any);

    await expect(service.queryTrades({ take: 5 })).resolves.toEqual([
      { id: "TRADE-1" },
    ]);
    expect(repo.find).toHaveBeenCalledWith({
      order: { tradeTime: "DESC" },
      where: { settlementStatus: "SETTLED_OFFLINE" },
      take: 5,
    });
  });

  it("summarizes only settled offline OTC trade totals", async () => {
    const select = jest.fn().mockReturnThis();
    const addSelect = jest.fn().mockReturnThis();
    const where = jest.fn().mockReturnThis();
    const getRawOne = jest.fn().mockResolvedValue({
      count: "2",
      amount: "300",
      value: "12600",
      averagePrice: "42",
    });
    const repo = {
      createQueryBuilder: jest.fn(() => ({
        select,
        addSelect,
        where,
        getRawOne,
      })),
    };
    const service = new MarketTradeExecutionService(repo as any);

    await expect(service.getTradeSummary()).resolves.toEqual({
      tradeCount: 2,
      totalAmount: 300,
      totalValue: 12600,
      averagePrice: 42,
    });
    expect(addSelect).toHaveBeenCalledWith(
      "COALESCE(SUM(trade.totalPrice) / NULLIF(SUM(trade.amount), 0), 0)",
      "averagePrice"
    );
    expect(where).toHaveBeenCalledWith(
      "trade.settlementStatus IN (:...settlementStatuses)",
      { settlementStatuses: ["SETTLED_OFFLINE"] }
    );
  });
});
