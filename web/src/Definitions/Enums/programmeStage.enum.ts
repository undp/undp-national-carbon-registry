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

export enum ProjectActivityStage {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  NO_OBJECTION_LETTER_GENERATED = 'NO_OBJECTION_LETTER_GENERATED',
  PDD_SUBMITTED = 'PDD_SUBMITTED',
  PDD_REJECTED_BY_CERTIFIER = 'PDD_REJECTED_BY_CERTIFIER',
  PDD_APPROVED_BY_CERTIFIER = 'PDD_APPROVED_BY_CERTIFIER',
  PDD_REJECTED_BY_DNA = 'PDD_REJECTED_BY_DNA',
  PDD_APPROVED_BY_DNA = 'PDD_APPROVED_BY_DNA',
  VALIDATION_REPORT_SUBMITTED = 'VALIDATION_REPORT_SUBMITTED',
  VALIDATION_REPORT_REJECTED = 'VALIDATION_REPORT_REJECTED',
  AUTHORISED = 'AUTHORISED',
  CREDITS_AUTHORISED = 'CREDITS_AUTHORISED',
  MONITORING_REPORT_SUBMITTED = 'MONITORING_REPORT_SUBMITTED',
  MONITORING_REPORT_REJECTED = 'MONITORING_REPORT_REJECTED',
  MONITORING_REPORT_APPROVED = 'MONITORING_REPORT_APPROVED',
  VERIFICATION_REPORT_SUBMITTED = 'VERIFICATION_REPORT_SUBMITTED',
  VERIFICATION_REPORT_REJECTED = 'VERIFICATION_REPORT_REJECTED',
  VERIFICATION_REPORT_APPROVED = 'VERIFICATION_REPORT_APPROVED',
  CREDITS_ISSUED = 'CREDITS_ISSUED',
  CREDIT_TRANSFERED = 'CREDIT_TRANSFERED',
  RETIRE_REQUESTED = 'RETIRE_REQUESTED',
  RETIRE_APPROVED = 'RETIRE_APPROVED',
  RETIRE_REJECTED = 'RETIRE_REJECTED',
  RETIRE_CANCELLED = 'RETIRE_CANCELLED',
}

export enum ActivityStateEnum {
  MONITORING_REPORT_UPLOADED = 'MONITORING_REPORT_UPLOADED',
  MONITORING_REPORT_VERIFIED = 'MONITORING_REPORT_VERIFIED',
  MONITORING_REPORT_REJECTED = 'MONITORING_REPORT_REJECTED',
  VERIFICATION_REPORT_UPLOADED = 'VERIFICATION_REPORT_UPLOADED',
  VERIFICATION_REPORT_VERIFIED = 'VERIFICATION_REPORT_VERIFIED',
  VERIFICATION_REPORT_REJECTED = 'VERIFICATION_REPORT_REJECTED',
}

export enum ProjectProposalStage {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  PDD_SUBMITTED = 'PDD_SUBMITTED',
  PDD_REJECTED_BY_CERTIFIER = 'PDD_REJECTED_BY_CERTIFIER',
  PDD_APPROVED_BY_CERTIFIER = 'PDD_APPROVED_BY_CERTIFIER',
  PDD_REJECTED_BY_DNA = 'PDD_REJECTED_BY_DNA',
  PDD_APPROVED_BY_DNA = 'PDD_APPROVED_BY_DNA',
  VALIDATION_REPORT_SUBMITTED = 'VALIDATION_REPORT_SUBMITTED',
  VALIDATION_REPORT_REJECTED = 'VALIDATION_REPORT_REJECTED',
  AUTHORISED = 'AUTHORISED',

  // all the follwing stages need to be removed
  APPROVED_INF = 'APPROVED_INF',
  REJECTED_INF = 'REJECTED_INF',
  NO_OBJECTION_LETTER_PENDING = 'NO_OBJECTION_LETTER_PENDING',
  NO_OBJECTION_LETTER_GENERATED = 'NO_OBJECTION_LETTER_GENERATED',
  PDD_PENDING = 'PDD_PENDING',
  PDD_SUBMISSION = 'PDD_SUBMISSION',
  PDD_REJECTED = 'PDD_REJECTED',
  PDD_APPROVED = 'PDD_APPROVED',
  VALIDATION_REPORT_SUBMISSION = 'VALIDATION_REPORT_SUBMISSION',
  VALIDATION_REPORT_PENDING = 'VALIDATION_REPORT_PENDING',
  VALIDATION_REPORT_APPROVED = 'VALIDATION_REPORT_APPROVED',
  PROJECT_AUTHORIZED = 'PROJECT_AUTHORIZED',
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
}

export enum ProjectProposalStageMap {
  SUBMITTED_INF = 'INF Pending',
  APPROVED_INF = 'INF Approved',
  REJECTED_INF = 'INF Rejected',
  PROPOSAL_PENDING = 'Proposal Pending',
  ACCEPTED_PROPOSAL = 'Proposal Accepted',
  REJECTED_PROPOSAL = 'Proposal Rejected',
  SUBMITTED_CMA = 'CMA Pending',
  REJECTED_CMA = 'CMA Rejected',
  APPROVED_CMA = 'CMA Approved',
  VALIDATION_PENDING = 'Validation Pending',
  REJECTED_VALIDATION = 'Validation Rejected',
  AUTHORISED = 'Project Authorised',

  // NEW MAP`
  PENDING = 'Pending',
  REJECTED = 'Rejected',
  APPROVED = 'Approved',
  PDD_SUBMITTED = 'PDD Submitted',
  PDD_REJECTED_BY_CERTIFIER = 'PDD Rejected by Certifier',
  PDD_APPROVED_BY_CERTIFIER = 'PDD Approved by Certifier',
  PDD_REJECTED_BY_DNA = 'PDD Rejected by DNA',
  PDD_APPROVED_BY_DNA = 'PDD Approved by DNA',
  VALIDATION_REPORT_SUBMITTED = 'Validation Report Submitted',
  VALIDATION_DNA_REJECTED = 'Validation Report Rejected',
  AUTHORIZED = 'Authorised',
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
  EnergyIndustries = 'Energy Industries',
  EnergyDistribution = 'Energy Distribution',
  EnergyDemand = 'Energy Demand',
  ManufacturingIndustries = 'Manufacturing Industries',
  ChemicalIndustry = 'Chemical Industry',
  Construction = 'Construction',
  Transport = 'Transport',
  MiningMineralProduction = 'Mining/Mineral Production',
  MetalProduction = 'Metal Production',
  FugitiveEmissionsFromFuels = 'Fugitive Emissions from Fuels (Solid, Oil and Gas)',
  FugitiveEmissionsFromHalocarbons = 'Fugitive Emissions from Production and Consumption of Halocarbons and Sulphur Hexafluoride',
  SolventsUse = 'Solvents Use',
  WasteHandlingAndDisposal = 'Waste Handling and Disposal',
  AfforestationAndReforestation = 'Afforestation and Reforestation',
  Agriculture = 'Agriculture',
}
