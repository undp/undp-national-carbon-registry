import { Module } from "@nestjs/common";
import { AefReportManagementService } from "./aef-report-management.service";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { AefActionsTableEntity } from "../entities/aef.actions.table.entity";

@Module({
  imports: [
    UtilModule,
    ProgrammeLedgerModule,
    SerialNumberManagementModule,
    TypeOrmModule.forFeature([CreditTransactionsEntity, AefActionsTableEntity]),
  ],
  providers: [AefReportManagementService],
  exports: [AefReportManagementService],
})
export class AefReportManagementModule {}
