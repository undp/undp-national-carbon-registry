import { forwardRef, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { CaslModule } from "../casl/casl.module";
import configuration from "../../../core/src/app-config/configuration";
import { TypeOrmConfigService } from "../../../core/src/app-config/typeorm.config.service";
import { CompanyService } from "./company.service";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { UserModule } from "../user/user.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { LocationModule } from "../location/location.module";
import { Investment } from "../entities/investment.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { CompanyViewEntity } from "../view-entities/company.view.entity";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: "memory",
        ttl: parseInt(configService.get<string>("cache.organisation.ttl"), 10),
        max: parseInt(configService.get<string>("cache.organisation.max"), 10),
      }),
    }),
    TypeOrmModule.forFeature([
      Company,
      ProgrammeTransfer,
      Investment,
      CompanyViewEntity,
    ]),
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
    FileHandlerModule,
    forwardRef(() => EmailHelperModule),
    forwardRef(() => UserModule),
    AsyncOperationsModule,
    LocationModule,
  ],
  providers: [CompanyService, Logger],
  exports: [CompanyService],
})
export class CompanyModule {}
