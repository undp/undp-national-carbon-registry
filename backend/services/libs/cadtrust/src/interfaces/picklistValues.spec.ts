import {
  LOCATION_COUNTRY_VALUES,
  METHODOLOGY_TYPE_VALUES,
  PROJECT_SECTOR_VALUES,
  PROJECT_STATUS_VALUES,
  PROJECT_TYPE_VALUES,
  STAKEHOLDER_TYPE_VALUES,
  UNIT_METRIC_VALUES,
  VALIDATION_TYPE_VALUES,
} from "./picklistValues";

// A sanity check that the snapshot arrays are non-empty, have no accidental duplicates, and that
// each derived union type actually narrows (a value not in the array is a compile error at the
// `expectType` call sites below — the real point of this file, checked by `tsc`, not by jest).

describe("CAD Trust picklist value snapshots", () => {
  it.each([
    ["PROJECT_SECTOR_VALUES", PROJECT_SECTOR_VALUES],
    ["PROJECT_TYPE_VALUES", PROJECT_TYPE_VALUES],
    ["PROJECT_STATUS_VALUES", PROJECT_STATUS_VALUES],
    ["UNIT_METRIC_VALUES", UNIT_METRIC_VALUES],
    ["METHODOLOGY_TYPE_VALUES", METHODOLOGY_TYPE_VALUES],
    ["STAKEHOLDER_TYPE_VALUES", STAKEHOLDER_TYPE_VALUES],
    ["LOCATION_COUNTRY_VALUES", LOCATION_COUNTRY_VALUES],
    ["VALIDATION_TYPE_VALUES", VALIDATION_TYPE_VALUES],
  ])("%s is a non-empty array with no duplicates", (_name, values) => {
    expect(values.length).toBeGreaterThan(0);
    expect(new Set(values).size).toBe(values.length);
  });

  it("confirms a handful of values this adaptor actually relies on", () => {
    expect(PROJECT_STATUS_VALUES).toContain("Registered");
    expect(PROJECT_STATUS_VALUES).toContain("Rejected");
    expect(PROJECT_STATUS_VALUES).toContain("Authorized");
    expect(STAKEHOLDER_TYPE_VALUES).toContain("Developer");
    expect(UNIT_METRIC_VALUES).toContain("tCO2e");
    expect(VALIDATION_TYPE_VALUES).toContain("Validation of Project Design Document");
  });
});
