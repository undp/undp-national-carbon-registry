import { fixedClock, InMemoryAefStore } from "@app/aef-v2";
import { EntityManager } from "typeorm";

import { AuthorizedEntityStatus } from "../enum/authorized.entity.status.enum";
import { CreditTransactionStatusEnum } from "../enum/credit.transaction.status.enum";
import { CreditTransactionSubTypesEnum } from "../enum/credit.transaction.sub.types.enum";
import { TxType } from "../enum/txtype.enum";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { AefV2WriteService } from "./aef-v2-write.service";
import { NOT_APPLICABLE } from "./mappers/aef-code.maps";

// AefV2WriteService is constructed by hand rather than through Nest's
// TestingModule — its dependencies are all narrow, single-method surfaces
// here (a couple of findOneBy repos, a country/serial lookup), and doing so
// lets the store be a real InMemoryAefStore (from @app/aef-v2's own test
// support) instead of mocking store.find/create/update calls one by one —
// the whole point of this spec is checking what actually ends up in Table 5.
describe("AefV2WriteService — real-time authorized-entity writes", () => {
  const defaults = {
    aefT1SubmissionParty: "VUT",
    aefT1SubmissionNdcFirstYear: 2021,
    aefT1SubmissionNdcLastYear: 2030,
  };
  const clock = fixedClock(new Date("2026-06-01T12:00:00.000Z"));

  const entity = {
    id: "entity-uuid-1",
    cooperativeApproachId: "CA0004",
    entityName: "Alpine Carbon Markets",
    entityIdentifier: "ENT-001",
    countryOfIncorporation: "CH",
    authorizationDate: Date.parse("2024-03-01T00:00:00.000Z"),
    createdTime: Date.parse("2024-01-01T00:00:00.000Z"),
    authorizationReference: "REF-1",
    status: AuthorizedEntityStatus.ACTIVE,
  };

  // A legacy entity created before authorizationDate became mandatory.
  const legacyEntity = {
    ...entity,
    id: "entity-uuid-2",
    entityIdentifier: "ENT-002",
    authorizationDate: undefined,
    createdTime: Date.parse("2023-06-15T00:00:00.000Z"),
  };

  const cooperativeApproach = {
    cooperativeApproachId: "CA0004",
    caReferenceNumber: "CA0004",
  };

  function buildService(store: InMemoryAefStore) {
    const projectRepo = {
      findOneBy: jest.fn().mockResolvedValue({
        refId: "P0001",
        sector: "ENERGY",
        sectoralScope: "AGRICULTURE",
      }),
    };
    const creditTransactionsRepo = {
      findOneBy: jest.fn(),
    };
    const cooperativeApproachRepo = {
      findOneBy: jest.fn().mockResolvedValue(cooperativeApproach),
    };
    const authorizedEntityRepo = {
      findOneBy: jest.fn().mockResolvedValue(entity),
    };
    const countryService = {
      getAlpha3: jest.fn().mockResolvedValue("CHE"),
    };
    const serialNumberManagementService = {
      getBlockRange: jest.fn().mockReturnValue({ start: 1, end: 100 }),
    };
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "serialNumber.seperator") return "-";
        if (key === "AEF_V2.strictWrite") return true;
        return undefined;
      }),
    };
    const storeFactory = { forManager: () => store };

    // Stands in for the replicator's transactional EntityManager. Every
    // repository read in the service must go through this (em.getRepository),
    // never a separately-injected default-connection repo — that mismatch is
    // the actual production bug this refactor fixes (a same-transaction
    // status flip via em.update was invisible to a read through a different
    // connection), so routing every repo through here is what makes this
    // spec exercise the real code path instead of masking the bug the way
    // the previous constructor-injected mocks did.
    const em = {
      getRepository: (target: unknown) => {
        switch (target) {
          case ProjectEntity:
            return projectRepo;
          case CreditTransactionsEntity:
            return creditTransactionsRepo;
          case CooperativeApproach:
            return cooperativeApproachRepo;
          case CaAuthorizedEntity:
            return authorizedEntityRepo;
          default:
            throw new Error(`Unexpected entity in em.getRepository: ${String(target)}`);
        }
      },
    } as unknown as EntityManager;

    const service = new AefV2WriteService(
      storeFactory as any,
      defaults,
      configService as any,
      serialNumberManagementService as any,
      countryService as any
    );

    return { service, em, creditTransactionsRepo, authorizedEntityRepo };
  }

  function oimpCreditBlock(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      creditBlockId: "block-1",
      txType: TxType.RETIRE,
      txTime: Date.parse("2026-06-01T00:00:00.000Z"),
      itmoAuthorizationRecord: "auth-1",
      itmoSerial: "CA0004-VU-CH-1-1-100-2024",
      projectRefId: "P0001",
      vintage: "2024",
      creditAmount: 100,
      txData: { transactionId: "retire-1" },
      ...overrides,
    } as any;
  }

  function oimpRetireTx(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: "retire-1",
      status: CreditTransactionStatusEnum.COMPLETED,
      subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP,
      data: {
        country: "CH",
        authorizedEntityId: entity.id,
        entityName: entity.entityName,
        cooperativeApproachId: "CA0004",
      },
      ...overrides,
    };
  }

  it("writes a Table 5 row in real time for an OIMP retirement, keyed consistently with Table 3", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(oimpRetireTx());

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const entities = store.all("t5AuthorizedEntities");
    const actions = store.all("t3Actions");
    expect(entities).toHaveLength(1);
    expect(actions).toHaveLength(1);

    // Same expression on both sides: entity.entityIdentifier ?? entity.id.
    expect(entities[0].aefT5AuthorizedEntitiesId).toBe("ENT-001");
    expect(actions[0].aefT3ActionsUsingAuthorizedEntityId).toBe("ENT-001");

    // Written unfrozen — this is a real-time row, not a year-end snapshot.
    expect(entities[0].snapshotAt).toBeUndefined();

    expect(actions[0].aefT3ActionsPurposeOfUseOimp).toBe("First transferred to Alpine Carbon Markets");

    // Uses entity.authorizationDate, not createdTime, when both are present.
    expect(entities[0].aefT5AuthorizedEntitiesAuthorizationDate).toBe("01/03/2024");
    expect(entities[0].aefT5AuthorizedEntitiesConditions).toBe("Active");
    expect(entities[0].aefT5AuthorizedEntitiesChangeConditions).toBe(
      "Entity can be set to Active/Inactive by authorities."
    );
    // This registry has nothing further to add — never the entity's
    // authorizationReference or an inactive-status note (both dropped;
    // status is already carried by aefT5AuthorizedEntitiesConditions above).
    expect(entities[0].aefT5AuthorizedEntitiesAdditionalInformation).toBe(NOT_APPLICABLE);
  });

  it("falls back to createdTime for a legacy entity with no authorizationDate", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo, authorizedEntityRepo } = buildService(store);
    authorizedEntityRepo.findOneBy.mockResolvedValue(legacyEntity);
    creditTransactionsRepo.findOneBy.mockResolvedValue(
      oimpRetireTx({ data: { country: "CH", authorizedEntityId: legacyEntity.id, cooperativeApproachId: "CA0004" } })
    );

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const entities = store.all("t5AuthorizedEntities");
    expect(entities).toHaveLength(1);
    expect(entities[0].aefT5AuthorizedEntitiesAuthorizationDate).toBe("15/06/2023");
  });

  it("updates the same row rather than duplicating it on a second reference in the same year", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(oimpRetireTx());

    await service.recordCreditBlockEvent(oimpCreditBlock({ creditBlockId: "block-1" }), em);
    const firstRowId = store.all("t5AuthorizedEntities")[0].id;

    creditTransactionsRepo.findOneBy.mockResolvedValue(
      oimpRetireTx({ id: "retire-2" })
    );
    await service.recordCreditBlockEvent(
      oimpCreditBlock({ creditBlockId: "block-2", txData: { transactionId: "retire-2" } }),
      em
    );

    const entities = store.all("t5AuthorizedEntities");
    expect(entities).toHaveLength(1);
    expect(entities[0].id).toBe(firstRowId);
  });

  it("links the Table 2 and Table 5 rows via the circular FK when a Table 2 row exists", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(oimpRetireTx());

    // Pre-seed the Table 2 row this authorization would already have, per
    // the ITMO_AUTH branch — recordRetirementAction only ever looks this
    // up, never creates it.
    await store.create("t2Authorizations", {
      aefT2AuthorizationsId: "auth-1",
      aefT2AuthorizationsDate: "01/03/2024",
      aefT2AuthorizationsCooperativeApproachId: "CA0004",
      aefT2AuthorizationsVersion: 1,
      aefT2AuthorizationsMetric: "GHG",
      aefT2AuthorizationsSector: "Energy generation",
      aefT2AuthorizationsPurposesForAuthorization: "OIMP",
    });

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const t2 = store.all("t2Authorizations")[0];
    const t5 = store.all("t5AuthorizedEntities")[0];
    expect(t2.aefT5AuthorizedEntitiesId).toBe(t5.id);
    expect(t5.aefT2AuthorizationsId).toBe(t2.id);
  });

  it("does not write a Table 5 row for an NDC first-transfer retirement, and marks the OIMP-only fields NA", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(
      oimpRetireTx({
        subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC,
        data: { country: "CH", cooperativeApproachId: "CA0004" },
      })
    );

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const action = store.all("t3Actions")[0];
    expect(store.all("t5AuthorizedEntities")).toHaveLength(0);
    // Only meaningful for OIMP — NA on an NDC row rather than left blank.
    expect(action.aefT3ActionsUsingAuthorizedEntityId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsPurposeOfUseOimp).toBe(NOT_APPLICABLE);
    // Genuinely applicable to a first transfer — real values, unaffected.
    expect(action.aefT3ActionsAcquiringPartyId).toBe("CHE");
    expect(action.aefT3ActionsUsingParticipatingPartyId).toBe("CHE");
    // Never populated by any retirement subtype.
    expect(action.aefT3ActionsAdditionalInformation).toBe(NOT_APPLICABLE);
  });

  it("marks the transfer/use-only fields NA for a voluntary cancellation", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(
      oimpRetireTx({
        subType: CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION,
        // A cancellation never resolves a country or authorized entity —
        // buildRetirementData only populates those for the two
        // first-transfer subtypes.
        data: {},
      })
    );

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const action = store.all("t3Actions")[0];
    expect(store.all("t5AuthorizedEntities")).toHaveLength(0);
    expect(action.aefT3ActionsAcquiringPartyId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsUsingParticipatingPartyId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsUsingAuthorizedEntityId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsPurposeOfUseOimp).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsAdditionalInformation).toBe(NOT_APPLICABLE);
  });

  it("marks the transfer/use-only fields NA for an OMGE cancellation", async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { service, em, creditTransactionsRepo } = buildService(store);
    creditTransactionsRepo.findOneBy.mockResolvedValue(
      oimpRetireTx({
        subType: CreditTransactionSubTypesEnum.OMGE_CANCELLATION,
        data: {},
      })
    );

    await service.recordCreditBlockEvent(oimpCreditBlock(), em);

    const action = store.all("t3Actions")[0];
    expect(action.aefT3ActionsAcquiringPartyId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsUsingParticipatingPartyId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsUsingAuthorizedEntityId).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsPurposeOfUseOimp).toBe(NOT_APPLICABLE);
    expect(action.aefT3ActionsAdditionalInformation).toBe(NOT_APPLICABLE);
  });
});
