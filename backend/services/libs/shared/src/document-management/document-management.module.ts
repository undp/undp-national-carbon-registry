import { Module } from "@nestjs/common";
import { DocumentManagementService } from "./document-management.service";
import { UtilModule } from "../util/util.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentEntity } from "../entities/document.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CompanyModule } from "../company/company.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    UtilModule,
    TypeOrmModule.forFeature([DocumentEntity]),
    ProgrammeLedgerModule,
    EmailHelperModule,
    AuditLogsModule,
    CompanyModule,
    FileHandlerModule,
    UserModule,
  ],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
