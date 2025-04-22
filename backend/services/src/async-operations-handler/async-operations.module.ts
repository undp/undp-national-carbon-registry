import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsyncOperationsDatabaseHandlerService } from "./async-operations-database-handler.service";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsQueueHandlerService } from "./async-operations-queue-handler.service";
import { AsyncOperationsHandlerService } from "./async-operations-handler.service";
import { AsyncActionEntity } from "@app/shared/entities/async.action.entity";
import { Counter } from "@app/shared/entities/counter.entity";
import configuration from "@app/core/app-config/configuration";
import { AsyncOperationType } from "@app/shared/enum/async.operation.type.enum";
import { TypeOrmConfigService } from "@app/core/app-config/typeorm.config.service";
import { RegistryClientModule } from "@app/shared/registry-client/registry-client.module";
import { EmailModule } from "@app/shared/email/email.module";
import { CadtModule } from "@app/shared/cadt/cadt.module";
import { SharedModule } from "@app/shared";
import { CoreModule } from "@app/core";

@Module({
  imports: [
    TypeOrmModule.forFeature([AsyncActionEntity, Counter]),
    SharedModule,
    CoreModule,
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
