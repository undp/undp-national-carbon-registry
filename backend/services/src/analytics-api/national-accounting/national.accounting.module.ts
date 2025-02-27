import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NationalAccountingService } from "./national.accounting.service";
import { Programme } from "@app/shared/entities/programme.entity";
import { CreditAuditLog } from "@app/shared/entities/credit.audit.log.entity";
import { CreditAuditLogViewEntity } from "@app/shared/entities/creditAuditLog.view.entity";
import { User } from "@app/shared/entities/user.entity";
import { SharedModule } from "@app/shared";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Programme,
      CreditAuditLog,
      CreditAuditLogViewEntity,
      User,
    ]),
    SharedModule,
  ],
  providers: [NationalAccountingService],
  exports: [NationalAccountingService],
})
export class NationalAccountingModule {}
