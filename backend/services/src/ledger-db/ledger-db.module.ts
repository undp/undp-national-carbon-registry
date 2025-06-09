import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../configuration";
import { LedgerType } from "../enum/ledger.type";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { LedgerDBInterface } from "./ledger.db.interface";
import { PgSqlLedgerService } from "./pgsql-ledger.service";
import { QLDBLedgerService } from "./qldb-ledger.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
  ],
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
