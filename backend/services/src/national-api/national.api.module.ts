import { CoreModule } from "@app/core";
import { SharedModule } from "@app/shared";
import { Logger, Module } from "@nestjs/common";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { AuthController } from "./auth.controller";
import { CompanyController } from "./company.controller";
import { CreditRetirementSlController } from "./creditRetirement.controller";
import { LocationController } from "./location.controller";
import { NationalAPIController } from "./national.api.controller";
import { NationalAPIService } from "./national.api.service";
import { ProgrammeController } from "./programme.controller";
import { ProgrammeAuditSlController } from "./programmeAuditSl/programmeAuditSl.controller";
import { ProgrammeSlController } from "./programmeSl.controller";
import { SettingsController } from "./settings.controller";
import { UserController } from "./user.controller";
import { VerificationController } from "./verification/verification.controller";
import { ProjectManagementController } from "./project-management.controller";
import { DocumentManagementController } from "./document.controller";
import { CreditTransactionsManagementController } from "./credit.transactions.management.controller";

@Module({
  imports: [
    RateLimiterModule.register({
      type: "Memory", // In-memory store for rate limiting
    }),
    SharedModule,
    CoreModule,
  ],
  controllers: [
    NationalAPIController,
    UserController,
    AuthController,
    CompanyController,
    ProgrammeController,
    SettingsController,
    LocationController,
    ProgrammeSlController,
    CreditRetirementSlController,
    VerificationController,
    ProgrammeAuditSlController,
    ProjectManagementController,
    DocumentManagementController,
    CreditTransactionsManagementController,
  ],
  providers: [NationalAPIService, Logger],
})
export class NationalAPIModule {}
