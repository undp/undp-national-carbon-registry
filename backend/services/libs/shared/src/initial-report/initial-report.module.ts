import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InitialReportService } from "./initial-report.service";
import { InitialReport } from "../entities/initial.report.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([InitialReport, CooperativeApproach]),
    UtilModule,
  ],
  providers: [InitialReportService],
  exports: [InitialReportService],
})
export class InitialReportModule {}
