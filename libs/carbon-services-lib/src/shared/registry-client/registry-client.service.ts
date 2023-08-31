import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserDto } from "../dto/user.dto";
import axios from "axios";
import { ProgrammeApprove } from "../dto/programme.approve";
import { AuthorizationLetterGen } from "../util/authorisation.letter.gen";
import { CompanyService } from "../company/company.service";
import { ProgrammeService } from "../programme/programme.service";
import { InjectRepository } from "@nestjs/typeorm";
import { ProgrammeDocument } from "../entities/programme.document";
import { Repository } from "typeorm";
import { DocumentStatus } from "../enum/document.status";
import { DocType } from "../enum/document.type";
import { FindOrganisationQueryDto } from "../dto/find.organisation.dto";

@Injectable()
export class RegistryClientService {
  constructor(private configService: ConfigService,
    private logger: Logger,
    private authLetterGen: AuthorizationLetterGen,
    private companyService: CompanyService,
    private programmeService: ProgrammeService,
    @InjectRepository(ProgrammeDocument)
    private documentRepo: Repository<ProgrammeDocument>,
) {}

  private async sendHttp(endpoint: string, data: any) {
    if (!this.configService.get("registry.syncEnable")) {
      this.logger.debug("Company created ignored due to registry sync disable");
      return;
    }

    return await axios
      .post(this.configService.get("registry.endpoint") + endpoint, data, {
        headers: {
          api_key: `${this.configService.get("registry.apiToken")}`,
        },
      })
      .catch((ex) => {
        console.log("Exception", ex.response?.data?.message);
        if (
          ex.response?.data?.statusCode == 400 &&
          ex.response?.data?.message?.indexOf("already exist") >= 0
        ) {
          return true;
        }
        throw ex;
      });
  }

  private async sendHttpPut(endpoint: string, data: any) {
    if (!this.configService.get("registry.syncEnable")) {
      this.logger.debug("Company created ignored due to registry sync disable");
      return;
    }

    return await axios
      .put(this.configService.get("registry.endpoint") + endpoint, data, {
        headers: {
          api_key: `${this.configService.get("registry.apiToken")}`,
        },
      })
      .catch((ex) => {
        console.log("Exception", ex.response?.data?.statusCode);
        if (
          ex.response?.data?.statusCode == 400 &&
          ex.response?.data?.message?.indexOf("already exist") >= 0
        ) {
          return true;
        }
        throw ex;
      });
  }

  public async createCompany(userDto: UserDto) {
    const resp = await this.sendHttp("/national/user/add", userDto);
    console.log(
      "Successfully create company on MRV",
      userDto.company.name
    );
    return resp;
  }

  public async authProgramme(actionProps:any) {

    const programme = await this.programmeService.findById(actionProps.programmeId)
    
    const orgNames = await this.companyService.queryNames({
      size: 10,
      page: 1,
      filterAnd: [{
        key: 'companyId',
        operation: 'IN',
        value: programme.companyId
      }],
      filterOr: undefined,
      sort: undefined
    }, undefined) ;

    const documents = await this.documentRepo.find({
      where: [
        { programmeId: programme.programmeId, status: DocumentStatus.ACCEPTED,type: DocType.DESIGN_DOCUMENT },
        { programmeId: programme.programmeId, status: DocumentStatus.ACCEPTED,type: DocType.METHODOLOGY_DOCUMENT},
      ]
    });
    let designDoc, designDocUrl, methodologyDoc, methodologyDocUrl;
    if(documents && documents.length > 0){
      designDoc = documents.find(d=>d.type === DocType.DESIGN_DOCUMENT);
      if(designDoc){
        designDocUrl = designDoc.url;
      }
      methodologyDoc = documents.find(d=>d.type === DocType.METHODOLOGY_DOCUMENT);
      if(methodologyDoc){
        methodologyDocUrl = methodologyDoc.url;
      }
    }

    const companyIds:FindOrganisationQueryDto={companyIds:[actionProps.authOrganisationId]}
    const companies = await this.companyService.findByCompanyIds(companyIds)[0]
    this.logger.log("companyIds",companyIds,"companies",companies)
    const authOrganisationName = await this.companyService.findByCompanyIds(companyIds)[0].name

    const authLetterUrl = await this.authLetterGen.generateLetter(
      programme.programmeId,
      programme.title,
      authOrganisationName,
      orgNames.data.map(e => e['name']),
      designDocUrl,
      methodologyDocUrl
    );
    const dr = new ProgrammeDocument();
    dr.programmeId = programme.programmeId;
    dr.externalId = programme.externalId;
    dr.status = DocumentStatus.ACCEPTED;
    dr.type = DocType.AUTHORISATION_LETTER;
    dr.txTime = new Date().getTime();
    dr.url = authLetterUrl;
    await this.documentRepo.save(dr);

    return
  }

  public async rejectProgramme(reject) {
    const resp = await this.sendHttpPut("/national/programme/rejectProgramme", reject);
    console.log(
      "Successfully rejected programme on MRV",
      reject
    );
    return resp;
  }


  public async issueCredit(issue) {
    const resp = await this.sendHttpPut("/national/programme/issueCredit", issue);
    console.log(
      "Successfully issued programme on MRV",
      issue
    );
    return resp;
  }
}
