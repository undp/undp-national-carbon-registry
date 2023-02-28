import { forwardRef, Module } from '@nestjs/common';
import { AsyncQueueModule } from '../async-operations/async-queue.module';
import { CompanyModule } from '../company/company.module';
import { EmailModule } from '../email/email.module';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { UserModule } from '../user/user.module';
import { EmailHelperService } from './email-helper.service';

@Module({
    providers: [EmailHelperService],
    exports: [EmailHelperService],
    imports: [forwardRef(() => UserModule), EmailModule, ProgrammeLedgerModule, forwardRef(() => CompanyModule),AsyncQueueModule]
})
export class EmailHelperModule {}
