import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "@app/shared/entities/programme.entity";
import { ProgrammeTransfer } from "@app/shared/entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "@app/shared/entities/programmeTransfer.view.entity";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "@app/shared/entities/company.entity";
import configuration from "@app/core/app-config/configuration";
import { AuthModule } from "@app/shared/auth/auth.module";
import { CaslModule } from "@app/shared/casl/casl.module";
import { UtilModule } from "@app/shared/util/util.module";
import { ProgrammeLedgerModule } from "@app/shared/programme-ledger/programme-ledger.module";
import { TypeOrmConfigService } from "@app/core/app-config/typeorm.config.service";
import { ProgrammeController } from "./programme.controller";
import { InvestmentView } from "@app/shared/entities/investment.view.entity";
import { NDCActionViewEntity } from "@app/shared/entities/ndc.view.entity";
import { Emission } from "@app/shared/entities/emission.entity";
import { Projection } from "@app/shared/entities/projection.entity";
import { EventLog } from "@app/shared/entities/event.log.entity";
import { NationalAccountingModule } from "src/analytics-api/national-accounting/national.accounting.module";
import { NationalAccountingController } from "./national-accounting.controller";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { AggregateSlAPIService } from "./aggregate.sl.api.service";
import { VerificationRequestEntity } from "@app/shared/entities/verification.request.entity";
import { CreditRetirementSl } from "@app/shared/entities/creditRetirementSl.entity";
import { CreditRetirementSlView } from "@app/shared/entities/creditRetirementSl.view.entity";
import { ProgrammeAuditLogSl } from "@app/shared/entities/programmeAuditLogSl.entity";
import { SharedModule } from "@app/shared";
import { CoreModule } from "@app/core";

@Module({
  imports: [
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
    SharedModule,
    CoreModule,
  ],
  controllers: [ProgrammeController, NationalAccountingController],
  providers: [Logger, AggregateAPIService, AggregateSlAPIService],
})
export class AnalyticsAPIModule {}
