import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "./filehandler.interface";
import { encodeStorageKey } from "./storage-key";
import { ConfigService } from "@nestjs/config";
const fs = require("fs").promises;
const fsAync = require("fs");
import * as path from "path";

@Injectable()
export class LocalFileHandlerService implements FileHandlerInterface {
  constructor(private configService: ConfigService) {}

  public async uploadFile(filePath: string, content: string): Promise<string> {
    // This must run inside a function marked `async`:
    const rootDir = path.resolve("./public/");
    const resolvedPath = path.resolve(rootDir, filePath);
    if (!resolvedPath.startsWith(rootDir)) {
      throw new Error("Invalid file path");
    }
    const folders = path.dirname(resolvedPath);
    if (!(await fsAync.existsSync(folders))) {
      await fsAync.mkdirSync(folders, { recursive: true });
    }
    await fs.writeFile(resolvedPath, content, "base64");
    return filePath;
  }

  public async getUrl(key: string): Promise<string> {
    // Served by the static middleware registered in main.ts.
    const baseUrl = this.configService.get<string>("backendHost");
    return `${baseUrl}/${encodeStorageKey(key)}`;
  }
}
