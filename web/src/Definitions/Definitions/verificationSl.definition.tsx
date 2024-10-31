import { CreditTypeSl } from '../Enums/creditTypeSl.enum';
import { VerificationRequestStatusEnum } from '../Enums/verification.request.status.enum';

export const getVerificationRequestStatusVal = (value: string) => {
  const index = Object.keys(VerificationRequestStatusEnum).indexOf(value);
  if (index < 0) {
    return value;
  }
  return Object.values(VerificationRequestStatusEnum)[index];
};

export const getVerificationRequestStatusType = (stage: VerificationRequestStatusEnum) => {
  switch (getVerificationRequestStatusVal(stage)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED:
      return 'green';
    case VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED:
      return 'orange';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return 'blue';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return 'geekblue';
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return 'red';
    default:
      return 'default';
  }
};

export const getVerificationRequestStatusName = (value: string) => {
  switch (getVerificationRequestStatusVal(value)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED:
      return 'Pending';
    case VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED:
      return 'Verification Pending';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return 'Awaiting Authorisation';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return 'Credit Issued';
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return 'Rejected';
    default:
      return 'Pending';
  }
};
