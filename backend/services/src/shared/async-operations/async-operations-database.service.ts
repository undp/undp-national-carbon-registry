import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AsyncActionEntity } from "../entities/async.action.entity";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { HelperService } from "../util/helpers.service";
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
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private helperService: HelperService
  ) {}

  public async AddAction(action: AsyncAction): Promise<boolean> {
    if (action.actionType === AsyncActionType.Email) {
      let asyncActionEntity: AsyncActionEntity = {} as AsyncActionEntity;
      asyncActionEntity.actionType = action.actionType;
      asyncActionEntity.actionProps = JSON.stringify(action.actionProps);
      await this.asyncActionRepo.save(asyncActionEntity).catch((err: any) => {
        this.logger.error("error", err);
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "common.addAsyncActionDatabaseFailed",
            ["Email"]
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      });

      this.logger.log("Succefully added to the AsyncAction table", action);
    }

    return true;
  }
}
