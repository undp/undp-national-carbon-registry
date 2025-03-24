import { Module } from "@nestjs/common";
import { SerialNumberManagementService } from "./serial-number-management.service";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [UtilModule],
  providers: [SerialNumberManagementService],
  exports: [SerialNumberManagementService],
})
export class SerialNumberManagementModule {}
