import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AsyncActionEntity } from "src/shared/entities/async.action.entity";
import { Counter } from "src/shared/entities/counter.entity";
import { asyncActionType } from "src/shared/enum/async.action.type.enum";
import { CounterType } from "src/shared/util/counter.type.enum";
import { Repository } from "typeorm";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsService } from "./async-operations.service";

@Injectable()
export class AsyncOperationsDatabaseHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private asyncOperationsService: AsyncOperationsService
  ) {}

  async asyncHandler(event: any): Promise<any> {
    console.log("database asyncHandler started", JSON.stringify(event));
    setInterval(async () => {
      const asyncPromises = [];
      const seqObj = await this.counterRepo.findOneBy({
        id: CounterType.ASYNC_OPERATIONS,
      });

      let lastSeq = 0;
      if (seqObj) {
        lastSeq = seqObj.counter;
      }

      const notExecutedActions = await this.asyncActionRepo
        .createQueryBuilder("asyncAction")
        .where("asyncAction.actionId > :lastExecuted", {
          lastExecuted: lastSeq,
        })
        .select(['"actionId"', '"actionType"', '"actionProps"'])
        .getRawMany();

      notExecutedActions.forEach((action:any) => {
        if (action.actionType === asyncActionType.Email.toString()) {
          const emailBody = JSON.parse(action.actionProps);
          asyncPromises.push(
            this.asyncOperationsService.sendEmail(emailBody)
          );
        }
        lastSeq = action.actionId;
      })

      await this.counterRepo.save({ id: CounterType.ASYNC_OPERATIONS, counter:  lastSeq})

      await Promise.all(asyncPromises);
    }, 5000);
  }
}
