import { CadTrustStakeholderMapper } from "./stakeholder.mapper";
import { STAKEHOLDER_TYPE_DEVELOPER } from "./picklist.map";

function buildMapper() {
  const warnOnUnknownValues = jest.fn(async (_key: string, values: string[]) => values);
  return { warnOnUnknownValues, mapper: new CadTrustStakeholderMapper({ warnOnUnknownValues } as any) };
}

describe("CadTrustStakeholderMapper", () => {
  it("stages the company as a Developer stakeholder", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput({ name: "Kunene Developers", website: "https://kunenedev.example.org" });

    expect(input).toEqual({
      stakeholderName: "Kunene Developers",
      stakeholderType: STAKEHOLDER_TYPE_DEVELOPER,
      stakeholderLink: "https://kunenedev.example.org",
    });
  });

  it("omits stakeholderLink when the company has no website", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput({ name: "Kunene Developers" });

    expect(input).not.toHaveProperty("stakeholderLink");
  });

  it("omits stakeholderLink when the company's website is an empty string", async () => {
    // CAD Trust validates this as a URI; Company.website can legitimately be
    // forced to "" on an update that omits it (company.service.ts).
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput({ name: "Kunene Developers", website: "" });

    expect(input).not.toHaveProperty("stakeholderLink");
  });

  it("trims a whitespace-only website the same as an empty one", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput({ name: "Kunene Developers", website: "   " });

    expect(input).not.toHaveProperty("stakeholderLink");
  });

  it("checks stakeholderType against the live picklist", async () => {
    const { mapper, warnOnUnknownValues } = buildMapper();

    await mapper.toCreateInput({ name: "Kunene Developers" });

    expect(warnOnUnknownValues).toHaveBeenCalledWith("stakeholder_type", [STAKEHOLDER_TYPE_DEVELOPER]);
  });
});
