import { RegionalMarketProjectionService } from "./regional-market-projection.service";

describe("RegionalMarketProjectionService", () => {
  function queryBuilder(raw: Record<string, string | number>) {
    return {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(raw),
    };
  }

  function createRepositories(options: {
    activeProjectCount?: number;
    issued?: number;
    retired?: number;
    companyRoleCounts?: Array<{ companyRole: string; count: string }>;
    companies?: Array<Record<string, unknown>>;
  } = {}) {
    const projectQueryBuilder = queryBuilder({
      issued: options.issued ?? 1000,
    });
    const retirementQueryBuilder = queryBuilder({
      retired: options.retired ?? 100,
    });

    const projectRepository = {
      count: jest.fn().mockResolvedValue(options.activeProjectCount ?? 2),
      find: jest.fn().mockResolvedValue([
        {
          refId: "PRJ-1",
          serialNumber: "SN-1",
          title: "First regional project",
          companyId: 10,
          sector: "Energy",
          sectoralScope: "Renewable energy",
          projectProposalStage: "AUTHORISED",
          createTime: Date.parse("2026-06-01T00:00:00.000Z"),
          creditEst: 1500,
          creditIssued: 1000,
        },
      ]),
      createQueryBuilder: jest.fn(() => projectQueryBuilder),
    };
    const creditTransactionsRepository = {
      createQueryBuilder: jest.fn(() => queryBuilder({ issued: 999 })),
    };
    const retirementRepository = {
      createQueryBuilder: jest.fn(() => retirementQueryBuilder),
      find: jest.fn().mockResolvedValue([
        {
          id: "RETIRE-1",
          senderId: 20,
          creditAmount: options.retired ?? 100,
          status: "Completed",
        },
      ]),
    };
    const companyQueryBuilder: any = queryBuilder({});
    companyQueryBuilder.where = jest.fn().mockReturnThis();
    companyQueryBuilder.groupBy = jest.fn().mockReturnThis();
    companyQueryBuilder.getRawMany = jest.fn().mockResolvedValue(
      options.companyRoleCounts ?? [
        { companyRole: "PD", count: "3" },
        { companyRole: "IC", count: "2" },
        { companyRole: "DNA", count: "1" },
      ]
    );
    const companyRepository = {
      createQueryBuilder: jest.fn(() => companyQueryBuilder),
      find: jest.fn().mockResolvedValue(
        options.companies ?? [
          {
            companyId: 10,
            name: "信阳绿源林业发展有限公司",
            provinces: ["河南省"],
            regions: ["信阳市"],
            companyRole: "PD",
          },
          {
            companyId: 20,
            name: "郑州热电集团有限公司",
            provinces: ["河南省"],
            regions: ["郑州市"],
            companyRole: "DNA",
          },
        ]
      ),
    };

    return {
      projectRepository,
      creditTransactionsRepository,
      retirementRepository,
      companyRepository,
      projectQueryBuilder,
      retirementQueryBuilder,
      companyQueryBuilder,
    };
  }

  it("builds a full real dashboard summary from all projection sections", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 2,
        totalAmount: 300,
        totalValue: 12600,
        averagePrice: 42,
      }),
      queryTrades: jest.fn().mockResolvedValue([{ id: "TRADE-1" }]),
    };
    const repositories = createRepositories();
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      dataStatus: "real",
      projectionAvailable: true,
      projectionErrors: [],
      sectionStatus: {
        projects: "real",
        issuance: "real",
        trades: "real",
        retirements: "real",
        accounts: "real",
      },
      accountSummary: {
        totalAccounts: 6,
        accountTypes: [
          { label: "市场参与主体", count: 6 },
          { label: "地方主管机构", count: 1 },
          { label: "项目业主", count: 3 },
          { label: "核证机构", count: 2 },
        ],
      },
      metrics: {
        totalIssuedCredits: 1000,
        activeProjectCount: 2,
        transferVolume: 300,
        retiredCredits: 100,
        averageOtcPrice: 42,
        otcTradeCount: 2,
        otcTradeValue: 12600,
      },
      recentProjectRegistrations: [
        {
          refId: "PRJ-1",
          projectName: "First regional project",
          status: "AUTHORISED",
          creditIssued: 1000,
        },
      ],
      recentTrades: [{ id: "TRADE-1" }],
      supervisoryAlerts: [],
      regionalMetrics: expect.any(Array),
    });
  });

  it("does not mark trade-only projection as fully real", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 1,
        totalAmount: 300,
        totalValue: 12600,
        averagePrice: 42,
      }),
      queryTrades: jest.fn().mockResolvedValue([{ id: "TRADE-1" }]),
    };
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      dataStatus: "fallback",
      projectionAvailable: false,
      sectionStatus: {
        projects: "fallback",
        issuance: "fallback",
        trades: "real",
        retirements: "fallback",
        accounts: "fallback",
      },
      metrics: {
        totalIssuedCredits: 0,
        activeProjectCount: 0,
        transferVolume: 300,
        retiredCredits: 0,
      },
    });
  });

  it("counts only authorised active project stages", async () => {
    const repositories = createRepositories({ activeProjectCount: 2 });
    const expectedActiveProjectWhere = [
      { projectProposalStage: "AUTHORISED" },
      { projectProposalStage: "AUTHORIZED" },
    ];
    const service = new (RegionalMarketProjectionService as any)(
      {
        getTradeSummary: jest.fn().mockResolvedValue({
          tradeCount: 0,
          totalAmount: 0,
          totalValue: 0,
          averagePrice: 0,
        }),
        queryTrades: jest.fn().mockResolvedValue([]),
      } as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await service.getDashboardSummary();

    expect(repositories.projectRepository.count).toHaveBeenCalledWith({
      where: expectedActiveProjectWhere,
    });
    expect(repositories.projectRepository.find).toHaveBeenCalledWith({
      where: expectedActiveProjectWhere,
      order: { createTime: "DESC" },
      take: 10,
    });
  });

  it("uses project creditIssued as issued credits instead of net balances", async () => {
    const repositories = createRepositories({ issued: 1000 });
    const service = new (RegionalMarketProjectionService as any)(
      {
        getTradeSummary: jest.fn().mockResolvedValue({
          tradeCount: 0,
          totalAmount: 0,
          totalValue: 0,
          averagePrice: 0,
        }),
        queryTrades: jest.fn().mockResolvedValue([]),
      } as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      metrics: { totalIssuedCredits: 1000 },
    });
    expect(repositories.projectQueryBuilder.select).toHaveBeenCalledWith(
      "COALESCE(SUM(project.creditIssued), 0)",
      "issued"
    );
  });

  it("filters retirement projection to completed retirements", async () => {
    const repositories = createRepositories({ retired: 100 });
    const service = new (RegionalMarketProjectionService as any)(
      {
        getTradeSummary: jest.fn().mockResolvedValue({
          tradeCount: 0,
          totalAmount: 0,
          totalValue: 0,
          averagePrice: 0,
        }),
        queryTrades: jest.fn().mockResolvedValue([]),
      } as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      metrics: { retiredCredits: 100 },
    });
    expect(repositories.retirementQueryBuilder.where).toHaveBeenCalledWith(
      "retirement.status = :status",
      { status: "Completed" }
    );
  });

  it("aggregates active account holder counts by organization role", async () => {
    const repositories = createRepositories({
      companyRoleCounts: [
        { companyRole: "PD", count: "4" },
        { companyRole: "IC", count: "2" },
        { companyRole: "DNA", count: "1" },
        { companyRole: "Ministry", count: "1" },
      ],
    });
    const service = new (RegionalMarketProjectionService as any)(
      {
        getTradeSummary: jest.fn().mockResolvedValue({
          tradeCount: 0,
          totalAmount: 0,
          totalValue: 0,
          averagePrice: 0,
        }),
        queryTrades: jest.fn().mockResolvedValue([]),
      } as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      sectionStatus: { accounts: "real" },
      accountSummary: {
        totalAccounts: 8,
        accountTypes: [
          { label: "市场参与主体", count: 8 },
          { label: "地方主管机构", count: 2 },
          { label: "项目业主", count: 4 },
          { label: "核证机构", count: 2 },
        ],
      },
    });
    expect(repositories.companyQueryBuilder.where).toHaveBeenCalledWith(
      "company.state = :activeState",
      { activeState: "1" }
    );
    expect(repositories.companyQueryBuilder.groupBy).toHaveBeenCalledWith(
      "company.companyRole"
    );
  });

  it("adds trade counterparties and city-level regional metrics when source rows include city evidence", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 1,
        totalAmount: 300,
        totalValue: 12600,
        averagePrice: 42,
      }),
      queryTrades: jest.fn().mockResolvedValue([
        {
          id: "TRADE-1",
          sellerCompanyId: 10,
          buyerCompanyId: 20,
          amount: 300,
          totalPrice: 12600,
          unitPrice: 42,
          tradeTime: new Date("2026-06-11T00:00:00.000Z"),
        },
      ]),
    };
    const repositories = createRepositories({
      activeProjectCount: 1,
      issued: 1000,
      retired: 150,
    });
    repositories.projectRepository.find.mockResolvedValue([
      {
        refId: "PRJ-1",
        serialNumber: "SN-1",
        title: "信阳大别山林业碳汇项目",
        companyId: 10,
        sector: "Forestry",
        sectoralScope: "Afforestation",
        projectProposalStage: "AUTHORISED",
        createTime: Date.parse("2026-06-01T00:00:00.000Z"),
        creditEst: 1500,
        creditIssued: 1000,
      },
    ]);
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    await expect(service.getDashboardSummary()).resolves.toMatchObject({
      recentTrades: [
        {
          counterparty: "信阳绿源林业发展有限公司 → 郑州热电集团有限公司",
          sellerName: "信阳绿源林业发展有限公司",
          buyerName: "郑州热电集团有限公司",
          sellerCity: "信阳市",
          buyerCity: "郑州市",
        },
      ],
      regionalMetrics: expect.arrayContaining([
        expect.objectContaining({
          city: "信阳市",
          projectCount: 1,
          issuedCredits: 1000,
          soldCredits: 300,
          governanceScoreBreakdown: expect.objectContaining({
            supply: expect.any(Number),
            trading: expect.any(Number),
            retirement: expect.any(Number),
            unclosedDemandPenalty: expect.any(Number),
          }),
          governanceBand: "balanced",
        }),
        expect.objectContaining({
          city: "郑州市",
          accountCount: 1,
          boughtCredits: 300,
          retiredCredits: 150,
          governanceScoreBreakdown: expect.objectContaining({
            trading: expect.any(Number),
            retirement: expect.any(Number),
            unclosedDemandPenalty: 0,
          }),
          governanceBand: "balanced",
        }),
      ]),
    });
  });

  it("localizes smoke trade counterparties and keeps unretired demand below closed-loop retirement scores", async () => {
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 1,
        totalAmount: 3000,
        totalValue: 126000,
        averagePrice: 42,
      }),
      queryTrades: jest.fn().mockResolvedValue([
        {
          id: "TRADE-1",
          sellerCompanyId: 10,
          buyerCompanyId: 20,
          amount: 3000,
          totalPrice: 126000,
          unitPrice: 42,
          tradeTime: new Date("2026-06-11T00:00:00.000Z"),
        },
      ]),
    };
    const repositories = createRepositories({
      companies: [
        {
          companyId: 10,
          name: "Smoke Project Developer 6",
          provinces: ["河南省"],
          regions: ["周口市"],
          companyRole: "PD",
        },
        {
          companyId: 20,
          name: "Smoke Independent Certifier 1",
          provinces: ["河南省"],
          regions: ["郑州市"],
          companyRole: "DNA",
        },
      ],
    });
    repositories.projectRepository.find.mockResolvedValue([
      {
        refId: "PRJ-1",
        serialNumber: "SN-1",
        title: "周口农业废弃物利用项目",
        companyId: 10,
        sector: "农业减排",
        projectProposalStage: "AUTHORISED",
        createTime: Date.parse("2026-06-01T00:00:00.000Z"),
        creditIssued: 2000,
      },
    ]);
    repositories.retirementRepository.find.mockResolvedValue([
      {
        id: "RETIRE-1",
        senderId: 10,
        creditAmount: 200,
        status: "Completed",
      },
    ]);
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    const summary = await service.getDashboardSummary();
    expect(summary.recentTrades[0]).toMatchObject({
      counterparty: "区域项目业主6 → 区域核证机构1",
      sellerName: "区域项目业主6",
      buyerName: "区域核证机构1",
      sellerCity: "周口市",
      buyerCity: "郑州市",
    });
    expect(summary.recentTrades[0].counterparty).not.toContain("Smoke");

    const zhengzhou = summary.regionalMetrics.find(
      (metric: Record<string, unknown>) => metric.city === "郑州市"
    );
    const zhoukou = summary.regionalMetrics.find(
      (metric: Record<string, unknown>) => metric.city === "周口市"
    );
    expect(zhengzhou.governanceScoreBreakdown.unclosedDemandPenalty).toBeGreaterThan(0);
    expect(zhengzhou.governanceScore).toBeLessThan(zhoukou.governanceScore);
  });

  it("builds regional metrics from full project and trade aggregates, while recent lists stay capped", async () => {
    const cityNames = [
      "信阳市",
      "南阳市",
      "三门峡市",
      "开封市",
      "许昌市",
      "驻马店市",
      "商丘市",
      "周口市",
      "洛阳市",
      "郑州市",
      "安阳市",
      "新乡市",
      "焦作市",
      "平顶山市",
      "濮阳市",
    ];
    const companies = cityNames.map((city, index) => ({
      companyId: 900001 + index,
      name: `Regional Company ${index + 1}`,
      provinces: ["河南省"],
      regions: [city],
      companyRole: index < 10 ? "PD" : "IC",
    }));
    const projects = companies.map((company, index) => ({
      refId: `SMOKE-PRJ-${index + 1}`,
      serialNumber: `SMOKE-SN-${index + 1}`,
      title: `Regional Project ${index + 1}`,
      companyId: company.companyId,
      sector: "Energy",
      sectoralScope: "Renewable energy",
      projectProposalStage: "AUTHORISED",
      createTime: Date.parse(`2026-06-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`),
      creditEst: 1500,
      creditIssued: 1000,
    }));
    const trades = Array.from({ length: 15 }, (_, index) => ({
      id: `TRADE-${index + 1}`,
      sellerCompanyId: 900001 + (index % 9),
      buyerCompanyId: 900010,
      amount: 300,
      totalPrice: 12600,
      unitPrice: 42,
      tradeTime: new Date(`2026-06-11T00:${String(index).padStart(2, "0")}:00.000Z`),
    }));
    const repositories = createRepositories({
      activeProjectCount: 15,
      issued: 15000,
      retired: 1500,
      companies,
      companyRoleCounts: [
        { companyRole: "PD", count: "10" },
        { companyRole: "IC", count: "5" },
      ],
    });
    repositories.projectRepository.find.mockImplementation((query?: { take?: number }) =>
      Promise.resolve(query?.take === 10 ? projects.slice(5) : projects)
    );
    repositories.retirementRepository.find.mockResolvedValue([
      {
        id: "RETIRE-ZZ-1",
        senderId: 900010,
        creditAmount: 300,
        status: "Completed",
      },
    ]);
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 15,
        totalAmount: 4500,
        totalValue: 189000,
        averagePrice: 42,
      }),
      queryTrades: jest.fn((query?: { take?: number | null }) =>
        Promise.resolve(query?.take === 10 ? trades.slice(5) : trades)
      ),
    };
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    const summary = await service.getDashboardSummary();
    const regionalIssued = summary.regionalMetrics.reduce(
      (total: number, metric: Record<string, number>) => total + metric.issuedCredits,
      0
    );
    const regionalSold = summary.regionalMetrics.reduce(
      (total: number, metric: Record<string, number>) => total + metric.soldCredits,
      0
    );
    const regionalBought = summary.regionalMetrics.reduce(
      (total: number, metric: Record<string, number>) => total + metric.boughtCredits,
      0
    );
    const regionalRetired = summary.regionalMetrics.reduce(
      (total: number, metric: Record<string, number>) => total + metric.retiredCredits,
      0
    );
    const zhengzhou = summary.regionalMetrics.find(
      (metric: Record<string, unknown>) => metric.city === "郑州市"
    );

    expect(summary.recentProjectRegistrations).toHaveLength(10);
    expect(summary.recentTrades).toHaveLength(10);
    expect(regionalIssued).toBe(summary.metrics.totalIssuedCredits);
    expect(regionalSold).toBe(summary.metrics.transferVolume);
    expect(regionalBought).toBe(summary.metrics.transferVolume);
    expect(regionalRetired).toBe(300);
    expect(zhengzhou).toMatchObject({
      issuedCredits: 1000,
      boughtCredits: 4500,
      retiredCredits: 300,
      availableBalance: 1000 + 4500 - 0 - 300,
    });
  });

  it("builds regional retirement metrics from all completed retirements", async () => {
    const company = {
      companyId: 900010,
      name: "郑州热电集团有限公司",
      provinces: ["河南省"],
      regions: ["郑州市"],
      companyRole: "PD",
    };
    const repositories = createRepositories({
      activeProjectCount: 1,
      issued: 0,
      retired: 600,
      companies: [company],
      companyRoleCounts: [{ companyRole: "PD", count: "1" }],
    });
    repositories.projectRepository.find.mockResolvedValue([]);
    const retirements = Array.from({ length: 60 }, (_, index) => ({
      id: `RETIRE-${index + 1}`,
      senderId: 900010,
      creditAmount: 10,
      status: "Completed",
    }));
    repositories.retirementRepository.find.mockImplementation((query?: { take?: number }) =>
      Promise.resolve(
        typeof query?.take === "number"
          ? retirements.slice(0, query.take)
          : retirements
      )
    );
    const marketTradeExecutionService = {
      getTradeSummary: jest.fn().mockResolvedValue({
        tradeCount: 0,
        totalAmount: 0,
        totalValue: 0,
        averagePrice: 0,
      }),
      queryTrades: jest.fn().mockResolvedValue([]),
    };
    const service = new (RegionalMarketProjectionService as any)(
      marketTradeExecutionService as any,
      repositories.projectRepository as any,
      repositories.creditTransactionsRepository as any,
      repositories.retirementRepository as any,
      repositories.companyRepository as any
    );

    const summary = await service.getDashboardSummary();
    const zhengzhou = summary.regionalMetrics.find(
      (metric: Record<string, unknown>) => metric.city === "郑州市"
    );

    expect(summary.metrics.retiredCredits).toBe(600);
    expect(zhengzhou).toMatchObject({
      retiredCredits: 600,
      availableBalance: -600,
    });
  });
});
