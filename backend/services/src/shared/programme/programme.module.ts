import { Logger, Module } from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { CaslModule } from '../casl/casl.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../entities/programme.entity';
import { UtilModule } from '../util/util.module';
import { ConstantEntity } from '../entities/constants.entity';
import { CompanyModule } from '../company/company.module';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { Company } from '../entities/company.entity';
import { ProgrammeQueryEntity } from '../entities/programme.view.entity';
import { ProgrammeTransferViewEntityQuery } from '../entities/programmeTransfer.view.entity';
import { UserModule } from '../user/user.module';
import { EmailHelperModule } from '../email-helper/email-helper.module';

@Module({
  imports: [
    ProgrammeLedgerModule, 
    CaslModule, 
    TypeOrmModule.forFeature([Programme, ProgrammeTransfer, ConstantEntity, Company, ProgrammeQueryEntity, ProgrammeTransferViewEntityQuery]), 
    UtilModule, 
    CompanyModule, 
    UserModule,
    EmailHelperModule
  ],
  providers: [Logger, ProgrammeService],
  exports: [ProgrammeService]
})
export class ProgrammeModule {}

