import { CadTrustVerificationMapper } from "./verification.mapper";

function buildMapper(overrides: { verificationBodyDefault?: string } = {}) {
  const picklistService = { warnOnUnknownValues: jest.fn(async () => undefined) };
  const profile = {
    getVerificationBodyDefault: jest.fn(() => overrides.verificationBodyDefault ?? "DNV"),
  };

  return {
    mapper: new CadTrustVerificationMapper(picklistService as any, profile as any),
    picklistService,
    profile,
  };
}

const PROPS = {
  refId: "0042",
  documentVersion: 1,
  verificationBodyName: "Kunene Certifiers",
  verificationStartDate: "2026-01-01",
  verificationEndDate: "2026-06-30",
};

describe("CadTrustVerificationMapper", () => {
  it("always sends the configured default, never the real verifying body's name", async () => {
    const { mapper, profile } = buildMapper({ verificationBodyDefault: "DNV" });

    const input = await mapper.toCreateInput(PROPS, "0042-VERIFICATION-v1", "cadt-project-1");

    expect(input.verificationBody).toBe("DNV");
    expect(input.verificationBody).not.toBe(PROPS.verificationBodyName);
    expect(profile.getVerificationBodyDefault).toHaveBeenCalledTimes(1);
  });

  it("warns (never throws) on the configured default via the picklist service", async () => {
    const { mapper, picklistService } = buildMapper({ verificationBodyDefault: "DNV" });

    await mapper.toCreateInput(PROPS, "0042-VERIFICATION-v1", "cadt-project-1");

    expect(picklistService.warnOnUnknownValues).toHaveBeenCalledWith("verification_body", ["DNV"]);
  });

  it("includes the period dates when present", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROPS, "0042-VERIFICATION-v1", "cadt-project-1");

    expect(input.verificationStartDate).toBe("2026-01-01");
    expect(input.verificationEndDate).toBe("2026-06-30");
  });

  it("omits the period dates when absent — both are optional on CAD Trust's side", async () => {
    const { mapper } = buildMapper();
    const props = { ...PROPS, verificationStartDate: undefined, verificationEndDate: undefined };

    const input = await mapper.toCreateInput(props, "0042-VERIFICATION-v1", "cadt-project-1");

    expect(input).not.toHaveProperty("verificationStartDate");
    expect(input).not.toHaveProperty("verificationEndDate");
  });

  it("includes cadTrustValidationId only when given", async () => {
    const { mapper } = buildMapper();

    const withValidation = await mapper.toCreateInput(
      PROPS,
      "0042-VERIFICATION-v1",
      "cadt-project-1",
      "cadt-validation-1"
    );
    expect(withValidation.cadTrustValidationId).toBe("cadt-validation-1");

    const withoutValidation = await mapper.toCreateInput(PROPS, "0042-VERIFICATION-v1", "cadt-project-1");
    expect(withoutValidation).not.toHaveProperty("cadTrustValidationId");
  });

  it("sets verificationId and cadTrustProjectId from the given arguments", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(PROPS, "0042-VERIFICATION-v1", "cadt-project-1");

    expect(input.verificationId).toBe("0042-VERIFICATION-v1");
    expect(input.cadTrustProjectId).toBe("cadt-project-1");
  });
});
