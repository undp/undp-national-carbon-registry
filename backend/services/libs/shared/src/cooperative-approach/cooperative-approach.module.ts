import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CooperativeApproachService } from "./cooperative-approach.service";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([CooperativeApproach]),
    UtilModule,
  ],
  providers: [CooperativeApproachService],
  exports: [CooperativeApproachService],
})
export class CooperativeApproachModule {}
