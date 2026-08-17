import { ProjectManagementService } from "./project-management.service";
import { CompanyRole } from "../enum/company.role.enum";

describe("ProjectManagementService", () => {
  let service: ProjectManagementService;
  let orderByArgs: any[];
  let selectArgs: any;
  let helperService: any;

  beforeEach(() => {
    orderByArgs = [];
    selectArgs = undefined;
    const projectViewRepo: any = {
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(function (this: any, cols: any) {
          selectArgs = cols;
          return this;
        }),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockImplementation((...args: any[]) => {
          orderByArgs = args;
          return {
            offset: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
            getRawMany: jest.fn().mockResolvedValue([]),
          };
        }),
      }),
    };
    helperService = {
      generateWhereSQL: jest.fn(),
      parseMongoQueryToSQLWithTable: jest.fn(),
      generateSortCol: jest.fn((col: string) => `"${col}"`),
    };

    service = new ProjectManagementService(
      helperService,
      {} as any, // companyService
      {} as any, // counterService
      {} as any, // programmeLedgerService
      {} as any, // documentRepo
      {} as any, // noObjectionLetterGenerateService
      projectViewRepo,
      {} as any, // projectDetailsViewRepo
      {} as any, // activityViewEntityRepo
      {} as any, // emailHelperService
      {} as any, // documentManagementService
      {} as any // auditLogService
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("query sorting", () => {
    const user: any = { companyRole: CompanyRole.MINISTRY };

    it("casts projectProposalStage to text so it sorts alphabetically instead of by enum ordinal", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "projectProposalStage", order: "ASC" } } as any,
        undefined,
        user
      );
      expect(orderByArgs[0]).toBe(
        `"document_entity"."projectProposalStage"::text`
      );
    });

    it("sorts sectoralScope alphabetically by displayed label instead of by raw code", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "sectoralScope", order: "ASC" } } as any,
        undefined,
        user
      );
      // Ranks follow SECTORAL_SCOPE_ALPHABETICAL_ORDER, so WASTE_FROM_FUELS
      // ("Fugitive Emissions from Fuels...") sorts between ENERGY_INDUSTRIES
      // and FUGITIVE_EMISSIONS_PRODUCTION rather than under "W".
      expect(orderByArgs[0]).toBe(
        `CASE "document_entity"."sectoralScope" ` +
          `WHEN 'AFFORESTATION_AND_REFORESTATION' THEN 0 ` +
          `WHEN 'AGRICULTURE' THEN 1 ` +
          `WHEN 'CHEMICAL_INDUSTRIES' THEN 2 ` +
          `WHEN 'CONSTRUCTION' THEN 3 ` +
          `WHEN 'ENERGY_DEMAND' THEN 4 ` +
          `WHEN 'ENERGY_DISTRIBUTION' THEN 5 ` +
          `WHEN 'ENERGY_INDUSTRIES' THEN 6 ` +
          `WHEN 'WASTE_FROM_FUELS' THEN 7 ` +
          `WHEN 'FUGITIVE_EMISSIONS_PRODUCTION' THEN 8 ` +
          `WHEN 'MANUFACTURING_INDUSTRIES' THEN 9 ` +
          `WHEN 'METAL_PRODUCTION' THEN 10 ` +
          `WHEN 'MINING_MINERAL_PRODUCTION' THEN 11 ` +
          `WHEN 'N/A' THEN 12 ` +
          `WHEN 'SOLVENT_USE' THEN 13 ` +
          `WHEN 'TRANSPORT' THEN 14 ` +
          `WHEN 'WASTE_HANDLING_AND_DISPOSAL' THEN 15 ` +
          `ELSE 16 END`
      );
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.query(
        { size: 10, page: 1, sort: { key: "createdTime", order: "DESC" } } as any,
        undefined,
        user
      );
      expect(orderByArgs[0]).toBe(`"document_entity"."createdTime"`);
    });
  });

  describe("queryNameIds", () => {
    const dna: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("selects only the two columns a filter dropdown needs", async () => {
      await service.queryNameIds({ size: 20, page: 1 } as any, undefined, dna);

      expect(selectArgs).toEqual([
        `"document_entity"."refId" AS "refId"`,
        `"document_entity"."title" AS "title"`,
      ]);
    });

    it("scopes a Project Developer to its own company, exactly as query() does", async () => {
      const query: any = {
        size: 20,
        page: 1,
        filterAnd: [{ key: "creditIssued", operation: ">", value: 0 }],
      };

      await service.queryNameIds(query, undefined, {
        companyRole: CompanyRole.PROJECT_DEVELOPER,
        companyId: 7,
      } as any);

      expect(query.filterAnd).toContainEqual({
        key: "companyId",
        operation: "=",
        value: 7,
      });
    });

    it("scopes an Independent Certifier to the projects it is assigned to", async () => {
      const query: any = { size: 20, page: 1 };

      await service.queryNameIds(query, undefined, {
        companyRole: CompanyRole.INDEPENDENT_CERTIFIER,
        companyId: 4,
      } as any);

      expect(query.filterAnd).toEqual([
        { key: "independentCertifiers", operation: "@>", value: "{4}" },
      ]);
    });

    it("adds no visibility filter for DNA, and keeps the caller's own filters", async () => {
      const query: any = {
        size: 20,
        page: 1,
        filterAnd: [{ key: "creditIssued", operation: ">", value: 0 }],
      };

      await service.queryNameIds(query, undefined, dna);

      expect(query.filterAnd).toEqual([
        { key: "creditIssued", operation: ">", value: 0 },
      ]);
    });

    it("sorts on the aliased view column and defaults page/size", async () => {
      await service.queryNameIds(
        { sort: { key: "title", order: "ASC" } } as any,
        undefined,
        dna
      );

      expect(orderByArgs[0]).toBe(`"document_entity"."title"`);
      expect(orderByArgs[1]).toBe("ASC");
    });
  });
});
