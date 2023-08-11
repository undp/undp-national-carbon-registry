import { Logger, Module } from '@nestjs/common';
import { ProgrammeService } from './programme.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Programme } from '../entities/programme.entity';
import { UtilModule,ProgrammeLedgerModule,AsyncOperationsModule,LocationModule,CompanyModule ,UserModule,EmailHelperModule,CaslModule} from 'carbon-services-lib';
import { ConstantEntity } from '../entities/constants.entity';
import { ProgrammeTransfer } from '../entities/programme.transfer';
import { Company } from '../entities/company.entity';
import { ProgrammeQueryEntity } from '../entities/programme.view.entity';
import { ProgrammeTransferViewEntityQuery } from '../entities/programmeTransfer.view.entity';

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

