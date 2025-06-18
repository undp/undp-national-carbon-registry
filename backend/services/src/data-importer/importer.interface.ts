import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export abstract class ImporterInterface {
  abstract start(type: string): Promise<any>;
}
