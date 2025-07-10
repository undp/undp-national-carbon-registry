export interface CreditRetirementInterface {
  id: number;
  serialNumber: string;
  creditAmount: number;
  createdDate: string;
  retirementType: string;
  country?: string;
  status: string;
  projectId: number;
  projectName: string;
  senderId: number;
  senderName: string;
  senderLogo: string;
  organizationName: string;
}
