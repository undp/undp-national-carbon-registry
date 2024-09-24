import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "../entities/programme.entity";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../entities/programmeTransfer.view.entity";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "../entities/company.entity";
import configuration from "../configuration";
import { AuthModule } from "../auth/auth.module";
import { CaslModule } from "../casl/casl.module";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { ProgrammeController } from "./programme.controller";
import { InvestmentView } from "../entities/investment.view.entity";
import { NDCActionViewEntity } from "../entities/ndc.view.entity";
import { Emission } from "../entities/emission.entity";
import { Projection } from "../entities/projection.entity";
import { EventLog } from "../entities/event.log.entity";
import { NationalAccountingModule } from "src/analytics-api/national-accounting/national.accounting.module";
import { NationalAccountingController } from "./national-accounting.controller";

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
    TypeOrmModule.forFeature([
      Programme,
      ProgrammeTransfer,
      ProgrammeTransferViewEntityQuery,
      Company,
      NDCActionViewEntity,
      InvestmentView,
      Emission,
      Projection,
      EventLog
    ]),
    AuthModule,
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
		NationalAccountingModule
  ],
  controllers: [ProgrammeController, NationalAccountingController],
  providers: [Logger, AggregateAPIService],
})
export class AnalyticsAPIModule {}
