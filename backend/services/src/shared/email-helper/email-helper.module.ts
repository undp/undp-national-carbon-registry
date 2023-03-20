import { forwardRef, Module } from '@nestjs/common';
import { AsyncOperationsModule } from '../async-operations/async-operations.module';
import { CompanyModule } from '../company/company.module';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { UserModule } from '../user/user.module';
import { UtilModule } from '../util/util.module';
import { EmailHelperService } from './email-helper.service';

@Module({
    providers: [EmailHelperService],
    exports: [EmailHelperService],
    imports: [forwardRef(() => UserModule), ProgrammeLedgerModule, forwardRef(() => CompanyModule), AsyncOperationsModule, UtilModule]
})
export class EmailHelperModule {}
