import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "@app/shared/entities/programme.entity";
import { ProgrammeTransfer } from "@app/shared/entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "@app/shared/view-entities/programmeTransfer.view.entity";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "@app/shared/entities/company.entity";
import { ProgrammeController } from "./programme.controller";
import { InvestmentView } from "@app/shared/view-entities/investment.view.entity";
import { NDCActionViewEntity } from "@app/shared/view-entities/ndc.view.entity";
import { Emission } from "@app/shared/entities/emission.entity";
import { Projection } from "@app/shared/entities/projection.entity";
import { EventLog } from "@app/shared/entities/event.log.entity";
import { NationalAccountingController } from "./national-accounting.controller";
import { VerificationRequestEntity } from "@app/shared/entities/verification.request.entity";
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
      VerificationRequestEntity,
    ]),
    SharedModule,
    CoreModule,
  ],
  controllers: [ProgrammeController, NationalAccountingController],
  providers: [Logger, AggregateAPIService],
})
export class AnalyticsAPIModule {}
