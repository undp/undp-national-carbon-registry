import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../shared/entities/programme.entity';
import configuration from '../shared/configuration';
import { TypeOrmConfigService } from '../shared/typeorm.config.service';
import { LedgerReplicatorService } from './ledger-replicator.service';
import { Company } from '../shared/entities/company.entity';

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
    TypeOrmModule.forFeature([Programme, Company])
  ],
  providers: [LedgerReplicatorService, Logger]
})
export class LedgerReplicatorModule {}
