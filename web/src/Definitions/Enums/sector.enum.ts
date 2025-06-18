export enum Sector {
  Energy = 'Energy',
  Health = 'Health',
  Education = 'Education',
  Transport = 'Transport',
  Manufacturing = 'Manufacturing',
  Hospitality = 'Hospitality',
  Forestry = 'Forestry',
  Waste = 'Waste',
  Agriculture = 'Agriculture',
  Other = 'Other',
}

export enum EmissionSector {
  'energyEmissions' = 'Energy',
  'industrialProcessesProductUse' = 'Industrial Processes & Product Use',
  'agricultureForestryOtherLandUse' = 'Agriculture, Forestry, and Other Land Use',
  'waste' = 'Waste',
  'other' = 'Other',
}

export enum EmissionGas {
  'co2' = 'CO<sub>2</sub>',
  'ch4' = 'CH<sub>4</sub>',
  'n2o' = 'N<sub>2</sub>O',
  'co2eq' = 'CO<sub>2</sub>-eq',
}

export enum EmissionSubSectors {
  fuelCombustionActivities = 'Fuel Combustion Activities',
  fugitiveEmissionsFromFuels = 'Fugitive emissions from fuels',
  carbonDioxideTransportStorage = 'Carbon dioxide Transport and Storage',
  mineralIndustry = 'Mineral Industry',
  chemicalIndustry = 'Chemical Industry',
  metalIndustry = 'Metal Industry',
  nonEnergyProductsFuelsSolventUse = 'Non-Energy Products from Fuels and Solvent Use',
  electronicsIndustry = 'Electronics Industry',
  productUsesSubstOzoneDepletingSubs = 'Product Uses as Substitutes for Ozone Depleting Substances',
  otherProductManufactureUse = 'Other Product Manufacture and Use',
  otherIndustrialProcessesProductUse = 'Other (Industrial Processes & Product Use)',
  livestock = 'Livestock',
  land = 'Land',
  aggregateNonCo2SourcesLand = 'Aggregate sources and non-CO2 emissions sources on land',
  otherAgricultureForestryOtherLandUse = 'Other (Agriculture, Forestry, and Other Land Use)',
  solidWasteDisposal = 'Solid Waste Disposal',
  biologicalTreatmentSolidWaste = 'Biological Treatment of Solid Waste',
  incinerationOpenBurningWaste = 'Incineration and Open Burning of Waste',
  wastewaterTreatmentDischarge = 'Wastewater Treatment and Discharge',
  otherWaste = 'Other (Waste)',
  indirectN2oEmissions = 'Indirect N2O emissions from the atmospheric deposition of nitrogen in NOx and NH3',
  other = 'Other',
}

export enum ProjectionTypes {
  bau = 'BAU',
  conditionalNdc = 'Conditional NDC',
  unconditionalNdc = 'Unconditional NDC',
  actual = 'Actual',
}
