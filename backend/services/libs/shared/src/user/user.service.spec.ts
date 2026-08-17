import { UserService } from "./user.service";

describe("UserService", () => {
  let service: UserService;
  let orderByArgs: any[];

  beforeEach(() => {
    orderByArgs = [];
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      leftJoinAndMapOne: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockImplementation((...args: any[]) => {
        orderByArgs = args;
        return queryBuilder;
      }),
      offset: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      getMany: jest.fn().mockResolvedValue([]),
    };
    const userRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const helperService: any = {
      generateWhereSQL: jest.fn(),
      parseMongoQueryToSQLWithTable: jest.fn(),
      formatReqMessagesString: jest.fn(),
    };

    service = new UserService(
      userRepo,
      {} as any, // logger
      {} as any, // configService
      helperService,
      {} as any, // entityManger
      {} as any, // companyService
      {} as any, // emailHelperService
      {} as any, // counterService
      {} as any, // countryService
      {} as any, // fileHandler
      {} as any, // asyncOperationsInterface
      {} as any, // locationService
      {} as any, // passwordHashService
      {} as any, // dataExportService
      {} as any // httpUtilService
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("query sorting", () => {
    const user: any = { companyRole: undefined };

    it.each(["companyRole", "role"])(
      "casts %s to text so it sorts alphabetically instead of by enum ordinal",
      async (key) => {
        await service.query(
          { size: 10, page: 1, sort: { key, order: "ASC" } } as any,
          undefined,
          user
        );
        expect(orderByArgs[0]).toBe(`"user"."${key}"::text`);
      }
    );

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "name", order: "DESC" } } as any,
        undefined,
        user
      );
      expect(orderByArgs[0]).toBe(`"user"."name"`);
    });
  });

  describe("download sorting", () => {
    it.each(["companyRole", "role"])(
      "casts %s to text so it sorts alphabetically instead of by enum ordinal",
      async (key) => {
        await service
          .download({ sort: { key, order: "ASC" } } as any, undefined)
          .catch(() => {});
        expect(orderByArgs[0]).toBe(`"user"."${key}"::text`);
      }
    );

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service
        .download({ sort: { key: "name", order: "DESC" } } as any, undefined)
        .catch(() => {});
      expect(orderByArgs[0]).toBe(`"user"."name"`);
    });
  });
});
