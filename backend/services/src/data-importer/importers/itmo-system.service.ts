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
import { UserService } from "../../shared/user/user.service";
import { Role } from "../../shared/casl/role.enum";
import { GHGs } from "../../shared/enum/ghgs.enum";
import { Programme } from "../../shared/entities/programme.entity";

function flatten(ary) {
  if (!ary) {
    return ary;
  }
  return ary.reduce(function(a, b) {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}

@Injectable()
export class ITMOSystemImporter implements ImporterInterface {
  private endpoint;
  private authToken;
  private apiKey;

  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private companyService: CompanyService,
    private userService: UserService,
    private programmeService: ProgrammeService
  ) {
    this.endpoint = this.configService.get("ITMOSystem.endpoint");
    this.apiKey = this.configService.get("ITMOSystem.apiKey");
  }

  private async login(): Promise<string> {
    const resp = await axios.post(
      this.endpoint + "auth/login",
      {
        email: this.configService.get("ITMOSystem.email"),
        password: this.configService.get("ITMOSystem.password"),
      },
      {
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
      }
    );
    if (resp.data && resp.data.statusCode == 200) {
      return resp.headers["x-token-id"];
    } else {
      this.logger.log(`Login failed ${JSON.stringify(resp)}`);
      throw new Error("Failed to login to ITMO system. " + resp);
    }
  }

  private async sendGetReq(path: string): Promise<AxiosResponse> {
    return await axios.get(this.endpoint + path, {
      headers: {
        Authorization: this.authToken,
        "x-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  private getSector(
    itmoSector: string
  ): [Sector, SectoralScope, TypeOfMitigation] {
    switch (itmoSector) {
      case "energy-distribution":
        return [
          Sector.Energy,
          SectoralScope.EnergyDistribution,
          TypeOfMitigation.ENERGY_DISTRIBUTION,
        ];
      default:
        return [
          Sector.Other,
          SectoralScope.EnergyIndustry,
          TypeOfMitigation.EE_INDUSTRY,
        ];
    }
  }

  async start(type: string): Promise<any> {
    this.authToken = await this.login();
    const projects = await this.sendGetReq("me/projects");
    if (!projects || !projects.data || !projects.data.data) {
      this.logger.log(`No projects received ${projects}`);
      throw new Error(`No projects received ${projects}`);
    } else {
      for (const project of projects.data.data) {
        const projectId = project.id;

        let programme = await this.programmeService.findByExternalId(projectId);
        if (programme && programme.currentStage == ProgrammeStage.REJECTED) {
          continue;
        }
        const projectData = await this.sendGetReq("me/projects/" + projectId);
        const projectDetails = projectData?.data;
        if (projectDetails?.steps) {
          for (const step of projectDetails?.steps) {
            if (
              !programme &&
              step.name ===
                "ITMO-Design Document (DD) & Validation Report / Upload on National Public Registry"
            ) {
              const taxId = project.company;
              const company = await this.companyService.findByTaxId(taxId);
              if (!company) {
                await this.userService.create(
                  {
                    email: `nce.digital+${project.company}@undp.org`,
                    role: Role.Admin,
                    name: project.company,
                    phoneNo: "00",
                    company: {
                      taxId: taxId,
                      companyId: undefined,
                      name: project.company,
                      email: `nce.digital+${project.company}@undp.org`,
                      phoneNo: "00",
                      website: undefined,
                      address: this.configService.get("systemCountryName"),
                      logo: undefined,
                      country: this.configService.get("systemCountry"),
                      companyRole: CompanyRole.PROGRAMME_DEVELOPER,
                      createdTime: undefined,
                    },
                    password: undefined,
                    companyId: undefined,
                  },
                  undefined,
                  CompanyRole.GOVERNMENT
                );
              }

              const [sector, scope, mitigation] = this.getSector(
                projectDetails.sector
              );

              const pr = {
                title: projectDetails.name,
                externalId: projectDetails.id,
                sectoralScope: scope,
                sector: sector,
                typeOfMitigation: mitigation,
                startTime: parseInt(
                  (
                    new Date("2023-03-06T14:02:42.840Z").getTime() / 1000
                  ).toFixed()
                ),
                endTime: parseInt(
                  (
                    new Date("2023-03-06T14:02:42.840Z").getTime() / 1000 +
                    87660 * 60 * 60
                  ).toFixed()
                ),
                proponentTaxVatId: [taxId],
                proponentPercentage: [100],
                creditUnit: this.configService.get("defaultCreditUnit"),
                programmeProperties: {
                  geographicalLocation: projectDetails.country.name,
                  greenHouseGasses: [GHGs.CO2],
                },
                creditEst: 100,
              };

              if ( step.files && step.files.length > 0) {
                pr.programmeProperties['programmeMaterials'] = step.files[0]
                pr.programmeProperties['projectMaterial'] = step.files[0]
              }

              await this.programmeService.create(pr);
            } else if (
              programme &&
              programme.currentStage === ProgrammeStage.AUTHORISED
            ) {
              const flat = flatten(step.iterations)

              const list = flatten(flat?.map((e) => {
                    return e?.contents?.map((x) => x.name);
                  }))
              
              this.logger.log(`Issue list values: ${list}`)
              if (list && list.includes("Upload Final Monitoring Report")) {
                const rootUser = await this.userService.getRoot();
                if (rootUser) {
                  const resp = await this.programmeService.issueProgrammeCredit(
                    {
                      programmeId: programme.programmeId,
                      issueAmount: 10,
                      comment: "ITMO system issue",
                    },
                    rootUser
                  );

                  this.logger.log(`Issue credit response ${resp}`)
                }
              }
            }
          }
        }
      }
    }
  }
}
