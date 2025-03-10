import { Module } from "@nestjs/common";
import { ProjectManagementService } from "./project-management.service";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { CaslModule } from "../casl/casl.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UtilModule } from "../util/util.module";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { DocumentEntity } from "../entities/document.entity";
import { ProjectViewEntity } from "../view-entities/project.view.entity";
import { ProjectDetailsViewEntity } from "../view-entities/projectDetails.view.entity";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([
      DocumentEntity,
      ProjectViewEntity,
      ProjectDetailsViewEntity,
    ]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    FileHandlerModule,
    AuditLogsModule,
  ],
  providers: [ProjectManagementService],
  exports: [ProjectManagementService],
})
export class ProjectManagementModule {}
