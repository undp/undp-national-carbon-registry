import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { CaslModule } from '../casl/casl.module';
import configuration from '../configuration';
import { EmailModule } from '../email/email.module';
import { TypeOrmConfigService } from '../typeorm.config.service';
import { CompanyService } from './company.service';
import { UtilModule } from '../util/util.module';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { ProgrammeTransfer } from '../entities/programme.transfer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined
    }),
    TypeOrmModule.forFeature([Company, ProgrammeTransfer]),
    CaslModule,
    EmailModule,
    UtilModule,
    ProgrammeLedgerModule
  ],
  providers: [CompanyService, Logger],
  exports: [CompanyService]
})
export class CompanyModule {}
