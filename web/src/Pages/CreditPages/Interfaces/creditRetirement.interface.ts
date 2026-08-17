export interface CreditRetirementInterface {
  id: number;
  serialNumber: string;
  creditAmount: number;
  createdDate: string;
  subType: string;
  // Destination counterparty country, populated for ITMO Use-Towards-NDC
  // / Use-For-OIMP retirements.
  country?: string;
  status: string;
  projectId: number;
  projectName: string;
  projectOwnerId: number;
  senderId: number;
  senderName: string;
  senderLogo: string;
  // Authorized entity name, populated only for Use-For-OIMP retirements.
  entityName?: string;
  // Dec 6/CMA.4 Annex I para 5 ITMO identifier of the retired block.
  // Null for MO blocks.
  itmoSerial?: string | null;
  // Non-null ⇒ the retired block was ITMO authorized.
  itmoAuthorizationRecord?: string | null;
}
