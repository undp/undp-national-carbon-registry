import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AsyncActionEntity } from "carbon-services-lib";
import { Counter } from "carbon-services-lib";
import { configuration } from "carbon-services-lib";
import { AsyncOperationType } from "carbon-services-lib";
import { TypeOrmConfigService } from "carbon-services-lib";
import { AsyncOperationsDatabaseHandlerService } from "./async-operations-database-handler.service";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsQueueHandlerService } from "./async-operations-queue-handler.service";
import { RegistryClientModule ,EmailModule} from "carbon-services-lib";
import { AsyncOperationsHandlerService } from "./async-operations-handler.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration.default],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    TypeOrmModule.forFeature([AsyncActionEntity, Counter]),
    RegistryClientModule,
    EmailModule,
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
export class AsyncOperationsModule {}
