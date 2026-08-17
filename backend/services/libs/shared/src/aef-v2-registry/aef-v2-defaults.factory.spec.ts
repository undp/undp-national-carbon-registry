import { derivePartyItmoRegistryId, resolvePartyItmoRegistryId } from "./aef-v2-defaults.factory";

describe("derivePartyItmoRegistryId", () => {
  it("derives alpha-3 party code + 2 digits, matching PARTY_ITMO_REGISTRY_ID_PATTERN", () => {
    expect(derivePartyItmoRegistryId("NGA")).toBe("NGA01");
  });
});

describe("resolvePartyItmoRegistryId", () => {
  function configServiceReturning(value: string | undefined) {
    return { get: jest.fn().mockReturnValue(value) } as unknown as { get: jest.Mock };
  }

  it("derives from the Party when AEF_V2.partyItmoRegistryId is unset", () => {
    const configService = configServiceReturning(undefined);

    expect(resolvePartyItmoRegistryId(configService as any, "NGA")).toBe("NGA01");
  });

  it("prefers an explicitly configured value over the derived one", () => {
    const configService = configServiceReturning("NGA07");

    expect(resolvePartyItmoRegistryId(configService as any, "NGA")).toBe("NGA07");
  });
});
