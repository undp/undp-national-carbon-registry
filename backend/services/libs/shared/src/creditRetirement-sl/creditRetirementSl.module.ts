import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { CaslModule } from "../casl/casl.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { CreditRetirementSl } from "../entities/creditRetirementSl.entity";
import { CreditRetirementSlService } from "./creditRetirementSl.service";
import { CreditRetirementSlView } from "../view-entities/creditRetirementSl.view.entity";
import { ProgrammeAuditLogSl } from "../entities/programmeAuditLogSl.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([
      CreditRetirementSl,
      CreditRetirementSlView,
      ProgrammeAuditLogSl,
    ]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    AsyncOperationsModule,
    FileHandlerModule,
    ConfigModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: "memory",
        ttl: parseInt(configService.get<string>("cache.retirement.ttl"), 10),
        max: parseInt(configService.get<string>("cache.retirement.max"), 10),
      }),
    }),
  ],
  providers: [Logger, CreditRetirementSlService],
  exports: [CreditRetirementSlService],
})
export class CreditRetirementSlModule {}
