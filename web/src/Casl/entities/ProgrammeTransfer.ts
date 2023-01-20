import { BaseEntity } from './BaseEntity';

export class ProgrammeTransfer implements BaseEntity {
  requestId?: number;

  programmeId?: string;

  requesterId?: number;

  requesterCompanyId?: number;

  creditAmount?: number;

  comment?: string;

  companyId?: number[];
}
