import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../shared/entities/programme.entity';
import configuration from '../shared/configuration';
import { TypeOrmConfigService } from '../shared/typeorm.config.service';
import { LedgerType } from '../shared/enum/ledger.type';
import { ProgrammeModule } from '../shared/programme/programme.module';
import { DataImporterService } from './data-importer.service';
import { CompanyModule,UserModule } from 'carbon-services-lib';

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
    TypeOrmModule.forFeature([Programme]),
    ProgrammeModule,
    CompanyModule,
    UserModule
  ],
  providers: [Logger, DataImporterService]
})
export class DataImporterModule {}
