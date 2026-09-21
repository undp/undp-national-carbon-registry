import { Injectable, Logger } from "@nestjs/common";
import { RegistryClientService } from "@app/shared/registry-client/registry-client.service";
import { EmailService } from "@app/shared/email/email.service";
import { AsyncActionType } from "@app/shared/enum/async.action.type.enum";
import { CadtApiService } from "@app/shared/cadt/cadt.api.service";
import { CadTrustSyncDispatcherService } from "@app/shared/cadtrust-sync/cadtrust-sync.dispatcher.service";

@Injectable()
export class AsyncOperationsHandlerService {
  constructor(
    private emailService: EmailService,
    private registryClient: RegistryClientService,
    private cadtService: CadtApiService,
    private cadTrustSyncDispatcher: CadTrustSyncDispatcherService,
    private logger: Logger
  ) {}

  async handler(actionType: any, dataObject: any) {
    this.logger.log(
      "AsyncOperationsHandlerService started",
      actionType.toString()
    );
    if (actionType) {
      // CAD Trust v2 sync actions are routed through a handler registry rather
      // than hand-written cases below, so adding a newly synced entity needs no
      // change in this file. The dispatcher never throws — a throw here would
      // stall the global async cursor and stop every queued action, email
      // included.
      if (this.cadTrustSyncDispatcher.canHandle(actionType)) {
        return await this.cadTrustSyncDispatcher.handle(actionType, dataObject);
      }

      switch (actionType.toString()) {
        case AsyncActionType.Email.toString():
          return await this.emailService.sendEmail(dataObject);
        case AsyncActionType.RegistryCompanyCreate.toString():
          return await this.registryClient.createCompany(dataObject);
        case AsyncActionType.CompanyUpdate.toString():
          return await this.registryClient.CompanyUpdate(dataObject);
        case AsyncActionType.AuthProgramme.toString():
          return await this.registryClient.authProgramme(dataObject);
        case AsyncActionType.IssueCredit.toString():
          return await this.registryClient.issueCredit(dataObject);
        case AsyncActionType.RejectProgramme.toString():
          return await this.registryClient.rejectProgramme(dataObject);

        case AsyncActionType.ProgrammeCreate.toString():
          return this.registryClient.createProgramme(dataObject);
        case AsyncActionType.ProgrammeAccept.toString():
          return this.registryClient.programmeAccept(dataObject);
        case AsyncActionType.DocumentUpload.toString():
          return this.registryClient.addDocument(dataObject);
        case AsyncActionType.OwnershipUpdate.toString():
          return this.registryClient.updateOwnership(dataObject);
        case AsyncActionType.AddMitigation.toString():
          return this.registryClient.addMitigation(dataObject);
        case AsyncActionType.NationalInvestment.toString():
          return this.registryClient.addNationalInvestment(dataObject);

        case AsyncActionType.CADTProgrammeCreate.toString():
          return this.cadtService.createProgramme(dataObject);
        case AsyncActionType.CADTUpdateProgramme.toString():
          return this.cadtService.updateProgramme(dataObject.programme);
        case AsyncActionType.CADTCreditIssue.toString():
          return this.cadtService.issueCredit(
            dataObject.programme,
            dataObject.amount
          );
        case AsyncActionType.CADTTransferCredit.toString():
          return this.cadtService.transferCredit(
            dataObject.programme,
            dataObject.transfer
          );
      }
    }
  }
}
