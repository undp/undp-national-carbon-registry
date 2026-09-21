import { toCadTrustIsoDate } from "./iso-date";

describe("toCadTrustIsoDate", () => {
  it("converts epoch millis given as a number", () => {
    expect(toCadTrustIsoDate(1_700_000_000_000)).toBe("2023-11-14");
  });

  it("converts epoch millis given as a STRING — the pg bigint hydration case that threw RangeError", () => {
    // `new Date("1700000000000")` on its own parses as a date string -> Invalid Date -> its
    // toISOString() throws `RangeError: Invalid time value`. The Number() coercion is what fixes it.
    expect(toCadTrustIsoDate("1700000000000")).toBe("2023-11-14");
  });

  it("returns undefined (never throws) for missing values", () => {
    expect(toCadTrustIsoDate(undefined)).toBeUndefined();
    expect(toCadTrustIsoDate(null)).toBeUndefined();
    expect(toCadTrustIsoDate("")).toBeUndefined();
  });

  it("returns undefined for an unparseable value rather than throwing", () => {
    expect(toCadTrustIsoDate("not-a-date")).toBeUndefined();
    expect(toCadTrustIsoDate(Number.NaN)).toBeUndefined();
  });

  it("treats 0 as a real timestamp (the epoch), not a missing value", () => {
    expect(toCadTrustIsoDate(0)).toBe("1970-01-01");
  });
});
