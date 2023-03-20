import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "../async-operations/async-operations.interface";
import { CompanyService } from "../company/company.service";
import { Company } from "../entities/company.entity";
import { Programme } from "../entities/programme.entity";
import { asyncActionType } from "../enum/async.action.type.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { UserService } from "../user/user.service";
import { HelperService } from "../util/helpers.service";

@Injectable()
export class EmailHelperService {
  isEmailDisabled: boolean;

  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private configService: ConfigService,
    @Inject(forwardRef(() => CompanyService))
    private companyService: CompanyService,
    private programmeLedger: ProgrammeLedgerService,
    private asyncOperationsInterface: AsyncOperationsInterface,
    private helperService: HelperService
  ) {
    this.isEmailDisabled = this.configService.get<boolean>("email.disabled");
  }

  public async sendEmailToProgrammeOwnerAdmins(
    programmeId: string,
    template: any,
    templateData: {},
    companyId?: number,
    governmentId?: number
  ) {
    if (this.isEmailDisabled) return;
    const programme = await this.programmeLedger.getProgrammeById(programmeId);
    const hostAddress = this.configService.get("host");
    let companyDetails: Company;

    switch (template.id) {
      case "PROGRAMME_REJECTION":
        templateData = {
          ...templateData,
          programmeName: programme.title,
          date: new Date(programme.txTime),
          pageLink: hostAddress + `/programmeManagement/view?id=${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          pageLink: hostAddress + `/programmeManagement/view?id=${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION_REVOKE_BY_CERT":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          pageLink: hostAddress + `/programmeManagement/view?id=${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        const government = await this.companyService.findByCompanyId(
          governmentId
        );
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          government: government.name,
          pageLink: hostAddress + `/programmeManagement/view?id=${programmeId}`,
        };
        break;

      default:
        break;
    }

    programme.companyId.forEach(async (companyId: number) => {
      this.sendEmailToOrganisationAdmins(companyId, template, templateData);
    });
  }

  public async sendEmailToOrganisationAdmins(
    companyId: number,
    template,
    templateData: any,
    receiverCompanyId?: number,
    programmeId?: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const users = await this.userService.getOrganisationAdminAndManagerUsers(
      companyId
    );
    let companyDetails: Company;
    let programme: Programme;
    const hostAddress = this.configService.get("host");

    switch (template.id) {
      case "CREDIT_TRANSFER_GOV":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
        };
        break;

      case "CREDIT_TRANSFER_CANCELLATION":
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_TRANSFER_ACCEPTED":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_TRANSFER_REJECTED":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_TRANSFER_GOV_CANCELLATION":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_TRANSFER_GOV_ACCEPTED_TO_RECEIVER":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          government: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          credits: programme.creditBalance,
          pageLink: hostAddress + `/programmeManagement/view?id=${programmeId}`,
        };
        break;

      case "CREDIT_RETIREMENT_RECOGNITION":
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_RETIREMENT_NOT_RECOGNITION":
        programme = await this.programmeLedger.getProgrammeById(programmeId);
        templateData = {
          ...templateData,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      default:
        break;
    }

    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
        countryName: systemCountryName,
      };
      const action: AsyncAction = {
        actionType: asyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            false
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };
      this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToGovernmentAdmins(
    template,
    templateData: any,
    programmeId?: string,
    companyId?: number
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");
    const users = await this.userService.getGovAdminAndManagerUsers();
    let programme: Programme;
    let companyDetails: Company;
    if (programmeId)
      programme = await this.programmeLedger.getProgrammeById(programmeId);

    switch (template.id) {
      case "CREDIT_TRANSFER_GOV_ACCEPTED_TO_INITIATOR":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_TRANSFER_GOV_REJECTED":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      case "CREDIT_RETIREMENT_CANCEL":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "/creditTransfers/viewAll",
        };
        break;

      default:
        break;
    }

    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
        countryName: systemCountryName,
      };
      const action: AsyncAction = {
        actionType: asyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            false
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };
      this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmail(
    sender: string,
    template,
    templateData: any,
    companyId: number
  ) {
    if (this.isEmailDisabled) return;
    const companyDetails = await this.companyService.findByCompanyId(companyId);
    const systemCountryName = this.configService.get("systemCountryName");
    templateData = {
      ...templateData,
      countryName: systemCountryName,
      government: companyDetails.name,
    };
    const action: AsyncAction = {
      actionType: asyncActionType.Email,
      actionProps: {
        emailType: template.id,
        sender: sender,
        subject: this.helperService.getEmailTemplateMessage(
          template["subject"],
          templateData,
          false
        ),
        emailBody: this.helperService.getEmailTemplateMessage(
          template["html"],
          templateData,
          false
        ),
      },
    };
    this.asyncOperationsInterface.AddAction(action);
  }
}
