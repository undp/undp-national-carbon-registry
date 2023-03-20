import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { asyncActionType } from "../enum/async.action.type.enum";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

var AWS = require("aws-sdk");
var sqs = new AWS.SQS();

@Injectable()
export class AsyncOperationsQueueService implements AsyncOperationsInterface {
  constructor(private configService: ConfigService, private logger: Logger) {}

  public async AddAction(action: AsyncAction): Promise<boolean> {
    var params = {};

    if (action.actionType === asyncActionType.Email) {
      params = {
        MessageAttributes: {
          actionType: {
            DataType: "Number",
            StringValue: action.actionType.toString(),
          },
        },
        MessageBody: JSON.stringify(action.actionProps),
        MessageGroupId: action.actionProps.emailType,
        QueueUrl: this.configService.get("asyncQueueName"),
      };
    }

    sqs.sendMessage(params, function (err, data) {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Succefully added to the async queue", action);
      }
    });
    return true;
  }
}
