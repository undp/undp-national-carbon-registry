import { forwardRef, Logger, Module } from "@nestjs/common";
import { AsyncOperationsInterface } from "./async-operations.interface";
import { AsyncOperationsQueueService } from "./async-operations-queue.service";
import configuration from "../configuration";
import { ConfigModule } from "@nestjs/config";
import { AsyncOperationType } from "../enum/async.operation.type.enum";
import { AsyncOperationsDatabaseService } from "./async-operations-database.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsyncActionEntity } from "../entities/async.action.entity";
import { TypeOrmConfigService } from "../typeorm.config.service";
import { UtilModule } from "../util/util.module";

@Module({
  exports: [AsyncOperationsInterface],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([AsyncActionEntity]),
    forwardRef(() => UtilModule)
  ],
  providers: [
    Logger,
    {
      provide: AsyncOperationsInterface,
      useClass:
        process.env.ASYNC_OPERATIONS_TYPE === AsyncOperationType.Queue
          ? AsyncOperationsQueueService
          : AsyncOperationsDatabaseService,
    }
  ]
})
export class AsyncOperationsModule {}
