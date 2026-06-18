import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketProjectionService } from "@app/shared/regional-market/regional-market-projection.service";
import { RegionalMarketAPIService } from "./regional.market.api.service";

describe("regional demo edge hardening", () => {
  let service: RegionalMarketAPIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegionalMarketAPIService,
        {
          provide: RegionalMarketService,
          useValue: {
            getBoundary: jest.fn(),
          },
        },
        {
          provide: RegionalMarketProjectionService,
          useValue: {
            getDashboardSummary: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(RegionalMarketAPIService);
  });

  it("records audit events for login, role switch, write actions, and reset", () => {
    service.loginDemoSession("gov_demo");
    service.switchDemoRole("ENTERPRISE");
    const transfer = service.transferDemoRegistryHoldingToTrading({
      actorRole: "ENTERPRISE",
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 1000,
    });
    const listing = service.createDemoTradingListing({
      actorRole: "ENTERPRISE",
      tradingHoldingId: transfer.tradingHolding.id,
      quantity: 800,
      unitPrice: 42,
    });
    const deal = service.confirmDemoTradingDeal({
      actorRole: "ENTERPRISE",
      listingId: listing.listing.id,
      buyerOrganizationId: "org-buyer-demo",
      quantity: 800,
    });
    expect(deal.deal.id).toBe("deal-1");
    service.resetDemo("OPERATOR");

    expect(service.listDemoAuditLogs().items.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "LOGIN",
        "SWITCH_ROLE",
        "TRANSFER_TO_TRADING",
        "CREATE_LISTING",
        "CONFIRM_DEAL",
        "RESET",
      ])
    );
  });

  it("rejects unauthorized role mutations", () => {
    expect(() =>
      service.transferDemoRegistryHoldingToTrading({
        holdingId: "reg-holding-enterprise-forest-2025",
        quantity: 100,
      })
    ).toThrow();

    try {
      service.transferDemoRegistryHoldingToTrading({
        actorRole: "FINANCE",
        holdingId: "reg-holding-enterprise-forest-2025",
        quantity: 100,
      });
      throw new Error("expected role guard to reject finance transfer");
    } catch (error: any) {
      expect(error.response).toMatchObject({
        error: {
          code: "DEMO_ROLE_NOT_ALLOWED",
          message: "Role is not allowed for this demo action.",
        },
      });
    }

    const valuation = service.createDemoFinanceValuation({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      assetId: "reg-holding-enterprise-forest-2025",
      quantity: 1000,
      unitPrice: 42,
      discountFactor: 0.6,
    });
    const application = service.createDemoFinanceApplication({
      actorRole: "ENTERPRISE",
      enterpriseId: "org-enterprise-demo",
      valuationId: valuation.valuation.id,
      requestedAmount: 20000,
      purpose: "绿色设备更新演示",
    });

    try {
      service.reviewDemoFinanceApplication(application.application.id, {
        actorRole: "ENTERPRISE",
        result: "APPROVED",
      });
      throw new Error("expected role guard to reject enterprise review");
    } catch (error: any) {
      expect(error.response).toMatchObject({
        error: {
          code: "DEMO_ROLE_NOT_ALLOWED",
          message: "Role is not allowed for this demo action.",
        },
      });
    }
  });

  it("requires operator role for reset", () => {
    expect(() => service.resetDemo()).toThrow();
    expect(() => service.resetDemo("ENTERPRISE")).toThrow();
    expect(service.resetDemo("OPERATOR")).toMatchObject({
      status: "RESET",
    });
  });

  it("blocks invalid transitions, insufficient quantity, and supports repeated reset", () => {
    expect(() =>
      service.createDemoTradingListing({
        actorRole: "ENTERPRISE",
        tradingHoldingId: "missing",
        quantity: 100,
        unitPrice: 42,
      })
    ).toThrow();

    expect(() =>
      service.transferDemoRegistryHoldingToTrading({
        actorRole: "ENTERPRISE",
        holdingId: "reg-holding-enterprise-forest-2025",
        quantity: 999999,
      })
    ).toThrow();

    const transfer = service.transferDemoRegistryHoldingToTrading({
      actorRole: "ENTERPRISE",
      holdingId: "reg-holding-enterprise-forest-2025",
      quantity: 1000,
    });
    const listing = service.createDemoTradingListing({
      actorRole: "ENTERPRISE",
      tradingHoldingId: transfer.tradingHolding.id,
      quantity: 800,
      unitPrice: 42,
    });
    service.confirmDemoTradingDeal({
      actorRole: "ENTERPRISE",
      listingId: listing.listing.id,
      buyerOrganizationId: "org-buyer-demo",
      quantity: 800,
    });

    try {
      service.confirmDemoTradingDeal({
        actorRole: "ENTERPRISE",
        listingId: listing.listing.id,
        buyerOrganizationId: "org-buyer-demo",
        quantity: 800,
      });
      throw new Error("expected repeated deal confirmation to fail");
    } catch (error: any) {
      expect(error.response).toMatchObject({
        error: {
          code: "DEMO_LISTING_ALREADY_CONFIRMED",
          message: "Demo listing has already been confirmed.",
        },
      });
    }

    service.resetDemo("OPERATOR");
    service.resetDemo("OPERATOR");

    expect(service.getDemoSupervisionSummary()).toMatchObject({
      simulatedTradingActivity: {
        transferCount: 0,
        listingCount: 0,
        dealCount: 0,
      },
      simulatedFinancingIntent: {
        applicationCount: 0,
      },
    });
  });
});
