import { NestFactory } from "@nestjs/core";
import { Handler, Context } from "aws-lambda";
import { asyncActionType } from "src/shared/enum/async.action.type.enum";
import { getLogger } from "src/shared/server";
import { AsyncOperationsInterface } from "./async-operations-interface.service";
import { AsyncOperationsModule } from "./async-operations.module";

export const handler: Handler = async (event: any, context: Context) => {
  const app = await NestFactory.createApplicationContext(
    AsyncOperationsModule,
    {
      logger: getLogger(AsyncOperationsModule),
    }
  );
  const asyncPromises = [];
  if (event && event.Records) {
    event.Records.forEach((record: any) => {
      const actionType = record.messageAttributes?.actionType?.stringValue;
      if (actionType) {
        if (actionType === asyncActionType.Email.toString()) {
          const emailBody = JSON.parse(record.body);
          asyncPromises.push(
            app.get(AsyncOperationsInterface).sendEmail(emailBody)
          );
        }
      }
    });

    await Promise.all(asyncPromises);
  }
};
