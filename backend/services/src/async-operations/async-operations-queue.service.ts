import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { HelperService } from "../util/helpers.service";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "./async-operations.interface";

import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"

@Injectable()
export class AsyncOperationsQueueService implements AsyncOperationsInterface {
  private emailDisabled: boolean;
  private sqs = new SQSClient({});

  constructor(
    private configService: ConfigService,
    private logger: Logger,
    private helperService: HelperService
  ) {
    this.emailDisabled = this.configService.get<boolean>("email.disabled");
  }
  public tx:AsyncAction[]=[]

  public async flushTx(): Promise<boolean>{
    for (var action of this.tx){
      //execute action
    }
    this.tx=[]
    return true
  }

  public async AddAction(action: AsyncAction): Promise<boolean> {
    // var params = {};

    if ([AsyncActionType.DocumentUpload, AsyncActionType.IssueCredit, AsyncActionType.RegistryCompanyCreate, AsyncActionType.RejectProgramme,AsyncActionType.AddMitigation,AsyncActionType.ProgrammeAccept,AsyncActionType.ProgrammeCreate,AsyncActionType.OwnershipUpdate].includes(action.actionType) && !this.configService.get("registry.syncEnable")) {
      this.logger.log(`Dropping sync event ${action.actionType} due to sync disabled`)
      return false;
    }

    if (action.actionType === AsyncActionType.Email) {
      if (this.emailDisabled) {
        return false;
      }
    }

    if ([AsyncActionType.CADTProgrammeCreate, AsyncActionType.CADTCertify, AsyncActionType.CADTCreditIssue, AsyncActionType.CADTTransferCredit, AsyncActionType.CADTUpdateProgramme].includes(action.actionType) && !this.configService.get('cadTrust.enable')) {
      return false;
    }

    // params = {
    //   MessageAttributes: {
    //     actionType: {
    //       DataType: "Number",
    //       StringValue: action.actionType.toString(),
    //     },
    //   },
    //   MessageBody: JSON.stringify(action.actionProps),
    //   MessageGroupId: action.actionType.toString() + new Date().getTime(),
    //   QueueUrl: this.configService.get("asyncQueueName"),
    // };

    const params = new SendMessageCommand({
      QueueUrl: this.configService.get("asyncQueueName"),
      MessageAttributes: {
        actionType: {
          DataType: "Number",
          StringValue: action.actionType.toString(),
        },
      },
      MessageBody: JSON.stringify(action.actionProps),
      MessageGroupId: this.configService.get("systemType")
    });

    try {
      await this.sqs.send(params);
      this.logger.log("Successfully added to the queue", action.actionType);
    } catch (error) {
      this.logger.error("Failed when adding to queue", action.actionType);
      this.logger.error("Error",error)
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
