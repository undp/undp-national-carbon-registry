import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CorrespondingAdjustmentService } from "./corresponding-adjustment.service";
import { CorrespondingAdjustment } from "../entities/corresponding.adjustment.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { InitialReport } from "../entities/initial.report.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { NdcTargetYearlyViewEntity } from "../view-entities/ndc.target.yearly.view.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorrespondingAdjustment,
      CreditTransactionsEntity,
      // Resolves a period's filed caMethod via ndc_target.sourceReportNumber.
      // Emission is deliberately absent: the reporting year's emissions are
      // collected on the calculate form, not read from the inventory table.
      InitialReport,
      NdcTarget,
      NdcTargetYearlyViewEntity,
    ]),
    UtilModule,
  ],
  providers: [CorrespondingAdjustmentService],
  exports: [CorrespondingAdjustmentService],
})
export class CorrespondingAdjustmentModule {}
