import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProgrammeController } from "./programme.controller";
import { AnalyticsAPIService } from "./analytics.api.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "carbon-services-lib";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../shared/entities/programmeTransfer.view.entity";
import { AuthModule, UtilModule,ProgrammeLedgerModule ,CaslModule} from "carbon-services-lib";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "../shared/entities/company.entity";
import { configuration } from "carbon-services-lib";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration.default],
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
      Company
    ]),
    AuthModule,
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
  ],
  controllers: [ProgrammeController],
  providers: [AnalyticsAPIService, Logger, AggregateAPIService],
})
export class AnalyticsAPIModule {}
