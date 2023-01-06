import { DateTime } from 'luxon';

export enum ProgrammeStage {
  AwaitingAuthorization = 'Pending',
  Issued = 'Issued',
  Rejected = 'Rejected',
  Retired = 'Retired',
  Transferred = 'Transferred',
  // Frozen = 'Frozen',
}

export enum TxType {
  CREATE = '0',
  REJECT = '1',
  ISSUE = '2',
  TRANSFER = '3',
  CERTIFY = '4',
  RETIRE = '5',
  REVOKE = '6',
}

export enum SectoralScope {
  'Energy Industry' = '1',
  'Energy Distribution' = '2',
  'Agriculture' = '15',
}

export enum TypeOfMitigation {
  AGRICULTURE = 'Agriculture',
  SOLAR = 'Solar',
}

export const getStageEnumVal = (value: string) => {
  const index = Object.keys(ProgrammeStage).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(ProgrammeStage)[index];
};

export const getStageTagType = (stage: ProgrammeStage) => {
  switch (getStageEnumVal(stage)) {
    case ProgrammeStage.AwaitingAuthorization:
      return 'error';
    case ProgrammeStage.Issued:
      return 'processing';
    case ProgrammeStage.Transferred:
      return 'success';
    default:
      return 'default';
  }
};

export enum CompanyRole {
  CERTIFIER = 'Certifier',
  PROGRAMME_DEVELOPER = 'ProgrammeDeveloper',
  MRV = 'MRV',
  GOVERNMENT = 'Government',
}

export interface ProgrammeProperties {
  maxInternationalTransferAmount: string;
  creditingPeriodInYears: number;
  programmeCostUSD: number;
  sourceOfFunding: any;
  grantEquivalentAmount: number;
  carbonPriceUSDPerTon: number;
  buyerCountryEligibility: string;
  geographicalLocation: string[];
  greenHouseGasses: any[];
  creditYear: number;
}

export interface Programme {
  programmeId: string;
  serialNo: string;
  title: string;
  sectoralScope: string;
  sector: string;
  countryCodeA2: string;
  currentStage: ProgrammeStage;
  startTime: number;
  endTime: number;
  creditChange: number;
  creditIssued: number;
  creditBalance: number;
  creditTransferred: number;
  constantVersion: string;
  proponentTaxVatId: string[];
  companyId: number[];
  proponentPercentage: number[];
  creditOwnerPercentage: number[];
  certifierId: any[];
  certifier: any[];
  company: any[];
  creditUnit: string;
  programmeProperties: ProgrammeProperties;
  agricultureProperties: any;
  solarProperties: any;
  txTime: number;
  createdTime: number;
  txRef: string;
  typeOfMitigation: TypeOfMitigation;
}

export const getGeneralFields = (programme: Programme) => {
  return {
    title: programme.title,
    serialNo: programme.serialNo,
    currentStatus: programme.currentStage,
    applicationType: 'Programme Developer',
    sector: programme.sector,
    sectoralScope:
      Object.keys(SectoralScope)[
        Object.values(SectoralScope).indexOf(programme.sectoralScope as SectoralScope)
      ],
    startDate: DateTime.fromSeconds(Number(programme.startTime)),
    endDate: DateTime.fromSeconds(Number(programme.endTime)),
    buyerCountry: programme.programmeProperties.buyerCountryEligibility,
  };
};

export const getFinancialFields = (programme: Programme) => {
  return {
    programmeCost: programme.programmeProperties.programmeCostUSD,
    financingType: programme.programmeProperties.sourceOfFunding,
    grantEquivalent: programme.programmeProperties.grantEquivalentAmount,
    carbonPrice: programme.programmeProperties.carbonPriceUSDPerTon,
  };
};
