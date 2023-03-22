import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { asyncActionType } from "../enum/async.action.type.enum";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

@Injectable()
export class AsyncOperationsDatabseService implements AsyncOperationsInterface {
  constructor(private configService: ConfigService, private logger: Logger) {}

  public async AddAction(action: AsyncAction): Promise<boolean> {
    console.log('d1 added to the database');
    return true;
  }
}
