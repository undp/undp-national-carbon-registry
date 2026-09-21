import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreditBlocksManagementService } from "./credit-blocks-management.service";
import { UtilModule } from "../util/util.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";
import { ItmoAccount } from "../entities/itmo.account.entity";

@Module({
  imports: [
    UtilModule,
    SerialNumberManagementModule,
    TypeOrmModule.forFeature([ItmoAccount]),
  ],
  providers: [CreditBlocksManagementService],
  exports: [CreditBlocksManagementService],
})
export class CreditBlocksManagementModule {}
