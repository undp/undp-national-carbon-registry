import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import configuration from "../shared/configuration";
import { AsyncOperationType } from "../shared/enum/async.operation.type.enum";
import { TypeOrmConfigService } from "../shared/typeorm.config.service";
import { AsyncOperationsDatabaseService } from "./async-operations-database.service";
import { AsyncOperationsInterface } from "./async-operations-interface.service";
import { AsyncOperationsQueueService } from "./async-operations-queue.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
  ],
  providers: [
    {
      provide: AsyncOperationsInterface,
      useClass:
        process.env.ASYNC_OPERATIONS_TYPE === AsyncOperationType.Queue
          ? AsyncOperationsQueueService
          : AsyncOperationsDatabaseService,
    },
    Logger,
  ],
})
export class AsyncOperationsModule {}
