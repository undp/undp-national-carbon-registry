import { Module } from "@nestjs/common";
import { DocumentManagementService } from "./document-management.service";
import { UtilModule } from "../util/util.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentEntity } from "../entities/document.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";

@Module({
  imports: [
    UtilModule,
    TypeOrmModule.forFeature([DocumentEntity]),
    ProgrammeLedgerModule,
    AuditLogsModule,
    EmailHelperModule,
    FileHandlerModule,
  ],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
