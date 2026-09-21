import { AccountType } from "../../enum/account.type.enum";
import { CreditTransactionSubTypesEnum } from "../../enum/credit.transaction.sub.types.enum";
import { SerialNumberManagementService } from "../../serial-number-management/serial-number-management.service";
import { CadTrustCreditUnitMapper } from "./credit-unit.mapper";

const SERIAL_CONFIG_SERVICE = {
  get: (key: string) => {
    if (key === "serialNumber.seperator") return "-";
    return undefined;
  },
};

function buildMapper(overrides: { unitType?: string | undefined } = {}) {
  const picklistService = { warnOnUnknownValues: jest.fn(async () => undefined) };
  const profile = {
    getUnitType: jest.fn(() => ("unitType" in overrides ? overrides.unitType : "Removal - technical")),
  };
  const serialNumberManagementService = new SerialNumberManagementService(
    SERIAL_CONFIG_SERVICE as any,
    {} as any
  );

  return {
    mapper: new CadTrustCreditUnitMapper(picklistService as any, profile as any, serialNumberManagementService),
    picklistService,
    profile,
  };
}

const HELD_BLOCK = {
  creditBlockId: "CA0001-XX-XX-1-1-100",
  serialNumber: "CA0001-XX-XX-1-1-100-2026",
  vintage: "2026",
  creditAmount: 100,
  accountType: AccountType.HOLDING,
  txTime: 1_700_000_000_000,
} as any;

describe("CadTrustCreditUnitMapper", () => {
  describe("a held (not retired) block", () => {
    it("maps status to Held and derives the block range from the serial number", async () => {
      const { mapper } = buildMapper();

      const input = await mapper.toUnitInput(HELD_BLOCK, "cadt-issuance-1", {
        currentOwner: "Kunene Developers",
      });

      expect(input.unitStatus).toBe("Held");
      expect(input.unitStatusReason).toBe("Newly issued");
      expect(input.unitStartBlock).toBe("1");
      expect(input.unitEndBlock).toBe("100");
      expect(input.unitVintageYear).toBe(2026);
      expect(input.unitCount).toBe(100);
      expect(input.unitSerialId).toBe(HELD_BLOCK.serialNumber);
      expect(input.cadTrustIssuanceId).toBe("cadt-issuance-1");
      expect(input.unitCurrentOwner).toBe("Kunene Developers");
      expect(input.unitMetric).toBe("tCO2e");
    });

    it("does not set retirement fields", async () => {
      const { mapper } = buildMapper();

      const input = await mapper.toUnitInput(HELD_BLOCK, "cadt-issuance-1", {
        currentOwner: "Kunene Developers",
      });

      expect(input).not.toHaveProperty("unitRetirementDetail");
      expect(input).not.toHaveProperty("unitRetirementBeneficiary");
      expect(input).not.toHaveProperty("unitRetirementBeneficiaryId");
    });

    it("omits unitCurrentOwner when no owner name is resolved", async () => {
      const { mapper } = buildMapper();

      const input = await mapper.toUnitInput(HELD_BLOCK, "cadt-issuance-1", {});

      expect(input).not.toHaveProperty("unitCurrentOwner");
    });

    it("sets unitItmosReferenceId from itmoSerial when present", async () => {
      const { mapper } = buildMapper();
      const block = { ...HELD_BLOCK, itmoSerial: "CA0001-XX-XX-1-1-100-2026" };

      const input = await mapper.toUnitInput(block, "cadt-issuance-1", {});

      expect(input.unitItmosReferenceId).toBe(block.itmoSerial);
    });

    it("handles txTime hydrated as a string (as TypeORM returns a pg bigint) without throwing", async () => {
      const { mapper } = buildMapper();
      // The exact shape that produced `RangeError: Invalid time value` — a bigint column read back
      // as a string, then fed to `new Date(...)` which parses it as a date string, not epoch ms.
      const block = { ...HELD_BLOCK, txTime: "1700000000000" as any };

      const input = await mapper.toUnitInput(block, "cadt-issuance-1", {});

      expect(input.unitStatusDate).toBe("2023-11-14");
    });

    it("falls back to createTime, then today, when txTime is unusable", async () => {
      const { mapper } = buildMapper();
      const today = new Date().toISOString().split("T")[0];

      const viaCreateTime = await mapper.toUnitInput(
        { ...HELD_BLOCK, txTime: null as any, createTime: 1_700_000_000_000 },
        "cadt-issuance-1",
        {}
      );
      expect(viaCreateTime.unitStatusDate).toBe("2023-11-14");

      const viaToday = await mapper.toUnitInput(
        { ...HELD_BLOCK, txTime: null as any, createTime: undefined },
        "cadt-issuance-1",
        {}
      );
      expect(viaToday.unitStatusDate).toBe(today);
    });
  });

  describe("a retired/cancelled block", () => {
    const RETIRED_BLOCK = { ...HELD_BLOCK, accountType: AccountType.RETIREMENT_NDC };

    it("maps status to Retired, deriving the reason from the retirement's subType", async () => {
      const { mapper } = buildMapper();
      const latestRetirement = { subType: CreditTransactionSubTypesEnum.USE_TOWARDS_NDC, data: {} } as any;

      const input = await mapper.toUnitInput(
        RETIRED_BLOCK,
        "cadt-issuance-1",
        { currentOwner: "Kunene Developers" },
        latestRetirement
      );

      expect(input.unitStatus).toBe("Retired");
      expect(input.unitStatusReason).toBe("Retired for use towards the host Party's NDC");
    });

    it("distinguishes an ITMO first transfer from a domestic MO use — both land in RETIREMENT_NDC", async () => {
      const { mapper } = buildMapper();
      const latestRetirement = {
        subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_TOWARDS_NDC,
        data: { country: "KE" },
      } as any;

      const input = await mapper.toUnitInput(RETIRED_BLOCK, "cadt-issuance-1", {}, latestRetirement);

      expect(input.unitStatusReason).toBe("First transfer - retired towards the acquiring Party's NDC");
    });

    it("falls back to the accountType reason for a retirement row with no subType (legacy)", async () => {
      const { mapper } = buildMapper();
      const latestRetirement = { data: {} } as any;

      const input = await mapper.toUnitInput(RETIRED_BLOCK, "cadt-issuance-1", {}, latestRetirement);

      expect(input.unitStatusReason).toBe("Retired for use towards NDC");
    });

    it("falls back to a generic reason for an unmapped accountType with no subType", async () => {
      const { mapper } = buildMapper();
      const block = { ...HELD_BLOCK, accountType: AccountType.CANCELLATION_SOP };

      const input = await mapper.toUnitInput(block, "cadt-issuance-1", {});

      expect(input.unitStatusReason).toBe("Retired");
    });

    it("takes the retirement detail from data.remarks and the beneficiary trio from the resolved parties", async () => {
      const { mapper } = buildMapper();
      const latestRetirement = {
        subType: CreditTransactionSubTypesEnum.FIRST_TRANSFER_FOR_OIMP,
        data: { remarks: "Retired for compliance" },
      } as any;

      const input = await mapper.toUnitInput(
        RETIRED_BLOCK,
        "cadt-issuance-1",
        { currentOwner: "Acme Corp", beneficiary: "Acme Corp", beneficiaryId: "ACME-123" },
        latestRetirement
      );

      expect(input.unitRetirementDetail).toBe("Retired for compliance");
      expect(input.unitRetirementBeneficiary).toBe("Acme Corp");
      expect(input.unitRetirementBeneficiaryId).toBe("ACME-123");
    });

    it("omits the beneficiary fields when the resolved parties carry none — the documented OMGE gap", async () => {
      const { mapper } = buildMapper();
      const latestRetirement = { subType: CreditTransactionSubTypesEnum.OMGE_CANCELLATION, data: {} } as any;

      const input = await mapper.toUnitInput(
        RETIRED_BLOCK,
        "cadt-issuance-1",
        { currentOwner: "Kunene Developers" },
        latestRetirement
      );

      expect(input).not.toHaveProperty("unitRetirementDetail");
      expect(input).not.toHaveProperty("unitRetirementBeneficiary");
      expect(input).not.toHaveProperty("unitRetirementBeneficiaryId");
    });

    it("uses the retirement's own status date (creditBlock.txTime), not any other timestamp", async () => {
      const { mapper } = buildMapper();

      const input = await mapper.toUnitInput(RETIRED_BLOCK, "cadt-issuance-1", {});

      expect(input.unitStatusDate).toBe(new Date(RETIRED_BLOCK.txTime).toISOString().split("T")[0]);
    });
  });

  describe("unitType — no confirmed value exists for this registry", () => {
    it("uses the configured CADT_V2_UNIT_TYPE value when set", async () => {
      const { mapper } = buildMapper({ unitType: "Removal - technical" });

      const input = await mapper.toUnitInput(HELD_BLOCK, "cadt-issuance-1", {});

      expect(input.unitType).toBe("Removal - technical");
    });

    it("sends an empty string rather than a guessed value when unset, so the node's own rejection surfaces the gap", async () => {
      const { mapper, picklistService } = buildMapper({ unitType: undefined });

      const input = await mapper.toUnitInput(HELD_BLOCK, "cadt-issuance-1", {});

      expect(input.unitType).toBe("");
      expect(picklistService.warnOnUnknownValues).toHaveBeenCalledWith("unit_type", [""]);
    });
  });
});
