import { Sector } from "../enum/sector.enum";
import { ProgrammeStage } from "../enum/programme-status.enum";
import { ProjectProposalStage } from "../enum/projectProposalStage.enum";
import { TxType } from "../enum/txtype.enum";

export const SECTOR_TO_CADT_PROJECT_SECTOR: Record<string, string> = {
  [Sector.Energy]: "Energy",
  [Sector.Forestry]: "Agriculture, forestry and other land use (AFOLU)",
  [Sector.Agriculture]: "Agriculture, forestry and other land use (AFOLU)",
  [Sector.Manufacturing]: "Manufacturing industries",
  [Sector.Waste]: "Waste management and remediation activities",
  [Sector.Transport]: "Transportation and storage",
  [Sector.Health]: "Human health and social work activities",
  [Sector.Education]: "Education",
  [Sector.Hospitality]: "Accommodation and food service activities",
  [Sector.Other]: "Not elsewhere classified",
};

export const PROGRAMME_STAGE_TO_CADT_STATUS: Record<string, string> = {
  [ProgrammeStage.NEW]: "Listed",
  [ProgrammeStage.AWAITING_AUTHORIZATION]: "Listed",
  [ProgrammeStage.APPROVED]: "Registered",
  [ProgrammeStage.AUTHORISED]: "Authorized",
  [ProgrammeStage.REJECTED]: "Rejected",
};

const rejectedProposalStages = new Set([
  ProjectProposalStage.REJECTED_INF,
  ProjectProposalStage.REJECTED_PROPOSAL,
  ProjectProposalStage.REJECTED_CMA,
  ProjectProposalStage.REJECTED_VALIDATION,
  ProjectProposalStage.REJECTED,
  ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER,
  ProjectProposalStage.PDD_REJECTED_BY_DNA,
  ProjectProposalStage.VALIDATION_DNA_REJECTED,
]);

const authorizedProposalStages = new Set([
  ProjectProposalStage.AUTHORIZED,
  ProjectProposalStage.AUTHORISED,
]);

export function mapProposalStageToStatus(
  stage: ProjectProposalStage
): string {
  if (authorizedProposalStages.has(stage)) return "Authorized";
  if (rejectedProposalStages.has(stage)) return "Rejected";
  if (stage === ProjectProposalStage.APPROVED) return "Registered";
  if (stage === ProjectProposalStage.VALIDATION_DNA_APPROVED) return "Validated";
  return "Listed";
}

export const SECTOR_TO_CADT_UNIT_TYPE: Record<string, string> = {
  [Sector.Forestry]: "Removal - nature",
  [Sector.Agriculture]: "Reduction - nature",
  [Sector.Energy]: "Reduction - technical",
  [Sector.Manufacturing]: "Reduction - technical",
  [Sector.Waste]: "Reduction - technical",
  [Sector.Transport]: "Reduction - technical",
  [Sector.Health]: "Reduction - technical",
  [Sector.Education]: "Reduction - technical",
  [Sector.Hospitality]: "Reduction - technical",
  [Sector.Other]: "Not Determined",
};

export const TX_TYPE_TO_CADT_UNIT_STATUS: Record<string, string> = {
  [TxType.ISSUE]: "Held",
  [TxType.ISSUE_SL]: "Held",
  [TxType.APPROVE]: "Held",
  [TxType.RETIRE]: "Retired",
  [TxType.RETIRE_SL]: "Retired",
  [TxType.TRANSFER]: "Exported",
  [TxType.TRANSFER_SL]: "Exported",
  [TxType.CREATE]: "Buffer",
  [TxType.FREEZE]: "Inactive",
  [TxType.REJECT]: "Cancelled",
};

export const SECTOR_TO_METHODOLOGY_TYPE: Record<string, string> = {
  [Sector.Forestry]: "Removal - nature",
  [Sector.Agriculture]: "Reduction - nature",
  [Sector.Energy]: "Reduction - technical",
  [Sector.Manufacturing]: "Reduction - technical",
  [Sector.Waste]: "Reduction - technical",
  [Sector.Transport]: "Reduction - technical",
  [Sector.Health]: "Reduction - technical",
  [Sector.Education]: "Reduction - technical",
  [Sector.Hospitality]: "Reduction - technical",
  [Sector.Other]: "Reduction - technical",
};

export function mapSectorToProjectSector(sector: string): string[] {
  return [SECTOR_TO_CADT_PROJECT_SECTOR[sector] || "Not elsewhere classified"];
}

export function mapProgrammeStageToStatus(stage: ProgrammeStage): string {
  return PROGRAMME_STAGE_TO_CADT_STATUS[stage] || "Listed";
}

export function mapTxTypeToUnitStatus(txType: TxType): string {
  return TX_TYPE_TO_CADT_UNIT_STATUS[txType] || "Held";
}

export function mapSectorToUnitType(sector: string): string {
  return SECTOR_TO_CADT_UNIT_TYPE[sector] || "Not Determined";
}

export function mapSectorToMethodologyType(sector: string): string {
  return SECTOR_TO_METHODOLOGY_TYPE[sector] || "Reduction - technical";
}
