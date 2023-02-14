import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CompanyService } from "../company/company.service";
import { EmailService } from "../email/email.service";
import { Company } from "../entities/company.entity";
import { Programme } from "../entities/programme.entity";
import { ProgrammeLedgerService } from "../programme-ledger/programme-ledger.service";
import { UserService } from "../user/user.service";

@Injectable()
export class EmailHelperService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private emailService: EmailService,
    private companyService: CompanyService,
    private programmeLedger: ProgrammeLedgerService
  ) {}

  public async sendEmailToProgrammeOwnerAdmins(
    programmeId: string,
    template: any,
    templateData: {},
    companyId?: number
  ) {
    const programme = await this.programmeLedger.getProgrammeById(programmeId);
    const hostAddress = this.configService.get("host");
    let companyDetails: Company;
    switch (template.id) {
      case "PROGRAMME_REJECTION":
        templateData = {
          ...templateData,
          programmeName: programme.title,
          date: new Date(programme.txTime),
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
        break;

      case "CREDIT_TRANSFER_CANCELLATION":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + "creditTransfers/viewAll",
        };

      case "CREDIT_TRANSFER_ACCEPTED":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
      case "CREDIT_TRANSFER_REJECTED":
        companyDetails = await this.companyService.findByCompanyId(companyId);
        templateData = {
          ...templateData,
          organisationName: companyDetails.name,
          serialNumber: programme.serialNo,
          programmeName: programme.title,
          pageLink: hostAddress + `/programmeManagement/view/${programmeId}`,
        };
    }

    programme.companyId.forEach(async (companyId: number) => {
      this.sendEmailToOrganisationAdmins(companyId, template, templateData);
    });
  }

  public async sendEmailToOrganisationAdmins(
    companyId: number,
    template,
    templateData: any
  ) {
    const systemCountryName = this.configService.get("systemCountryName");
    const users = await this.userService.getOrganisationAdminAndManagerUsers(
      companyId
    );
    users.forEach((user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
        countryName: systemCountryName,
      };
      this.emailService.sendEmail(user.user_email, template, templateData);
    });
  }

  public async sendEmailToGovernmentAdmins(template, templateData: any) {
    const systemCountryName = this.configService.get("systemCountryName");
    const users = await this.userService.getGovAdminAndManagerUsers();
    users.forEach((user: any) => {
      templateData = {
        ...templateData,
        name: user.user_name,
        countryName: systemCountryName,
      };
      this.emailService.sendEmail(user.user_email, template, templateData);
    });
  }
}
