export interface CreditTransfersInterface {
  id: number;
  serialNumber: string;
  creditAmount: number;
  createdDate: string;
  projectId: number;
  projectName: string;
  receiverId: number;
  receiverName: string;
  receiverLogo: string;
  senderId: number;
  senderName: string;
  senderLogo: string;
  transferStatus: string;
}
