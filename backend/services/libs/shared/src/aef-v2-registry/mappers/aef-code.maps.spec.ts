import { ACTIVITY_TYPES, SECTORS } from "@app/aef-v2";

import { CreditTransactionSubTypesEnum } from "../../enum/credit.transaction.sub.types.enum";
import { InfSectorEnum } from "../../enum/inf.sector.enum";
import { InfSectoralScopeEnum } from "../../enum/inf.sectoral.scope.enum";
import {
  AEF_V2_ACTION_BY_SUBTYPE,
  AEF_V2_SECTOR,
  AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE,
  AEF_V2_T3_ACTIONS_ALWAYS_NA,
  AEF_V2_T3_AUTHORIZATION_ACTION_NA,
  AEF_V2_T4_HOLDINGS_ALWAYS_NA,
  NOT_APPLICABLE,
} from "./aef-code.maps";

describe("AEF_V2_ACTION_BY_SUBTYPE", () => {
  it("maps every retirement subtype to a valid AEF action type/subtype pair", () => {
    expect(AEF_V2_ACTION_BY_SUBTYPE[CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC]).toEqual({
      type: "First transfer",
      subtype: "First transfer to another Party",
    });
    expect(AEF_V2_ACTION_BY_SUBTYPE[CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP]).toEqual({
      type: "First transfer",
      subtype: "Use or cancellation",
    });
    // Confirms the correction: OMGE cancellations are voluntary (there is no
    // mandatory OMGE deduction path in this registry), not mandatory.
    expect(AEF_V2_ACTION_BY_SUBTYPE[CreditTransactionSubTypesEnum.OMGE_CANCELLATION]).toEqual({
      type: "Cancellation",
      subtype: "Voluntary cancellation to deliver OMGE",
    });
    expect(AEF_V2_ACTION_BY_SUBTYPE[CreditTransactionSubTypesEnum.VOLUNTARY_CANCELLATION]).toEqual({
      type: "Voluntary Cancellation",
      subtype: "Other cancellations",
    });
  });

  it("has no entry for USE_TOWARDS_NDC — MO-only, never an AEF action", () => {
    expect(AEF_V2_ACTION_BY_SUBTYPE[CreditTransactionSubTypesEnum.USE_TOWARDS_NDC]).toBeUndefined();
  });
});

describe("AEF_V2_SECTOR", () => {
  it("maps every InfSectorEnum member to a value in the AEF SECTORS nomenclature", () => {
    for (const sector of Object.values(InfSectorEnum)) {
      expect(SECTORS).toContain(AEF_V2_SECTOR[sector]);
    }
  });

  it("routes sectors with no confident 1:1 fit to the registry-extension Other value", () => {
    expect(AEF_V2_SECTOR[InfSectorEnum.OTHER]).toBe("Other");
  });
});

describe("AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE", () => {
  it("maps every InfSectoralScopeEnum member to a value in the AEF ACTIVITY_TYPES nomenclature", () => {
    for (const scope of Object.values(InfSectoralScopeEnum)) {
      expect(ACTIVITY_TYPES).toContain(AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE[scope]);
    }
  });

  it("uses the digit-zero 'C02 usage' spelling CARP actually accepts, not 'CO2'", () => {
    expect(AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE[InfSectoralScopeEnum.METAL_PRODUCTION]).toBe(
      "C02 usage"
    );
  });

  it("routes NOT_APPLICABLE to the registry-extension Other value", () => {
    expect(AEF_V2_SECTORAL_SCOPE_ACTIVITY_TYPE[InfSectoralScopeEnum.NOT_APPLICABLE]).toBe("Other");
  });
});

describe("AEF_V2_T3_ACTIONS_ALWAYS_NA", () => {
  it("marks every field NA — this registry never produces a value for any of them", () => {
    for (const value of Object.values(AEF_V2_T3_ACTIONS_ALWAYS_NA)) {
      expect(value).toBe(NOT_APPLICABLE);
    }
  });
});

describe("AEF_V2_T3_AUTHORIZATION_ACTION_NA", () => {
  it("marks every field NA — none of these apply to a plain Authorization action", () => {
    for (const value of Object.values(AEF_V2_T3_AUTHORIZATION_ACTION_NA)) {
      expect(value).toBe(NOT_APPLICABLE);
    }
  });
});

describe("AEF_V2_T4_HOLDINGS_ALWAYS_NA", () => {
  it("marks every field NA — this registry never produces a value for any of them", () => {
    for (const value of Object.values(AEF_V2_T4_HOLDINGS_ALWAYS_NA)) {
      expect(value).toBe(NOT_APPLICABLE);
    }
  });
});
