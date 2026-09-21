import { CadTrustLocationMapper } from "./location.mapper";

const PROJECT_CAD_TRUST_ID = "cadt-project-1";

function buildMapper(configOverrides: Record<string, any> = {}) {
  const warnOnUnknownValues = jest.fn(async (_key: string, values: string[]) => values);
  const configService = {
    get: (key: string) => ({ systemCountryName: "CountryX", ...configOverrides })[key],
  };
  const logger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

  return {
    warnOnUnknownValues,
    logger,
    mapper: new CadTrustLocationMapper(configService as any, { warnOnUnknownValues } as any, logger as any),
  };
}

describe("CadTrustLocationMapper", () => {
  it("builds a location from province and coordinates", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, {
      province: "Kunene",
      geographicalLocationCoordinates: [[[[13.5, -19.0]]]],
    });

    expect(input).toEqual({
      cadTrustProjectId: PROJECT_CAD_TRUST_ID,
      locationCountry: "CountryX",
      locationRegion: "Kunene",
      locationGis: JSON.stringify([[[[13.5, -19.0]]]]),
    });
  });

  it("returns undefined — not an error — when the INF has no location data at all", async () => {
    const { mapper } = buildMapper();

    expect(await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, { projectDescription: "d" })).toBeUndefined();
    expect(await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, undefined)).toBeUndefined();
  });

  it("builds a location from province alone, with no coordinates", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, { province: "Kunene" });

    expect(input).toEqual({
      cadTrustProjectId: PROJECT_CAD_TRUST_ID,
      locationCountry: "CountryX",
      locationRegion: "Kunene",
    });
  });

  it("builds a location from coordinates alone, with no province", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, {
      geographicalLocationCoordinates: [[[[13.5, -19.0]]]],
    });

    expect(input?.locationRegion).toBeUndefined();
    expect(input?.locationGis).toBe(JSON.stringify([[[[13.5, -19.0]]]]));
  });

  it("passes through the literal 'test' placeholder rather than filtering it", async () => {
    // A known frontend landmine (ProgrammeCreationComponent.tsx falls back to
    // "test" for empty province/district/city) — not this mapper's job to fix.
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, { province: "test" });

    expect(input?.locationRegion).toBe("test");
  });

  it("omits locationGis and logs a warning when the serialized coordinates exceed 10000 characters", async () => {
    const { mapper, logger } = buildMapper();
    const hugeCoordinates = Array.from({ length: 2000 }, () => [13.5, -19.0]);

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, {
      province: "Kunene",
      geographicalLocationCoordinates: hugeCoordinates,
    });

    expect(input).not.toHaveProperty("locationGis");
    expect(input?.locationRegion).toBe("Kunene");
    expect(logger.warn).toHaveBeenCalled();
  });

  it("checks locationCountry against the live picklist", async () => {
    const { mapper, warnOnUnknownValues } = buildMapper();

    await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, { province: "Kunene" });

    expect(warnOnUnknownValues).toHaveBeenCalledWith("location_country", ["CountryX"]);
  });

  it("resolves country from systemCountryName", async () => {
    const { mapper } = buildMapper({ systemCountryName: "Vanuatu" });

    const input = await mapper.toCreateInput(PROJECT_CAD_TRUST_ID, { province: "Kunene" });

    expect(input?.locationCountry).toBe("Vanuatu");
  });
});
