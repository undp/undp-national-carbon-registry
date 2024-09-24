import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Programme } from '../entities/programme.entity';
import { CompanyService } from '../company/company.service';
import { ProgrammeStage } from '../enum/programme-status.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NDCAction } from '../entities/ndc.action.entity';
import { TypeOfMitigation } from '../enum/typeofmitigation.enum';
import { TxType } from '../enum/txtype.enum';
import { Sector } from '../enum/sector.enum';
import { ProgrammeTransfer } from '../entities/programme.transfer';

@Injectable()
export class CadtApiService {
  constructor(
    private configService: ConfigService,
    private companyService: CompanyService,
    @InjectRepository(Programme) private programmeRepo: Repository<Programme>,
    private logger: Logger,
  ) {}

  private async send(endpoint, fn, data?: any) {
    if (!this.configService.get('cadTrust.enable')) {
      this.logger.log(
        'Does not execute since CAD-Trust is disable in the system',
      );
      return;
    }

    console.log('CADT request', data);
    const resp = await fn(
      this.configService.get('cadTrust.endpoint') + endpoint,
      data,
    ).catch((ex) => {
      console.log('Exception', ex);
      console.log('CADT errors', ex.response?.data?.errors)
      throw ex;
    });
    console.log('CADT response', resp);
    return resp;
  }

  private async sendHttpGet(endpoint: string, data: any) {
    return await this.send(endpoint, axios.get, data);
  }

  private async sendHttpPost(endpoint: string, data: any) {
    return await this.send(endpoint, axios.post, data);
  }

  private async sendHttpPut(endpoint: string, data: any) {
    return await this.send(endpoint, axios.put, data);
  }

  private getMapToCADTStatus(status: ProgrammeStage) {
    switch (status) {
      case ProgrammeStage.NEW:
      case ProgrammeStage.AWAITING_AUTHORIZATION:
        return 'Registered';
      case ProgrammeStage.APPROVED:
        return 'Listed';
      case ProgrammeStage.AUTHORISED:
        return 'Completed';
      case ProgrammeStage.REJECTED:
        return 'Withdrawn';
    }
  }

  private getUnitType(sector: Sector) {
    switch(sector) {
        case Sector.Forestry:
            return "Removal - nature";
    }
    return "Reduction - technical";
  }

  // private getUnitType(typeOfMitigation: TypeOfMitigation) {
  //   switch(typeOfMitigation) {
  //       case TypeOfMitigation.FORESTRY:
  //           return "Removal Nature";
  //       default:
  //           return "Reduction Technical";
  //   }
  // }

  private getUnitStatus(txType: TxType) {
    switch(txType) {
        case TxType.ISSUE:
        case TxType.APPROVE:
            return "Held";
        case TxType.RETIRE:
            return "Retired";
        case TxType.CREATE:
            return "Buffer";
        case TxType.TRANSFER:
            return "Exported";
    }
  }

  private getProjectDate(date: number) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  
  public async createProgramme(programme: Programme) {

    const program = await this.programmeRepo.findOneBy({
      programmeId: programme.programmeId,
    });

    if (!program){
      throw new Error("Programme not created yet")
    }

    const companies = await this.companyService.findByCompanyIds({
      companyIds: programme.companyId,
    });

    const pd = companies?.map((c) => c.name)?.join(', ');

    let methodology = "Pending";
    if (programme.mitigationActions?.length > 0){
      if (programme.mitigationActions[0].properties.methodology) {
        methodology = programme.mitigationActions[0].properties.methodology
      } else if (programme.mitigationActions[0]['methodology']) {
        methodology = programme.mitigationActions[0]['methodology']
      }
    }

    const p = await this.sendHttpPost('v1/projects', {
      projectId: programme.programmeId,
      originProjectId: programme.programmeId,
      currentRegistry: this.configService.get('systemCountryName'),
      registryOfOrigin: `${this.configService.get(
        'systemCountryName',
      )} Standard Carbon Registry`,
      projectName: programme.title,
      projectLink:
        this.configService.get('host') +
        '/programmeManagement/view/' +
        programme.programmeId,
      projectDeveloper: pd,
      sector: programme.sector,
      projectType:
        programme.mitigationActions?.length > 0
          ? programme.mitigationActions[0].typeOfMitigation
          : 'Pending',
      coveredByNDC: 'Inside NDC',
      projectStatus: this.getMapToCADTStatus(programme.currentStage),
      projectStatusDate: this.getProjectDate(programme.startTime * 1000),
      unitMetric: 'tCO2e',
      methodology: methodology,
      estimations: [{
        unitCount: programme.creditEst,
        creditingPeriodStart: this.getProjectDate(programme.startTime * 1000),
        creditingPeriodEnd: this.getProjectDate(programme.endTime * 1000),
      }]
    });

    const cresp = await this.sendHttpPost('v1/staging/commit', undefined);
    //TODO: Make this reliable
    const response = await this.programmeRepo
      .update(
        {
          programmeId: programme.programmeId,
        },
        {
          cadtId: p?.data?.uuid,
        },
      )
      .catch((err: any) => {
        this.logger.error(
          `CADT id update failed on programme ${programme.programmeId} CADTId: ${p?.data?.uuid}`,
        );
        return err;
      });

    return p;
  }

  public async updateProgramme(programme: Programme) {

    const sqlProgram = await this.programmeRepo.findOneBy({
      programmeId: programme.programmeId,
    });

    programme.cadtId = sqlProgram.cadtId;
    programme.blockBounds = sqlProgram.blockBounds;

    if (!programme.cadtId) {
        this.logger.log(`Programme does not have cad trust id. Dropping record ${programme.programmeId} ${programme.currentStage}`)
        return;
    }

    const companies = await this.companyService.findByCompanyIds({
      companyIds: programme.companyId,
    });

    const pd = companies?.map((c) => c.name)?.join(', ');

    let methodology = "Pending";
    if (programme.mitigationActions?.length > 0){
      if (programme.mitigationActions[0].properties?.methodology) {
        methodology = programme.mitigationActions[0].properties.methodology
      } else if (programme.mitigationActions[0]['methodology']) {
        methodology = programme.mitigationActions[0]['methodology']
      }
    }


    const auth = await this.sendHttpPut('v1/projects', {
      warehouseProjectId: String(programme.cadtId),
      projectId: programme.programmeId,
      originProjectId: programme.programmeId,
      currentRegistry: this.configService.get('systemCountryName'),
      registryOfOrigin: `${this.configService.get(
        'systemCountryName',
      )} Standard Carbon Registry`,
      projectName: programme.title,
      projectLink:
        this.configService.get('host') +
        '/programmeManagement/view/' +
        programme.programmeId,
      projectDeveloper: pd,
      sector: programme.sector,
      projectType:
        programme.mitigationActions?.length > 0
          ? programme.mitigationActions[0].typeOfMitigation
          : 'Pending',
      coveredByNDC: 'Inside NDC',
      projectStatus: this.getMapToCADTStatus(programme.currentStage),
      projectStatusDate: this.getProjectDate(programme.startTime * 1000),
      unitMetric: 'tCO2e',
      methodology: methodology,
    });
    
    await await this.sendHttpPost('v1/staging/commit', undefined);
    return auth;
  }

  private getBlockStartFromSerialNumber(serialNo: string) {
    return Number(serialNo.split('-')[6]);
  }

  private getYearFromSerialNumber(serialNo: string) {
    return parseInt(serialNo.split('-')[4]);
  }

  public async issueCredit(
    programme: Programme,
    // ndcAction: NDCAction,
    issueAmounts: any[]
  ) {

    const sqlProgram = await this.programmeRepo.findOneBy({
      programmeId: programme.programmeId,
    });

    programme.cadtId = sqlProgram.cadtId;
    programme.blockBounds = sqlProgram.blockBounds;

    if (!programme.cadtId) {
        this.logger.log(`Programme does not have cad trust id. Dropping record ${programme.programmeId} ${programme.currentStage}`)
        return;
    }

    const amount = issueAmounts.reduce((n, {issueCredit}) => n + issueCredit, 0)

    const gov = await this.companyService.findGovByCountry(this.configService.get('systemCountry'));
    const blockStart = this.getBlockStartFromSerialNumber(programme.serialNo) + Number(programme.creditIssued);

    const list = []
    let blockBounds = programme.blockBounds || {}

    let currentStart = blockStart;
    for (const cIndex in programme.companyId) {
      const cId = programme.companyId[cIndex];
      const cName = (await this.companyService.findByCompanyId(cId))?.name

      let issuesStart = currentStart
      if (blockBounds[cId] && blockBounds[cId].length > 0) {
        issuesStart = Number(blockBounds[cId][blockBounds[cId].length - 1].unitBlockEnd) + 1
      }


      const cAmount = Number((amount * programme.proponentPercentage[cIndex]/100).toFixed(0))
      const gap = Number((programme.creditEst * programme.proponentPercentage[cIndex]/100).toFixed(0))
      const req = {
        "projectLocationId": programme.programmeProperties.geographicalLocation?.join(' '),
        "unitOwner": cName,
        "countryJurisdictionOfOwner": "Nigeria",         // this.configService.get('systemCountryName'),
        "unitBlockStart": String(issuesStart),
        "unitBlockEnd": String(issuesStart + cAmount - 1),
        "unitCount": cAmount,
        "vintageYear": this.getYearFromSerialNumber(programme.serialNo),
        "unitType": this.getUnitType(programme.sector),
        "unitStatus": this.getUnitStatus(TxType.ISSUE),
        "unitRegistryLink": this.configService.get('host') + "/creditTransfers/viewAll",
        "correspondingAdjustmentDeclaration": "Unknown",
        "correspondingAdjustmentStatus": "Not Started",
        "issuance": {
            "warehouseProjectId": programme.cadtId,
            "startDate": this.getProjectDate(programme.startTime * 1000),
             "endDate": this.getProjectDate(programme.endTime * 1000),
             "verificationApproach": "Pending",
             "verificationReportDate": this.getProjectDate(new Date().getTime()), //TODO
             "verificationBody": gov.name // TODO
        }
      }
      const credit = await this.sendHttpPost('v1/units', req);

      currentStart += gap
      list.push(credit)

      if (!blockBounds[cId]) {
        blockBounds[cId] = []
      }
      blockBounds[cId].push({
        unitBlockStart: req.unitBlockStart,
        unitBlockEnd: req.unitBlockEnd,
        unitId: credit?.data?.uuid,
        amount: cAmount
      })
    }
  
    await await this.sendHttpPost('v1/staging/commit', undefined);

    //TODO: Make this reliable
    const response = await this.programmeRepo
    .update(
      {
        programmeId: programme.programmeId,
      },
      {
        blockBounds: blockBounds
      },
    )
    .catch((err: any) => {
      this.logger.error(
        `CADT id update failed on programme ${programme.programmeId}`,
      );
      return err;
    });

    return list
  }

  public async transferCredit(
    programme: Programme,
    transfer: ProgrammeTransfer
  ) {

    const sqlProgram = await this.programmeRepo.findOneBy({
      programmeId: programme.programmeId,
    });

    programme.cadtId = sqlProgram.cadtId;
    programme.blockBounds = sqlProgram.blockBounds;

    if (!programme.cadtId) {
        this.logger.log(`Programme does not have cad trust id. Dropping record ${programme.programmeId} ${programme.currentStage}`)
        return;
    }
    
    const programBlockBounds = programme.blockBounds[transfer.fromCompanyId];
    if (!programBlockBounds) {
      this.logger.log(`Programme block bounds does not exist. Dropping record ${programme.programmeId}`)
      return;
    }

    const toCompany = await this.companyService.findByCompanyId(transfer.toCompanyId);
    const fromCompany = await this.companyService.findByCompanyId(transfer.fromCompanyId);

    let txAmount = Number(transfer.creditAmount.toFixed(0))
    for (const bound of programBlockBounds) {
      if (bound.isTransferred) {
        continue;
      }

      if ( txAmount < bound.amount) {
        const records = [
          {
            "unitCount": bound.amount - txAmount,
            "unitOwner": fromCompany?.name,
            "unitBlockStart": String(Number(bound.unitBlockStart) + txAmount),
            "unitBlockEnd": bound.unitBlockEnd
          },
          {
            "unitCount": txAmount,
            "unitOwner": toCompany?.name,
            "unitBlockStart": String(bound.unitBlockStart),
            "unitBlockEnd": String(Number(bound.unitBlockStart) + txAmount - 1)
          }
        ]
        bound.unitBlockStart = String(Number(bound.unitBlockStart) + txAmount)
        bound.amount = bound.amount - txAmount
    
        const resp = await this.sendHttpPost('v1/units/split', {
          warehouseUnitId: bound.unitId,
          records: records
        })
        break;
      } else {
        const req = {
          "warehouseUnitId": bound.unitId,
          "projectLocationId": programme.programmeProperties.geographicalLocation?.join(' '),
          "unitOwner": toCompany?.name,
          "countryJurisdictionOfOwner": "Nigeria", //this.configService.get('systemCountryName'),
          "unitBlockStart": String(bound.unitBlockStart),
          "unitBlockEnd": String(bound.unitBlockEnd),
          "unitCount": Number(bound.amount),
          "vintageYear": this.getYearFromSerialNumber(programme.serialNo),
          "unitType": this.getUnitType(programme.sector),
          "unitStatus": this.getUnitStatus(TxType.ISSUE),
          "unitRegistryLink": this.configService.get('host') + "/creditTransfers/viewAll",
          "correspondingAdjustmentDeclaration": "Unknown",
          "correspondingAdjustmentStatus": "Not Started",
        }
        bound.isTransferred = true
        await this.sendHttpPut('v1/units', req);
        txAmount -= Number(bound.amount)
      }
    }

    //TODO: Make this reliable
    const response = await this.programmeRepo
    .update(
      {
        programmeId: programme.programmeId,
      },
      {
        blockBounds: programme.blockBounds
      },
    )
    .catch((err: any) => {
      this.logger.error(
        `CADT id update failed on programme ${programme.programmeId}`,
      );
      return err;
    });
    await await this.sendHttpPost('v1/staging/commit', undefined);
  }
}
