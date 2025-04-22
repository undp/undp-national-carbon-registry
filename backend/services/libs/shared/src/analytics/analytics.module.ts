import { Module } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsController } from "src/national-api/analytics.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectEntity } from "../entities/projects.entity";
import { AuditEntity } from "../entities/audit.entity";
import { CaslModule } from "../casl/casl.module";
import { UtilModule } from "../util/util.module";
import { ActivityEntity } from "../entities/activity.entity";

@Module({
  providers: [AnalyticsService],
  imports: [
    TypeOrmModule.forFeature([ProjectEntity, AuditEntity, ActivityEntity]),
    CaslModule,
    UtilModule,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
