import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  RegionalDemoLoginDto,
  RegionalDemoSwitchRoleDto,
  RegionalDemoFinanceApplicationDto,
  RegionalDemoFinanceReviewDto,
  RegionalDemoFinanceValuationDto,
  RegionalDemoTradingDealDto,
  RegionalDemoTradingListingDto,
  RegionalDemoTransferToTradingDto,
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

  it("accepts phase-two transfer, listing, and deal payloads", async () => {
    const transfer = plainToInstance(RegionalDemoTransferToTradingDto, {
      actorRole: "ENTERPRISE",
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 1200,
    });
    const listing = plainToInstance(RegionalDemoTradingListingDto, {
      actorRole: "ENTERPRISE",
      tradingHoldingId: "trading-holding-1",
      quantity: 800,
      unitPrice: 42,
    });
    const deal = plainToInstance(RegionalDemoTradingDealDto, {
      actorRole: "ENTERPRISE",
      listingId: "listing-1",
      buyerOrganizationId: "org-buyer-demo",
      quantity: 800,
    });

    await expect(validate(transfer)).resolves.toHaveLength(0);
    await expect(validate(listing)).resolves.toHaveLength(0);
    await expect(validate(deal)).resolves.toHaveLength(0);
  });

  it("rejects phase-two non-positive quantities", async () => {
    const dto = plainToInstance(RegionalDemoTradingListingDto, {
      actorRole: "ENTERPRISE",
      tradingHoldingId: "trading-holding-1",
      quantity: 0,
      unitPrice: -1,
    });

    const errors = await validate(dto);

    expect(JSON.stringify(errors)).toContain("quantity");
    expect(JSON.stringify(errors)).toContain("unitPrice");
  });

  it("accepts S10 valuation, application, and review payloads", async () => {
    const valuation = plainToInstance(RegionalDemoFinanceValuationDto, {
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      assetId: "reg-holding-enterprise-forest-2025",
      quantity: 1000,
      unitPrice: 42,
      discountFactor: 0.6,
    });
    const application = plainToInstance(RegionalDemoFinanceApplicationDto, {
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      valuationId: "valuation-1",
      requestedAmount: 20000,
      purpose: "绿色设备更新演示",
    });
    const review = plainToInstance(RegionalDemoFinanceReviewDto, {
      actorRole: "FINANCE",
      result: "APPROVED",
      reviewerNote: "演示额度内",
    });

    await expect(validate(valuation)).resolves.toHaveLength(0);
    await expect(validate(application)).resolves.toHaveLength(0);
    await expect(validate(review)).resolves.toHaveLength(0);
  });

  it("rejects unsupported S10 review results", async () => {
    const dto = plainToInstance(RegionalDemoFinanceReviewDto, {
      actorRole: "FINANCE",
      result: "DISBURSED",
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
