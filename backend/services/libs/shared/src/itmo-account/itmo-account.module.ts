import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ItmoAccount } from "../entities/itmo.account.entity";
import { ItmoAccountService } from "./itmo-account.service";
import { UtilModule } from "../util/util.module";

@Module({
  imports: [TypeOrmModule.forFeature([ItmoAccount]), UtilModule],
  providers: [ItmoAccountService],
  exports: [ItmoAccountService],
})
export class ItmoAccountModule {}
