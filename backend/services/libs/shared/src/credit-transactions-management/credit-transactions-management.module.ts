import { Module } from "@nestjs/common";
import { CreditTransactionsManagementService } from "./credit-transactions-management.service";
import { UtilModule } from "../util/util.module";
import { CompanyModule } from "../company/company.module";
import { LedgerDbModule } from "../ledger-db/ledger-db.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { CreditBlockBalancesViewEntity } from "../view-entities/credit.block.balances.view.entity";
import { CreditBlockTransfersViewEntity } from "../view-entities/credit.block.transfers.view.entity";
import { CreditBlockRetirementsViewEntity } from "../view-entities/credit.block.retirements.view.entity";
import { DocumentManagementModule } from "../document-management/document-management.module";
import { AefReportManagementModule } from "../aef-report-management/aef-report-management.module";

@Module({
  imports: [
    UtilModule,
    CompanyModule,
    ProgrammeLedgerModule,
    TypeOrmModule.forFeature([
      CreditTransactionsEntity,
      CreditBlocksEntity,
      CreditBlockBalancesViewEntity,
      CreditBlockTransfersViewEntity,
      CreditBlockRetirementsViewEntity,
    ]),
    DocumentManagementModule,
    AefReportManagementModule,
  ],
  providers: [CreditTransactionsManagementService],
  exports: [CreditTransactionsManagementService],
})
export class CreditTransactionsManagementModule {}
