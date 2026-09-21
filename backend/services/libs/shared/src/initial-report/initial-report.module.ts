import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InitialReportService } from "./initial-report.service";
import { InitialReport } from "../entities/initial.report.entity";
import { InitialReportCooperativeApproach } from "../entities/initial.report.cooperative.approach.entity";
import { InitialReportVersion } from "../entities/initial.report.version.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { NdcDetailsPeriod } from "../entities/ndc.details.period.entity";
import { NdcTarget } from "../entities/ndc.target.entity";
import { User } from "../entities/user.entity";
import { UtilModule } from "../util/util.module";
import { CooperativeApproachModule } from "../cooperative-approach/cooperative-approach.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InitialReport,
      InitialReportCooperativeApproach,
      InitialReportVersion,
      CooperativeApproach,
      CaAuthorizedEntity,
      NdcDetailsPeriod,
      NdcTarget,
      User,
    ]),
    UtilModule,
    // Submitting a report drives every linked cooperative approach to
    // Submitted. No cycle: CooperativeApproachService does not depend on
    // this one.
    CooperativeApproachModule,
  ],
  providers: [InitialReportService],
  exports: [InitialReportService],
})
export class InitialReportModule {}
