import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";

import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { LocationModule } from "../location/location.module";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { CaslModule } from "../casl/casl.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { VerificationService } from "./verification.service";
import { ProgrammeSlModule } from "../programme-sl/programme-sl.module";
import { CreditRetirementSlModule } from "../creditRetirement-sl/creditRetirementSl.module";
import { ProgrammeAuditLogSl } from "../entities/programmeAuditLogSl.entity";
import { DocumentEntity } from "../entities/document.entity";
import { VerificationRequestEntity } from "../entities/verification.request.entity";

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([
      DocumentEntity,
      VerificationRequestEntity,
      ProgrammeAuditLogSl,
    ]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    LocationModule,
    AsyncOperationsModule,
    FileHandlerModule,
    ProgrammeSlModule,
    CreditRetirementSlModule,
  ],
  providers: [Logger, VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
