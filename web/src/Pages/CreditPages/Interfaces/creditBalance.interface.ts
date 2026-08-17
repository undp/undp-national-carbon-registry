import { IssuedOrReceivedOptions } from "../Enums/creditEventEnum";

export interface CreditBalanceInterface {
  id: string;
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
  type: IssuedOrReceivedOptions;
  accountType?: string;
  // Non-null ⇒ the block is ITMO authorized.
  itmoAuthorizationRecord?: string | null;
  itmoCooperativeApproachId?: string | null;
  // AuthorizationPurpose value (see Definitions/Enums/authorizationPurpose.enum.ts).
  itmoAuthorizationPurpose?: string | null;
  // Dec 6/CMA.4 Annex I para 5 ITMO identifier. Null for MO blocks.
  itmoSerial?: string | null;
}
