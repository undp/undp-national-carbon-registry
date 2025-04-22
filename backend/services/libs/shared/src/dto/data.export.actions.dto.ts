import { DataExportDto } from "./data.export.dto";

export class DataExportActions extends DataExportDto {
  party: string;
  reportedYear: string;
  article6RecordId: string;
  cooperativeApproach: string;
  firstUniqueIdentifier: string;
  lastUniqueIdentifier: string;
  creditBlockStartId: string;
  creditBlockEndId: string;
  metric: string;
  quantityInMetric: string;
  creditAmount: number;
  conversionFactor: string;
  firstTransferingParty: string;
  vintage: string;
  sector: string;
  sectoralScope: string;
  projectAuthorizationTime: string;
  authorizationId: string;
  purposeForAuthorization: string;
  oimp: string;
  firstTransferDefinition: string;
  actionTime: string;
  actionType: string;
  transferingParty: string;
  aquiringParty: string;
  actionBy: string;
  purposeForCancellation: string;
}
