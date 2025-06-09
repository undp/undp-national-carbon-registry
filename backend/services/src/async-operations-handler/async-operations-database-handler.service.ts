import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AsyncOperationsHandlerInterface } from './async-operations-handler-interface.service';
import { AsyncOperationsHandlerService } from './async-operations-handler.service';
import { AsyncActionEntity } from '../entities/async.action.entity';
import { CounterType } from '../util/counter.type.enum';
import { Counter } from '../entities/counter.entity';

@Injectable()
export class AsyncOperationsDatabaseHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private logger: Logger,
    @InjectRepository(Counter) private counterRepo: Repository<Counter>,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private asyncOperationsHandlerService: AsyncOperationsHandlerService,
  ) {}

  async asyncHandler(event: any): Promise<any> {
    this.logger.log('database asyncHandler started', JSON.stringify(event));
  
    const seqObj = await this.counterRepo.findOneBy({
      id: CounterType.ASYNC_OPERATIONS,
    });
    let lastSeq = 0;
    if (seqObj) {
      lastSeq = seqObj.counter;
    }
    let retryCount = 0;
    const retryLimit = 50;
    const baseDelay = 5000; // Initial delay for exponential backoff
  
    const doActions = async () => {
      console.log('lastSeq', lastSeq, 'retryCount', retryCount);
      const notExecutedActions = await this.asyncActionRepo
        .createQueryBuilder('asyncAction')
        .where('asyncAction.actionId > :lastExecuted', { lastExecuted: lastSeq })
        .orderBy('"actionId"', 'ASC')
        .select(['"actionId"', '"actionType"', '"actionProps"'])
        .getRawMany();
  
      if (notExecutedActions.length !== 0) {
        try {
            for (const action of notExecutedActions) {
            console.log('Action start', action.actionType, action.actionId);
            await this.asyncOperationsHandlerService.handler(
              action.actionType,
              JSON.parse(action.actionProps),
            );
            lastSeq = action.actionId;
            await this.counterRepo.save({
              id: CounterType.ASYNC_OPERATIONS,
              counter: lastSeq,
            });
            retryCount = 0; // Reset retry count after a successful execution
          }
        } catch (exception) {
          this.logger.log('database asyncHandler failed', exception);
          if (retryCount >= retryLimit) {
            this.logger.log('database asyncHandler terminated');
            return;
          }
          const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
          return doActions(); // Retry the operation
        }
      }
      // Schedule the next execution after a fixed delay regardless of success or failure
      setTimeout(doActions, baseDelay);
    };
  
    await doActions();
  }
}
