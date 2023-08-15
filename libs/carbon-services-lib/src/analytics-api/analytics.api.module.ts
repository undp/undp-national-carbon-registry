import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeTransfer } from "../shared/entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../shared/entities/programmeTransfer.view.entity";
import { AggregateAPIService } from "./aggregate.api.service";
import { Company } from "../shared/entities/company.entity";
import configuration from "../shared/configuration";
import { AuthModule } from "../shared/auth/auth.module";
import { CaslModule } from "../shared/casl/casl.module";
import { UtilModule } from "../shared/util/util.module";
import { ProgrammeLedgerModule } from "../shared/programme-ledger/programme-ledger.module";
import { TypeOrmConfigService } from "../shared/typeorm.config.service";
import { ProgrammeController } from "./programme.controller";

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
      Company
    ]),
    AuthModule,
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
  ],
  controllers: [ProgrammeController],
  providers: [Logger, AggregateAPIService],
})
export class AnalyticsAPIModule {}
