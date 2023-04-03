import { Injectable, Logger } from "@nestjs/common";
import { AsyncOperationsHandlerInterface } from "./async-operations-handler-interface.service";
import { AsyncActionType } from "src/shared/enum/async.action.type.enum";
import { EmailService } from "src/shared/email/email.service";
import { SQSEvent, SQSRecord } from "aws-lambda";

type Response = { batchItemFailures: { itemIdentifier: string }[] };

@Injectable()
export class AsyncOperationsQueueHandlerService
  implements AsyncOperationsHandlerInterface
{
  constructor(private emailService: EmailService) {}

  async asyncHandler(event: SQSEvent): Promise<Response> {
    const response: Response = { batchItemFailures: [] };
    const promises = event.Records.map(async (record) => {
      try {
        const actionType = record.messageAttributes?.actionType?.stringValue;
        if (actionType) {
          if (actionType === AsyncActionType.Email.toString()) {
            const emailBody = JSON.parse(record.body);
            await this.emailService.sendEmail(emailBody);
          }
        }
      } catch (e) {
        response.batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    });

    await Promise.all(promises);
    return response;
  }
}
