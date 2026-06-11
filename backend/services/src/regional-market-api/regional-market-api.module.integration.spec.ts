import { Test, TestingModule } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";

jest.mock("@app/core/app-config/app-config.module", () => ({
  AppConfigModule: (() => {
    const { Global, Module } = require("@nestjs/common");
    const { ConfigService } = require("@nestjs/config");
    const { I18nService } = require("nestjs-i18n");
    const { DataSource, EntityManager } = require("typeorm");

    @Global()
    @Module({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values = {
                database: {
                  host: "127.0.0.1",
                  port: 5432,
                  username: "hquser",
                  password: "",
                  database: "carbondev",
                },
                "ledger.name": "regional-test-ledger",
                "ledger.table": "programmes",
                "ledger.overallTable": "overall",
                "ledger.companyTable": "company",
                "ledger.projectTable": "project",
                "ledger.creditBlocksTable": "credit_blocks",
              };

              return values[key];
            }),
          },
        },
        {
          provide: EntityManager,
          useValue: {},
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn((key) => key),
            t: jest.fn((key) => key),
          },
        },
        {
          provide: DataSource,
          useValue: {
            entityMetadatas: [],
            options: { type: "postgres" },
            getRepository: jest.fn(() => ({
              create: jest.fn((entity) => entity),
              save: jest.fn((entity) => Promise.resolve(entity)),
              find: jest.fn(() => Promise.resolve([])),
              createQueryBuilder: jest.fn(() => ({
                select: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                getRawOne: jest.fn(() => Promise.resolve({})),
              })),
            })),
            createEntityManager: jest.fn(() => ({})),
          },
        },
      ],
      exports: [ConfigService, EntityManager, I18nService, DataSource],
    })
    class MockAppConfigModule {}

    return MockAppConfigModule;
  })(),
}));

import { RegionalMarketModule } from "@app/shared/regional-market/regional-market.module";
import { MarketTradeExecutionService } from "@app/shared/regional-market/market-trade-execution.service";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketAPIController } from "./regional.market.api.controller";
import { RegionalMarketAPIModule } from "./regional.market.api.module";

const repository = {
  create: jest.fn((entity) => entity),
  save: jest.fn((entity) => Promise.resolve(entity)),
  find: jest.fn(() => Promise.resolve([])),
  createQueryBuilder: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(() =>
      Promise.resolve({
        tradeCount: "0",
        totalAmount: "0",
        totalValue: "0",
        averagePrice: "0",
      })
    ),
  })),
};

const dataSource = {
  entityMetadatas: [],
  options: { type: "postgres" },
  getRepository: jest.fn(() => repository),
  createEntityManager: jest.fn(() => ({})),
};

describe("RegionalMarketAPIModule integration", () => {
  let module: TestingModule;

  afterEach(async () => {
    await module?.close();
  });

  it("compiles the extracted regional API module with the real regional market module", async () => {
    module = await Test.createTestingModule({
      imports: [RegionalMarketAPIModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    expect(module.get(RegionalMarketAPIController)).toBeInstanceOf(
      RegionalMarketAPIController
    );
    expect(module.get(RegionalMarketService)).toBeInstanceOf(
      RegionalMarketService
    );
    expect(module.get(MarketTradeExecutionService)).toBeInstanceOf(
      MarketTradeExecutionService
    );
    expect(
      Reflect.getMetadata("imports", RegionalMarketAPIModule)
    ).toContain(RegionalMarketModule);
  });
});
