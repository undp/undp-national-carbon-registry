import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../../../core/src/app-config/configuration";
import { LedgerType } from "../enum/ledger.type";
import { TypeOrmConfigService } from "../../../core/src/app-config/typeorm.config.service";
import { LedgerDBInterface } from "./ledger.db.interface";
import { PgSqlLedgerService } from "./pgsql-ledger.service";
import { QLDBLedgerService } from "./qldb-ledger.service";
import { CoreModule } from "@app/core";

@Module({
  imports: [CoreModule],
  // need to import core module since this LedgerDbModule used in main.
  // LedgerDbModule need to solve dependencies on its own
  // Global dependency injections doesnt work since this module is called before the construction of app
  providers: [
    Logger,
    {
      provide: LedgerDBInterface,
      useClass:
        process.env.LEDGER_TYPE === LedgerType.QLDB
          ? QLDBLedgerService
          : PgSqlLedgerService,
    },
  ],
  exports: [LedgerDBInterface],
})
export class LedgerDbModule {}
