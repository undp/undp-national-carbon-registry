import { AuthorizedEntityStatus } from "../../enum/authorized.entity.status.enum";
import { NOT_APPLICABLE } from "../mappers/aef-code.maps";
import { RegistryAuthorizedEntitiesProvider } from "./registry-authorized-entities.provider";

// The exclusion/inclusion behaviour of the WHERE clause itself can only be
// proven against a real database (getMany() is a black box here) — what a
// unit test *can* pin down is that the query builder is still asked for the
// COALESCE fallback (a regression guard against reverting to the old
// authorizationDate-IS-NOT-NULL exclusion), and that the row-mapping falls
// back to createdTime exactly when authorizationDate is absent.
describe("RegistryAuthorizedEntitiesProvider", () => {
  const entityWithDate = {
    id: "entity-1",
    cooperativeApproachId: "CA0004",
    entityName: "Alpine Carbon Markets",
    entityIdentifier: "ENT-001",
    countryOfIncorporation: "CH",
    authorizationDate: Date.parse("2024-03-01T00:00:00.000Z"),
    createdTime: Date.parse("2024-01-01T00:00:00.000Z"),
    status: AuthorizedEntityStatus.ACTIVE,
  };

  const entityWithoutDate = {
    id: "entity-2",
    cooperativeApproachId: "CA0004",
    entityName: "Legacy Entity",
    entityIdentifier: undefined,
    countryOfIncorporation: "CH",
    authorizationDate: null,
    createdTime: Date.parse("2023-06-15T00:00:00.000Z"),
    status: AuthorizedEntityStatus.ACTIVE,
  };

  function buildProvider(entities: unknown[]) {
    const whereCalls: { sql: string; params: unknown }[] = [];
    const queryBuilder: any = {
      where: jest.fn((sql: string, params: unknown) => {
        whereCalls.push({ sql, params });
        return queryBuilder;
      }),
      andWhere: jest.fn(() => queryBuilder),
      getMany: jest.fn().mockResolvedValue(entities),
    };
    const authorizedEntityRepo = {
      createQueryBuilder: jest.fn(() => queryBuilder),
    };
    const cooperativeApproachRepo = {
      findBy: jest.fn().mockResolvedValue([{ cooperativeApproachId: "CA0004", caReferenceNumber: "CA0004" }]),
    };
    const countryService = {
      getAlpha3: jest.fn().mockResolvedValue("CHE"),
    };

    const provider = new RegistryAuthorizedEntitiesProvider(
      authorizedEntityRepo as any,
      cooperativeApproachRepo as any,
      countryService as any
    );

    return { provider, whereCalls };
  }

  it("filters on COALESCE(authorizationDate, createdTime), not an IS NOT NULL exclusion", async () => {
    const { provider, whereCalls } = buildProvider([entityWithDate]);

    await provider.getAuthorizedEntities({ reportedYear: 2025, asOf: new Date("2025-12-31T23:59:59.999Z") });

    expect(whereCalls[0].sql).toBe("COALESCE(entity.authorizationDate, entity.createdTime) <= :asOf");
  });

  it("uses authorizationDate when present", async () => {
    const { provider } = buildProvider([entityWithDate]);

    const rows = await provider.getAuthorizedEntities({
      reportedYear: 2025,
      asOf: new Date("2025-12-31T23:59:59.999Z"),
    });

    expect(rows[0].aefT5AuthorizedEntitiesAuthorizationDate).toBe("01/03/2024");
  });

  it("falls back to createdTime when authorizationDate is absent", async () => {
    const { provider } = buildProvider([entityWithoutDate]);

    const rows = await provider.getAuthorizedEntities({
      reportedYear: 2025,
      asOf: new Date("2025-12-31T23:59:59.999Z"),
    });

    expect(rows[0].aefT5AuthorizedEntitiesAuthorizationDate).toBe("15/06/2023");
  });

  it("carries the entity's current status into Conditions, and the static ChangeConditions label", async () => {
    const { provider } = buildProvider([entityWithDate]);

    const rows = await provider.getAuthorizedEntities({
      reportedYear: 2025,
      asOf: new Date("2025-12-31T23:59:59.999Z"),
    });

    expect(rows[0].aefT5AuthorizedEntitiesConditions).toBe("Active");
    expect(rows[0].aefT5AuthorizedEntitiesChangeConditions).toBe(
      "Entity can be set to Active/Inactive by authorities."
    );
  });

  it("marks Additional explanatory information NA — this registry has nothing further to add", async () => {
    const { provider } = buildProvider([entityWithDate]);

    const rows = await provider.getAuthorizedEntities({
      reportedYear: 2025,
      asOf: new Date("2025-12-31T23:59:59.999Z"),
    });

    expect(rows[0].aefT5AuthorizedEntitiesAdditionalInformation).toBe(NOT_APPLICABLE);
  });
});
