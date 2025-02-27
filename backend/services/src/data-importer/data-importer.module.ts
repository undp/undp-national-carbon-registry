import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataImporterService } from "./data-importer.service";
import { Programme } from "@app/shared/entities/programme.entity";
import configuration from "@app/shared/configuration";
import { CompanyModule } from "@app/shared/company/company.module";
import { UserModule } from "@app/shared/user/user.module";
import { ProgrammeModule } from "@app/shared/programme/programme.module";
import { TypeOrmConfigService } from "@app/shared/typeorm.config.service";
import { Company } from "@app/shared/entities/company.entity";
import { ProgrammeDocument } from "@app/shared/entities/programme.document";
import { AnnualReportModule } from "@app/shared/annualreport/annual-report.module";
import { ProgrammeLedgerModule } from "@app/shared/programme-ledger/programme-ledger.module";
import { EmailHelperModule } from "@app/shared/email-helper/email-helper.module";
import { UtilModule } from "@app/shared/util/util.module";
import { SharedModule } from "@app/shared";

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
    SharedModule,
  ],
  providers: [Logger, DataImporterService],
  exports: [DataImporterService],
})
export class DataImporterModule {}
