import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { HelperService } from "../util/helpers.service";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

var AWS = require("aws-sdk");
var sqs = new AWS.SQS();

@Injectable()
export class AsyncOperationsQueueService implements AsyncOperationsInterface {
  private emailDisabled: boolean;

  constructor(
    private configService: ConfigService,
    private logger: Logger,
    private helperService: HelperService
  ) {
    this.emailDisabled = this.configService.get<boolean>("email.disabled");
  }

  public async AddAction(action: AsyncAction): Promise<boolean> {
    var params = {};

    if (action.actionType === AsyncActionType.Email) {
      if (this.emailDisabled)
        return false;
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

    try {
      await sqs.sendMessage(params).promise();
      this.logger.log("Succefully added to the queue", action);
    } catch (error) {
      this.logger.error("Failed when adding to queue");
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.addAsyncActionQueueFailed",
          ["Email"]
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return true;
  }
}
