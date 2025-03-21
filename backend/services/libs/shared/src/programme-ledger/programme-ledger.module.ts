import { Module, Logger } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CaslModule } from "../casl/casl.module";
import { ConstantEntity } from "../entities/constants.entity";
import { Programme } from "../entities/programme.entity";
import { LedgerDbModule } from "../ledger-db/ledger-db.module";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerService } from "./programme-ledger.service";
import { CreditBlocksManagementModule } from "../credit-blocks-management/credit-blocks-management.module";

@Module({
  imports: [
    LedgerDbModule,
    ProgrammeLedgerModule,
    CaslModule,
    TypeOrmModule.forFeature([Programme, ConstantEntity]),
    UtilModule,
    CreditBlocksManagementModule,
  ],
  providers: [ProgrammeLedgerService, Logger],
  exports: [ProgrammeLedgerService],
})
export class ProgrammeLedgerModule {}
