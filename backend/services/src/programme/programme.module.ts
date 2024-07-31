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
import { ProgrammeDocument } from '../entities/programme.document';
import { NDCActionViewEntity } from '../entities/ndc.view.entity';
import { Investment } from '../entities/investment.entity';
import { InvestmentView } from '../entities/investment.view.entity';
import { ProgrammeDocumentViewEntity } from '../entities/document.view.entity';
import { NDCAction } from '../entities/ndc.action.entity';
import { FileHandlerModule } from '../file-handler/filehandler.module';
import { AuthorizationLetterGen } from '../util/authorisation.letter.gen';
import { CadtModule } from '../cadt/cadt.module';
import { NdcDetailsPeriod } from '../entities/ndc.details.period.entity';
import { NdcDetailsAction } from '../entities/ndc.details.action.entity';
import { EventLog } from '../entities/event.log.entity';

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([
      Programme,
      ProgrammeTransfer,
      ConstantEntity,
      Company,
      ProgrammeQueryEntity,
      ProgrammeTransferViewEntityQuery,
      NDCAction,
      ProgrammeDocument,
      NDCActionViewEntity,
      Investment,
      InvestmentView,
      ProgrammeDocumentViewEntity,
      NdcDetailsPeriod,
      NdcDetailsAction,
      EventLog
    ]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    LocationModule,
    AsyncOperationsModule,
    FileHandlerModule,
  ],
  providers: [Logger, ProgrammeService],
  exports: [ProgrammeService],
})
export class ProgrammeModule {}
