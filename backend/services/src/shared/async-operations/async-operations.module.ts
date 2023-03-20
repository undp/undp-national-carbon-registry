import { Logger, Module } from "@nestjs/common";
import { AsyncOperationsInterface } from "./async-operations.interface";
import { AsyncOperationsQueueService } from "./async-operations-queue.service";
import configuration from "../configuration";
import { ConfigModule } from "@nestjs/config";

@Module({
  providers: [
    {
      provide: AsyncOperationsInterface,
      useClass: AsyncOperationsQueueService,
    },
    Logger,
  ],
  exports: [AsyncOperationsInterface],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [`.env.${process.env.NODE_ENV}`, `.env`],
    }),
  ],
})
export class AsyncOperationsModule {}
