import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AsyncAction,
  AsyncOperationsInterface,
} from "../async-operations/async-operations.interface";
import { CompanyService } from "../company/company.service";
import { Company } from "../entities/company.entity";
import { Programme } from "../entities/programme.entity";
import { AsyncActionType } from "../enum/async.action.type.enum";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { UserService } from "../user/user.service";
import { HelperService } from "../util/helpers.service";
import { EmailTemplates } from "./email.template";
import { ProgrammeSl } from "../entities/programmeSl.entity";
import { EmailTemplateDto } from "../dto/email.template.dto";
import { ProjectEntity } from "../entities/projects.entity";

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
    this.isEmailDisabled = this.configService.get<boolean>(
      "email.disableLowPriorityEmails"
    );
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
        let authDate = new Date(programme.txTime);
        let date = authDate.getDate().toString().padStart(2, "0");
        let month = authDate.toLocaleString("default", { month: "long" });
        let year = authDate.getFullYear();
        let formattedDate = `${date} ${month} ${year}`;

        templateData = {
          ...templateData,
          programmeName: programme.title,
          date: formattedDate,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        if (!programme.creditBalance || !programme.serialNo) {
          template = EmailTemplates.NON_AUTHORIZED_PROGRAMME_CERTIFICATION;
        }
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION_REVOKE_BY_CERT":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        if (!programme.creditBalance || !programme.serialNo) {
          template =
            EmailTemplates.NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_CERT;
        }
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
        break;

      case "PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        const government = await this.companyService.findByCompanyId(
          governmentId
        );
        if (!programme.creditBalance || !programme.serialNo) {
          template =
            EmailTemplates.NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_PROGRAMME;
        }
        templateData = {
          ...templateData,
          programmeName: programme.title,
          credits: programme.creditBalance,
          serialNumber: programme.serialNo,
          organisationName: companyDetails.name,
          government: government.name,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
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
    programmeId?: string,
    initiatorCompanyId?: number,
    attachments?: any
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const users = await this.userService.getOrganisationAdminAndManagerUsers(
      companyId
    );
    let companyDetails: Company;
    let inititatorCompanyDetails: Company;
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
        if (!programme.creditBalance || !programme.serialNo) {
          template =
            EmailTemplates.NON_AUTHORIZED_PROGRAMME_CERTIFICATION_REVOKE_BY_GOVT_TO_CERT;
        }
        templateData = {
          ...templateData,
          government: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          credits: programme.creditBalance,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
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

      case "CREDIT_TRANSFER_CANCELLATION_SYS_TO_SENDER":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        inititatorCompanyDetails = await this.companyService.findByCompanyId(
          initiatorCompanyId
        );
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          initiatorOrganisationName: inititatorCompanyDetails.name,
        };
        break;

      case "CREDIT_TRANSFER_CANCELLATION_SYS_TO_INITIATOR":
        companyDetails = await this.companyService.findByCompanyId(
          receiverCompanyId
        );
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
        };
        break;

      case "CREDIT_TRANSFER_SL_REQUEST_APPROVED":
      case "CREDIT_RETIRE_SL_REQUEST_APPROVED":
      case "CREDIT_TRANSFER_SL_REQUEST_REJECTED":
      case "CREDIT_RETIRE_SL_REQUEST_REJECTED":
      case "CREDIT_TRANSFER_SL_REQUEST_CANCELED":
      case "CREDIT_RETIRE_SL_REQUEST_CANCELED":
      case "CREDIT_RECEIVED_AND_RETIRED_SL":
        templateData = {
          ...templateData,
          pageLink: hostAddress + "/retirementManagement/viewAll",
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
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      if (attachments) {
        action.actionProps["attachments"] = attachments;
      }

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToGovernmentAdmins(
    template,
    templateData: any,
    programmeId?: string,
    companyId?: number,
    attachments?: any,
    ccSenders?: string[]
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
      case "ORGANISATION_REGISTRATION":
        templateData = {
          ...templateData,
        };
        break;

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

      case "CREDIT_RETIREMENT_CANCEL_SYS_TO_GOV":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
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
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          cc: ccSenders,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      if (attachments) {
        action.actionProps["attachments"] = attachments;
      }
      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToDNAAdmins(
    template: EmailTemplateDto,
    templateData: any,
    refId: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");

    let project: ProjectEntity;
    let company: Company;

    if (template.id !== "ORGANISATION_REGISTRATION") {
      project = await this.programmeLedger.getProjectById(refId);
      company = await this.companyService.findByCompanyId(project.companyId);

      if (!project) {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "common.programmeNotFound",
            []
          ),
          HttpStatus.BAD_REQUEST
        );
      }
    }

    switch (template.id) {
      case "INF_CREATE":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_APPROVAL_IC_TO_DNA":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_SUBMITTED_TO_DNA":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganizationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_CREATE_TO_DNA":
        templateData = {
          organizationNameIC: templateData.icOrganisationName,
          organizationNamePD: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
    }

    const users = await this.userService.getDNAAdminUsers();
    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToICAdmins(
    template: EmailTemplateDto,
    templateData: any,
    refId: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");

    let project = await this.programmeLedger.getProjectById(refId);

    if (!project) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.programmeNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const company = await this.companyService.findByCompanyId(
      project.companyId
    );

    switch (template.id) {
      case "INF_ASSIGN":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_CREATE":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_DNA_REJECT_TO_IC":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_APPROVAL_DNA_TO_IC":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_APPROVED_TO_IC":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_REJECTED_TO_IC":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "MONITORING_UPLOADED":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_REJECTED_TO_IC":
        templateData = {
          organisationNameIC: templateData.icOrganisationName,
          remarks: templateData.remarks,
          organisationNamePD: company.name,
          countryName: systemCountryName,
          projectName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_APPROVED_TO_IC":
        templateData = {
          organisationNameIC: templateData.icOrganisationName,
          organisationNamePD: company.name,
          countryName: systemCountryName,
          projectName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
    }

    const users: any[] = [];
    for (const certifierCompanyId of project.independentCertifiers) {
      users.push(
        ...(await this.userService.getOrganisationAdminUsers(
          certifierCompanyId
        ))
      );
    }
    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToPDAdmins(
    template: EmailTemplateDto,
    templateData: any,
    refId: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");

    let project = await this.programmeLedger.getProjectById(refId);

    if (!project) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.programmeNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    const company = await this.companyService.findByCompanyId(
      project.companyId
    );

    switch (template.id) {
      case "INF_APPROVE":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "INF_REJECT":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_APPROVAL_IC_TO_PD":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_IC_REJECT":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_DNA_REJECT_TO_PD":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "PDD_APPROVAL_DNA_TO_PD":
        templateData = {
          organisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_SUBMITTED":
        templateData = {
          pdOrganizationName: company.name,
          organisationName: templateData.organisationName,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_APPROVED_TO_PD":
        templateData = {
          pdOrganizationName: company.name,
          icOrganizationName: templateData.icOrganizationName,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VALIDATION_REJECTED_TO_PD":
        templateData = {
          pdOrganizationName: company.name,
          icOrganizationName: templateData.icOrganizationName,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_CREATE_TO_PD":
        templateData = {
          organizationNamePD: company.name,
          organizationNameIC: templateData.icOrganizationName,
          countryName: systemCountryName,
          projectName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "MONITORING_REJECT":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          remarks: templateData.remarks,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "MONITORING_APPROVE":
        templateData = {
          icOrganisationName: templateData.icOrganisationName,
          pdOrganisationName: company.name,
          countryName: systemCountryName,
          programmeName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_REJECTED_TO_PD":
        templateData = {
          organisationNameIC: templateData.icOrganisationName,
          remarks: templateData.remarks,
          organisationNamePD: company.name,
          countryName: systemCountryName,
          projectName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
      case "VERIFICATION_APPROVED_TO_PD":
        templateData = {
          organisationNameIC: templateData.icOrganisationName,
          organisationNamePD: company.name,
          countryName: systemCountryName,
          projectName: project.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${refId}`,
        };
        break;
    }

    const users: any[] = await this.userService.getOrganisationAdminUsers(
      project.companyId
    );
    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        user: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToSLCFAdmins(
    template,
    templateData: any,
    programmeId: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");
    const users = await this.userService.getSLCFAdminAndManagerUsers();
    let programme: ProgrammeSl;
    let companyDetails: Company;
    const remark = templateData?.remark;

    programme = await this.programmeLedger.getProgrammeSlById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.programmeNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    companyDetails = await this.companyService.findByCompanyId(
      programme.companyId
    );

    switch (template.id) {
      case "PROGRAMME_SL_CREATE":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "PROJECT_PROPOSAL_ACCEPTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "PROJECT_PROPOSAL_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "CMA_CREATE":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VALIDATION_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VALIDATION_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "MONITORING_CREATE":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VERIFICATION_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VERIFICATION_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "CREDIT_TRANSFER_SL_REQUEST":
      case "CREDIT_RETIRE_SL_REQUEST":
      case "CREDIT_TRANSFER_SL_REQUEST_CANCELED":
      case "CREDIT_RETIRE_SL_REQUEST_CANCELED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          credits: templateData.credits,
          serialNumber: programme.serialNo,
          remark: templateData.remark,
          pageLink: hostAddress + `/retirementManagement/viewAll`,
        };
        break;

      case "CARBON_NEUTRAL_SL_REQUESTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          // pageLink: hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;

      default:
        break;
    }

    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToProjectParticipant(
    template,
    templateData: any,
    programmeId: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");
    let programme: ProgrammeSl;
    let companyDetails: Company;
    const remark = templateData?.remark;

    programme = await this.programmeLedger.getProgrammeSlById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.programmeNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    companyDetails = await this.companyService.findByCompanyId(
      programme.companyId
    );

    const users = await this.userService.getOrganisationAdminAndManagerUsers(
      programme.companyId
    );

    switch (template.id) {
      case "PROGRAMME_SL_APPROVED":
        templateData = {
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "PROGRAMME_SL_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;

      case "PROJECT_PROPOSAL_SUBMITTED":
        templateData = {
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "CMA_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "CMA_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VALIDATION_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "MONITORING_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "MONITORING_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VERIFICATION_APPROVED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      case "VERIFICATION_REJECTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          remark,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;
      default:
        break;
    }

    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
    });
  }

  public async sendEmailToExCom(
    template,
    templateData: any,
    programmeId?: string
  ) {
    if (this.isEmailDisabled) return;
    const systemCountryName = this.configService.get("systemCountryName");
    const hostAddress = this.configService.get("host");
    const users = await this.userService.getExComAdminAndManagerUsers();
    let programme: ProgrammeSl;
    let companyDetails: Company;

    programme = await this.programmeLedger.getProgrammeSlById(programmeId);

    if (!programme) {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.programmeNotFound",
          []
        ),
        HttpStatus.BAD_REQUEST
      );
    }

    companyDetails = await this.companyService.findByCompanyId(
      programme.companyId
    );

    switch (template.id) {
      case "VALIDATION_SUBMITTED":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;

      case "VERIFICATION_CREATE":
        templateData = {
          organisationName: companyDetails.name,
          countryName: systemCountryName,
          programmeName: programme.title,
          programmePageLink:
            hostAddress + `/programmeManagementSLCF/view/${programmeId}`,
        };
        break;

      default:
        break;
    }

    users.forEach(async (user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
      };
      const action: AsyncAction = {
        actionType: AsyncActionType.Email,
        actionProps: {
          emailType: template.id,
          sender: user.user_email,
          subject: this.helperService.getEmailTemplateMessage(
            template["subject"],
            templateData,
            true
          ),
          emailBody: this.helperService.getEmailTemplateMessage(
            template["html"],
            templateData,
            false
          ),
        },
      };

      await this.asyncOperationsInterface.AddAction(action);
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
      actionType: AsyncActionType.Email,
      actionProps: {
        emailType: template.id,
        sender: sender,
        subject: this.helperService.getEmailTemplateMessage(
          template["subject"],
          templateData,
          true
        ),
        emailBody: this.helperService.getEmailTemplateMessage(
          template["html"],
          templateData,
          false
        ),
      },
    };
    await this.asyncOperationsInterface.AddAction(action);
  }
}
