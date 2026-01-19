import { Module } from "@nestjs/common";
import { CreditBlocksManagementService } from "./credit-blocks-management.service";
import { UtilModule } from "../util/util.module";
import { SerialNumberManagementModule } from "../serial-number-management/serial-number-management.module";

@Module({
  imports: [UtilModule, SerialNumberManagementModule],
  providers: [CreditBlocksManagementService],
  exports: [CreditBlocksManagementService],
})
export class CreditBlocksManagementModule {}
