import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class FileHandlerInterface {
  
  public abstract uploadFile(path: string, content: string): Promise<string>;

  public abstract getUrl(path: string): Promise<string>;

}
