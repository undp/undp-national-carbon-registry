export interface CreditBalanceInterface {
  id: number;
  serialNumber: string;
  creditAmount: number;
  createdDate: string;
  projectId: number;
  projectName: string;
  receiverId: number;
  receiverName: string;
  receiverLogo: string;
  senderId: number | null;
  senderName: string | null;
  senderLogo: string | null;
  eventType: 'Issued' | 'Received';
}
