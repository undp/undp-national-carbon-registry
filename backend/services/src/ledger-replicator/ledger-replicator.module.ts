import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QLDBKinesisReplicatorService } from "./qldb-kinesis-replicator.service";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { PgSqlReplicatorService } from "./pgsql-replicator.service";
import { ProcessEventService } from "./process.event.service";
import { Programme } from "../shared/src/entities/programme.entity";
import configuration from "../shared/src/configuration";
import { TypeOrmConfigService } from "../shared/src/typeorm.config.service";
import { Company } from "../shared/src/entities/company.entity";
import { Counter } from "../shared/src/entities/counter.entity";
import { LocationModule } from "../shared/src/location/location.module";
import { LedgerType } from "../shared/src/enum/ledger.type";
import { DataImporterModule } from "../data-importer/data-importer.module";
import { AsyncOperationsModule } from "../shared/src/async-operations/async-operations.module";
import { ProgrammeSl } from "../shared/src/entities/programmeSl.entity";

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
    TypeOrmModule.forFeature([Programme, Company, Counter, ProgrammeSl]),
    LocationModule,
    DataImporterModule,
    AsyncOperationsModule,
  ],
  providers: [
    {
      provide: LedgerReplicatorInterface,
      useClass:
        process.env.LEDGER_TYPE === LedgerType.QLDB
          ? QLDBKinesisReplicatorService
          : PgSqlReplicatorService,
    },
    Logger,
    ProcessEventService,
  ],
})
export class LedgerReplicatorModule {}
