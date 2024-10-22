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
import { AuthModule } from "../auth/auth.module";
import { CaslModule } from "../casl/casl.module";
import { CompanyModule } from "../company/company.module";
import { ProgrammeModule } from "../programme/programme.module";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { UserModule } from "../user/user.module";
import { UtilModule } from "../util/util.module";
import configuration from "../configuration";
import { ProgrammeSlModule } from "../programme-sl/programme-sl.module";
import { ProgrammeSlController } from "./programmeSl.controller";
import { LocationModule } from "../location/location.module";
import { LocationController } from "./location.controller";
import { CreditRetirementSlController } from "./creditRetirement.controller";
import { CreditRetirementSlModule } from "../creditRetirement-sl/creditRetirementSl.module";
import { VerificationController } from "./verification/verification.controller";
import { VerificationModule } from "src/verification/verification.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined,
    }),
    AuthModule,
    UserModule,
    CaslModule,
    ProgrammeModule,
    VerificationModule,
    CompanyModule,
    UtilModule,
    LocationModule,
    ProgrammeSlModule,
    CreditRetirementSlModule
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
  ],
  providers: [NationalAPIService, Logger],
})
export class NationalAPIModule {}
