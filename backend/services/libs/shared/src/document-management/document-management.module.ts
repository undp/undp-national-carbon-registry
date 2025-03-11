import { Module } from "@nestjs/common";
import { DocumentManagementService } from "./document-management.service";
import { UtilModule } from "../util/util.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DocumentEntity } from "../entities/document.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";

@Module({
  imports: [
    UtilModule,
    TypeOrmModule.forFeature([DocumentEntity]),
    ProgrammeLedgerModule,
  ],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
