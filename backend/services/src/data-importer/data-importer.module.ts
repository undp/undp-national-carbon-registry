import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataImporterService } from "./data-importer.service";
import { Programme } from "../shared/src/entities/programme.entity";
import configuration from "../shared/src/configuration";
import { CompanyModule } from "../shared/src/company/company.module";
import { UserModule } from "../shared/src/user/user.module";
import { ProgrammeModule } from "../shared/src/programme/programme.module";
import { TypeOrmConfigService } from "../shared/src/typeorm.config.service";
import { Company } from "../shared/src/entities/company.entity";
import { ProgrammeDocument } from "../shared/src/entities/programme.document";
import { AnnualReportModule } from "../shared/src/annualreport/annual-report.module";
import { ProgrammeLedgerModule } from "../shared/src/programme-ledger/programme-ledger.module";
import { EmailHelperModule } from "../shared/src/email-helper/email-helper.module";
import { UtilModule } from "../shared/src/util/util.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Programme, Company, ProgrammeDocument]),
    ProgrammeModule,
    CompanyModule,
    UserModule,
    AnnualReportModule,
    ProgrammeLedgerModule,
    EmailHelperModule,
    UtilModule,
  ],
  providers: [Logger, DataImporterService],
  exports: [DataImporterService],
})
export class DataImporterModule {}
