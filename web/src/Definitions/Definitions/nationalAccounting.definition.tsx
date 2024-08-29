import { CreditAuditLogType } from '../Enums/creditAuditLogType.enum';

export const getCreditAuditStageTagType = (stage: CreditAuditLogType) => {
  switch (stage) {
    case CreditAuditLogType.CREDIT_AUTHORIZED:
      return 'processing';
    case CreditAuditLogType.CREDIT_ISSUED:
      return 'green';
    case CreditAuditLogType.CREDIT_RETIRED:
      return 'default';
    default:
      return 'default';
  }
};
