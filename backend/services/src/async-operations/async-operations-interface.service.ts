import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class AsyncOperationsInterface {
  abstract sendEmail(event): Promise<any>;
}
