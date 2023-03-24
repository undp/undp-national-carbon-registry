import { Injectable, Logger } from "@nestjs/common";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncActionType } from "src/shared/enum/async.action.type.enum";
import { AsyncOperationsService } from "./async-operations.service";

@Injectable()
export class AsyncOperationsQueueHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(private asyncOperationsService: AsyncOperationsService) {}

  async asyncHandler(event: any): Promise<any> {
    const asyncPromises = [];
    if (event && event.Records) {
      event.Records.forEach((record: any) => {
        const actionType = record.messageAttributes?.actionType?.stringValue;
        if (actionType) {
          if (actionType === AsyncActionType.Email.toString()) {
            const emailBody = JSON.parse(record.body);
            asyncPromises.push(
              this.asyncOperationsService.sendEmail(emailBody)
            );
          }
        }
      });
    }

    await Promise.all(asyncPromises);
  }
}
