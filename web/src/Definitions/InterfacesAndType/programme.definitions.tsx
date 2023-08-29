import { DateTime } from 'luxon';
import { ProgrammeTransfer } from '@undp/carbon-library';
import { GovBGColor, CertBGColor, DevBGColor } from '../../Pages/Common/role.color.constants';

export enum CreditTransferStage {
  Pending = 'Pending',
  Approved = 'Accepted',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  Recognised = 'Recognised',
  NotRecognised = 'NotRecognised',
}

export const getCreditStageVal = (value: string) => {
  const index = Object.keys(CreditTransferStage).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(CreditTransferStage)[index];
};

export const getStageTransferEnumVal = (value: string, transfer: ProgrammeTransfer) => {
  // if (transfer.isRetirement) {
  //   if (value === ProgrammeTransferStage.APPROVED) {
  //     return 'Recongnised';
  //   }
  //   if (value === ProgrammeTransferStage.REJECTED) {
  //     return 'Not Recongnised';
  //   }
  // }

  const index = Object.keys(CreditTransferStage).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(CreditTransferStage)[index];
};

export const getTransferStageTagType = (
  stage: CreditTransferStage,
  transfer: ProgrammeTransfer
) => {
  // if (transfer.isRetirement) {
  //   switch (getStageEnumVal(stage)) {
  //     case ProgrammeTransferStage.APPROVED:
  //       return 'purple';
  //     case ProgrammeTransferStage.REJECTED:
  //       return 'orange';
  //   }
  // }
  switch (getCreditStageVal(stage)) {
    case CreditTransferStage.Rejected:
      return 'error';
    case CreditTransferStage.Approved:
      return 'processing';
    case CreditTransferStage.Pending:
      return 'success';
    case CreditTransferStage.Recognised:
      return 'purple';
    case CreditTransferStage.NotRecognised:
      return 'orange';
    default:
      return 'default';
  }
};

export class UnitField {
  constructor(public unit: string, public value: any) {}
}

export enum CompanyRole {
  CERTIFIER = 'Certifier',
  PROGRAMME_DEVELOPER = 'ProgrammeDeveloper',
  MRV = 'MRV',
  GOVERNMENT = 'Government',
}

export const addCommSep = (value: any) => {
  return (
    Number(value)
      // .toString()
      .toFixed(2)
      .replace('.00', '')
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );
};

export const addCommSepRound = (value: any) => {
  return Number(value)
    .toFixed(2)
    .replace('.00', '')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const addRoundNumber = (value: any) => {
  return Number(value.toFixed(2).replace('.00', ''));
};

export const addSpaces = (text: string) => {
  if (!text) {
    return text;
  }
  return text.replace(/([A-Z])/g, ' $1').trim();
};

export const getCompanyBgColor = (item: string) => {
  if (item === 'Government') {
    return GovBGColor;
  } else if (item === 'Certifier') {
    return CertBGColor;
  }
  return DevBGColor;
};

export const getRetirementTypeString = (retirementType: string | null) => {
  if (retirementType === null) {
    return '-';
  }

  switch (retirementType) {
    case '0':
      return 'CROSS BORDER TRANSFER';
    case '1':
      return 'LEGAL ACTION';
    case '2':
      return 'OTHER';
  }
};

export const sumArray = (arrList: any[]) => {
  if (arrList === undefined || arrList === null) {
    return 0;
  }

  return arrList.reduce((a, b) => Number(a) + Number(b), 0);
};
