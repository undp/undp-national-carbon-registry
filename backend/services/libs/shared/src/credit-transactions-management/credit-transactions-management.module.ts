import { Module } from "@nestjs/common";
import { CreditTransactionsManagementService } from "./credit-transactions-management.service";
import { UtilModule } from "../util/util.module";
import { CompanyModule } from "../company/company.module";
import { LedgerDbModule } from "../ledger-db/ledger-db.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { CreditBlocksEntity } from "../entities/credit.blocks.entity";
import { DocumentManagementModule } from "../document-management/document-management.module";

@Module({
  imports: [
    UtilModule,
    CompanyModule,
    ProgrammeLedgerModule,
    TypeOrmModule.forFeature([CreditTransactionsEntity, CreditBlocksEntity]),
    DocumentManagementModule,
  ],
  providers: [CreditTransactionsManagementService],
  exports: [CreditTransactionsManagementService],
})
export class CreditTransactionsManagementModule {}
