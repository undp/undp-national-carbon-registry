import {
  NdcTrajectoryProblem,
  interpolateNdcTarget,
  validateNdcTrajectory,
} from "./ndc-trajectory";

describe("validateNdcTrajectory", () => {
  const valid = {
    ndcStartYear: 2021,
    ndcEndYear: 2030,
    baseYear: 2015,
    targetYear: 2030,
  };

  it("accepts a period that starts after the base year and ends on the target year", () => {
    expect(validateNdcTrajectory(valid)).toEqual([]);
  });

  it("accepts a period beginning exactly at the base year", () => {
    expect(
      validateNdcTrajectory({ ...valid, ndcStartYear: 2015, baseYear: 2015 })
    ).toEqual([]);
  });

  // The view divides by (targetYear - baseYear); a zero or negative span
  // would blow up or silently invert every target on the path.
  it("rejects a target year equal to the base year", () => {
    expect(
      validateNdcTrajectory({
        ndcStartYear: 2015,
        ndcEndYear: 2015,
        baseYear: 2015,
        targetYear: 2015,
      })
    ).toContain(NdcTrajectoryProblem.NON_POSITIVE_SPAN);
  });

  it("rejects a target year before the base year", () => {
    expect(
      validateNdcTrajectory({
        ndcStartYear: 2010,
        ndcEndYear: 2010,
        baseYear: 2015,
        targetYear: 2010,
      })
    ).toContain(NdcTrajectoryProblem.NON_POSITIVE_SPAN);
  });

  it("rejects a period starting before the base year", () => {
    expect(
      validateNdcTrajectory({ ...valid, ndcStartYear: 2010 })
    ).toContain(NdcTrajectoryProblem.PERIOD_BEFORE_BASE_YEAR);
  });

  it("rejects an inverted period", () => {
    expect(
      validateNdcTrajectory({
        ndcStartYear: 2030,
        ndcEndYear: 2021,
        baseYear: 2015,
        targetYear: 2021,
      })
    ).toContain(NdcTrajectoryProblem.PERIOD_INVERTED);
  });

  it("rejects a target year that is not the period's final year", () => {
    expect(
      validateNdcTrajectory({ ...valid, targetYear: 2028 })
    ).toContain(NdcTrajectoryProblem.TARGET_YEAR_OUTSIDE_PERIOD);
  });

  it("reports every problem at once rather than stopping at the first", () => {
    const problems = validateNdcTrajectory({
      ndcStartYear: 2010,
      ndcEndYear: 2005,
      baseYear: 2015,
      targetYear: 2005,
    });
    expect(problems).toEqual(
      expect.arrayContaining([
        NdcTrajectoryProblem.PERIOD_INVERTED,
        NdcTrajectoryProblem.NON_POSITIVE_SPAN,
        NdcTrajectoryProblem.PERIOD_BEFORE_BASE_YEAR,
      ])
    );
  });
});

// This mirrors the SQL in ndc.target.yearly.view.entity.ts. The view is
// the thing that actually runs in production, so these cases double as
// the specification the view must satisfy — the e2e suite asserts the
// same numbers against real Postgres.
describe("interpolateNdcTarget", () => {
  const line = {
    baseYear: 2015,
    baseYearEmission: 100_000,
    targetYear: 2030,
    ndcTarget: 70_000,
  };

  it("returns the base emission at the base year", () => {
    expect(interpolateNdcTarget({ ...line, year: 2015 })).toBe(100_000);
  });

  it("returns the filed target exactly at the target year", () => {
    expect(interpolateNdcTarget({ ...line, year: 2030 })).toBe(70_000);
  });

  it("returns the mean at the midpoint", () => {
    // 2015 -> 2030 is 15 years; 2022.5 is not an integer year, so use a
    // span with an integer midpoint instead.
    expect(
      interpolateNdcTarget({
        baseYear: 2020,
        baseYearEmission: 100,
        targetYear: 2030,
        ndcTarget: 50,
        year: 2025,
      })
    ).toBe(75);
  });

  it("steps evenly across the span", () => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025];
    const values = years.map((year) =>
      interpolateNdcTarget({
        baseYear: 2020,
        baseYearEmission: 100,
        targetYear: 2025,
        ndcTarget: 50,
        year,
      })
    );
    expect(values).toEqual([100, 90, 80, 70, 60, 50]);
  });

  // A Party whose emissions are permitted to grow is just as valid as
  // one reducing them, so the sign of the slope must not matter.
  it("handles an increasing target as well as a decreasing one", () => {
    expect(
      interpolateNdcTarget({
        baseYear: 2020,
        baseYearEmission: 50,
        targetYear: 2030,
        ndcTarget: 100,
        year: 2025,
      })
    ).toBe(75);
  });

  it("rounds to the column's five decimal places", () => {
    expect(
      interpolateNdcTarget({
        baseYear: 2020,
        baseYearEmission: 0,
        targetYear: 2023,
        ndcTarget: 1,
        year: 2021,
      })
    ).toBe(0.33333);
  });

  it("throws rather than dividing by zero on a degenerate span", () => {
    expect(() =>
      interpolateNdcTarget({
        baseYear: 2020,
        baseYearEmission: 100,
        targetYear: 2020,
        ndcTarget: 50,
        year: 2020,
      })
    ).toThrow(/span must be positive/);
  });
});
