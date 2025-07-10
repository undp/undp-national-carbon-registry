import { CreditAuditLogType } from '../Enums/creditAuditLogType.enum';
import { BaseEntity } from './baseEntity';

export class CreditAuditLog implements BaseEntity {
  id?: string;

  programmeId?: string;

  type?: CreditAuditLogType;

  country?: string;

  credits?: number;

  createdTime?: Date;

  createdBy?: number;
}
