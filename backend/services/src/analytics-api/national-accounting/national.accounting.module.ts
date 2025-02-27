import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CaslModule } from "src/shared/src/casl/casl.module";
import { CreditAuditLog } from "src/shared/src/entities/credit.audit.log.entity";
import { Programme } from "src/shared/src/entities/programme.entity";
import { User } from "src/shared/src/entities/user.entity";
import { NationalAccountingService } from "./national.accounting.service";
import { UtilModule } from "src/shared/src/util/util.module";
import { CreditAuditLogViewEntity } from "src/shared/src/entities/creditAuditLog.view.entity";

@Module({
  imports: [
    CaslModule,
    TypeOrmModule.forFeature([
      Programme,
      CreditAuditLog,
      CreditAuditLogViewEntity,
      User,
    ]),
    UtilModule,
  ],
  providers: [NationalAccountingService],
  exports: [NationalAccountingService],
})
export class NationalAccountingModule {}
