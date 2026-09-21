import { CompanyService } from "./company.service";
import { CompanyRole } from "../enum/company.role.enum";

describe("CompanyService", () => {
  let service: CompanyService;
  let orderByArgs: any[];
  let selectArgs: any[];
  let offsetArg: number;
  let limitArg: number;
  let companyRepo: any;
  let helperService: any;
  let creditBlocksEntityRepository: any;
  let creditBlockOrgAggregationViewEntityRepository: any;
  let creditBlockOrgBalancesViewEntityRepository: any;

  beforeEach(() => {
    orderByArgs = [];
    selectArgs = [];
    offsetArg = undefined;
    limitArg = undefined;
    companyRepo = {
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(function (this: any, cols: any) {
          selectArgs = cols;
          return this;
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockImplementation((...args: any[]) => {
          orderByArgs = args;
          const tail: any = {
            offset: jest.fn().mockImplementation((value: number) => {
              offsetArg = value;
              return tail;
            }),
            limit: jest.fn().mockImplementation((value: number) => {
              limitArg = value;
              return tail;
            }),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            getRawMany: jest.fn().mockResolvedValue([]),
          };
          return tail;
        }),
      }),
    };
    helperService = {
      generateWhereSQL: jest.fn(),
      parseMongoQueryToSQL: jest.fn(),
    };
    // findByCompanyId(id, true) always sums this to compute the live
    // creditBalance override, regardless of which test is exercising the
    // aggregation/balances attachment - default to no blocks.
    creditBlocksEntityRepository = { find: jest.fn().mockResolvedValue([]) };
    creditBlockOrgAggregationViewEntityRepository = {
      find: jest.fn().mockResolvedValue([]),
    };
    creditBlockOrgBalancesViewEntityRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    service = new CompanyService(
      companyRepo,
      {} as any, // userRepo
      {} as any, // companyViewRepo
      {} as any, // logger
      {} as any, // configService
      helperService,
      {} as any, // programmeLedgerService
      {} as any, // emailHelperService
      {} as any, // programmeTransferRepo
      {} as any, // fileHandler
      {} as any, // counterService
      {} as any, // userService
      {} as any, // asyncOperationsInterface
      {} as any, // locationService
      {} as any, // investmentRepo
      {} as any, // dataExportService
      {} as any, // httpUtilService
      {} as any, // cacheManager
      creditBlocksEntityRepository,
      creditBlockOrgAggregationViewEntityRepository,
      creditBlockOrgBalancesViewEntityRepository
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("query sorting", () => {
    const companyRole = CompanyRole.DESIGNATED_NATIONAL_AUTHORITY;

    it("sorts state alphabetically by displayed label instead of by enum ordinal", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "state", order: "ASC" } } as any,
        undefined,
        companyRole
      );

      expect(orderByArgs[0]).toBe(
        `CASE "state" WHEN '1' THEN 0 WHEN '0' THEN 1 WHEN '2' THEN 2 WHEN '3' THEN 3 ELSE 4 END`
      );
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "name", order: "DESC" } } as any,
        undefined,
        companyRole
      );

      expect(orderByArgs[0]).toBe(`"name"`);
    });
  });

  describe("queryNameIds", () => {
    it("selects only the two columns a filter dropdown needs", async () => {
      await service.queryNameIds({ size: 20, page: 1 } as any, undefined);

      expect(selectArgs).toEqual(['"companyId"', '"name"']);
    });

    it("leaves the caller's filters alone - unlike queryNames, it pins no state", async () => {
      const query: any = {
        size: 20,
        page: 1,
        filterAnd: [{ key: "state", operation: "in", value: ["0", "1"] }],
      };

      await service.queryNameIds(query, undefined);

      // queryNames would have appended its own `state in [1]` here, which
      // would silently drop Pending organizations from the caller's list.
      expect(query.filterAnd).toEqual([
        { key: "state", operation: "in", value: ["0", "1"] },
      ]);
      expect(helperService.generateWhereSQL).toHaveBeenCalledWith(
        query,
        undefined
      );
    });

    it("honours the requested sort and paginates from page/size", async () => {
      await service.queryNameIds(
        { size: 20, page: 3, sort: { key: "name", order: "ASC" } } as any,
        undefined
      );

      expect(orderByArgs).toEqual([`"name"`, "ASC"]);
      expect(offsetArg).toBe(40);
      expect(limitArg).toBe(20);
    });

    it("defaults page/size so a bare request can't produce a NaN offset", async () => {
      await service.queryNameIds({} as any, undefined);

      expect(offsetArg).toBe(0);
      expect(limitArg).toBe(10);
    });
  });

  describe("findByCompanyId credit aggregation (attachCreditAggregation)", () => {
    it("attaches itmoBalance/itmoReservedCredits from the org balances view", async () => {
      companyRepo.find.mockResolvedValueOnce([{ companyId: 1 } as any]);
      creditBlockOrgAggregationViewEntityRepository.find.mockResolvedValueOnce([
        {
          organizationId: 1,
          creditIssued: 9812,
          creditReceived: 800,
          creditRetired: 2906,
          creditTransferred: 3500,
          creditReserved: 0,
          creditBalance: 4206,
        },
      ]);
      creditBlockOrgBalancesViewEntityRepository.find.mockResolvedValueOnce([
        { organizationId: 1, itmoBalance: 990, itmoReservedCredits: 0 },
      ]);

      const result = await service.findByCompanyId(1, true);

      expect(result).toMatchObject({ itmoBalance: 990, itmoReservedCredits: 0 });
    });

    it("defaults itmoBalance/itmoReservedCredits to 0 for an org with no balances-view row (holds no blocks)", async () => {
      companyRepo.find.mockResolvedValueOnce([{ companyId: 2 } as any]);
      creditBlockOrgAggregationViewEntityRepository.find.mockResolvedValueOnce([
        { organizationId: 2, creditIssued: 0, creditReceived: 0, creditRetired: 0, creditTransferred: 0, creditReserved: 0, creditBalance: 0 },
      ]);
      creditBlockOrgBalancesViewEntityRepository.find.mockResolvedValueOnce([]); // no row for org 2

      const result = await service.findByCompanyId(2, true);

      expect(result).toMatchObject({ itmoBalance: 0, itmoReservedCredits: 0 });
    });

    it("still attaches the existing six aggregation figures unchanged", async () => {
      companyRepo.find.mockResolvedValueOnce([{ companyId: 3 } as any]);
      creditBlockOrgAggregationViewEntityRepository.find.mockResolvedValueOnce([
        {
          organizationId: 3,
          creditIssued: 0,
          creditReceived: 3500,
          creditRetired: 100,
          creditTransferred: 1800,
          creditReserved: 0,
          creditBalance: 1600,
        },
      ]);
      creditBlockOrgBalancesViewEntityRepository.find.mockResolvedValueOnce([]);

      const result = await service.findByCompanyId(3, true);

      expect(result).toMatchObject({
        creditIssued: 0,
        creditReceived: 3500,
        creditRetired: 100,
        creditTransferred: 1800,
        creditReserved: 0,
      });
    });
  });
});
