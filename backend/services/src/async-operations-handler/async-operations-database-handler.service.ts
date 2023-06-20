import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AsyncActionEntity } from "src/shared/entities/async.action.entity";
import { Counter } from "src/shared/entities/counter.entity";
import { CounterType } from "src/shared/util/counter.type.enum";
import { Repository } from "typeorm";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncOperationsHandlerService } from "./async-operations-handler.service";

@Injectable()
export class AsyncOperationsDatabaseHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private asyncOperationsHandlerService: AsyncOperationsHandlerService
  ) {}

  async asyncHandler(event: any): Promise<any> {
    this.logger.log("database asyncHandler started", JSON.stringify(event));

    const seqObj = await this.counterRepo.findOneBy({
      id: CounterType.ASYNC_OPERATIONS,
    });
    let lastSeq = 0;
    if (seqObj) {
      lastSeq = seqObj.counter;
    }

    setInterval(async () => {
      const asyncPromises = [];

      const notExecutedActions = await this.asyncActionRepo
        .createQueryBuilder("asyncAction")
        .where("asyncAction.actionId > :lastExecuted", {
          lastExecuted: lastSeq,
        })
        .select(['"actionId"', '"actionType"', '"actionProps"'])
        .getRawMany();

      if(notExecutedActions.length === 0)
        return;
        
      const startedSeq = lastSeq;
      notExecutedActions.forEach((action: any) => {
        console.log('Processing action', action.actionId)
        asyncPromises.push(
          this.asyncOperationsHandlerService.handler(
            action.actionType,
            JSON.parse(action.actionProps)
          )
        );
        lastSeq = action.actionId;
      });

      try {
        await Promise.all(asyncPromises);
        await this.counterRepo.save({
          id: CounterType.ASYNC_OPERATIONS,
          counter: lastSeq,
        });
      } catch (exception) {
        this.logger.log("database asyncHandler failed", exception);
        lastSeq = startedSeq;
      }
    }, 5000);
  }
}
