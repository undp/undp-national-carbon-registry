import { BuildingType } from '@undp/carbon-credit-calculator';

export const consumerGroupList = [
  { value: BuildingType.Household.valueOf(), label: 'Household' },
  { value: BuildingType.HealthCenter.valueOf(), label: 'Health Center' },
  { value: BuildingType.Dispensary.valueOf(), label: 'Dispensary' },
  { value: BuildingType.School.valueOf(), label: 'School' },
  { value: BuildingType.PrimarySchool.valueOf(), label: 'Primary School' },
  { value: BuildingType.SecondarySchool.valueOf(), label: 'Secondary School' },
  {
    value: BuildingType.PublicAdministration.valueOf(),
    label: 'Public Administration',
  },
  { value: BuildingType.TradingPlace.valueOf(), label: 'Trading Place' },
  { value: BuildingType.BusStop.valueOf(), label: 'Bus Stop' },
];
