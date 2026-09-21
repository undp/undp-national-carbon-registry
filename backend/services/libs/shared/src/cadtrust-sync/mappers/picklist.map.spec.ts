import {
  LOCATION_COUNTRY_VALUES,
  PROJECT_SECTOR_VALUES,
  PROJECT_STATUS_VALUES,
  PROJECT_TYPE_VALUES,
  STAKEHOLDER_TYPE_VALUES,
  UNIT_METRIC_VALUES,
  VALIDATION_TYPE_VALUES,
} from "@app/cadtrust";

import { CreditTransactionSubTypesEnum } from "../../enum/credit.transaction.sub.types.enum";
import {
  PROJECT_SECTOR_FALLBACK,
  PROJECT_SECTOR_MAP,
  PROJECT_STATUS_FALLBACK,
  PROJECT_STATUS_MAP,
  PROJECT_TYPE_FALLBACK,
  PROJECT_TYPE_MAP,
  PROJECT_UNIT_METRIC,
  STAKEHOLDER_TYPE_DEVELOPER,
  UNIT_STATUS_REASON_BY_SUBTYPE,
  VALIDATION_TYPE_PDD_APPROVAL,
} from "./picklist.map";

/**
 * The exported maps are TYPE-checked against `@app/cadtrust`'s picklist unions at compile time —
 * that is the primary guarantee (a typo or an invented string is a build failure). These are runtime
 * assertions on top, catching anyone who defeats the type via an `as` cast, and pinning the specific
 * corrections made against the live-node fetch this file was built from (see picklist.map.ts's doc
 * comments for the reasoning behind each one).
 */
describe("picklist.map values are real CAD Trust picklist members", () => {
  it("every PROJECT_SECTOR_MAP value is a real projectSector value", () => {
    Object.values(PROJECT_SECTOR_MAP).forEach((value) => {
      expect(PROJECT_SECTOR_VALUES).toContain(value);
    });
    expect(PROJECT_SECTOR_VALUES).toContain(PROJECT_SECTOR_FALLBACK);
  });

  it("every PROJECT_TYPE_MAP value is a real projectType value", () => {
    Object.values(PROJECT_TYPE_MAP).forEach((value) => {
      expect(PROJECT_TYPE_VALUES).toContain(value);
    });
    expect(PROJECT_TYPE_VALUES).toContain(PROJECT_TYPE_FALLBACK);
  });

  it("every PROJECT_STATUS_MAP value is a real projectStatus value", () => {
    Object.values(PROJECT_STATUS_MAP).forEach((value) => {
      expect(PROJECT_STATUS_VALUES).toContain(value);
    });
    expect(PROJECT_STATUS_VALUES).toContain(PROJECT_STATUS_FALLBACK);
  });

  it("pins the three synced project-status corrections", () => {
    expect(PROJECT_STATUS_MAP.APPROVED).toBe("Registered");
    expect(PROJECT_STATUS_MAP.REJECTED).toBe("Rejected");
    expect(PROJECT_STATUS_MAP.AUTHORISED).toBe("Authorized");
  });

  it("STAKEHOLDER_TYPE_DEVELOPER and PROJECT_UNIT_METRIC are real values", () => {
    expect(STAKEHOLDER_TYPE_VALUES).toContain(STAKEHOLDER_TYPE_DEVELOPER);
    expect(UNIT_METRIC_VALUES).toContain(PROJECT_UNIT_METRIC);
  });

  it("VALIDATION_TYPE_PDD_APPROVAL is a real validationType value", () => {
    expect(VALIDATION_TYPE_VALUES).toContain(VALIDATION_TYPE_PDD_APPROVAL);
  });

  it("sanity: LOCATION_COUNTRY_VALUES is available for deployment-time checks", () => {
    expect(LOCATION_COUNTRY_VALUES.length).toBeGreaterThan(0);
  });

  it("UNIT_STATUS_REASON_BY_SUBTYPE covers every retirement subType so no retirement falls back to accountType", () => {
    Object.values(CreditTransactionSubTypesEnum).forEach((subType) => {
      expect(UNIT_STATUS_REASON_BY_SUBTYPE[subType]).toBeDefined();
    });
  });

  it("UNIT_STATUS_REASON_BY_SUBTYPE keeps MO use and ITMO first transfer distinct", () => {
    expect(UNIT_STATUS_REASON_BY_SUBTYPE[CreditTransactionSubTypesEnum.USE_TOWARDS_NDC]).not.toBe(
      UNIT_STATUS_REASON_BY_SUBTYPE[CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC]
    );
  });
});
