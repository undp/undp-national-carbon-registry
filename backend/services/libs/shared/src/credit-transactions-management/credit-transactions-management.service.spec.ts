import { CreditTransactionsManagementService } from "./credit-transactions-management.service";
import { CompanyRole } from "../enum/company.role.enum";
import { TxType } from "../enum/txtype.enum";
import { SerialNumberManagementService } from "../serial-number-management/serial-number-management.service";

describe("CreditTransactionsManagementService", () => {
  let service: CreditTransactionsManagementService;
  let orderByCalls: any[][];
  let programmeLedgerService: any;
  let creditBlocksEntityRepository: any;
  let companyService: any;
  let creditTransactionsEntityRepository: any;
  let cooperativeApproachRepo: any;
  let creditBlockOrgTransactionsViewEntityRepository: any;
  let creditBlockItmoAuthorizationsViewEntityRepository: any;
  let cadTrustSyncEnqueue: any;
  let counterService: any;
  let aefV2WriteService: any;

  beforeEach(() => {
    orderByCalls = [];
    const queryBuilder: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockImplementation((...args: any[]) => {
        orderByCalls = [args];
        return queryBuilder;
      }),
      addOrderBy: jest.fn().mockImplementation((...args: any[]) => {
        orderByCalls.push(args);
        return queryBuilder;
      }),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    const creditBlockTransfersViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockExplorerViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockIssuancesViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    creditBlockOrgTransactionsViewEntityRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    creditBlockItmoAuthorizationsViewEntityRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockBalancesViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockOrgBalancesViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockProjectBalancesViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const creditBlockProjectHolderBalancesViewEntityRepository: any = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const helperService: any = {
      generateWhereSQL: jest.fn().mockReturnValue(undefined),
    };
    // getCreditBlockHistoryTree's dependencies - stubbed here with plain
    // jest.fn()s, configured per-test below (ledger versions, the queried
    // block, company names, and the two credit-transaction lookups).
    programmeLedgerService = { getCreditBlockLedgerHistory: jest.fn() };
    creditBlocksEntityRepository = { findOne: jest.fn() };
    companyService = {
      findByCompanyId: jest.fn(async (id: number) => ({ name: `Org ${id}` })),
    };
    creditTransactionsEntityRepository = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
    };
    cooperativeApproachRepo = { find: jest.fn().mockResolvedValue([]) };
    cadTrustSyncEnqueue = {
      enqueueCreditIssuance: jest.fn(async () => undefined),
      enqueueUnitUpdate: jest.fn(async () => undefined),
      enqueueVerification: jest.fn(async () => undefined),
    };
    // The real thing, not a stub - getCreditBlockHistoryTree's range/id
    // parsing (groupCreditBlockLedgerVersions, findCreditBlockHistoryRoot)
    // depends on its actual serial-parsing logic, not just its shape. Only
    // "serialNumber.seperator" is read by the methods these tests exercise.
    const configService: any = {
      get: (key: string) => {
        if (key === "serialNumber.seperator") return "-";
        if (key === "systemCountry") return "XX"; // only read by getItmoSerial
        return undefined;
      },
    };
    const serialNumberManagementService = new SerialNumberManagementService(
      configService,
      {} as any
    );

    counterService = { incrementCount: jest.fn(async () => "9001") };
    aefV2WriteService = { recordCreditBlockEvent: jest.fn(async () => undefined) };

    service = new CreditTransactionsManagementService(
      helperService,
      companyService,
      programmeLedgerService,
      creditBlocksEntityRepository,
      counterService,
      creditTransactionsEntityRepository,
      {} as any, // documentManagementService
      creditBlockBalancesViewEntityRepository,
      creditBlockTransfersViewEntityRepository,
      {} as any, // creditBlockRetirementsViewEntityRepository
      creditBlockItmoAuthorizationsViewEntityRepository,
      creditBlockExplorerViewEntityRepository,
      creditBlockIssuancesViewEntityRepository,
      creditBlockOrgBalancesViewEntityRepository,
      creditBlockProjectBalancesViewEntityRepository,
      creditBlockProjectHolderBalancesViewEntityRepository,
      creditBlockOrgTransactionsViewEntityRepository,
      cooperativeApproachRepo,
      {} as any, // caAuthorizedEntityRepo
      serialNumberManagementService,
      aefV2WriteService,
      cadTrustSyncEnqueue
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("handleTransactionRecords — CAD Trust v2 dispatch", () => {
    // Minimal fields handleTransactionRecords itself reads; irrelevant fields omitted per block.
    const baseBlock = {
      creditBlockId: "CA0001-XX-XX-1-1-100",
      projectRefId: "0042",
      serialNumber: "CA0001-XX-XX-1-1-100-2026",
      creditAmount: 100,
      transactionRecords: [] as any[],
    };

    function em() {
      return { save: jest.fn(async () => undefined), update: jest.fn(async () => undefined) };
    }

    it("ISSUE: enqueues credit issuance and writes the transaction row", async () => {
      const entityManager = em();
      const creditBlock: any = { ...baseBlock, txType: TxType.ISSUE, ownerCompanyId: 7 };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(entityManager.save).toHaveBeenCalledTimes(1);
      expect(cadTrustSyncEnqueue.enqueueCreditIssuance).toHaveBeenCalledWith(creditBlock.creditBlockId);
      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).not.toHaveBeenCalled();
      expect(aefV2WriteService.recordCreditBlockEvent).toHaveBeenCalledWith(creditBlock, entityManager, undefined);
    });

    it("TRANSFER: enqueues a unit update — covers both whole-block moves and a split's receiver side", async () => {
      const entityManager = em();
      const creditBlock: any = {
        ...baseBlock,
        txType: TxType.TRANSFER,
        ownerCompanyId: 8,
        previousOwnerCompanyId: 7,
      };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).toHaveBeenCalledWith(creditBlock.creditBlockId);
      expect(cadTrustSyncEnqueue.enqueueCreditIssuance).not.toHaveBeenCalled();
    });

    it("RETIRE_REQ: does not touch CAD Trust — it's only a reservation, not an approved event", async () => {
      const entityManager = em();
      const creditBlock: any = {
        ...baseBlock,
        txType: TxType.RETIRE_REQ,
        ownerCompanyId: 7,
        txData: { subType: "Voluntary Cancellations", amount: 10 },
        transactionRecords: [{ id: "1", type: "Retired", status: "Pending", amount: 10 }],
      };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).not.toHaveBeenCalled();
      expect(cadTrustSyncEnqueue.enqueueCreditIssuance).not.toHaveBeenCalled();
    });

    it("RETIRE, COMPLETED: enqueues a unit update", async () => {
      const entityManager = em();
      const creditBlock: any = {
        ...baseBlock,
        txType: TxType.RETIRE,
        ownerCompanyId: 0,
        txData: { transactionId: "1" },
        transactionRecords: [{ id: "1", type: "Retired", status: "Completed", amount: 10 }],
      };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).toHaveBeenCalledWith(creditBlock.creditBlockId);
    });

    it.each(["Rejected", "Cancelled"])(
      "RETIRE, %s: does NOT enqueue a unit update — TxType.RETIRE also fires on reject/cancel",
      async (status) => {
        const entityManager = em();
        const creditBlock: any = {
          ...baseBlock,
          txType: TxType.RETIRE,
          ownerCompanyId: 7,
          txData: { transactionId: "1" },
          transactionRecords: [{ id: "1", type: "Retired", status, amount: 10 }],
        };

        await service.handleTransactionRecords(creditBlock, entityManager as any);

        expect(cadTrustSyncEnqueue.enqueueUnitUpdate).not.toHaveBeenCalled();
      }
    );

    it("ITMO_AUTH_REQ: does not touch CAD Trust — only a reservation", async () => {
      const entityManager = em();
      const creditBlock: any = {
        ...baseBlock,
        txType: TxType.ITMO_AUTH_REQ,
        ownerCompanyId: 7,
        txData: { amount: 10 },
        transactionRecords: [{ id: "1", type: "ItmoAuthorized", status: "Pending", amount: 10 }],
      };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).not.toHaveBeenCalled();
    });

    it("ITMO_AUTH, COMPLETED: enqueues a unit update", async () => {
      const entityManager = em();
      const creditBlock: any = {
        ...baseBlock,
        txType: TxType.ITMO_AUTH,
        ownerCompanyId: 7,
        txData: { transactionId: "1" },
        transactionRecords: [{ id: "1", type: "ItmoAuthorized", status: "Completed", amount: 10 }],
      };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).toHaveBeenCalledWith(creditBlock.creditBlockId);
    });

    it.each(["Rejected", "Cancelled"])(
      "ITMO_AUTH, %s: does NOT enqueue a unit update",
      async (status) => {
        const entityManager = em();
        const creditBlock: any = {
          ...baseBlock,
          txType: TxType.ITMO_AUTH,
          ownerCompanyId: 7,
          txData: { transactionId: "1" },
          transactionRecords: [{ id: "1", type: "ItmoAuthorized", status, amount: 10 }],
        };

        await service.handleTransactionRecords(creditBlock, entityManager as any);

        expect(cadTrustSyncEnqueue.enqueueUnitUpdate).not.toHaveBeenCalled();
      }
    );

    it("CREDIT_BLOCK_SPLIT: enqueues a unit update for the retained/shrunken side, and still writes no CreditTransactionsEntity row (unchanged pre-existing behaviour)", async () => {
      const entityManager = em();
      const creditBlock: any = { ...baseBlock, txType: TxType.CREDIT_BLOCK_SPLIT, ownerCompanyId: 7 };

      await service.handleTransactionRecords(creditBlock, entityManager as any);

      expect(cadTrustSyncEnqueue.enqueueUnitUpdate).toHaveBeenCalledWith(creditBlock.creditBlockId);
      expect(entityManager.save).not.toHaveBeenCalled();
      expect(entityManager.update).not.toHaveBeenCalled();
      // The AEF hook is unconditional and pre-existing — confirms this branch still reaches it.
      expect(aefV2WriteService.recordCreditBlockEvent).toHaveBeenCalledWith(creditBlock, entityManager, undefined);
    });
  });

  describe("queryTransfers sorting", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts id numerically instead of lexicographically", async () => {
      await service.queryTransfers(
        { size: 10, page: 1, sort: { key: "id", order: "ASC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(
        `CASE WHEN "creditTx"."id" ~ '^[0-9]+$' THEN "creditTx"."id"::bigint END`
      );
      expect(orderByCalls[0][1]).toBe("ASC");
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.queryTransfers(
        { size: 10, page: 1, sort: { key: "createdDate", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(`"createdDate"`);
      expect(orderByCalls[0][1]).toBe("DESC");
    });
  });

  describe("queryExplorer sorting", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts serialNumber by its numeric segments instead of lexicographically", async () => {
      await service.queryExplorer(
        { size: 10, page: 1, sort: { key: "serialNumber", order: "ASC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(2);
      const [projectId, blockStart] = orderByCalls.map((call) => call[0]);
      expect(projectId).toContain("split_part(\"creditBlock\".\"serialNumber\", '-', 4)::int");
      expect(blockStart).toContain("split_part(\"creditBlock\".\"serialNumber\", '-', 5)::int");
      orderByCalls.forEach((call) => expect(call[1]).toBe("ASC"));
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.queryExplorer(
        { size: 10, page: 1, sort: { key: "projectName", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(`"projectName"`);
      expect(orderByCalls[0][1]).toBe("DESC");
    });
  });

  describe("queryExplorer first-transfer country enrichment", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    // createQueryBuilder() always returns the same mock queryBuilder
    // instance (mockReturnValue, not mockReturnValueOnce - see the shared
    // beforeEach), so grabbing it here re-uses the exact object already
    // wired into queryExplorer's query chain.
    const setExplorerRows = (rows: any[]) => {
      const qb = (service as any).creditBlockExplorerViewEntityRepository.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValueOnce([rows, rows.length]);
    };

    it("attaches the acquiring country from the block's isFirstTransfer=true transaction", async () => {
      setExplorerRows([{ id: "BLOCK-1", serialNumber: "CA0NNN-NG-XX-1-1-1000-2024" }]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([
        { creditBlockId: "BLOCK-1", isFirstTransfer: true, data: { country: "JP" } },
      ]);

      const result = await service.queryExplorer({ size: 10, page: 1 } as any, undefined, user);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({ id: "BLOCK-1", firstTransfer: "JP" });
    });

    it("returns null for a block with no isFirstTransfer transaction (the common MO case)", async () => {
      setExplorerRows([{ id: "BLOCK-2", serialNumber: "CA0NNN-NG-XX-1-1-1000-2024" }]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([]);

      const result = await service.queryExplorer({ size: 10, page: 1 } as any, undefined, user);

      expect(result.data[0]).toMatchObject({ id: "BLOCK-2", firstTransfer: null });
    });

    it("returns null rather than crashing when the isFirstTransfer row has no country in its data", async () => {
      setExplorerRows([{ id: "BLOCK-3", serialNumber: "CA0NNN-NG-XX-1-1-1000-2024" }]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([
        { creditBlockId: "BLOCK-3", isFirstTransfer: true, data: {} },
      ]);

      const result = await service.queryExplorer({ size: 10, page: 1 } as any, undefined, user);

      expect(result.data[0]).toMatchObject({ id: "BLOCK-3", firstTransfer: null });
    });

    it("matches each row to its own block's transaction only (no cross-row leakage)", async () => {
      setExplorerRows([
        { id: "BLOCK-4", serialNumber: "CA0NNN-NG-XX-1-1-1000-2024" },
        { id: "BLOCK-5", serialNumber: "CA0NNN-NG-XX-1-1001-2000-2024" },
      ]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([
        { creditBlockId: "BLOCK-4", isFirstTransfer: true, data: { country: "JP" } },
      ]);

      const result = await service.queryExplorer({ size: 10, page: 1 } as any, undefined, user);

      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: "BLOCK-4", firstTransfer: "JP" }),
          expect.objectContaining({ id: "BLOCK-5", firstTransfer: null }),
        ])
      );
    });
  });

  describe("queryIssuances sorting", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts serialNumber by its numeric segments instead of lexicographically", async () => {
      await service.queryIssuances(
        { size: 10, page: 1, sort: { key: "serialNumber", order: "ASC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(2);
      const [projectId, blockStart] = orderByCalls.map((call) => call[0]);
      expect(projectId).toContain("split_part(\"creditTx\".\"serialNumber\", '-', 4)::int");
      expect(blockStart).toContain("split_part(\"creditTx\".\"serialNumber\", '-', 5)::int");
      orderByCalls.forEach((call) => expect(call[1]).toBe("ASC"));
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.queryIssuances(
        { size: 10, page: 1, sort: { key: "issuanceDate", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(`"issuanceDate"`);
      expect(orderByCalls[0][1]).toBe("DESC");
    });
  });

  describe("queryBalanceByProject sorting", () => {
    const dna: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };
    const projectDeveloper: any = {
      companyRole: CompanyRole.PROJECT_DEVELOPER,
      companyId: 3,
    };

    it("sorts moBalance by the non-ITMO remainder, not a column of that name", async () => {
      await service.queryBalanceByProject(
        { size: 10, page: 1, sort: { key: "moBalance", order: "DESC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls[0][0]).toBe(
        `("projectBalance"."creditBalance" - "projectBalance"."itmoBalance")`
      );
      expect(orderByCalls[0][1]).toBe("DESC");
    });

    it("sorts moReserved by the non-ITMO remainder of the reserved amount", async () => {
      await service.queryBalanceByProject(
        { size: 10, page: 1, sort: { key: "moReserved", order: "ASC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls[0][0]).toBe(
        `("projectBalance"."reservedCredits" - "projectBalance"."itmoReservedCredits")`
      );
      expect(orderByCalls[0][1]).toBe("ASC");
    });

    it("maps the MO keys on the Project Developer's holder-scoped view too", async () => {
      await service.queryBalanceByProject(
        { size: 10, page: 1, sort: { key: "moBalance", order: "ASC" } } as any,
        undefined,
        projectDeveloper
      );

      expect(orderByCalls[0][0]).toBe(
        `("projectBalance"."creditBalance" - "projectBalance"."itmoBalance")`
      );
    });

    it("keeps unrelated sort keys on the plain-column path, with a stable tiebreaker", async () => {
      await service.queryBalanceByProject(
        { size: 10, page: 1, sort: { key: "projectName", order: "ASC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls).toHaveLength(2);
      expect(orderByCalls[0][0]).toBe(`"projectName"`);
      expect(orderByCalls[1][0]).toBe(`"projectBalance"."projectId"`);
    });

    it("adds no ordering at all when no sort key is given", async () => {
      await service.queryBalanceByProject(
        { size: 10, page: 1 } as any,
        undefined,
        dna
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBeUndefined();
    });
  });

  describe("queryBalanceByOrganization sorting", () => {
    // DNA-only endpoint - any other role is rejected before the query runs.
    const dna: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts moBalance by the non-ITMO remainder, not a column of that name", async () => {
      await service.queryBalanceByOrganization(
        { size: 10, page: 1, sort: { key: "moBalance", order: "DESC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls[0][0]).toBe(
        `("orgBalance"."creditBalance" - "orgBalance"."itmoBalance")`
      );
      expect(orderByCalls[0][1]).toBe("DESC");
    });

    it("sorts moReserved by the non-ITMO remainder of the reserved amount", async () => {
      await service.queryBalanceByOrganization(
        { size: 10, page: 1, sort: { key: "moReserved", order: "ASC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls[0][0]).toBe(
        `("orgBalance"."reservedCredits" - "orgBalance"."itmoReservedCredits")`
      );
    });

    it("keeps unrelated sort keys on the plain-column path, with a stable tiebreaker", async () => {
      await service.queryBalanceByOrganization(
        { size: 10, page: 1, sort: { key: "organizationName", order: "ASC" } } as any,
        undefined,
        dna
      );

      expect(orderByCalls).toHaveLength(2);
      expect(orderByCalls[0][0]).toBe(`"organizationName"`);
      expect(orderByCalls[1][0]).toBe(`"orgBalance"."organizationId"`);
    });
  });

  describe("queryCreditBalances sorting", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts serialNumber by its numeric segments instead of lexicographically", async () => {
      await service.queryCreditBalances(
        { size: 10, page: 1, sort: { key: "serialNumber", order: "ASC" } } as any,
        undefined,
        user
      );

      const [projectId, blockStart] = orderByCalls.map((call) => call[0]);
      expect(projectId).toContain("split_part(\"creditBlock\".\"serialNumber\", '-', 4)::int");
      expect(blockStart).toContain("split_part(\"creditBlock\".\"serialNumber\", '-', 5)::int");
    });

    it("keeps unrelated sort keys on the plain-column path, with a stable tiebreaker", async () => {
      await service.queryCreditBalances(
        { size: 10, page: 1, sort: { key: "creditAmount", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(2);
      expect(orderByCalls[0][0]).toBe(`"creditAmount"`);
      expect(orderByCalls[0][1]).toBe("DESC");
      expect(orderByCalls[1][0]).toBe(`"creditBlock"."id"`);
    });
  });

  describe("queryOrgCreditBlocks sorting", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    it("sorts serialNumber by its numeric segments instead of lexicographically", async () => {
      await service.queryOrgCreditBlocks(
        {
          size: 10,
          page: 1,
          organizationId: 1,
          sort: { key: "serialNumber", order: "ASC" },
        } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(2);
      const [projectId, blockStart] = orderByCalls.map((call) => call[0]);
      expect(projectId).toContain("split_part(\"orgTx\".\"serialNumber\", '-', 4)::int");
      expect(blockStart).toContain("split_part(\"orgTx\".\"serialNumber\", '-', 5)::int");
      orderByCalls.forEach((call) => expect(call[1]).toBe("ASC"));
    });

    it("keeps unrelated sort keys on the plain-column path (no regression)", async () => {
      await service.queryOrgCreditBlocks(
        {
          size: 10,
          page: 1,
          organizationId: 1,
          sort: { key: "updatedDate", order: "DESC" },
        } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(`"updatedDate"`);
      expect(orderByCalls[0][1]).toBe("DESC");
    });

    it("falls back to updatedDate DESC when no sort key is given", async () => {
      await service.queryOrgCreditBlocks(
        { size: 10, page: 1, organizationId: 1 } as any,
        undefined,
        user
      );

      expect(orderByCalls).toHaveLength(1);
      expect(orderByCalls[0][0]).toBe(`"updatedDate"`);
      expect(orderByCalls[0][1]).toBe("DESC");
    });
  });

  describe("queryOrgCreditBlocks ITMO serial enrichment", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    // createQueryBuilder() always returns the same mock queryBuilder
    // instance (mockReturnValue, not mockReturnValueOnce - see the shared
    // beforeEach), so grabbing it here re-uses the exact object already
    // wired into queryOrgCreditBlocks's query chain.
    const setOrgTransactionRows = (rows: any[]) => {
      const qb = creditBlockOrgTransactionsViewEntityRepository.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValueOnce([rows, rows.length]);
    };

    it("derives the serial from the row's own serialNumber - regression guard against a live block-join drift", async () => {
      setOrgTransactionRows([
        {
          id: "8",
          currentStatus: "ITMO Authorized",
          organizationId: 1,
          serialNumber: "CA0TEST-XX-YY-2-2417-3916-2026",
          itmoAuthorizationRecord: "8",
        },
      ]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([
        { id: "8", data: { cooperativeApproachId: "CA-001" } },
      ]);
      cooperativeApproachRepo.find.mockResolvedValueOnce([
        { cooperativeApproachId: "CA-001", caReferenceNumber: "CA0001" },
      ]);

      const result = await service.queryOrgCreditBlocks(
        { size: 10, page: 1, organizationId: 1 } as any,
        undefined,
        user
      );

      // The row's own range (2417-3916), not some other range a live join
      // to the (possibly since-re-split) block might have produced.
      expect(result.data[0]).toMatchObject({
        id: "8",
        itmoSerial: "CA0001-XX-XX-2-2417-3916-2026",
      });
    });

    it("returns null and skips both lookups entirely for an MO row (the common case)", async () => {
      setOrgTransactionRows([
        {
          id: "1",
          currentStatus: "Issued",
          organizationId: 1,
          serialNumber: "CA0TEST-XX-YY-1-1-1000-2024",
          itmoAuthorizationRecord: null,
        },
      ]);

      const result = await service.queryOrgCreditBlocks(
        { size: 10, page: 1, organizationId: 1 } as any,
        undefined,
        user
      );

      expect(result.data[0]).toMatchObject({ id: "1", itmoSerial: null });
      expect(creditTransactionsEntityRepository.find).not.toHaveBeenCalled();
      expect(cooperativeApproachRepo.find).not.toHaveBeenCalled();
    });

    it("degrades to null rather than throwing when the CA reference can't be resolved", async () => {
      setOrgTransactionRows([
        {
          id: "9",
          currentStatus: "ITMO Authorized",
          organizationId: 1,
          serialNumber: "CA0TEST-XX-YY-1-1897-2396-2026",
          itmoAuthorizationRecord: "9",
        },
      ]);
      creditTransactionsEntityRepository.find.mockResolvedValueOnce([
        { id: "9", data: { cooperativeApproachId: "CA-999" } },
      ]);
      cooperativeApproachRepo.find.mockResolvedValueOnce([]); // no matching CA

      const result = await service.queryOrgCreditBlocks(
        { size: 10, page: 1, organizationId: 1 } as any,
        undefined,
        user
      );

      expect(result.data[0]).toMatchObject({ id: "9", itmoSerial: null });
    });
  });

  describe("queryItmoAuthorizations response shape", () => {
    const user: any = { companyRole: CompanyRole.DESIGNATED_NATIONAL_AUTHORITY };

    const setItmoAuthorizationRows = (rows: any[]) => {
      const qb =
        creditBlockItmoAuthorizationsViewEntityRepository.createQueryBuilder();
      qb.getManyAndCount.mockResolvedValueOnce([rows, rows.length]);
    };

    it("returns authorizationPurpose and the derived itmoSerial, and drops the internal serialNumber", async () => {
      setItmoAuthorizationRows([
        {
          id: "8",
          status: "Completed",
          serialNumber: "CA0NNN-XX-YY-2-2417-3916-2026",
          cooperativeApproachId: "CA-001",
          authorizationPurpose: "UseTowardsNDC",
        },
      ]);
      cooperativeApproachRepo.find.mockResolvedValueOnce([
        { cooperativeApproachId: "CA-001", caReferenceNumber: "CA0001" },
      ]);

      const result = await service.queryItmoAuthorizations(
        { size: 10, page: 1, sort: { key: "createdDate", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(result.data[0]).toMatchObject({
        id: "8",
        // Drives the Purpose of Authorisation column; the frontend maps the
        // raw wire value to its label.
        authorizationPurpose: "UseTowardsNDC",
        itmoSerial: "CA0001-XX-XX-2-2417-3916-2026",
        caReferenceNumber: "CA0001",
      });
      // The Serial No column is gone; serialNumber stays on the view purely
      // to derive itmoSerial above and must not reach the client.
      expect(result.data[0]).not.toHaveProperty("serialNumber");
    });

    it("still omits serialNumber on a Pending row that has no itmoSerial yet", async () => {
      setItmoAuthorizationRows([
        {
          id: "21",
          status: "Pending",
          serialNumber: "CA0NNN-XX-YY-2-1-1316-2026",
          cooperativeApproachId: "CA-001",
          authorizationPurpose: "OtherPurposes",
        },
      ]);
      cooperativeApproachRepo.find.mockResolvedValueOnce([
        { cooperativeApproachId: "CA-001", caReferenceNumber: "CA0001" },
      ]);

      const result = await service.queryItmoAuthorizations(
        { size: 10, page: 1, sort: { key: "createdDate", order: "DESC" } } as any,
        undefined,
        user
      );

      expect(result.data[0]).toMatchObject({
        id: "21",
        authorizationPurpose: "OtherPurposes",
        itmoSerial: null,
      });
      expect(result.data[0]).not.toHaveProperty("serialNumber");
    });
  });

  describe("getCreditBlockHistoryTree", () => {
    // "{prefix}-{country}-{party}-{projectId}-{start}-{end}-{vintage}" - the
    // same 7-part shape SerialNumberManagementService expects. creditBlockId
    // is the first 5 parts (up through {start}).
    const serial = (projectId: string, start: number, end: number, vintage = "2024") =>
      `CA0TEST-XX-YY-${projectId}-${start}-${end}-${vintage}`;
    const blockId = (projectId: string, start: number) => `CA0TEST-XX-YY-${projectId}-${start}`;

    it("reconstructs the full lineage through an ITMO-authorization split - regression: this used to orphan everything past the auth (self-labelled TRANSFER, subtree dropped)", async () => {
      const versions = [
        // Issued 1000 to Org 1.
        {
          creditBlockId: blockId("1", 1),
          serialNumber: serial("1", 1, 1000),
          txType: TxType.ISSUE,
          txTime: 1000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 1000,
          vintage: "2024",
        },
        // Org 1 partially authorizes 400 as ITMO - split, retained MO side.
        {
          creditBlockId: blockId("1", 1),
          serialNumber: serial("1", 1, 600),
          txType: TxType.CREDIT_BLOCK_SPLIT,
          txTime: 2000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 600,
          vintage: "2024",
        },
        // The new ITMO child - ownership unchanged (still Org 1), so its
        // previousOwnerCompanyId inherits the never-transferred parent's
        // null. This is exactly what used to make it invisible to
        // childIndex.
        {
          creditBlockId: blockId("1", 601),
          serialNumber: serial("1", 601, 1000),
          txType: TxType.ITMO_AUTH,
          txTime: 2000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 400,
          vintage: "2024",
          itmoAuthorizationRecord: "AUTH-1",
          itmoSerial: "ITMO-XX-YY-1-601-1000-2024",
        },
        // Org 1 partially retires 300 of the ITMO credits - split, retained
        // ITMO side stays isItmo.
        {
          creditBlockId: blockId("1", 601),
          serialNumber: serial("1", 601, 700),
          txType: TxType.CREDIT_BLOCK_SPLIT,
          txTime: 3000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 100,
          vintage: "2024",
          itmoAuthorizationRecord: "AUTH-1",
          itmoSerial: "ITMO-XX-YY-1-601-700-2024",
        },
        // The retired ITMO child.
        {
          creditBlockId: blockId("1", 701),
          serialNumber: serial("1", 701, 1000),
          txType: TxType.RETIRE,
          txTime: 3000,
          ownerCompanyId: 0,
          previousOwnerCompanyId: 1,
          creditAmount: 300,
          vintage: "2024",
          itmoAuthorizationRecord: "AUTH-1",
          itmoSerial: "ITMO-XX-YY-1-701-1000-2024",
        },
      ];
      programmeLedgerService.getCreditBlockLedgerHistory.mockResolvedValue(versions);
      creditBlocksEntityRepository.findOne.mockResolvedValue({
        creditBlockId: blockId("1", 701),
        projectRefId: "PROJ1",
        serialNumber: serial("1", 701, 1000),
        vintage: "2024",
      });
      creditTransactionsEntityRepository.find.mockImplementation(async (options: any) => {
        if (options.where.id) {
          return [{ id: "AUTH-1", data: { authorizationPurpose: "UseTowardsNDC" } }];
        }
        return [
          {
            creditBlockId: blockId("1", 701),
            subType: "First Transfer Towards NDC",
          },
        ];
      });

      const result = await service.getCreditBlockHistoryTree({ blockId: blockId("1", 701) } as any);
      const history = (result as any).data.history;

      // Regression: with the bug, this would stop at 2 nodes (root + the
      // mislabelled "1-1000" split) and never reach the ITMO subtree.
      expect(history).toHaveLength(3);

      expect(history[0].info).toMatchObject({ action: "ISSUE", amount: 1000 });

      const authSplit = history[1];
      expect(authSplit.range).toBe("1-1000");
      expect(authSplit.children[0].info).toMatchObject({ action: "RETAIN", amount: 600, isItmo: false });
      expect(authSplit.children[1].range).toBe("601-1000");
      expect(authSplit.children[1].info).toMatchObject({
        action: "ITMO_AUTH",
        companyId: 1,
        companyName: "Org 1",
        amount: 400,
        isItmo: true,
        itmoSerial: "ITMO-XX-YY-1-601-1000-2024",
        authorizationPurpose: "UseTowardsNDC",
      });

      const retireSplit = history[2];
      expect(retireSplit.range).toBe("601-1000");
      expect(retireSplit.children[0].info).toMatchObject({ action: "RETAIN", amount: 100, isItmo: true });
      expect(retireSplit.children[1].range).toBe("701-1000");
      expect(retireSplit.children[1].info).toMatchObject({
        action: "RETIRE",
        companyId: 1, // the retiring company, not the resulting owner (0)
        companyName: "Org 1",
        amount: 300,
        isItmo: true,
        itmoSerial: "ITMO-XX-YY-1-701-1000-2024",
        retireSubType: "First Transfer Towards NDC",
      });
    });

    it("labels a whole-block ITMO authorization as ITMO_AUTH rather than dropping it as a no-op", async () => {
      const versions = [
        {
          creditBlockId: blockId("2", 1),
          serialNumber: serial("2", 1, 500),
          txType: TxType.ISSUE,
          txTime: 1000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
        },
        // Whole block authorized - same id, same range, owner unchanged;
        // only itmoAuthorizationRecord/itmoSerial newly appear.
        {
          creditBlockId: blockId("2", 1),
          serialNumber: serial("2", 1, 500),
          txType: TxType.ITMO_AUTH,
          txTime: 2000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
          itmoAuthorizationRecord: "AUTH-2",
          itmoSerial: "ITMO-XX-YY-2-1-500-2024",
        },
      ];
      programmeLedgerService.getCreditBlockLedgerHistory.mockResolvedValue(versions);
      creditBlocksEntityRepository.findOne.mockResolvedValue({
        creditBlockId: blockId("2", 1),
        projectRefId: "PROJ2",
        serialNumber: serial("2", 1, 500),
        vintage: "2024",
      });
      creditTransactionsEntityRepository.find.mockResolvedValue([
        { id: "AUTH-2", data: { authorizationPurpose: "OtherPurposes" } },
      ]);

      const result = await service.getCreditBlockHistoryTree({ blockId: blockId("2", 1) } as any);
      const history = (result as any).data.history;

      expect(history).toHaveLength(2);
      expect(history[1].range).toBe("1-500");
      expect(history[1].children).toHaveLength(1);
      expect(history[1].children[0].info).toMatchObject({
        action: "ITMO_AUTH",
        isItmo: true,
        itmoSerial: "ITMO-XX-YY-2-1-500-2024",
        authorizationPurpose: "OtherPurposes",
      });
    });

    it("produces no node for a rejected/cancelled ITMO authorization request (txType alone can't tell it apart from a real one)", async () => {
      const versions = [
        {
          creditBlockId: blockId("3", 1),
          serialNumber: serial("3", 1, 500),
          txType: TxType.ISSUE,
          txTime: 1000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
        },
        // Reservation for the request.
        {
          creditBlockId: blockId("3", 1),
          serialNumber: serial("3", 1, 500),
          txType: TxType.ITMO_AUTH_REQ,
          txTime: 2000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
        },
        // Rejected - writes txType ITMO_AUTH too, but itmoAuthorizationRecord
        // never gets set and ownership never changes.
        {
          creditBlockId: blockId("3", 1),
          serialNumber: serial("3", 1, 500),
          txType: TxType.ITMO_AUTH,
          txTime: 3000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
        },
      ];
      programmeLedgerService.getCreditBlockLedgerHistory.mockResolvedValue(versions);
      creditBlocksEntityRepository.findOne.mockResolvedValue({
        creditBlockId: blockId("3", 1),
        projectRefId: "PROJ3",
        serialNumber: serial("3", 1, 500),
        vintage: "2024",
      });

      const result = await service.getCreditBlockHistoryTree({ blockId: blockId("3", 1) } as any);
      const history = (result as any).data.history;

      // Only the issuance root - both the request and the rejection are
      // silently skipped, exactly like a rejected retire request.
      expect(history).toHaveLength(1);
      expect(history[0].info.action).toBe("ISSUE");
    });

    it("keeps existing TRANSFER/whole-block-RETIRE behavior unchanged for blocks that never touch ITMO", async () => {
      const versions = [
        {
          creditBlockId: blockId("4", 1),
          serialNumber: serial("4", 1, 500),
          txType: TxType.ISSUE,
          txTime: 1000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 500,
          vintage: "2024",
        },
        {
          creditBlockId: blockId("4", 1),
          serialNumber: serial("4", 1, 300),
          txType: TxType.CREDIT_BLOCK_SPLIT,
          txTime: 2000,
          ownerCompanyId: 1,
          previousOwnerCompanyId: undefined,
          creditAmount: 300,
          vintage: "2024",
        },
        {
          creditBlockId: blockId("4", 301),
          serialNumber: serial("4", 301, 500),
          txType: TxType.TRANSFER,
          txTime: 2000,
          ownerCompanyId: 2,
          previousOwnerCompanyId: 1,
          creditAmount: 200,
          vintage: "2024",
        },
        // Buyer (2) retires the whole transferred block in one action.
        {
          creditBlockId: blockId("4", 301),
          serialNumber: serial("4", 301, 500),
          txType: TxType.RETIRE,
          txTime: 3000,
          ownerCompanyId: 0,
          previousOwnerCompanyId: 2,
          creditAmount: 200,
          vintage: "2024",
        },
      ];
      programmeLedgerService.getCreditBlockLedgerHistory.mockResolvedValue(versions);
      creditBlocksEntityRepository.findOne.mockResolvedValue({
        creditBlockId: blockId("4", 301),
        projectRefId: "PROJ4",
        serialNumber: serial("4", 301, 500),
        vintage: "2024",
      });

      const result = await service.getCreditBlockHistoryTree({ blockId: blockId("4", 301) } as any);
      const history = (result as any).data.history;

      expect(history).toHaveLength(3);
      expect(history[1].children[1].info).toMatchObject({
        action: "TRANSFER",
        companyId: 2,
        companyName: "Org 2",
        amount: 200,
        isItmo: false,
      });
      expect(history[2].children[0].info).toMatchObject({
        action: "RETIRE",
        companyId: 2, // the retiring company
        companyName: "Org 2",
        amount: 200,
        isItmo: false,
        retireSubType: null,
      });
    });
  });
});
