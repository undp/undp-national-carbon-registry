import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "../shared/src/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/src/entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../shared/src/entities/programmeTransfer.view.entity";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "../shared/src/entities/company.entity";
import configuration from "../shared/src/configuration";
import { AuthModule } from "../shared/src/auth/auth.module";
import { CaslModule } from "../shared/src/casl/casl.module";
import { UtilModule } from "../shared/src/util/util.module";
import { ProgrammeLedgerModule } from "../shared/src/programme-ledger/programme-ledger.module";
import { TypeOrmConfigService } from "../shared/src/typeorm.config.service";
import { ProgrammeController } from "./programme.controller";
import { InvestmentView } from "../shared/src/entities/investment.view.entity";
import { NDCActionViewEntity } from "../shared/src/entities/ndc.view.entity";
import { Emission } from "../shared/src/entities/emission.entity";
import { Projection } from "../shared/src/entities/projection.entity";
import { EventLog } from "../shared/src/entities/event.log.entity";
import { NationalAccountingModule } from "src/analytics-api/national-accounting/national.accounting.module";
import { NationalAccountingController } from "./national-accounting.controller";
import { ProgrammeSl } from "../shared/src/entities/programmeSl.entity";
import { AggregateSlAPIService } from "./aggregate.sl.api.service";
import { VerificationRequestEntity } from "../shared/src/entities/verification.request.entity";
import { CreditRetirementSl } from "../shared/src/entities/creditRetirementSl.entity";
import { CreditRetirementSlView } from "src/shared/src/entities/creditRetirementSl.view.entity";
import { ProgrammeAuditLogSl } from "src/shared/src/entities/programmeAuditLogSl.entity";

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
      EventLog,
      ProgrammeSl,
      VerificationRequestEntity,
      CreditRetirementSl,
      CreditRetirementSlView,
      ProgrammeAuditLogSl,
    ]),
    AuthModule,
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
    NationalAccountingModule,
  ],
  controllers: [ProgrammeController, NationalAccountingController],
  providers: [Logger, AggregateAPIService, AggregateSlAPIService],
})
export class AnalyticsAPIModule {}
