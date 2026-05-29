import { ActivityStateEnum } from '../Enums/activityStatus.enum';
import { CreditEventStatusEnum, CreditEventTypeEnum } from '../Enums/creditEventEnum';
import { ProjectProposalStage } from '../Enums/projectProposalStage.enum';

export interface GetAllDataCounts {
  totalProjects: number;
  totalCreditsIssued: number;
  totalCreditsRetired: number;
}

export interface ActivityEntityResponse {
  id?: number;
  refId?: string;
  activityDocs: any[];
  project: any;
  documents?: any[];
  version?: number;
  state: ActivityStateEnum;
}

export interface CreditEventsEntityResponse {
  id?: number;
  tokenId: string;
  transferId: string;
  batchSerialNumnber: string;
  serialNumnber: number;
  project: any;
  sender?: any;
  receiver?: any;
  type: CreditEventTypeEnum;
  status: CreditEventStatusEnum;
  createdDate?: number;
  updatedDate?: number;
}

export interface ProjectEntityResponse {
  id: number;
  refId: string;
  title: string;
  sectoralScope: string;
  activities?: ActivityEntityResponse[];
  creditEvents?: any[];
  organization?: any;
  createdBy?: any;
  approvedBy?: any;
  assignees?: any[];
  projectProposalStage: ProjectProposalStage;
  documents?: any[];
  creditEst?: number;
  creditIssued?: number;
  creditRetired?: number;
  creditFrozen?: number;
  creditTransferred?: number;
  noObjectionLetterUrl?: string;
  creditCertificateUrl?: string;
  createdDate?: number;
}
