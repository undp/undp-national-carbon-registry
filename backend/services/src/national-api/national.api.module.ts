import { CoreModule } from "@app/core";
import { SharedModule } from "@app/shared";
import { Logger, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { AuthController } from "./auth.controller";
import { CompanyController } from "./company.controller";
import { LocationController } from "./location.controller";
import { NationalAPIController } from "./national.api.controller";
import { NationalAPIService } from "./national.api.service";
import { ProgrammeController } from "./programme.controller";
import { SettingsController } from "./settings.controller";
import { UserController } from "./user.controller";
import { ProjectManagementController } from "./project-management.controller";
import { DocumentManagementController } from "./document.controller";
import { AnalyticsController } from "./analytics.controller";
import { CreditTransactionsManagementController } from "./credit.transactions.management.controller";
import { AefV2Controller } from "./aef-v2.controller";
import { AefV2SchedulerService } from "./aef-v2.scheduler";
import { CooperativeApproachController } from "./cooperative-approach.controller";
import { CorrespondingAdjustmentController } from "./corresponding-adjustment.controller";
import { InitialReportController } from "./initial-report.controller";
import { ItmoAccountController } from "./itmo-account.controller";
import { AdminController } from "./admin.controller";
import { CadTrustSyncController } from "./cadtrust-sync.controller";

@Module({
  imports: [
    RateLimiterModule.register({
      type: "Memory", // In-memory store for rate limiting
    }),
    SharedModule,
    CoreModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    NationalAPIController,
    UserController,
    AuthController,
    CompanyController,
    ProgrammeController,
    SettingsController,
    LocationController,
    ProjectManagementController,
    DocumentManagementController,
    AnalyticsController,
    CreditTransactionsManagementController,
    AefV2Controller,
    CooperativeApproachController,
    CorrespondingAdjustmentController,
    InitialReportController,
    ItmoAccountController,
    AdminController,
    CadTrustSyncController,
  ],
  providers: [NationalAPIService, Logger, AefV2SchedulerService],
})
export class NationalAPIModule {}
