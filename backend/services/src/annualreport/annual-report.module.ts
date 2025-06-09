import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../configuration";
import { Country } from "../entities/country.entity";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { AnnualReportGen } from "./annual.report.gen";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { ProgrammeModule } from "../programme/programme.module";
import { CompanyModule } from "../company/company.module";
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forFeature([
      Country,
      Programme,
      ProgrammeTransfer,
      ConfigurationSettings,
    ]),
    FileHandlerModule,
    ProgrammeLedgerModule,
    ProgrammeModule,
    CompanyModule,
  ],
  providers: [
    Logger,
    AnnualReportGen,
  ],
  exports: [
    AnnualReportGen,
  ],
})
export class AnnualReportModule {}
