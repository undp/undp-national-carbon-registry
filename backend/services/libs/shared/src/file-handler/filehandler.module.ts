import { Logger, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { FileUrlInterceptor } from "./file-url.interceptor";
import { StorageType } from "../enum/storage.type";
import { AzureFileHandlerService } from "./azure.filehandler.service";
import { FileHandlerInterface } from "./filehandler.interface";
import { LocalFileHandlerService } from "./local.filehandler.service";
import { S3FileHandlerService } from "./s3.filehandler.service";

@Module({
  providers: [
    Logger,
    {
      provide: FileHandlerInterface,
      inject: [Logger, ConfigService],
      useFactory: (logger: Logger, configService: ConfigService) => {
        const storageType = process.env.FILE_SERVICE || StorageType.LOCAL;
        switch (storageType) {
          case StorageType.LOCAL:
            return new LocalFileHandlerService(configService);
          case StorageType.S3:
            return new S3FileHandlerService(logger, configService);
          case StorageType.AZURE:
            return new AzureFileHandlerService(logger, configService);
          default:
            // Previously an unrecognised value silently fell through to LOCAL,
            // which writes to the container's disk - a typo in a deployment env
            // could lose files without a single log line.
            throw new Error(
              `Unsupported FILE_SERVICE "${storageType}". Expected one of: ${Object.values(
                StorageType
              ).join(", ")}.`
            );
        }
      },
    },
    // Resolves stored keys into fetchable URLs on every outbound response.
    // Global because file references surface from many endpoints and from inside
    // untyped jsonb columns.
    { provide: APP_INTERCEPTOR, useClass: FileUrlInterceptor },
  ],
  exports: [FileHandlerInterface],
  imports: [],
})
export class FileHandlerModule {}
