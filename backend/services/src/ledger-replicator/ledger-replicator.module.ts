import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QLDBKinesisReplicatorService } from './qldb-kinesis-replicator.service';
import { LedgerReplicatorInterface } from './replicator-interface.service';
import { PgSqlReplicatorService } from './pgsql-replicator.service';
import { ProcessEventService } from './process.event.service';
import { Programme } from '../entities/programme.entity';
import configuration from '../configuration';
import { TypeOrmConfigService } from '../typeorm.config.service';
import { Company } from '../entities/company.entity';
import { Counter } from '../entities/counter.entity';
import { LocationModule } from '../location/location.module';
import { LedgerType } from '../enum/ledger.type';
import { DataImporterModule } from '../data-importer/data-importer.module';
import { AsyncOperationsModule } from '../async-operations/async-operations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Programme, Company, Counter]),
    LocationModule,
    DataImporterModule,
    AsyncOperationsModule,
  ],
  providers: [{
    provide: LedgerReplicatorInterface,
    useClass:
      process.env.LEDGER_TYPE === LedgerType.QLDB
        ? QLDBKinesisReplicatorService
        : PgSqlReplicatorService,
  }, Logger, ProcessEventService]
})
export class LedgerReplicatorModule {}
