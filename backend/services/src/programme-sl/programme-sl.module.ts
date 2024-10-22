import { Logger, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../entities/programmeTransfer.view.entity";
import { Programme } from "../entities/programme.entity";
import { UtilModule } from "../util/util.module";
import { ConstantEntity } from "../entities/constants.entity";
import { Company } from "../entities/company.entity";
import { ProgrammeQueryEntity } from "../entities/programme.view.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { LocationModule } from "../location/location.module";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { CaslModule } from "../casl/casl.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { ProgrammeSlService } from "./programme-sl.service";
import { DocumentEntity } from "src/entities/document.entity";

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([ProgrammeSl, DocumentEntity]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    LocationModule,
    AsyncOperationsModule,
    FileHandlerModule,
  ],
  providers: [Logger, ProgrammeSlService],
  exports: [ProgrammeSlService],
})
export class ProgrammeSlModule {}
