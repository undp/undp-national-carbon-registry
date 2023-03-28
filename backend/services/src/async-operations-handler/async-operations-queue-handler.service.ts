import { Injectable, Logger } from "@nestjs/common";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncActionType } from "src/shared/enum/async.action.type.enum";
import { EmailService } from "src/shared/email/email.service";

@Injectable()
export class AsyncOperationsQueueHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(private emailService: EmailService) {}

  async asyncHandler(event: any): Promise<any> {
    const asyncPromises = [];
    if (event && event.Records) {
      event.Records.forEach((record: any) => {
        const actionType = record.messageAttributes?.actionType?.stringValue;
        if (actionType) {
          if (actionType === AsyncActionType.Email.toString()) {
            const emailBody = JSON.parse(record.body);
            asyncPromises.push(this.emailService.sendEmail(emailBody));
          }
        }
      });
    }

    await Promise.all(asyncPromises);
  }
}
