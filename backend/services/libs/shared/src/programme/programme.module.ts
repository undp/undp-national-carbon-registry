import { Logger, Module } from "@nestjs/common";
import { ProgrammeService } from "./programme.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { ProgrammeTransferViewEntityQuery } from "../view-entities/programmeTransfer.view.entity";
import { Programme } from "../entities/programme.entity";
import { UtilModule } from "../util/util.module";
import { ConstantEntity } from "../entities/constants.entity";
import { Company } from "../entities/company.entity";
import { ProgrammeQueryEntity } from "../view-entities/programme.view.entity";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { AsyncOperationsModule } from "../async-operations/async-operations.module";
import { LocationModule } from "../location/location.module";
import { CompanyModule } from "../company/company.module";
import { UserModule } from "../user/user.module";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { CaslModule } from "../casl/casl.module";
import { ProgrammeDocument } from "../entities/programme.document";
import { NDCActionViewEntity } from "../view-entities/ndc.view.entity";
import { Investment } from "../entities/investment.entity";
import { InvestmentView } from "../view-entities/investment.view.entity";
import { ProgrammeDocumentViewEntity } from "../view-entities/document.view.entity";
import { NDCAction } from "../entities/ndc.action.entity";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { NdcDetailsPeriod } from "../entities/ndc.details.period.entity";
import { NdcDetailsAction } from "../entities/ndc.details.action.entity";
import { EventLog } from "../entities/event.log.entity";
import { Region } from "../entities/region.entity";
import { CreditAuditLog } from "../entities/credit.audit.log.entity";
import { DocumentEntity } from "../entities/document.entity";
import { InitialReport } from "../entities/initial.report.entity";
import { CooperativeApproach } from "../entities/cooperative.approach.entity";

@Module({
  imports: [
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([
      Programme,
      ProgrammeTransfer,
      ConstantEntity,
      Company,
      ProgrammeQueryEntity,
      ProgrammeTransferViewEntityQuery,
      NDCAction,
      ProgrammeDocument,
      NDCActionViewEntity,
      Investment,
      InvestmentView,
      ProgrammeDocumentViewEntity,
      NdcDetailsPeriod,
      NdcDetailsAction,
      EventLog,
      Region,
      CreditAuditLog,
      DocumentEntity,
      // Dec 2/CMA.3 Annex chapter V para 18 guard
      InitialReport,
      // Draft -/CMA.5 paras 20-21 revocation guard
      CooperativeApproach,
    ]),
    UtilModule,
    CompanyModule,
    UserModule,
    EmailHelperModule,
    LocationModule,
    AsyncOperationsModule,
    FileHandlerModule,
  ],
  providers: [Logger, ProgrammeService],
  exports: [ProgrammeService],
})
export class ProgrammeModule {}
