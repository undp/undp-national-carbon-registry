import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BasicResponseDto } from "../dto/basic.response.dto";
import { ConfigurationSettings } from "../entities/configuration.settings";
import { ConfigurationSettingsType } from "../enum/configuration.settings.type.enum";
import { HelperService } from "./helpers.service";
import { SLCFSignsDto } from "../dto/slcfSigns.dto";
import { FileHandlerInterface } from "../file-handler/filehandler.interface";
import { SLCFCertificateType } from "../enum/certificate.type.enum";
import { ProjectRegistrationCertificateGenerator } from "./document-generators/projectRegistrationCertificate.gen";
import { CreditType } from "../enum/creditType.enum";
import { DateUtilService } from "./dateUtil.service";
import {
  ProjectCategory,
  SlProjectCategoryMap,
} from "../enum/projectCategory.enum";
import { CreditIssueCertificateGenerator } from "./document-generators/creditIssueCertificate.gen";
import { VoluntarilyCancellationCertificateGenerator } from "./document-generators/voluntarilyCancellationCertificate.gen";
import { User } from "../entities/user.entity";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { CarbonNeutralCertificateGenerator } from "./document-generators/carbonNeutralCertificate.gen";

@Injectable()
export class ConfigurationSettingsService {
  constructor(
    @InjectRepository(ConfigurationSettings)
    private configSettingsRepo: Repository<ConfigurationSettings>,
    private logger: Logger,
    private helperService: HelperService,
    private fileHandler: FileHandlerInterface,
    private projectRegistrationCertificateGenerator: ProjectRegistrationCertificateGenerator,
    private creditIssueCertificateGenerator: CreditIssueCertificateGenerator,
    private carbonNeutralCertificateGenerator: CarbonNeutralCertificateGenerator,
    private voluntarilyCancellationCertificateGenerator: VoluntarilyCancellationCertificateGenerator,
    private dateUtilService: DateUtilService
  ) {}

  async getSetting(type: number, defaultValue?: string) {
    return await this.configSettingsRepo
      .findOneBy({
        id: type,
      })
      .then(async (value) => {
        if (value) return value.settingValue;
        else {
          return defaultValue;
        }
      });
  }

  async updateSetting(type: ConfigurationSettingsType, settingValue: any) {
    const result = await this.configSettingsRepo
      .upsert([{ id: type, settingValue: settingValue }], ["id"])
      .catch((err: any) => {
        this.logger.error(err);
        return err;
      });

    if (result.identifiers) {
      return new BasicResponseDto(
        HttpStatus.OK,
        this.helperService.formatReqMessagesString(
          "common.settingsSavedMsg",
          []
        )
      );
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.settingsSaveFailedMsg",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateSLCFSigns(signsDto: SLCFSignsDto) {
    const results = {};
    if (signsDto.ceoSign && this.helperService.isBase64(signsDto.ceoSign)) {
      const response: any = await this.fileHandler.uploadFile(
        `signatures/ceo.jpg`,
        signsDto.ceoSign
      );
      if (response) {
        const update = await this.updateSetting(
          ConfigurationSettingsType.ceoSign,
          response
        );
        if (update) {
          results["ceoSign"] = response;
        }
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "common.settingsSaveFailedMsg",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    if (
      signsDto.chairmanSign &&
      this.helperService.isBase64(signsDto.chairmanSign)
    ) {
      const response: any = await this.fileHandler.uploadFile(
        `signatures/chairman.jpg`,
        signsDto.chairmanSign
      );
      if (response) {
        const update = await this.updateSetting(
          ConfigurationSettingsType.chairmanSign,
          response
        );

        if (update) {
          results["chairmanSign"] = response;
        }
      } else {
        throw new HttpException(
          this.helperService.formatReqMessagesString(
            "common.settingsSaveFailedMsg",
            []
          ),
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    if (results) {
      return results;
    } else {
      throw new HttpException(
        this.helperService.formatReqMessagesString(
          "common.settingsSaveFailedMsg",
          []
        ),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async generatePreviewCertificates(type: SLCFCertificateType, user: User) {
    if (
      !(
        user.role === Role.Root ||
        (user.companyRole === CompanyRole.CLIMATE_FUND &&
          user.role === Role.Admin)
      )
    ) {
      throw new HttpException(
        this.helperService.formatReqMessagesString("user.userUnAuth", []),
        HttpStatus.FORBIDDEN
      );
    }
    switch (type) {
      case SLCFCertificateType.REGISTRATION:
        const regData = {
          projectName: "Solar Project Preview",
          companyName: "ABC Private Limited",
          creditType: CreditType.TRACK_1,
          certificateNo: "SLCCS/REG/0000/0000",
          regDate: this.dateUtilService.formatCustomDate(),
          issueDate: this.dateUtilService.formatCustomDate(),
          sector: SlProjectCategoryMap[ProjectCategory.RENEWABLE_ENERGY],
          estimatedCredits: "0000",
        };
        const regCertURL =
          await this.projectRegistrationCertificateGenerator.generateProjectRegistrationCertificate(
            regData,
            "0000",
            true
          );
        return { certURL: regCertURL };
        break;

      case SLCFCertificateType.CREDIT_ISSUANCE:
        const issueData = {
          projectName: "Solar Project Preview",
          companyName: "ABC Private Limited",
          creditType: CreditType.TRACK_1,
          certificateNo: "SLCCS/REG/0000/0000/CI/00",
          issueDate: this.dateUtilService.formatCustomDate(),
          issuedCredits: 0,
          monitoringStartDate: this.dateUtilService.formatCustomDate(),
          monitoringEndDate: this.dateUtilService.formatCustomDate(),
          startCreditSerialNo: "SLCCS/REG/0000/000",
          endCreditSerialNo: "SLCCS/REG/0000/000",
        };
        const issueCertURL =
          await this.creditIssueCertificateGenerator.generateCreditIssueCertificate(
            issueData,
            true
          );
        return { certURL: issueCertURL };
        break;

      case SLCFCertificateType.CREDIT_RETIREMENT:
        const retirementData = {
          companyName: "ABC Private Limited",
          noOfSCERs: 0,
          yearVerified: new Date().getFullYear(),
          transactionReference: "SLCCS/0000/0000",
          dateOfTransaction: this.dateUtilService.formatCustomDate(),
          startSerialNumber: "SLCCS/REG/0000/00",
          endSerialNumber: "SLCCS/REG/0000/00",
          totalSCERs: 0,
          documentDate: this.dateUtilService.formatCustomDate(),
          projectName: "Solar Project Preview",
          projectProponent: "XYZ Private Limited",
        };
        const certURL =
          await this.voluntarilyCancellationCertificateGenerator.generateVoluntaryCancellationCertificate(
            retirementData,
            true
          );
        return { certURL };
        break;

      case SLCFCertificateType.CARBON_NEUTRAL:
        const neutralData = {
          projectName: "Solar Project Preview",
          companyName: "ABC Private Limited",
          scope: "Project Level",
          certificateNo: "SLCCS/REG/0000/0000/CI/00",
          issueDate: this.dateUtilService.formatCustomDate(),
          creditAmount: 0,
          orgBoundary: "Organization Boundary",
          assessmentYear: new Date().getFullYear(),
          assessmentPeriod: `${this.dateUtilService.formatCustomDate()} - ${this.dateUtilService.formatCustomDate()}`,
        };
        const carbonNeutralCertUrl =
          await this.carbonNeutralCertificateGenerator.generateCarbonNeutralCertificate(
            neutralData,
            true
          );
        return { certURL: carbonNeutralCertUrl };
        break;
      default:
        break;
    }
  }
}
