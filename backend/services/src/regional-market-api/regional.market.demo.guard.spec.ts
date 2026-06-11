import { UnauthorizedException } from "@nestjs/common";
import { RegionalMarketDemoGuard } from "./regional.market.demo.guard";

const executionContextFor = (request: any) =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as any;

describe("RegionalMarketDemoGuard", () => {
  const originalDemoMode = process.env.REGIONAL_MARKET_DEMO_MODE;

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.REGIONAL_MARKET_DEMO_MODE;
    } else {
      process.env.REGIONAL_MARKET_DEMO_MODE = originalDemoMode;
    }
  });

  it("allows authenticated requests without changing the user", () => {
    const guard = new RegionalMarketDemoGuard();
    const request = { user: { id: 12 } };

    expect(guard.canActivate(executionContextFor(request))).toBe(true);
    expect(request.user).toEqual({ id: 12 });
  });

  it("injects an explicit demo user only when regional demo mode is enabled", () => {
    process.env.REGIONAL_MARKET_DEMO_MODE = "true";
    const guard = new RegionalMarketDemoGuard();
    const request: any = {};

    expect(guard.canActivate(executionContextFor(request))).toBe(true);
    expect(request.user).toMatchObject({
      id: 0,
      companyId: 0,
      companyRole: "REGIONAL_MARKET_DEMO",
    });
  });

  it("rejects anonymous requests when regional demo mode is disabled", () => {
    delete process.env.REGIONAL_MARKET_DEMO_MODE;
    const guard = new RegionalMarketDemoGuard();

    expect(() => guard.canActivate(executionContextFor({}))).toThrow(
      UnauthorizedException
    );
  });
});
