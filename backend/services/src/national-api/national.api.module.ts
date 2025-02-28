import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NationalAPIController } from "./national.api.controller";
import { NationalAPIService } from "./national.api.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompanyController } from "./company.controller";
import { UserController } from "./user.controller";
import { AuthController } from "./auth.controller";
import { ProgrammeController } from "./programme.controller";
import { SettingsController } from "./settings.controller";
import { TypeOrmConfigService } from "@app/core/app-config/typeorm.config.service";
import configuration from "@app/core/app-config/configuration";
import { ProgrammeSlController } from "./programmeSl.controller";
import { LocationController } from "./location.controller";
import { CreditRetirementSlController } from "./creditRetirement.controller";
import { VerificationController } from "./verification/verification.controller";
import { ProgrammeAuditSlController } from "./programmeAuditSl/programmeAuditSl.controller";
import { RateLimiterModule } from "nestjs-rate-limiter";
import { SharedModule } from "@app/shared";
import { CoreModule } from "@app/core";

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
  ],
  providers: [NationalAPIService, Logger],
})
export class NationalAPIModule {}
