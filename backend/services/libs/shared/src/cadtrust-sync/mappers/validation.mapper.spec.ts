import { DocumentTypeEnum } from "../../enum/document.type.enum";
import { CadTrustValidationSyncProps } from "../cadtrust-sync.enqueue.service";
import { VALIDATION_TYPE_PDD_APPROVAL } from "./picklist.map";
import { CadTrustValidationMapper } from "./validation.mapper";

const CAD_TRUST_PROJECT_ID = "cadt-project-1";
const VALIDATION_ID = "0042-PDD-v1";

function buildMapper(overrides: { validationBodyDefault?: string } = {}) {
  const warnOnUnknownValues = jest.fn(async (_key: string, values: string[]) => values);
  const profile = {
    getValidationBodyDefault: () => overrides.validationBodyDefault ?? "DNV",
  };
  return {
    warnOnUnknownValues,
    profile,
    mapper: new CadTrustValidationMapper({ warnOnUnknownValues } as any, profile as any),
  };
}

function buildProps(overrides: Partial<CadTrustValidationSyncProps> = {}): CadTrustValidationSyncProps {
  return {
    refId: "0042",
    documentType: DocumentTypeEnum.PROJECT_DESIGN_DOCUMENT,
    documentVersion: 1,
    validationBodyName: "Kunene Certifiers",
    creditPeriodStartDate: "2026-01-01",
    creditPeriodEndDate: "2033-01-01",
    validationDate: "2026-03-15",
    ...overrides,
  };
}

describe("CadTrustValidationMapper", () => {
  it("populates every field from a PDD-approval snapshot", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(buildProps(), VALIDATION_ID, CAD_TRUST_PROJECT_ID);

    expect(input).toEqual({
      validationId: VALIDATION_ID,
      cadTrustProjectId: CAD_TRUST_PROJECT_ID,
      validationType: VALIDATION_TYPE_PDD_APPROVAL,
      validationBody: "DNV",
      validationDate: "2026-03-15",
      validationCreditPeriodStartDate: "2026-01-01",
      validationCreditPeriodEndDate: "2033-01-01",
    });
  });

  it("uses the same validationType for a validation-report snapshot too", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProps({ documentType: DocumentTypeEnum.VALIDATION }),
      "0042-VALIDATION-v1",
      CAD_TRUST_PROJECT_ID
    );

    expect(input.validationType).toBe(VALIDATION_TYPE_PDD_APPROVAL);
  });

  it("omits the optional dates when absent", async () => {
    const { mapper } = buildMapper();

    const input = await mapper.toCreateInput(
      buildProps({ creditPeriodStartDate: undefined, creditPeriodEndDate: undefined }),
      VALIDATION_ID,
      CAD_TRUST_PROJECT_ID
    );

    expect(input).not.toHaveProperty("validationCreditPeriodStartDate");
    expect(input).not.toHaveProperty("validationCreditPeriodEndDate");
  });

  it("checks validationType and validationBody against the live picklist", async () => {
    const { mapper, warnOnUnknownValues } = buildMapper();

    await mapper.toCreateInput(buildProps(), VALIDATION_ID, CAD_TRUST_PROJECT_ID);

    expect(warnOnUnknownValues).toHaveBeenCalledWith("validation_type", [VALIDATION_TYPE_PDD_APPROVAL]);
    expect(warnOnUnknownValues).toHaveBeenCalledWith("validation_body", ["DNV"]);
  });

  it("always uses the configured default for validationBody, never the real IC name", async () => {
    const { mapper } = buildMapper({ validationBodyDefault: "SGS (Thailand) Limited" });

    const input = await mapper.toCreateInput(
      buildProps({ validationBodyName: "Kunene Certifiers" }),
      VALIDATION_ID,
      CAD_TRUST_PROJECT_ID
    );

    expect(input.validationBody).toBe("SGS (Thailand) Limited");
  });
});
