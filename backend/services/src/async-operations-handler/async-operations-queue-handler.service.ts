import { Injectable, Logger } from "@nestjs/common";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { SQSEvent } from "aws-lambda";
import { AsyncOperationsHandlerService } from "./async-operations-handler.service";
import { AsyncActionType } from "../enum/async.action.type.enum";

type Response = { batchItemFailures: { itemIdentifier: string }[] };

@Injectable()
export class AsyncOperationsQueueHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(
    private asyncOperationsHandlerService: AsyncOperationsHandlerService,
    private logger: Logger
  ) {}

  async asyncHandler(event: SQSEvent): Promise<Response> {
    this.logger.log("Queue asyncHandler started");
    const response: Response = { batchItemFailures: [] };

    for (const record of event.Records) {
      const actionType = record.messageAttributes?.actionType?.stringValue;
      try {
        
        await this.asyncOperationsHandlerService.handler(
          actionType,
          JSON.parse(record.body)
        );
      } catch (exception) {
        this.logger.log("queue asyncHandler failed", exception);
        if (actionType?.toString() === AsyncActionType.Email.toString()) {
          response.batchItemFailures.push({ itemIdentifier: record.messageId });
        } else {
          throw exception;
        }
      }
    }
    return response;
  }
}
