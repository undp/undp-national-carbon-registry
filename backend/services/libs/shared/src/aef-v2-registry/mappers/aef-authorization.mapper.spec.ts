import { AuthorizationPurpose } from "../../enum/authorization.purpose.enum";
import {
  AefAuthorizationMapperInput,
  mapItmoAuthorizationToAefAuthorization,
} from "./aef-authorization.mapper";

function baseInput(overrides: Partial<AefAuthorizationMapperInput> = {}): AefAuthorizationMapperInput {
  return {
    authorizationRecordId: "auth-1",
    requestData: {
      cooperativeApproachId: "CA0001",
      authorizationPurpose: AuthorizationPurpose.NDC,
    },
    requestAmount: 100,
    cooperativeApproach: { caReferenceNumber: "CA0001" },
    project: { sector: "ENERGY", sectoralScope: "AGRICULTURE", refId: "P0001" },
    creditBlockId: "block-1",
    ...overrides,
  };
}

describe("mapItmoAuthorizationToAefAuthorization", () => {
  it("marks the OIMP-only fields NA for an NDC-purpose authorization", () => {
    const result = mapItmoAuthorizationToAefAuthorization(baseInput(), "01/01/2026");

    expect(result.aefT2AuthorizationsOimpAuthorizedParty).toBe("NA");
    expect(result.aefT2AuthorizationsFirstTransferDefinitionOimp).toBe("NA");
    expect(result.aefT2AuthorizationsPurposesForAuthorization).toBe("NDC");
  });

  it("populates the OIMP-only fields for an OIMP-purpose authorization", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({
        requestData: { cooperativeApproachId: "CA0001", authorizationPurpose: AuthorizationPurpose.OIMP },
      }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsOimpAuthorizedParty).toBe("Towards Cooperative Approach Entities");
    expect(result.aefT2AuthorizationsFirstTransferDefinitionOimp).toBe("Use or Cancellation");
    expect(result.aefT2AuthorizationsPurposesForAuthorization).toBe("OIMP");
  });

  it("marks the OIMP-only fields NA for an Other-purpose authorization too", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({
        requestData: { cooperativeApproachId: "CA0001", authorizationPurpose: AuthorizationPurpose.OTHER },
      }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsOimpAuthorizedParty).toBe("NA");
    expect(result.aefT2AuthorizationsFirstTransferDefinitionOimp).toBe("NA");
  });

  it("formats the authorized timeframe when both years are given", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ authorizedTimeframeStartYear: 2024, authorizedTimeframeEndYear: 2030 }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBe("2024 - 2030");
  });

  // Only a complete range is a valid timeframe - AUTHORIZED_TIMEFRAME_PATTERN
  // is `dddd - dddd`, so a lone year would be stored only to be rejected on
  // format at filing time.
  it("leaves the authorized timeframe unset when only the start year is given", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ authorizedTimeframeStartYear: 2024, authorizedTimeframeEndYear: undefined }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBeUndefined();
  });

  it("leaves the authorized timeframe unset when only the end year is given", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ authorizedTimeframeStartYear: undefined, authorizedTimeframeEndYear: 2030 }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBeUndefined();
  });

  it("leaves the authorized timeframe unset when neither year is given", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ authorizedTimeframeStartYear: undefined, authorizedTimeframeEndYear: undefined }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBeUndefined();
  });

  // The regression: antd's InputNumber yields null for a cleared field, and the
  // old `!== undefined` guard let that through as the literal "null - null".
  it("treats cleared years (null) as absent rather than stringifying them", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({
        authorizedTimeframeStartYear: null as unknown as number,
        authorizedTimeframeEndYear: null as unknown as number,
      }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBeUndefined();
  });

  it("treats a single cleared year as an incomplete range, not a lone year", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({
        authorizedTimeframeStartYear: null as unknown as number,
        authorizedTimeframeEndYear: 2030,
      }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsAuthorizedTimeframe).toBeUndefined();
  });

  it("maps a sectoral scope present in the activity-type table", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ project: { sector: "ENERGY", sectoralScope: "AGRICULTURE", refId: "P0001" } }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsActivityType).toBe("Agriculture");
  });

  it("maps a sectoral scope with no confident 1:1 fit to the registry-extension Other value", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ project: { sector: "ENERGY", sectoralScope: "NOT_APPLICABLE", refId: "P0001" } }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsActivityType).toBe("Other");
  });

  it("falls back to Other for a sector/scope not in the registry enum", () => {
    const result = mapItmoAuthorizationToAefAuthorization(
      baseInput({ project: { sector: "SOMETHING_UNKNOWN", sectoralScope: "SOMETHING_UNKNOWN", refId: "P0001" } }),
      "01/01/2026"
    );

    expect(result.aefT2AuthorizationsSector).toBe("Other");
    expect(result.aefT2AuthorizationsActivityType).toBe("Other");
  });

  it("sets the static fields the registry does not resolve from real data", () => {
    const result = mapItmoAuthorizationToAefAuthorization(baseInput(), "01/01/2026");

    expect(result.aefT2AuthorizationsVersion).toBe(1);
    expect(result.aefT2AuthorizationsMetric).toBe("GHG");
    expect(result.aefT2AuthorizationsGwpValue).toBe("NA");
    expect(result.aefT2AuthorizationsApplicableNonGhgMetric).toBe("NA");
    expect(result.aefT2AuthorizationsAuthorizedPartyId).toBe("Cooperative Approach Parties");
    expect(result.aefT2AuthorizationsAuthoziedEntityId).toBe("Cooperative Approach Entities");
    expect(result.aefT2AuthorizationsAuthorizationTerms).toBe(
      "Cannot make modifications to authorization conditions"
    );
    expect(result.aefT2AuthorizationsAuthorizationDocumentation).toBeUndefined();
    expect(result.aefT2AuthorizationsAdditionalInformation).toBe("NA");
  });

  it("uses the given authorization date verbatim", () => {
    const result = mapItmoAuthorizationToAefAuthorization(baseInput(), "15/03/2026");

    expect(result.aefT2AuthorizationsDate).toBe("15/03/2026");
  });
});
