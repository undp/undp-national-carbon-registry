import { Injectable } from "@nestjs/common";

@Injectable()
export class RegionalMarketService {
  getBoundary() {
    return {
      subsystem: "regional-carbon-market",
      mode: "registry-otc-settlement",
      cashSettlementMode: "offline",
    };
  }
}
