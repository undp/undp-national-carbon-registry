import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EmailService } from "src/shared/email/email.service";
import { AsyncActionEntity } from "src/shared/entities/async.action.entity";
import { Counter } from "src/shared/entities/counter.entity";
import { AsyncActionType } from "src/shared/enum/async.action.type.enum";
import { CounterType } from "src/shared/util/counter.type.enum";
import { Repository } from "typeorm";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";

@Injectable()
export class AsyncOperationsDatabaseHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private emailService: EmailService
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
        if (action.actionType === AsyncActionType.Email.toString()) {
          const emailBody = JSON.parse(action.actionProps);
          asyncPromises.push(this.emailService.sendEmail(emailBody));
        }
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
