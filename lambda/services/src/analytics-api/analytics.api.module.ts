import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ProgrammeController } from "./programme.controller";
import { AnalyticsAPIService } from "./analytics.api.service";
import configuration from "../shared/configuration";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeOrmConfigService } from "../shared/typeorm.config.service";
import { Programme } from "../shared/entities/programme.entity";
import { ProgrammeLedgerModule } from "../shared/programme-ledger/programme-ledger.module";
import { CaslModule } from "../shared/casl/casl.module";
import { AuthModule } from "../shared/auth/auth.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined
    }),
    TypeOrmModule.forFeature([Programme]),
    AuthModule,
    CaslModule,
    ProgrammeLedgerModule,
  ],
  controllers: [ProgrammeController],
  providers: [AnalyticsAPIService, Logger],
})
export class AnalyticsAPIModule {}
