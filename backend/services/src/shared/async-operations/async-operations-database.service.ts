import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToClass } from "class-transformer";
import { Repository } from "typeorm";
import { AsyncActionEntity } from "../entities/async.action.entity";
import { asyncActionType } from "../enum/async.action.type.enum";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

@Injectable()
export class AsyncOperationsDatabaseService
  implements AsyncOperationsInterface
{
  constructor(
    private logger: Logger,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>
  ) {}

  public async AddAction(action: AsyncAction): Promise<boolean> {
    if (action.actionType === asyncActionType.Email) {
      let asyncActionEntity: AsyncActionEntity = {} as AsyncActionEntity;
      asyncActionEntity.actionType = action.actionType;
      asyncActionEntity.actionProps = JSON.stringify(action.actionProps);
    
      await this.asyncActionRepo
        .save(asyncActionEntity)
        .catch((err: any) => {
          console.log("error", err);
          return false;
        });
    }
    return true;
  }
}
