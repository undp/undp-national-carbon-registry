import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

@Injectable()
export class RegionalMarketDemoGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (request?.user) {
      return true;
    }

    if (process.env.REGIONAL_MARKET_DEMO_MODE === "true") {
      request.user = {
        id: 0,
        companyId: 0,
        companyRole: "REGIONAL_MARKET_DEMO",
        role: "REGIONAL_MARKET_DEMO",
      };
      request.abilityCondition = request.abilityCondition ?? {};
      return true;
    }

    throw new UnauthorizedException(
      "Regional market endpoints require authentication or REGIONAL_MARKET_DEMO_MODE=true"
    );
  }
}
