import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QLDBKinesisReplicatorService } from "./qldb-kinesis-replicator.service";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { PgSqlReplicatorService } from "./pgsql-replicator.service";
import { ProcessEventService } from "./process.event.service";
import { Programme } from "@app/shared/entities/programme.entity";
import configuration from "@app/shared/configuration";
import { TypeOrmConfigService } from "@app/shared/typeorm.config.service";
import { Company } from "@app/shared/entities/company.entity";
import { Counter } from "@app/shared/entities/counter.entity";
import { LocationModule } from "@app/shared/location/location.module";
import { LedgerType } from "@app/shared/enum/ledger.type";
import { DataImporterModule } from "../data-importer/data-importer.module";
import { AsyncOperationsModule } from "@app/shared/async-operations/async-operations.module";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { SharedModule } from "@app/shared";

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
    SharedModule,
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
