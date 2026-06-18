import { Test, TestingModule } from "@nestjs/testing";
import { RegionalMarketService } from "@app/shared/regional-market/regional-market.service";
import { RegionalMarketProjectionService } from "@app/shared/regional-market/regional-market-projection.service";
import { RegionalMarketAPIService } from "./regional.market.api.service";

describe("regional demo integration golden path", () => {
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

  it("runs S8, S10, supervision return, and reset with separated truth labels", () => {
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
    const contractPreview = service.getDemoTradingDealContractPreview(deal.deal.id);
    const statusCertificate = service.getDemoTradingDealStatusCertificate(
      deal.deal.id
    );

    expect(contractPreview).toMatchObject({
      title: "演示合同预览",
      legalEffect: "演示文本，不具法律效力",
    });
    expect(statusCertificate).toMatchObject({
      title: "模拟成交状态凭证",
      settlementBoundary: "不含资金清算或银行结算",
    });

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
    const review = service.reviewDemoFinanceApplication(application.application.id, {
      actorRole: "FINANCE",
      result: "APPROVED",
      reviewerNote: "演示额度内",
    });

    expect(review.application).toMatchObject({
      status: "SIMULATED_APPROVED",
      pledgeStatus: "PLEDGE_LOCKED",
      reviewDisclaimer: "模拟审批不代表银行授信",
    });
    expect(service.getDemoSupervisionSummary()).toMatchObject({
      publicIndicators: { truthStatus: "REAL_PUBLIC_DATA" },
      simulatedTradingActivity: {
        truthStatus: "SIMULATED_DEMO_DATA",
        transferCount: 1,
        listingCount: 1,
        dealCount: 1,
      },
      simulatedFinancingIntent: {
        truthStatus: "SIMULATED_DEMO_DATA",
        applicationCount: 1,
        approvedCount: 1,
      },
      internalAssessmentTags: { truthStatus: "INTERNAL_DEMO_LOGIC" },
    });

    service.resetDemo("OPERATOR");

    expect(service.getDemoSupervisionSummary()).toMatchObject({
      simulatedTradingActivity: {
        transferCount: 0,
        listingCount: 0,
        dealCount: 0,
      },
      simulatedFinancingIntent: {
        applicationCount: 0,
        approvedCount: 0,
      },
    });
  });

  it("blocks transfer from a pledge-locked demo registry holding", () => {
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
    service.reviewDemoFinanceApplication(application.application.id, {
      actorRole: "FINANCE",
      result: "APPROVED",
      reviewerNote: "演示额度内",
    });

    try {
      service.transferDemoRegistryHoldingToTrading({
        actorRole: "ENTERPRISE",
        holdingId: "reg-holding-enterprise-forest-2025",
        quantity: 100,
      });
      throw new Error("expected pledge locked transfer to fail");
    } catch (error: any) {
      expect(error.response).toMatchObject({
        error: {
          code: "DEMO_REGISTRY_HOLDING_PLEDGE_LOCKED",
          message: "Demo registry holding is locked by financing intent.",
        },
      });
    }
  });
});
