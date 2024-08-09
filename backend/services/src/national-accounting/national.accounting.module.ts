import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CaslModule } from "src/casl/casl.module";
import { CreditAuditLog } from "src/entities/credit.audit.log.entity";
import { Programme } from "src/entities/programme.entity";
import { User } from "src/entities/user.entity";
import { NationalAccountingService } from "./national.accounting.service";
import { UtilModule } from "src/util/util.module";

@Module({
  imports: [
    CaslModule,
    TypeOrmModule.forFeature([
      Programme,
			CreditAuditLog, 
			User
    ]),
		UtilModule
  ],
  providers: [NationalAccountingService],
  exports: [NationalAccountingService],
})
export class NationalAccountingModule {}
