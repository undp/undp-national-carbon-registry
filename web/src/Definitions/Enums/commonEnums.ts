export enum RadioButtonStatus {
  YES = 'YES',
  NO = 'NO',
  NA = 'N/A',
}

export enum RadioButtonStatus2 {
  YES = 'YES',
  NO = 'NO',
  MAYBE = 'MAYBE',
}

export enum Titles {
  Mr = 'Mr',
  Mrs = 'Mrs',
}

export const titleList = [
  { value: Titles.Mr, label: 'Mr' },
  { value: Titles.Mrs, label: 'Mrs' },
];

export enum FormElementType {
  Radio,
  Label,
  Input,
}
