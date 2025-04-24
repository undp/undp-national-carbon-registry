import { DataExportDto } from "./data.export.dto";

export class DataExportHoldings extends DataExportDto {
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
}
