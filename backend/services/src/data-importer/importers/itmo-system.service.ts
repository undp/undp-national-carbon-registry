import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosResponse } from "axios";
import { ImporterInterface } from "../importer.interface";
import { SectoralScope } from "@undp/serial-number-gen";
import { ProgrammeService } from "../../programme/programme.service";
import { GHGs } from "../../enum/ghgs.enum";
import { UserService } from "../../user/user.service";
import { CompanyService } from "../../company/company.service";
import { Role } from "../../casl/role.enum";
import { TypeOfMitigation } from "../../enum/typeofmitigation.enum";
import { Sector } from "../../enum/sector.enum";
import { CompanyRole } from "../../enum/company.role.enum";
import { ProgrammeStage } from "../../enum/programme-status.enum";
import { CompanyState } from "../../enum/company.state.enum";
import { ProgrammeLedgerService } from "../../programme-ledger/programme-ledger.service";
import { EmailTemplates } from "../../email-helper/email.template";
import { EmailHelperService } from "../../email-helper/email-helper.service";
import { AuthorizationLetterGen } from "../../util/authorisation.letter.gen";
import { DataListResponseDto } from "../../dto/data.list.response";
import { SYSTEM_TYPE } from "../../enum/system.names.enum";
import { DocumentStatus } from "../../enum/document.status";

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
    private programmeService: ProgrammeService,
    private programmeLedger: ProgrammeLedgerService,
    private emailHelperService: EmailHelperService,
    private authLetter: AuthorizationLetterGen,
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
      case "agriculture":
        return [
          Sector.Agriculture,
          SectoralScope.Agriculture,
          TypeOfMitigation.AGRICULTURE
        ]
      case "energy-industries":
        return [
          Sector.Energy,
          SectoralScope.EnergyIndustry,
          TypeOfMitigation.EE_INDUSTRY
        ]
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

    const rootUser = await this.userService.getRoot();
    if (!rootUser) {
      throw new Error(`Root user does not exist in the system`);
    }
    rootUser['companyName'] = (await this.companyService.findGovByCountry(this.configService.get("systemCountry")))?.name;
    if (!projects || !projects.data || !projects.data.data) {
      this.logger.log(`No projects received ${projects}`);
      throw new Error(`No projects received ${projects}`);
    } else {
      for (const project of projects.data.data) {
        const projectId = project.id;

        let programmeEvents = await this.programmeService.getProgrammeEventsByExternalId(projectId);
        if (programmeEvents && programmeEvents.length > 0 && programmeEvents[programmeEvents.length - 1].data.currentStage == ProgrammeStage.REJECTED) {
          continue;
        }

        const projectData = await this.sendGetReq("me/projects/" + projectId);
        const projectDetails = projectData?.data;
        if (projectDetails?.steps) {
          for (const step of projectDetails?.steps) {
            if (
              (!programmeEvents || programmeEvents.length <= 0) &&
              step.name ===
                "ITMO-Design Document (DD) & Validation Report / Upload on National Public Registry"
            ) {
              const taxId = project.company;
              const company = await this.companyService.findByTaxId(taxId);
              if (!company) {

                const email = `nce.digital+${project.company}@undp.org`.replace(' ', '');
                await this.userService.create(
                  {
                    email: email,
                    role: Role.Admin,
                    name: project.company,
                    phoneNo: "00",
                    company: {
                      taxId: taxId,
                      paymentId: undefined, //double check this
                      companyId: undefined,
                      name: project.company,
                      email: email,
                      phoneNo: "00",
                      nameOfMinister:undefined,
                      sectoralScope:undefined,
                      govDep:undefined,
                      ministry:undefined,
                      website: undefined,
                      address: this.configService.get("systemCountryName"),
                      logo: undefined,
                      country: this.configService.get("systemCountry"),
                      companyRole: CompanyRole.PROGRAMME_DEVELOPER,
                      createdTime: undefined,
                      regions: [],
                      state: CompanyState.ACTIVE //double check this
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
                article6trade: true,
                supportingowners:undefined,
                implementinguser:undefined,
                creditUnit: this.configService.get("defaultCreditUnit"),
                programmeProperties: {
                  geographicalLocation: [projectDetails.country.name],
                  greenHouseGasses: [GHGs.CO2],
                },
                creditEst: 100,
                environmentalAssessmentRegistrationNo: projectDetails.environmentalAssessmentRegistrationNo
              };

              if (step.files && step.files.length > 0) {
                pr.programmeProperties["programmeMaterials"] = step.files;
                // pr.programmeProperties["projectMaterial"] = step.files;
              }
              await this.programmeService.create(pr, rootUser);

            } else if(programmeEvents && programmeEvents.length > 0 && programmeEvents[programmeEvents.length - 1].data.currentStage == ProgrammeStage.AWAITING_AUTHORIZATION 
              && step.name ==="Validation Report" && step.status == "completed"){
                try{
                    this.logger.log("ITMO Project "+projectDetails.name+" Approvement initialisation")
                    const programmedetails = await this.programmeService.findByExternalId(projectDetails.id)
                    await this.programmeService.itmoProjectApprove(programmedetails);
                    
                    if (step.files && step.files.length > 0) {
                      for (const programmeMaterials of step.files){
                        const updateprogrammetable = await this.programmeLedger.addDocument(
                          projectDetails.id,
                          undefined,
                          programmeMaterials,
                          new Date().getTime(),
                          DocumentStatus.ACCEPTED,
                          undefined,
                          undefined,
                          undefined
                        )
                      }
                    }
                } catch(error){
                  this.logger.error("Error in Approving ITMO project",error)
                }

            } else if(programmeEvents && programmeEvents.length > 0 && programmeEvents[programmeEvents.length - 1].data.currentStage == ProgrammeStage.APPROVED 
              && step.name ==="Creation of unique Project Identification Number" && step.status == "completed"){

              try {
                    this.logger.log("ITMO Project "+projectDetails.name+" Authorisation initialisation")
                    const programmedetails = await this.programmeService.findByExternalId(projectDetails.id)                    
                    const orgNames:DataListResponseDto  = await this.companyService.queryNames({
                      size: 10,
                      page: 1,
                      filterAnd: [{
                        key: 'companyId',
                        operation: 'IN',
                        value: programmedetails.companyId
                      }],
                      filterOr: undefined,
                      filterBy:undefined,
                      sort: undefined
                    }, undefined) ;
                    let orgData = orgNames.data

                    const authOrg = (await this.companyService.findGovByCountry(this.configService.get("systemCountry")))?.name;
                    const authLetterUrl = await this.authLetter.generateLetter(
                      programmedetails.programmeId,
                      programmedetails.title,
                      authOrg,
                      orgData.map(e => e.name),
                      "designDocUrl",
                      "methodologyDocUrl"
                    );
                    const auth = await this.programmeService.authorizeProgramme({programmeId: programmedetails.programmeId, issueAmount: 0, comment: "ITMO Authorised"}, rootUser, authLetterUrl)
                    if(this.configService.get('systemType')==SYSTEM_TYPE.CARBON_REGISTRY){
                      const updateprogrammetable = await this.programmeLedger.addDocument(
                        projectDetails.id,
                        undefined,
                        authLetterUrl,
                        new Date().getTime(),
                        DocumentStatus.ACCEPTED,
                        undefined,
                        undefined,
                        undefined
                      )
                    }
                  } catch(error){
                    this.logger.error("Error in Authorising ITMO project",error)
                    }
            } else if (
              programmeEvents && programmeEvents.length > 0 &&
              programmeEvents[programmeEvents.length - 1].data.currentStage === ProgrammeStage.AUTHORISED &&
              !programmeEvents.map(e => e.data.txRef).join(' ').includes('ITMO system issue')
            ) {
              const flat = flatten(step.iterations)

              const list = flatten(flat?.map((e) => {
                    return e?.contents?.map((x) => x.name);
                  }))
              
              this.logger.log(`Issue list values: ${list}`)
              // if (list && list.includes("Upload Final Monitoring Report")) {
              //   const resp = await this.programmeService.issueProgrammeCredit(
              //     {
              //       programmeId: programmeEvents[programmeEvents.length - 1].data.programmeId,
              //       issueAmount: 10,
              //       comment: "ITMO system issue",
              //     },
              //     rootUser
              //   );

              //   this.logger.log(`Issue credit response ${resp}`)
              // }
            }
          }
        }
      }
    }
  }
}
