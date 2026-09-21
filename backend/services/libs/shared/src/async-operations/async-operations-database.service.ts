import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AsyncActionEntity } from "../entities/async.action.entity";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { CADTRUST_V2_ACTION_TYPES } from "../enum/cadtrust.async.action.types";
import { HelperService } from "../util/helpers.service";
import { AsyncAction, AsyncOperationsInterface } from "./async-operations.interface";

@Injectable()
export class AsyncOperationsDatabaseService implements AsyncOperationsInterface {
  private emailDisabled: boolean;

  constructor(
    private configService: ConfigService,
    private logger: Logger,
    @InjectRepository(AsyncActionEntity)
    private asyncActionRepo: Repository<AsyncActionEntity>,
    private helperService: HelperService
  ) {
    this.emailDisabled = this.configService.get<boolean>("email.disabled");
  }

  public tx: AsyncAction[] = [];

  public async flushTx(): Promise<boolean> {
    for (var action of this.tx) {
      //execute action
    }
    this.tx = [];
    return true;
  }

  public async AddAction(action: AsyncAction): Promise<boolean> {
    if (
      [
        AsyncActionType.DocumentUpload,
        AsyncActionType.IssueCredit,
        AsyncActionType.RegistryCompanyCreate,
        AsyncActionType.RejectProgramme,
        AsyncActionType.AddMitigation,
        AsyncActionType.ProgrammeAccept,
        AsyncActionType.ProgrammeCreate,
        AsyncActionType.OwnershipUpdate,
        AsyncActionType.CompanyUpdate,
      ].includes(action.actionType) &&
      !this.configService.get("registry.syncEnable")
    ) {
      this.logger.log(`Dropping sync event ${action.actionType} due to sync disabled`);
      return false;
    }

    if (action.actionType === AsyncActionType.Email) {
      if (this.emailDisabled) return false;
    }

    if (
      [
        AsyncActionType.CADTProgrammeCreate,
        AsyncActionType.CADTCertify,
        AsyncActionType.CADTCreditIssue,
        AsyncActionType.CADTTransferCredit,
        AsyncActionType.CADTUpdateProgramme,
      ].includes(action.actionType) &&
      !this.configService.get("cadTrust.enable")
    ) {
      return false;
    }

    // CAD Trust v2 sync is a separate integration from the v1 block above, under
    // its own flag — a node runs v1 and v2 side by side with isolated stores.
    if (
      CADTRUST_V2_ACTION_TYPES.includes(action.actionType) &&
      !this.configService.get("cadTrustV2.enable")
    ) {
      this.logger.log(
        `Dropping CAD Trust v2 sync event ${action.actionType} due to CADT_V2_ENABLE being off`
      );
      return false;
    }

    let asyncActionEntity: AsyncActionEntity = {} as AsyncActionEntity;
    asyncActionEntity.actionType = action.actionType;
    asyncActionEntity.actionProps = JSON.stringify(action.actionProps);
    await this.asyncActionRepo.save(asyncActionEntity).catch((err: any) => {
      this.logger.error("error", err);
      throw new HttpException(
        this.helperService.formatReqMessagesString("common.addAsyncActionDatabaseFailed", [
          "Email",
        ]),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    });

    this.logger.log("Successfully added to the AsyncAction table", action);

    return true;
  }
}
