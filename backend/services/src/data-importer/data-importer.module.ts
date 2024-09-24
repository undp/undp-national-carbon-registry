import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataImporterService } from './data-importer.service';
import { Programme } from '../entities/programme.entity';
import configuration from '../configuration';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { ProgrammeModule } from '../programme/programme.module';
import { TypeOrmConfigService } from '../typeorm.config.service';
import { Company } from '../entities/company.entity';
import { ProgrammeDocument } from '../entities/programme.document';
import { AnnualReportModule } from '../annualreport/annual-report.module';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { EmailHelperModule } from '../email-helper/email-helper.module';
import { UtilModule } from '../util/util.module';

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
    TypeOrmModule.forFeature([
      Programme,
      Company,
      ProgrammeDocument,
    ]),
    ProgrammeModule,
    CompanyModule,
    UserModule,
    AnnualReportModule,
    ProgrammeLedgerModule,
    EmailHelperModule,
    UtilModule,
    
  ],
  providers: [Logger, DataImporterService],
  exports: [DataImporterService]
})
export class DataImporterModule {}
