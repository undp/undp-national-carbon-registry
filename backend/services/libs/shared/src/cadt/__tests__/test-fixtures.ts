import { Programme } from "../../entities/programme.entity";
import { ProjectEntity } from "../../entities/projects.entity";
import { Company } from "../../entities/company.entity";
import { CreditBlocksEntity } from "../../entities/credit.blocks.entity";
import { ActivityEntity } from "../../entities/activity.entity";
import { AefActionsTableEntity } from "../../entities/aef.actions.table.entity";
import { ProgrammeStage } from "../../enum/programme-status.enum";
import { Sector } from "../../enum/sector.enum";
import { TxType } from "../../enum/txtype.enum";
import { ProjectProposalStage } from "../../enum/projectProposalStage.enum";
import { CompanyRole } from "../../enum/company.role.enum";
import { CompanyState } from "../../enum/company.state.enum";
import { ActivityStateEnum } from "../../enum/activity.state.enum";
import { AefActionTypeEnum } from "../../enum/aef.action.type.enum";

export function makeProgramme(
  overrides?: Partial<Programme>
): Programme {
  const p = new Programme();
  Object.assign(p, {
    programmeId: "PRG-001",
    title: "Solar Farm Abuja",
    serialNo: "P-001",
    sectoralScope: 1,
    sector: Sector.Energy,
    countryCodeA2: "NG",
    currentStage: ProgrammeStage.AUTHORISED,
    startTime: 1672531200000,
    endTime: 1735689600000,
    creditEst: 5000,
    emissionReductionExpected: 5000,
    emissionReductionAchieved: 2000,
    creditBalance: 3000,
    creditIssued: 2000,
    creditRetired: [500],
    creditTransferred: [200],
    creditFrozen: [0],
    creditChange: 0,
    proponentTaxVatId: ["TAX001"],
    companyId: [1],
    article6trade: true,
    article68trade: false,
    article64trade: false,
    article62trade: false,
    mvcAdjust: false,
    mvcUnadjusted: false,
    creditOwnerPercentage: [100],
    proponentPercentage: [100],
    creditUnit: "ITMO",
    txTime: 1672531200000,
    createdTime: 1672531200000,
    statusUpdateTime: 1672531200000,
    programmeProperties: {
      geographicalLocation: ["Abuja", "Lagos"],
    } as any,
    geographicalLocationCordintes: [
      { lat: 9.0579, lng: 7.4951 },
      { lat: 6.5244, lng: 3.3792 },
    ],
    mitigationActions: [
      {
        typeOfMitigation: "Solar",
        subTypeOfMitigation: "Ground-mounted",
        properties: {
          methodology: "VCS - VM0043",
        },
      },
    ] as any,
    ...overrides,
  });
  return p;
}

export function makeProjectEntity(
  overrides?: Partial<ProjectEntity>
): ProjectEntity {
  const p = new ProjectEntity();
  Object.assign(p, {
    refId: "P-001",
    serialNumber: "CA0NNN-NA-XX-P-001-2024-0",
    title: "Solar Farm Abuja",
    companyId: 1,
    independentCertifiers: [2],
    projectProposalStage: ProjectProposalStage.AUTHORIZED,
    sector: Sector.Energy,
    sectoralScope: "1",
    txType: TxType.CREATE,
    txRef: "tx-001",
    txTime: 1672531200000,
    createTime: 1672531200000,
    updateTime: 1672531200000,
    projectAuthorizationTime: 1672531200000,
    creditEst: 5000,
    creditBalance: 3000,
    creditRetired: 500,
    creditTransferred: 200,
    creditIssued: 2000,
    creditChange: 0,
    activities: [
      {
        id: 1,
        refId: "A-001",
        projectRefId: "P-001",
        version: 1,
        state: ActivityStateEnum.VERIFICATION_REPORT_VERIFIED,
        creditIssued: [],
        createdTime: 1672531200000,
        updatedTime: 1675209600000,
      } as ActivityEntity,
    ],
    ...overrides,
  });
  return p;
}

export function makeCompany(overrides?: Partial<Company>): Company {
  const c = new Company();
  Object.assign(c, {
    companyId: 1,
    name: "Green Energy Corp",
    email: "info@greenenergy.com",
    website: "https://greenenergy.com",
    companyRole: CompanyRole.PROJECT_DEVELOPER,
    state: CompanyState.ACTIVE,
    country: "Nigeria",
    ...overrides,
  });
  return c;
}

export function makeCreditBlock(
  overrides?: Partial<CreditBlocksEntity>
): CreditBlocksEntity {
  const b = new CreditBlocksEntity();
  Object.assign(b, {
    creditBlockId: "CB-001",
    txRef: "tx-iss-001",
    txType: TxType.ISSUE,
    txTime: 1675209600000,
    ownerCompanyId: 1,
    projectRefId: "P-001",
    serialNumber: "CA0NNN-NA-XX-001-2024-0-1001-1400",
    vintage: "2024",
    creditAmount: 400,
    isNotTransferred: true,
    reservedCreditAmount: 0,
    createTime: 1675209600000,
    ...overrides,
  });
  return b;
}

export function makeActivityEntity(
  overrides?: Partial<ActivityEntity>
): ActivityEntity {
  const a = new ActivityEntity();
  Object.assign(a, {
    id: 1,
    refId: "A-001",
    projectRefId: "P-001",
    version: 1,
    state: ActivityStateEnum.VERIFICATION_REPORT_VERIFIED,
    creditIssued: [],
    createdTime: 1672531200000,
    updatedTime: 1675209600000,
    ...overrides,
  });
  return a;
}

export function makeAefActionsRecord(
  overrides?: Partial<AefActionsTableEntity>
): AefActionsTableEntity {
  const r = new AefActionsTableEntity();
  Object.assign(r, {
    id: 1,
    creditBlockStartId: "1001",
    creditBlockEndId: "1400",
    creditAmount: 400,
    vintage: "2024",
    sector: "Energy",
    sectoralScope: "1",
    projectAuthorizationTime: 1672531200000,
    authorizationId: "AUTH-001",
    actionTime: 1675209600000,
    actionType: AefActionTypeEnum.AUTHORIZATION,
    aquiringParty: "NG",
    createdTime: 1675209600000,
    ...overrides,
  });
  return r;
}
