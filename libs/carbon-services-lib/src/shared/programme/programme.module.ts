import { Logger, Module } from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { ProgrammeTransferViewEntityQuery } from '../entities/programmeTransfer.view.entity';
import { Programme } from '../entities/programme.entity';
import { UtilModule } from '../util/util.module';
import { ConstantEntity } from '../entities/constants.entity';
import { Company } from '../entities/company.entity';
import { ProgrammeQueryEntity } from '../entities/programme.view.entity';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { AsyncOperationsModule } from '../async-operations/async-operations.module';
import { LocationModule } from '../location/location.module';
import { CompanyModule } from '../company/company.module';
import { UserModule } from '../user/user.module';
import { EmailHelperModule } from '../email-helper/email-helper.module';
import { CaslModule } from '../casl/casl.module';

@Module({
  imports: [
    ProgrammeLedgerModule, 
    CaslModule, 
    TypeOrmModule.forFeature([Programme, ProgrammeTransfer, ConstantEntity, Company, ProgrammeQueryEntity, ProgrammeTransferViewEntityQuery]), 
    UtilModule, 
    CompanyModule, 
    UserModule,
    EmailHelperModule,
    LocationModule,
    AsyncOperationsModule
  ],
  providers: [Logger, ProgrammeService],
  exports: [ProgrammeService]
})
export class ProgrammeModule {}

