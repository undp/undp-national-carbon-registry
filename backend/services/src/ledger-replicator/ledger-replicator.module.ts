import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from 'carbon-services-lib';
import { configuration } from "carbon-services-lib";
import { TypeOrmConfigService } from 'carbon-services-lib';
import { QLDBKinesisReplicatorService } from './qldb-kinesis-replicator.service';
import { Company } from 'carbon-services-lib';
import { LedgerReplicatorInterface } from './replicator-interface.service';
import { PgSqlReplicatorService } from './pgsql-replicator.service';
import { ProcessEventService } from './process.event.service';
import { Counter } from 'carbon-services-lib';
import { LocationModule } from 'carbon-services-lib';
import { LedgerType } from 'carbon-services-lib';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration.default],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([Programme, Company, Counter]),
    LocationModule
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
