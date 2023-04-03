import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosResponse } from "axios";
import { ProgrammeService } from "../../shared/programme/programme.service";
import { CompanyService } from "../../shared/company/company.service";
import { ImporterInterface } from "../importer.interface";
import { ProgrammeStage } from "../../shared/enum/programme-status.enum";
import { CompanyRole } from "../../shared/enum/company.role.enum";
import { SectoralScope } from "serial-number-gen";
import { Sector } from "../../shared/enum/sector.enum";
import { TypeOfMitigation } from "../../shared/enum/typeofmitigation.enum";

@Injectable()
export class ITMOSystemImporter implements ImporterInterface{

  private endpoint;
  private authToken;
  private apiKey;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private companyService: CompanyService,
    private programmeService: ProgrammeService
  ) {
    this.endpoint = this.configService.get('ITMOSystem.endpoint');
    this.apiKey = this.configService.get('ITMOSystem.apiKey');
  }

  private async login(): Promise<string> {
    const resp = await axios.post(this.endpoint + 'auth/login', {
      'email': this.configService.get('ITMOSystem.email'),
      'password': this.configService.get('ITMOSystem.password')
    }, {
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    })
    if (resp.data && resp.data.statusCode == 200) {
      return resp.headers['x-token-id'];
    } else {
      this.logger.log(`Login failed ${JSON.stringify(resp)}`)
      throw new Error('Failed to login to ITMO system. ' + resp)
    }
  }

  private async sendGetReq(path: string): Promise<AxiosResponse> {
    return await axios.get(this.endpoint + path, {
      headers: {
        'Authorization': this.authToken,
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  async start(type: string): Promise<any> {
    this.authToken = await this.login();
    const projects = await this.sendGetReq('me/projects');
    if (!projects || !projects.data || !projects.data.data) {
      this.logger.log(`No projects received ${projects}`)
      throw new Error(`No projects received ${projects}`)
    } else {
      for (const project of projects.data.data) {
        const projectId = project.id;

        const programme = await this.programmeService.findByExternalId(projectId);
        if (programme && programme.currentStage == ProgrammeStage.REJECTED) {
          continue;
        }
        const projectDetails = await this.sendGetReq('me/projects/' + projectId)
        const stepNames = projectDetails?.data?.steps?.map(s => s.name);
        if (stepNames) {
          if (!programme && stepNames.includes("ITMO-Design Document (DD) & Validation Report / Upload on National Public Registry")) {
            const taxId = project.createdBy;
            const company = await this.companyService.findByTaxId(taxId);
            if (!company) {
              await this.companyService.create({
                taxId: taxId,
                companyId: undefined,
                name: "",
                email: "",
                phoneNo: "",
                website: "",
                address: "",
                logo: "",
                country: "",
                companyRole: CompanyRole.PROGRAMME_DEVELOPER,
                createdTime: 0
              })
            }

            await this.programmeService.create({
              title: "",
              externalId: "",
              sectoralScope: SectoralScope.EnergyDistribution,
              sector: Sector.Energy,
              typeOfMitigation: TypeOfMitigation.ENERGY_DISTRIBUTION,
              startTime: 0,
              endTime: 0,
              proponentTaxVatId: [],
              proponentPercentage: [],
              creditUnit: "",
              programmeProperties: new ProgrammeProperties,
              agricultureProperties: new AgricultureProperties,
              solarProperties: new SolarProperties,
              creditEst: 0
            })
          }
        }

      }
    }
  }
}
