import { CreditTypeSl } from '../Enums/creditTypeSl.enum';

export const getCreditTypeVal = (value: string) => {
  const index = Object.keys(CreditTypeSl).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(CreditTypeSl)[index];
};

export const getCreditTypeTagType = (stage: CreditTypeSl) => {
  switch (getCreditTypeVal(stage)) {
    case CreditTypeSl.TRACK_1:
      return 'orange';
    case CreditTypeSl.TRACK_2:
      return 'purple';
    default:
      return 'default';
  }
};

export const getCreditTypeName = (value: string) => {
  switch (getCreditTypeVal(value)) {
    case CreditTypeSl.TRACK_1:
      return 'SLCER+';
    case CreditTypeSl.TRACK_2:
      return 'SLCER';
    default:
      return 'SLCER';
  }
};
