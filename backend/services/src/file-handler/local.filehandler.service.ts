import { Injectable } from "@nestjs/common";
import { FileHandlerInterface } from "./filehandler.interface";
import { ConfigService } from "@nestjs/config";
const fs = require("fs").promises;
const fsAync = require("fs");

@Injectable()
export class LocalFileHandlerService implements FileHandlerInterface {

  constructor(
    private configService: ConfigService
  ) {}
  
  public async uploadFile(path: string, content: string): Promise<string> {
    const baseUrl = this.configService.get<string>("backendHost");
    // This must run inside a function marked `async`:
    const parts = path.split("/");
    if (parts.length > 1) {
      const folders = './public/' + parts.slice(0, -1).join("/");
      if (!(await fsAync.existsSync(folders))) {
        await fsAync.mkdirSync(folders, { recursive: true });
      }
    }
    await fs.writeFile("./public/" + path, content, 'base64');
    return baseUrl + "/" + path;
  }
  public getUrl(path: string): Promise<string> {
    throw new Error("Method not implemented.");
  }
}
