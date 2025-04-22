import { CloseCircleFilled, CloseOutlined, FileProtectOutlined } from '@ant-design/icons';
import { CreditTypeSl } from '../Enums/creditTypeSl.enum';
import { VerificationRequestStatusEnum } from '../Enums/verification.request.status.enum';
import * as Icon from 'react-bootstrap-icons';

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
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return 'orange';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return 'blue';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return 'geekblue';
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
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
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return 'Verification Pending';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return 'Awaiting Authorisation';
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return 'Credit Issued';
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
      return 'Report Declined';
    default:
      return 'Pending';
  }
};

export const getVerificationTimelineCurrentStep = (value: string) => {
  switch (getVerificationRequestStatusVal(value)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED:
      return 0;
    case VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED:
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return 1;
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return 1;
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return 2;
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
      return 0;
    default:
      return 0;
  }
};

export const getMonitoringContent = (stage: VerificationRequestStatusEnum) => {
  switch (getVerificationRequestStatusVal(stage)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
      return {
        statusKey: 'rejected',
        icon: <CloseCircleFilled />,
        className: 'monitoring-rejected',
      };
    case VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED:
      return {
        statusKey: 'submitted',
        icon: <Icon.ListUl />,
        className: 'monitoring-submitted',
      };
    default:
      return {
        statusKey: 'completed',
        icon: <Icon.CheckCircleFill />,
        className: 'monitoring-approved',
      };
  }
};

export const getVerificationContent = (stage: VerificationRequestStatusEnum) => {
  switch (getVerificationRequestStatusVal(stage)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_UPLOADED:
      return {
        statusKey: 'pending',
        icon: <Icon.CardList />,
        className: 'verification-pending',
      };
    case VerificationRequestStatusEnum.MONITORING_REPORT_VERIFIED:
      return {
        statusKey: 'pending',
        icon: <Icon.CardList />,
        className: 'verification-current',
      };
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_UPLOADED:
      return {
        statusKey: 'submitted',
        icon: <Icon.CardList />,
        className: 'verification-submitted',
      };
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
      return {
        statusKey: '',
        icon: <CloseOutlined />,
        className: 'verification-pending monitoring-rejected-verification',
      };
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return {
        statusKey: 'rejected',
        icon: <CloseCircleFilled />,
        className: 'verification-rejected',
      };
    default:
      return {
        statusKey: 'completed',
        icon: <Icon.CheckCircleFill />,
        className: 'verification-approved',
      };
  }
};

export const getIssuerCertificateContent = (stage: VerificationRequestStatusEnum) => {
  switch (getVerificationRequestStatusVal(stage)) {
    case VerificationRequestStatusEnum.MONITORING_REPORT_REJECTED:
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_REJECTED:
      return {
        statusKey: '',
        icon: <CloseOutlined />,
        className: 'issue-cert-pending',
      };
    case VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED:
      return {
        statusKey: 'completed',
        icon: <Icon.CheckCircleFill />,
        className: 'issue-cert-approved',
      };
    default:
      return {
        statusKey: 'pending',
        icon: <FileProtectOutlined />,
        className: 'issue-cert-pending',
      };
  }
};
