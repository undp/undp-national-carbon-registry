import { Logger, Module } from "@nestjs/common";
import { RegistryClientService } from "./registry-client.service";
import { ConfigModule } from "@nestjs/config";
import configuration from "../../../core/src/app-config/configuration";
import { UtilModule } from "../util/util.module";
import { CompanyModule } from "../company/company.module";
import { ProgrammeModule } from "../programme/programme.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProgrammeDocument } from "../entities/programme.document";
import { EmailHelperModule } from "../email-helper/email-helper.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgrammeDocument]),
    UtilModule,
    CompanyModule,
    ProgrammeModule,
    EmailHelperModule,
  ],
  providers: [RegistryClientService, Logger],
  exports: [RegistryClientService],
})
export class RegistryClientModule {}
