import { Injectable } from "@nestjs/common";

@Injectable()
export class RegionalMarketAPIService {
  getInfo() {
    return {
      subsystem: "regional-carbon-market",
      mode: "registry-otc-settlement",
      cashSettlementMode: "offline",
      exchangeScope: "excluded",
    };
  }
}
