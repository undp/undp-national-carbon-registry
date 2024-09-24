import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsyncOperationsDatabaseHandlerService } from "./async-operations-database-handler.service";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsQueueHandlerService } from "./async-operations-queue-handler.service";
import { AsyncOperationsHandlerService } from "./async-operations-handler.service";
import { AsyncActionEntity } from "../entities/async.action.entity";
import { Counter } from "../entities/counter.entity";
import configuration from "../configuration";
import { AsyncOperationType } from "../enum/async.operation.type.enum";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { RegistryClientModule } from "../registry-client/registry-client.module";
import { EmailModule } from "../email/email.module";
import { CadtModule } from "../cadt/cadt.module";

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
    TypeOrmModule.forFeature([AsyncActionEntity, Counter]),
    RegistryClientModule,
    EmailModule,
    CadtModule,
  ],
  providers: [
    {
      provide: AsyncOperationsHandlerInterface,
      useClass:
        process.env.ASYNC_OPERATIONS_TYPE === AsyncOperationType.Queue
          ? AsyncOperationsQueueHandlerService
          : AsyncOperationsDatabaseHandlerService,
    },
    Logger,
    AsyncOperationsHandlerService,
  ],
})
export class AsyncOperationsModuleMain {}
