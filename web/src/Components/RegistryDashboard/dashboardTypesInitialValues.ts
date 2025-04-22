import { ProgrammeStageLegend } from '../../Definitions/Enums/programmeStage.enum';
import { Sector } from '../../Definitions/Enums/sector.enum';

export interface ChartSeriesItem {
  name: string;
  data: any[];
}

export const getTotalProgrammesInitialValues = () => {
  const totalProgrammmesStatusInitialValues: ChartSeriesItem[] = [];
  const statusArray = Object.values(ProgrammeStageLegend);
  statusArray?.map((sector: any) => {
    totalProgrammmesStatusInitialValues.push({
      name: sector,
      data: [],
    });
  });
  return totalProgrammmesStatusInitialValues;
};

export const totalProgrammesInitialValues = [
  {
    name: 'Authorised',
    data: [],
  },
  {
    name: 'Rejected',
    data: [],
  },
  {
    name: 'Pending',
    data: [],
  },
];

export const getTotalProgrammesSectorInitialValues = () => {
  const totalProgrammmesSectorInitialValues: ChartSeriesItem[] = [];
  const sectorsArray = Object.values(Sector);
  sectorsArray?.map((sector: any) => {
    totalProgrammmesSectorInitialValues.push({
      name: sector,
      data: [],
    });
  });
  return totalProgrammmesSectorInitialValues;
};

export const totalCreditsSeriesInitialValues = [
  {
    name: 'Authorised',
    data: [],
  },
  {
    name: 'Issued',
    data: [],
  },
  {
    name: 'Transferred',
    data: [],
  },
  {
    name: 'Retired',
    data: [],
  },
];

export const totalCertifiedCreditsSeriesInitialValues = [
  {
    name: 'Certified',
    data: [],
  },
  {
    name: 'Uncertified',
    data: [],
  },
  {
    name: 'Revoked',
    data: [],
  },
];
