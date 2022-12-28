import { Logger, Module } from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { CaslModule } from '../casl/casl.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../entities/programme.entity';
import { UtilModule } from '../util/util.module';
import { ConstantEntity } from '../entities/constants.entity';
import { CompanyModule } from '../company/company.module';
import { EmailModule } from '../email/email.module';
import { ProgrammeTransfer } from '../entities/programme.transfer';

@Module({
  imports: [
    ProgrammeLedgerModule, 
    CaslModule, 
    TypeOrmModule.forFeature([Programme]), 
    TypeOrmModule.forFeature([ProgrammeTransfer]), 
    TypeOrmModule.forFeature([ConstantEntity]), 
    UtilModule, 
    CompanyModule, 
    EmailModule
  ],
  providers: [Logger, ProgrammeService],
  exports: [ProgrammeService]
})
export class ProgrammeModule {}

