import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { FileHandlerInterface } from "./filehandler.interface";
import { encodeStorageKey } from "./storage-key";

const CONTENT_TYPES = {
  csv: "text/csv",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  txt: "text/plain",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

@Injectable()
export class AzureFileHandlerService implements FileHandlerInterface {
  private container: ContainerClient;

  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {
    const connectionString = this.configService.get<string>(
      "azureBlobStorage.connectionString"
    );
    const containerName = this.configService.get<string>(
      "azureBlobStorage.containerName"
    );

    // Fail here rather than on the first upload: a misconfigured FILE_SERVICE
    // should stop the app starting, not surface as a failed document weeks later.
    if (!connectionString) {
      throw new Error(
        "FILE_SERVICE=AZURE requires AZURE_STORAGE_CONNECTION_STRING to be set."
      );
    }
    if (!containerName) {
      throw new Error(
        "FILE_SERVICE=AZURE requires AZURE_STORAGE_CONTAINER to be set."
      );
    }

    // The SDK only recognises an account connection string when both of these
    // are present; without them it assumes a SAS string and fails deep inside
    // its URL parsing with a bare "Invalid URL". Check here so a truncated or
    // placeholder value names itself.
    if (
      !connectionString.includes("DefaultEndpointsProtocol=") ||
      !connectionString.includes("AccountKey=")
    ) {
      throw new Error(
        "AZURE_STORAGE_CONNECTION_STRING is not a valid account connection string: " +
          "it must contain DefaultEndpointsProtocol= and AccountKey=. Copy the full " +
          "value from the storage account's Access keys blade onto a single line."
      );
    }

    this.container = BlobServiceClient.fromConnectionString(
      connectionString
    ).getContainerClient(containerName);
  }

  public async uploadFile(path: string, content: string): Promise<string> {
    const buffer = Buffer.from(content, "base64");
    const blob = this.container.getBlockBlobClient(path);

    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: this.contentType(path) },
    });

    return path;
  }

  public async getUrl(path: string): Promise<string> {
    return `${this.container.url}/${encodeStorageKey(path)}`;
  }

  private contentType(path: string): string {
    const extension = path.split(".").pop()?.toLowerCase();
    return CONTENT_TYPES[extension] || "application/octet-stream";
  }
}
