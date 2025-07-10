import { CreditTransferStage } from '../Enums/creditTransferStage.enum';
import { CreditTypeSl } from '../Enums/creditTypeSl.enum';
import { BaseEntity } from './baseEntity';

export class CreditRetirementSl implements BaseEntity {
  [x: string]: any;

  requestId?: number;

  programmeId?: string;

  programmeSerialNo?: string;

  toCompanyId?: number;

  toCompany!: any[];

  fromCompanyId?: number;

  fromCompany!: any[];

  creditAmount?: number;

  comment?: string;

  txRef?: string;

  txTime?: number;

  status?: CreditTransferStage;

  createdTime?: number;

  creditType?: CreditTypeSl;
}
