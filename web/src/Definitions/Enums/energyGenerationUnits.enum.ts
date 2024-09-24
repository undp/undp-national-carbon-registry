export enum EnergyGenerationUnits {
  Wh = 'Wh/year/unit',
  mWh = 'mWh/year/unit',
  kWh = 'kWh/year/unit',
  MWh = 'MWh/year/unit',
  GWh = 'GWh/year/unit',
  J = 'J/year/unit',
  KJ = 'kJ/year/unit',
}

export const energyGenerationUnitList = [
  { value: EnergyGenerationUnits.Wh.valueOf(), label: 'Wh' },
  { value: EnergyGenerationUnits.mWh.valueOf(), label: 'mWh' },
  { value: EnergyGenerationUnits.kWh.valueOf(), label: 'kWh' },
  { value: EnergyGenerationUnits.MWh.valueOf(), label: 'MWh' },
  { value: EnergyGenerationUnits.GWh.valueOf(), label: 'GWh' },
  { value: EnergyGenerationUnits.J.valueOf(), label: 'J' },
  { value: EnergyGenerationUnits.KJ.valueOf(), label: 'KJ' },
];
