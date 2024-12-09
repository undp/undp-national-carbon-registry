export enum ProgrammeStageR {
  AwaitingAuthorization = 'Pending',
  Approved = 'Approved',
  Authorised = 'Authorised',
  Rejected = 'Rejected',
}

export enum ProgrammeSLStageR {
  AwaitingAuthorization = 'awaitingAuthorization',
  Approved = 'approved',
  Authorised = 'authorised',
  Rejected = 'rejected',
}

export enum ProjectProposalStage {
  SUBMITTED_INF = 'SUBMITTED_INF',
  APPROVED_INF = 'APPROVED_INF',
  REJECTED_INF = 'REJECTED_INF',
  SUBMITTED_COST_QUOTATION = 'SUBMITTED_COST_QUOTATION',
  SUBMITTED_PROPOSAL = 'SUBMITTED_PROPOSAL',
  SUBMITTED_VALIDATION_AGREEMENT = 'SUBMITTED_VALIDATION_AGREEMENT',
  ACCEPTED_PROPOSAL = 'ACCEPTED_PROPOSAL',
  REJECTED_PROPOSAL = 'REJECTED_PROPOSAL',
  SUBMITTED_CMA = 'SUBMITTED_CMA',
  REJECTED_CMA = 'REJECTED_CMA',
  APPROVED_CMA = 'APPROVED_CMA',
  VALIDATION_PENDING = 'VALIDATION_PENDING',
  REJECTED_VALIDATION = 'REJECTED_VALIDATION',
  AUTHORISED = 'AUTHORISED',
}

export enum CreditType {
  TRACK_1 = 'TRACK_1',
  TRACK_2 = 'TRACK_2',
}

export enum ProgrammeStageMRV {
  AwaitingAuthorization = 'Pending',
  Authorised = 'Authorised',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum ProgrammeStageUnified {
  AwaitingAuthorization = 'Pending',
  Authorised = 'Authorised',
  Approved = 'Approved',
  Rejected = 'Rejected',
}
export enum ProgrammeStatus {
  PROPOSAL_STAGE = 'PROPOSAL_STAGE',
  PROCUREMENT_STAGE = 'PROCUREMENT_STAGE',
  CONSTRUCTION_STAGE = 'CONSTRUCTION_STAGE',
  INSTALLATION_STAGE = 'INSTALLATION_STAGE',
}
export enum ProgrammeCategory {
  RENEWABLE_ENERGY = 'RENEWABLE_ENERGY',
  AFFORESTATION = 'AFFORESTATION',
  REFORESTATION = 'REFORESTATION',
  OTHER = 'OTHER',
}

export enum ProgrammeStageLegend {
  AUTHORISED = 'Authorised',
  REJECTED = 'Rejected',
  AWAITING_AUTHORIZATION = 'AwaitingAuthorization',
}

export const getProjectCategory: { [key: string]: string } = {
  RENEWABLE_ENERGY: 'Renewable Energy',
  AFFORESTATION: 'Afforestation',
  REFORESTATION: 'Reforestation',
  OTHER: 'Other',
};

export enum CMASectoralScope {
  EnergyIndustries = 'Energy industries',
  EnergyDistribution = 'Energy distribution',
  EnergyDemand = 'Energy demand',
  ManufacturingIndustries = 'Manufacturing industries',
  ChemicalIndustry = 'Chemical industry',
  Construction = 'Construction',
  Transport = 'Transport',
  MiningMineralProduction = 'Mining/Mineral production',
  MetalProduction = 'Metal production',
  FugitiveEmissionsFromFuels = 'Fugitive emissions from fuels (solid, oil and gas)',
  FugitiveEmissionsFromHalocarbons = 'Fugitive emissions from production and consumption of halocarbons and sulphur hexafluoride',
  SolventsUse = 'Solvents use',
  WasteHandlingAndDisposal = 'Waste handling and disposal',
  AfforestationAndReforestation = 'Afforestation and reforestation',
  Agriculture = 'Agriculture',
}
