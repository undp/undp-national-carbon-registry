import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CooperativeApproachService } from "./cooperative-approach.service";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { InitialReport } from "../entities/initial.report.entity";
import { CaAuthorizedEntity } from "../entities/ca.authorized.entity.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CooperativeApproach,
      InitialReport,
      CaAuthorizedEntity,
    ]),
    UtilModule,
  ],
  providers: [CooperativeApproachService],
  exports: [CooperativeApproachService],
})
export class CooperativeApproachModule {}
