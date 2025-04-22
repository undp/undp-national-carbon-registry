import { CoreModule } from "@app/core";
import { SharedModule } from "@app/shared";
import { Company } from "@app/shared/entities/company.entity";
import { Counter } from "@app/shared/entities/counter.entity";
import { Programme } from "@app/shared/entities/programme.entity";
import { ProgrammeSl } from "@app/shared/entities/programmeSl.entity";
import { LedgerType } from "@app/shared/enum/ledger.type";
import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PgSqlReplicatorService } from "./pgsql-replicator.service";
import { ProcessEventService } from "./process.event.service";
import { QLDBKinesisReplicatorService } from "./qldb-kinesis-replicator.service";
import { LedgerReplicatorInterface } from "./replicator-interface.service";
import { ProjectEntity } from "@app/shared/entities/projects.entity";
import { DataImporterModule } from "src/data-importer/data-importer.module";
import { CreditBlocksEntity } from "@app/shared/entities/credit.blocks.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Programme,
      Company,
      Counter,
      ProgrammeSl,
      ProjectEntity,
      CreditBlocksEntity,
    ]),
    SharedModule,
    CoreModule,
    DataImporterModule,
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
