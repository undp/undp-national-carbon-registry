import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "src/shared/configuration";
import { AsyncOperationType } from "src/shared/enum/async.operation.type.enum";
import { AsyncOperationsDatabaseService } from "./async-operations-database.service";
import { AsyncOperationsInterface } from "./async-operations-interface.service";
import { AsyncOperationsQueueService } from "./async-operations-queue.service";


@Module({
    imports:[ConfigModule.forRoot({
        isGlobal: true,
        load: [configuration],
        envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`]
    })],
    providers:[{
        provide: AsyncOperationsInterface,
        useClass: process.env.ASYNC_OPERATIONS_TYPE === AsyncOperationType.Queue ? AsyncOperationsQueueService : AsyncOperationsDatabaseService
    }]
})
export class AsyncOperationsModule {}