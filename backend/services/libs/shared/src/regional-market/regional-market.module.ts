import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditTransactionsManagementModule } from "../credit-transactions-management/credit-transactions-management.module";
import { DocumentManagementModule } from "../document-management/document-management.module";
import { Country } from "../entities/country.entity";
import { MarketTradeExecutionEntity } from "../entities/market.trade.execution.entity";
import { ProjectEntity } from "../entities/projects.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { ProjectManagementModule } from "../project-management/project-management.module";
import { MarketTradeExecutionService } from "./market-trade-execution.service";
import { RegionalMarketProjectionService } from "./regional-market-projection.service";
import { RegionalMarketService } from "./regional-market.service";

@Module({
  imports: [
    ProjectManagementModule,
    DocumentManagementModule,
    ProgrammeLedgerModule,
    CreditTransactionsManagementModule,
    TypeOrmModule.forFeature([
      MarketTradeExecutionEntity,
      ProjectEntity,
      Country,
    ]),
  ],
  providers: [
    RegionalMarketService,
    MarketTradeExecutionService,
    RegionalMarketProjectionService,
  ],
  exports: [
    RegionalMarketService,
    MarketTradeExecutionService,
    RegionalMarketProjectionService,
  ],
})
export class RegionalMarketModule {}
