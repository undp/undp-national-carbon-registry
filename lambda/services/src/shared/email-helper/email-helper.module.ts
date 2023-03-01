import { forwardRef, Module } from '@nestjs/common';
import { CompanyModule } from '../company/company.module';
import { EmailModule } from '../email/email.module';
import { ProgrammeLedgerModule } from '../programme-ledger/programme-ledger.module';
import { UserModule } from '../user/user.module';
import { EmailHelperService } from './email-helper.service';

@Module({
    providers: [EmailHelperService],
    exports: [EmailHelperService],
    imports: [forwardRef(() => UserModule), EmailModule, ProgrammeLedgerModule, forwardRef(() => CompanyModule)]
})
export class EmailHelperModule {}
