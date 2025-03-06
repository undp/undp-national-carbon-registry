import { Module } from "@nestjs/common";
import { SharedService } from "./shared.service";
import { ProgrammeModule } from "./programme/programme.module";
import { AnnualReportModule } from "./annualreport/annual-report.module";
import { AsyncOperationsModule } from "./async-operations/async-operations.module";
import { AuthModule } from "./auth/auth.module";
import { CadtModule } from "./cadt/cadt.module";
import { CompanyModule } from "./company/company.module";
import { CreditRetirementSlModule } from "./creditRetirement-sl/creditRetirementSl.module";
import { EmailModule } from "./email/email.module";
import { EmailHelperModule } from "./email-helper/email-helper.module";
import { FileHandlerModule } from "./file-handler/filehandler.module";
import { LedgerDbModule } from "./ledger-db/ledger-db.module";
import { LocationModule } from "./location/location.module";
import { ProgrammeAuditSlModule } from "./programme-audit-sl/programme-audit-sl.module";
import { ProgrammeLedgerModule } from "./programme-ledger/programme-ledger.module";
import { ProgrammeSlModule } from "./programme-sl/programme-sl.module";
import { RegistryClientModule } from "./registry-client/registry-client.module";
import { UserModule } from "./user/user.module";
import { UtilModule } from "./util/util.module";
import { ValidationModule } from "./validation/validation.module";
import { VerificationModule } from "./verification/verification.module";
import { CaslModule } from "./casl/casl.module";
import { ProjectManagementModule } from "./project-management/project-management.module";

@Module({
  imports: [
    ProgrammeModule,
    AnnualReportModule,
    AsyncOperationsModule,
    AuthModule,
    CadtModule,
    CompanyModule,
    CreditRetirementSlModule,
    EmailModule,
    EmailHelperModule,
    FileHandlerModule,
    LedgerDbModule,
    LocationModule,
    ProgrammeAuditSlModule,
    ProgrammeLedgerModule,
    ProgrammeSlModule,
    RegistryClientModule,
    UserModule,
    UtilModule,
    ValidationModule,
    VerificationModule,
    CaslModule,
    ProjectManagementModule,
  ],
  providers: [SharedService],
  exports: [
    SharedService,
    ProgrammeModule,
    AnnualReportModule,
    AsyncOperationsModule,
    AuthModule,
    CadtModule,
    CompanyModule,
    CreditRetirementSlModule,
    EmailModule,
    EmailHelperModule,
    FileHandlerModule,
    LedgerDbModule,
    LocationModule,
    ProgrammeAuditSlModule,
    ProgrammeLedgerModule,
    ProgrammeSlModule,
    RegistryClientModule,
    UserModule,
    UtilModule,
    ValidationModule,
    VerificationModule,
    CaslModule,
    ProjectManagementModule,
  ],
})
export class SharedModule {}
