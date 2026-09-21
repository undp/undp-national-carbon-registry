import { CadTrustUnitLabelMapper } from "./unit-label.mapper";

describe("CadTrustUnitLabelMapper", () => {
  it("builds the unit-label body from its arguments, no I/O", () => {
    const mapper = new CadTrustUnitLabelMapper();

    const input = mapper.toCreateInput("cadt-label-1", "cadt-unit-1", "2026-03-15");

    expect(input).toEqual({
      cadTrustLabelId: "cadt-label-1",
      cadTrustUnitId: "cadt-unit-1",
      labelUnitDate: "2026-03-15",
    });
  });
});
