import { CreditTransferStage } from '../../Definitions/InterfacesAndType/programme.definitions';
import { BaseEntity } from './BaseEntity';

export class ProgrammeTransfer implements BaseEntity {
  [x: string]: any;

  requestId?: number;

  programmeId?: string;

  initiator?: number;

  initiatorCompanyId?: number;

  toCompanyId?: number;

  toAccount?: string;

  fromCompanyId?: number;

  creditAmount?: number;

  comment?: string;

  txTime?: number;

  status?: CreditTransferStage;

  isRetirement?: boolean;
}
