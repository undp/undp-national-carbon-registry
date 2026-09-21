export enum InfSectoralScopeEnum {
  ENERGY_INDUSTRIES = "ENERGY_INDUSTRIES",
  ENERGY_DISTRIBUTION = "ENERGY_DISTRIBUTION",
  ENERGY_DEMAND = "ENERGY_DEMAND",
  AGRICULTURE = "AGRICULTURE",
  AFFORESTATION_AND_REFORESTATION = "AFFORESTATION_AND_REFORESTATION",
  MANUFACTURING_INDUSTRIES = "MANUFACTURING_INDUSTRIES",
  CHEMICAL_INDUSTRIES = "CHEMICAL_INDUSTRIES",
  METAL_PRODUCTION = "METAL_PRODUCTION",
  TRANSPORT = "TRANSPORT",
  WASTE_FROM_FUELS = "WASTE_FROM_FUELS",
  WASTE_HANDLING_AND_DISPOSAL = "WASTE_HANDLING_AND_DISPOSAL",
  CONSTRUCTION = "CONSTRUCTION",
  MINING_MINERAL_PRODUCTION = "MINING_MINERAL_PRODUCTION",
  FUGITIVE_EMISSIONS_PRODUCTION = "FUGITIVE_EMISSIONS_PRODUCTION",
  SOLVENT_USE = "SOLVENT_USE",
  NOT_APPLICABLE = "N/A",
}

// Alphabetical order of each scope's displayed label (see
// web/public/locales/i18n/projectList/en.json) - the raw stored codes don't
// alphabetize the same way, e.g. WASTE_FROM_FUELS displays as "Fugitive
// Emissions from Fuels (Solid, Oil and Gas)". Keep in sync when adding a new
// InfSectoralScopeEnum value.
export const SECTORAL_SCOPE_ALPHABETICAL_ORDER: InfSectoralScopeEnum[] = [
  InfSectoralScopeEnum.AFFORESTATION_AND_REFORESTATION, // Afforestation and Reforestation
  InfSectoralScopeEnum.AGRICULTURE, // Agriculture
  InfSectoralScopeEnum.CHEMICAL_INDUSTRIES, // Chemical Industries
  InfSectoralScopeEnum.CONSTRUCTION, // Construction
  InfSectoralScopeEnum.ENERGY_DEMAND, // Energy Demand
  InfSectoralScopeEnum.ENERGY_DISTRIBUTION, // Energy Distribution
  InfSectoralScopeEnum.ENERGY_INDUSTRIES, // Energy Industries (Renewable - / Non Renewable sources)
  InfSectoralScopeEnum.WASTE_FROM_FUELS, // Fugitive Emissions from Fuels (Solid, Oil and Gas)
  InfSectoralScopeEnum.FUGITIVE_EMISSIONS_PRODUCTION, // Fugitive Emissions from Production and Consumption...
  InfSectoralScopeEnum.MANUFACTURING_INDUSTRIES, // Manufacturing Industries
  InfSectoralScopeEnum.METAL_PRODUCTION, // Metal Production
  InfSectoralScopeEnum.MINING_MINERAL_PRODUCTION, // Mining/Mineral Production
  InfSectoralScopeEnum.NOT_APPLICABLE, // NA
  InfSectoralScopeEnum.SOLVENT_USE, // Solvent Use
  InfSectoralScopeEnum.TRANSPORT, // Transport
  InfSectoralScopeEnum.WASTE_HANDLING_AND_DISPOSAL, // Waste Handling and Disposal
];
