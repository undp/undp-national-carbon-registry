import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../shared/entities/programme.entity';
import configuration from '../shared/configuration';
import { TypeOrmConfigService } from '../shared/typeorm.config.service';
import { QLDBKinesisReplicatorService } from './qldb-kinesis-replicator.service';
import { Company } from '../shared/entities/company.entity';
import { LedgerReplicatorInterface } from './replicator-interface.service';
import { PgSqlReplicatorService } from './pgsql-replicator.service';
import { ProcessEventService } from './process.event.service';
import { Counter } from '../shared/entities/counter.entity';
import { LocationModule } from 'carbon-services-lib';
import { LedgerType } from '../shared/enum/ledger.type';

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
