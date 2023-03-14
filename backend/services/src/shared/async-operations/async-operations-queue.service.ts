import { Injectable } from "@nestjs/common";
import { asyncActionType } from "../enum/async.action.type.enum";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

@Injectable()
export class AsyncOperationsQueueService implements AsyncOperationsInterface {
  public async AddAction(action: AsyncAction): Promise<boolean> {
    var AWS = require("aws-sdk");
    var sqs = new AWS.SQS();
    var params = {};

    if (action.actionType === asyncActionType.Email) {
      params = {
        MessageAttributes: {
          Sender: {
            DataType: "String",
            StringValue: action.emailAddress,
          },
          Subject: {
            DataType: "String",
            StringValue: action.subject,
          },
        },
        MessageBody: action.emailBody,
        QueueUrl:
          "https://sqs.us-east-1.amazonaws.com/302213478610/AsyncQueue.fifo",
        MessageGroupId: action.actionType + "",
        MessageDeduplicationId: action.emailAddress + action.emailType,
      };
    }

    sqs.sendMessage(params, function (err, data) {
      if (err) {
        console.log("d1 Error", err);
      } else {
        console.log("d1 Success", data.MessageId);
      }
    });
    return true;
  }
}
