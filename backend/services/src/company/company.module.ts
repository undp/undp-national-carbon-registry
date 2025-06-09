import { forwardRef, Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Company } from "../entities/company.entity";
import { CaslModule } from "../casl/casl.module";
import configuration from "../configuration";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { CompanyService } from "./company.service";
import { UtilModule } from "../util/util.module";
import { ProgrammeLedgerModule } from "../programme-ledger/programme-ledger.module";
import { ProgrammeTransfer } from "../entities/programme.transfer";
import { EmailHelperModule } from "../email-helper/email-helper.module";
import { FileHandlerModule } from "../file-handler/filehandler.module";
import { UserModule } from "../user/user.module";
import { AsyncOperationsModule } from '../async-operations/async-operations.module';
import { LocationModule } from "../location/location.module";
import { Investment } from "../entities/investment.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      imports: undefined,
    }),
    TypeOrmModule.forFeature([Company, ProgrammeTransfer, Investment]),
    CaslModule,
    UtilModule,
    ProgrammeLedgerModule,
    FileHandlerModule,
    forwardRef(() => EmailHelperModule),
    forwardRef(() => UserModule),
    AsyncOperationsModule,
    LocationModule
  ],
  providers: [CompanyService, Logger],
  exports: [CompanyService],
})
export class CompanyModule {}
