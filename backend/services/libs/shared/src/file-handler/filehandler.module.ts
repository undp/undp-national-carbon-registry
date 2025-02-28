import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "../../../core/src/app-config/configuration";
import { StorageType } from "../enum/storage.type";
import { FileHandlerInterface } from "./filehandler.interface";
import { LocalFileHandlerService } from "./local.filehandler.service";
import { S3FileHandlerService } from "./s3.filehandler.service";

@Module({
  providers: [
    Logger,
    {
      provide: FileHandlerInterface,
      useClass:
        process.env.FILE_SERVICE === StorageType.S3
          ? S3FileHandlerService
          : LocalFileHandlerService,
    },
  ],
  exports: [FileHandlerInterface],
  imports: [],
})
export class FileHandlerModule {}
