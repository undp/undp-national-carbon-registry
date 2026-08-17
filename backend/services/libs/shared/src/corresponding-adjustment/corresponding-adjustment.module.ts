import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CorrespondingAdjustmentService } from "./corresponding-adjustment.service";
import { CorrespondingAdjustment } from "../entities/corresponding.adjustment.entity";
import { CreditTransactionsEntity } from "../entities/credit.transactions.entity";
import { Emission } from "../entities/emission.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CorrespondingAdjustment,
      CreditTransactionsEntity,
      Emission,
      NdcTarget,
    ]),
    UtilModule,
  ],
  providers: [CorrespondingAdjustmentService],
  exports: [CorrespondingAdjustmentService],
})
export class CorrespondingAdjustmentModule {}
