import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsyncActionEntity } from "src/shared/entities/async.action.entity";
import { Counter } from "src/shared/entities/counter.entity";
import configuration from "../shared/configuration";
import { AsyncOperationType } from "../shared/enum/async.operation.type.enum";
import { TypeOrmConfigService } from "../shared/typeorm.config.service";
import { AsyncOperationsDatabaseHandlerService } from "./async-operations-database-handler.service";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsQueueHandlerService } from "./async-operations-queue-handler.service";
import { AsyncOperationsService } from "./async-operations.service";

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
    AsyncOperationsService,
  ],
})
export class AsyncOperationsModule {}
