import { CadTrustRegistryProfileService } from "./cadtrust-registry-profile.service";

const CONFIG: Record<string, any> = {
  "cadTrustV2.orgName": "Test Registry Org",
  "cadTrustV2.registryName": "Test Registry",
  "cadTrustV2.program.name": "CountryX National Carbon Crediting Program",
  "cadTrustV2.program.registry": "Test Registry",
  "cadTrustV2.program.registryActivityId": "LK",
  "cadTrustV2.program.registryProgramId": undefined,
  "cadTrustV2.program.description": undefined,
  "cadTrustV2.methodology.code": "LK-NCC",
  "cadTrustV2.methodology.name": "National Carbon Crediting",
  "cadTrustV2.methodology.version": undefined,
  "cadTrustV2.methodology.date": undefined,
  "cadTrustV2.methodology.link": undefined,
  "cadTrustV2.methodology.type": undefined,
};

function buildService(configOverrides: Record<string, any> = {}) {
  const warnOnUnknownValues = jest.fn(async (_key: string, values: string[]) => values);
  const configService = { get: (key: string) => ({ ...CONFIG, ...configOverrides })[key] };
  const picklistService = { warnOnUnknownValues };

  return {
    warnOnUnknownValues,
    service: new CadTrustRegistryProfileService(configService as any, picklistService as any),
  };
}

describe("CadTrustRegistryProfileService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("getProgramInput", () => {
    it("builds the required fields and omits unset optional ones", () => {
      const { service } = buildService();

      expect(service.getProgramInput()).toEqual({
        programName: "CountryX National Carbon Crediting Program",
        programRegistry: "Test Registry",
        programRegistryActivityId: "LK",
      });
    });

    it("includes optional fields when configured", () => {
      const { service } = buildService({
        "cadTrustV2.program.registryProgramId": "prog-1",
        "cadTrustV2.program.description": "National crediting activity",
      });

      const input = service.getProgramInput();

      expect(input.programRegistryProgramId).toBe("prog-1");
      expect(input.programDescription).toBe("National crediting activity");
    });
  });

  describe("getMethodologyInput", () => {
    it("builds the required fields and omits unset optional ones", async () => {
      const { service } = buildService();

      const input = await service.getMethodologyInput();

      expect(input).toEqual({ methodologyCode: "LK-NCC", methodologyName: "National Carbon Crediting" });
    });

    it("validates methodologyType against the live picklist only when it is set", async () => {
      const { service, warnOnUnknownValues } = buildService();

      await service.getMethodologyInput();
      expect(warnOnUnknownValues).not.toHaveBeenCalled();

      const { service: withType, warnOnUnknownValues: warnWithType } = buildService({
        "cadTrustV2.methodology.type": "Baseline and Credit",
      });
      const input = await withType.getMethodologyInput();

      expect(input.methodologyType).toBe("Baseline and Credit");
      expect(warnWithType).toHaveBeenCalledWith("methodology_type", ["Baseline and Credit"]);
    });
  });

  describe("assertConfigured — the sentinel-default guard", () => {
    it("passes when systemCountryName, systemCountryCode and a registry name are all set", () => {
      process.env.systemCountryName = "Vanuatu";
      process.env.systemCountryCode = "VU";
      process.env.SYSTEM_NAME = "Vanuatu Carbon Registry";

      const { service } = buildService();

      expect(service.assertConfigured()).toEqual([]);
    });

    it("blocks when every fallback is unset, leaving every value a placeholder", () => {
      delete process.env.systemCountryName;
      delete process.env.systemCountryCode;
      delete process.env.SYSTEM_NAME;
      delete process.env.CADT_V2_REGISTRY_NAME;
      delete process.env.CADT_V2_PROGRAM_NAME;
      delete process.env.CADT_V2_PROGRAM_REGISTRY;
      delete process.env.CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID;
      delete process.env.CADT_V2_METHODOLOGY_CODE;

      const { service } = buildService();

      expect(service.assertConfigured().length).toBe(4);
    });

    it("does not flag a real deployment whose country code happens to be the fallback value 'NG'", () => {
      // "NG" is both the hardcoded fallback and Nigeria's real ISO alpha-2 code.
      // The guard must key off which env vars were actually set, not the
      // resolved value, or a genuine Nigerian deployment would be blocked forever.
      process.env.systemCountryName = "Nigeria";
      process.env.systemCountryCode = "NG";
      process.env.SYSTEM_NAME = "Nigeria Carbon Registry";

      const { service } = buildService();

      expect(service.assertConfigured()).toEqual([]);
    });

    it("passes when an explicit CADT_V2_* override is set even though the system fallback is unset", () => {
      delete process.env.systemCountryName;
      delete process.env.systemCountryCode;
      delete process.env.SYSTEM_NAME;
      delete process.env.CADT_V2_REGISTRY_NAME;
      process.env.CADT_V2_PROGRAM_NAME = "Vanuatu National Carbon Crediting Program";
      process.env.CADT_V2_PROGRAM_REGISTRY = "Vanuatu Carbon Registry";
      process.env.CADT_V2_PROGRAM_REGISTRY_ACTIVITY_ID = "VU";
      process.env.CADT_V2_METHODOLOGY_CODE = "VU-NCC";

      const { service } = buildService();

      expect(service.assertConfigured()).toEqual([]);
    });
  });
});
