import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  RegionalDemoLoginDto,
  RegionalDemoSwitchRoleDto,
  RegionalIssueCreditsDto,
  RegionalOtcTradeExecuteDto,
  RegionalProjectIdDto,
} from "./regional.market.api.dto";

describe("Regional market API DTOs", () => {
  it("accepts a valid OTC trade execution payload", async () => {
    const dto = plainToInstance(RegionalOtcTradeExecuteDto, {
      transfer: {
        senderId: 10,
        receiverId: 20,
        projectRefId: "PRJ-1",
        creditBlockId: "CB-1",
        serialNumber: "SN-1",
        amount: 100,
      },
      market: {
        unitPrice: 42,
        currency: "CNY",
        tradeTime: "2026-06-11T00:00:00.000Z",
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("keeps compatibility with legacy recieverId spelling", async () => {
    const dto = plainToInstance(RegionalOtcTradeExecuteDto, {
      transfer: {
        senderId: 10,
        recieverId: 20,
        projectRefId: "PRJ-1",
        creditBlockId: "CB-1",
        amount: 100,
      },
      market: {
        unitPrice: 42,
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects invalid OTC trade numeric values", async () => {
    const dto = plainToInstance(RegionalOtcTradeExecuteDto, {
      transfer: {
        senderId: 10,
        receiverId: 20,
        projectRefId: "PRJ-1",
        creditBlockId: "CB-1",
        amount: 0,
      },
      market: {
        unitPrice: -1,
      },
    });

    const errors = await validate(dto);

    expect(JSON.stringify(errors)).toContain("amount");
    expect(JSON.stringify(errors)).toContain("unitPrice");
  });

  it("requires a project id for project detail lookup", async () => {
    const dto = plainToInstance(RegionalProjectIdDto, {});

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it("requires the credit issuance wrapper fields", async () => {
    const dto = plainToInstance(RegionalIssueCreditsDto, {
      activity: {},
      creditVerified: [],
      companyId: 20,
      document: {},
      txRef: "TX-1",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("accepts golden demo login accounts", async () => {
    const dto = plainToInstance(RegionalDemoLoginDto, { account: "gov_demo" });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects unknown demo login accounts", async () => {
    const dto = plainToInstance(RegionalDemoLoginDto, { account: "real_bank" });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it("accepts backend role switch requests with session id", async () => {
    const dto = plainToInstance(RegionalDemoSwitchRoleDto, {
      sessionId: "demo-session-gov",
      role: "ENTERPRISE",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
