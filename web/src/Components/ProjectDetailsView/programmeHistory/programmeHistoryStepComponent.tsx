import React from 'react';
import { Steps } from 'antd';
import { FileOutlined } from '@ant-design/icons';

import * as Icon from 'react-bootstrap-icons';

import './programmeHistoryStepComponent.scss';
import { DateTime } from 'luxon';
import { dateTimeFormat } from '../../../Definitions/Definitions/common.definitions';

interface ProgrammeLog {
  id: number;
  programmeId: string;
  logType: string;
  data: Record<string, any> | null;
  userId: number;
  createdTime: string;
  name: string;
  companyRole: string;
  role: string;
}

const logTypeIcons: Record<string, React.ReactNode> = {
  CREATE: <Icon.CaretRight />,
  INF_APPROVED: <Icon.FileEarmarkCheck />,
  INF_REJECTED: <Icon.FileEarmarkX />,
  CREATE_COST_QUOTATION: <Icon.FileText />,
  CREATE_PROJECT_PROPOSAL: <Icon.FileText />,
  CREATE_VALIDATION_AGREEMENT: <Icon.FileText />,
  PROJECT_PROPOSAL_ACCEPTED: <Icon.Check2Circle />,
  PROJECT_PROPOSAL_REJECTED: <Icon.FileX />,
  CMA_CREATE: <Icon.FileEarmark />,
  CMA_APPROVED: <Icon.FileEarmarkCheck />,
  CMA_REJECTED: <Icon.FileEarmarkX />,
  VALIDATION_REPORT_CREATED: <Icon.FileEarmarkBarGraph />,
  VALIDATION_REPORT_APPROVED: <Icon.FileEarmarkCheck />,
  VALIDATION_REPORT_REJECTED: <Icon.FileEarmarkX />,
  AUTHORISED: <Icon.Clipboard2Check />,
  MONITORING_CREATE: <Icon.ListUl />,
  MONITORING_APPROVED: <Icon.ListCheck />,
  MONITORING_REJECTED: <Icon.BookmarkX />,
  VERIFICATION_CREATE: <Icon.CardList />,
  VERIFICATION_APPROVED: <Icon.CardChecklist />,
  VERIFICATION_REJECTED: <Icon.BookmarkX />,
  CREDIT_ISSUED: <Icon.CurrencyExchange />,
  TRANSFER_REQUESTED: <Icon.ClockHistory />,
  TRANSFER_APPROVED: <Icon.BoxArrowRight />,
  TRANSFER_REJECTED: <Icon.XOctagon />,
  TRANSFER_CANCELLED: <Icon.ExclamationOctagon />,
  RETIRE_REQUESTED: <Icon.ClockHistory />,
  RETIRE_APPROVED: <Icon.Save />,
  RETIRE_REJECTED: <Icon.XOctagon />,
  RETIRE_CANCELLED: <Icon.ExclamationOctagon />,
  DEFAULT: <FileOutlined />, // Default icon for unspecified log types
};

interface ProgrammeHistoryStepsProps {
  historyData: ProgrammeLog[];
  translator: any;
}

const formatString = (langTag: string, vargs: any[], t: any) => {
  const str = t(langTag);
  const parts = str.split('{}');
  let insertAt = 1;
  for (const arg of vargs) {
    parts.splice(insertAt, 0, arg);
    insertAt += 2;
  }
  return parts.join('');
};

const getLogDescription = (log: any, t: any) => {
  switch (log.logType) {
    case 'CREATE':
      return formatString('slcfProgrammeTimeline:programmeCreatedDescription', [log.name], t);
      break;
    case 'INF_APPROVED':
      return formatString('slcfProgrammeTimeline:infApprovedDescription', [log.name], t);
      break;
    case 'INF_REJECTED':
      return formatString('slcfProgrammeTimeline:infRejectedDescription', [log.name], t);
      break;
    case 'CREATE_COST_QUOTATION':
      return formatString('slcfProgrammeTimeline:costQuoteCreatedDescription', [log.name], t);
      break;
    case 'CREATE_PROJECT_PROPOSAL':
      return formatString('slcfProgrammeTimeline:proposalCreatedDescription', [log.name], t);
      break;
    case 'CREATE_VALIDATION_AGREEMENT':
      return formatString(
        'slcfProgrammeTimeline:validationAgreementCreatedDescription',
        [log.name],
        t
      );
      break;
    case 'PROJECT_PROPOSAL_ACCEPTED':
      return formatString(
        'slcfProgrammeTimeline:projectProposalAcceptedDescription',
        [log.name],
        t
      );
      break;
    case 'PROJECT_PROPOSAL_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:projectProposalRejectedDescription',
        [log.name],
        t
      );
      break;
    case 'CMA_CREATE':
      return formatString('slcfProgrammeTimeline:cmaCreatedDescription', [log.name], t);
      break;
    case 'CMA_APPROVED':
      return formatString('slcfProgrammeTimeline:cmaApprovedDescription', [log.name], t);
      break;
    case 'CMA_REJECTED':
      return formatString('slcfProgrammeTimeline:cmaRejectedDescription', [log.name], t);
      break;
    case 'VALIDATION_REPORT_CREATED':
      return formatString(
        'slcfProgrammeTimeline:validationReportCreatedDescription',
        [log.name],
        t
      );
      break;
    case 'VALIDATION_REPORT_APPROVED':
      return formatString(
        'slcfProgrammeTimeline:validationReportApprovedDescription',
        [log.name],
        t
      );
      break;
    case 'AUTHORISED':
      return formatString('slcfProgrammeTimeline:authorisedDescription', [], t);
      break;
    case 'VALIDATION_REPORT_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:validationReportRejectedDescription',
        [log.name],
        t
      );
      break;
    case 'MONITORING_CREATE':
      return formatString(
        'slcfProgrammeTimeline:monitoringReportCreatedDescription',
        [log.name],
        t
      );
      break;
    case 'MONITORING_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:monitoringReportRejectedDescription',
        [log.name],
        t
      );
      break;
    case 'MONITORING_APPROVED':
      return formatString(
        'slcfProgrammeTimeline:monitoringReportApprovedDescription',
        [log.name],
        t
      );
      break;
    case 'VERIFICATION_CREATE':
      return formatString(
        'slcfProgrammeTimeline:verificationReportCreatedDescription',
        [log.name],
        t
      );
      break;
    case 'VERIFICATION_APPROVED':
      return formatString(
        'slcfProgrammeTimeline:verificationReportApprovedDescription',
        [log.name],
        t
      );
      break;
    case 'VERIFICATION_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:verificationReportRejectedDescription',
        [log.name],
        t
      );
      break;
    case 'CREDIT_ISSUED':
      return formatString(
        'slcfProgrammeTimeline:creditIssuedDescription',
        [log.data.creditIssued],
        t
      );
      break;
    case 'TRANSFER_REQUESTED':
      return formatString(
        'slcfProgrammeTimeline:transferRequestedDescription',
        [log.name, log.data.creditAmount, log.toCompanyName],
        t
      );
      break;
    case 'TRANSFER_APPROVED':
      return formatString('slcfProgrammeTimeline:transferApprovedDescription', [log.name], t);
      break;
    case 'TRANSFER_CANCELLED':
      return formatString(
        'slcfProgrammeTimeline:transferCancelledDescription',
        [log.name, log.data.creditAmount],
        t
      );
      break;
    case 'TRANSFER_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:transferRejectedDescription',
        [log.name, log.data.creditAmount, log.toCompanyName],
        t
      );
      break;
    case 'RETIRE_REQUESTED':
      return formatString(
        'slcfProgrammeTimeline:retireRequestedDescription',
        [log.name, log.data.creditAmount],
        t
      );
      break;
    case 'RETIRE_APPROVED':
      return formatString('slcfProgrammeTimeline:retireApprovedDescription', [log.name], t);
      break;
    case 'RETIRE_CANCELLED':
      return formatString(
        'slcfProgrammeTimeline:retireCancelledDescription',
        [log.name, log.data.creditAmount],
        t
      );
      break;
    case 'RETIRE_REJECTED':
      return formatString(
        'slcfProgrammeTimeline:retireRejectedDescription',
        [log.name, log.data.creditAmount],
        t
      );
      break;

    default:
      break;
  }
};

const getLogTitle = (logType: any) => {
  switch (logType) {
    case 'CREATE':
      return 'slcfProgrammeTimeline:programmeCreatedTitle';
      break;
    case 'INF_APPROVED':
      return 'slcfProgrammeTimeline:infApprovedTitle';
      break;
    case 'INF_REJECTED':
      return 'slcfProgrammeTimeline:infRejectedTitle';
      break;
    case 'CREATE_COST_QUOTATION':
      return 'slcfProgrammeTimeline:costQuoteCreatedTitle';
      break;
    case 'CREATE_PROJECT_PROPOSAL':
      return 'slcfProgrammeTimeline:proposalCreatedTitle';
      break;
    case 'CREATE_VALIDATION_AGREEMENT':
      return 'slcfProgrammeTimeline:validationAgreementCreatedTitle';
      break;
    case 'PROJECT_PROPOSAL_ACCEPTED':
      return 'slcfProgrammeTimeline:projectProposalAcceptedTitle';
      break;
    case 'PROJECT_PROPOSAL_REJECTED':
      return 'slcfProgrammeTimeline:projectProposalRejectedTitle';
      break;
    case 'CMA_CREATE':
      return 'slcfProgrammeTimeline:cmaCreatedTitle';
      break;
    case 'CMA_APPROVED':
      return 'slcfProgrammeTimeline:cmaApprovedTitle';
      break;
    case 'CMA_REJECTED':
      return 'slcfProgrammeTimeline:cmaRejectedTitle';
      break;
    case 'VALIDATION_REPORT_CREATED':
      return 'slcfProgrammeTimeline:validationReportCreatedTitle';
      break;
    case 'VALIDATION_REPORT_APPROVED':
      return 'slcfProgrammeTimeline:validationReportApprovedTitle';
      break;
    case 'AUTHORISED':
      return 'slcfProgrammeTimeline:authorisedTitle';
      break;
    case 'VALIDATION_REPORT_REJECTED':
      return 'slcfProgrammeTimeline:validationReportRejectedTitle';
      break;
    case 'MONITORING_CREATE':
      return 'slcfProgrammeTimeline:monitoringReportCreatedTitle';
      break;
    case 'MONITORING_REJECTED':
      return 'slcfProgrammeTimeline:monitoringReportRejectedTitle';
      break;
    case 'MONITORING_APPROVED':
      return 'slcfProgrammeTimeline:monitoringReportApprovedTitle';
      break;
    case 'VERIFICATION_CREATE':
      return 'slcfProgrammeTimeline:verificationReportCreatedTitle';
      break;
    case 'VERIFICATION_APPROVED':
      return 'slcfProgrammeTimeline:verificationReportApprovedTitle';
      break;
    case 'VERIFICATION_REJECTED':
      return 'slcfProgrammeTimeline:verificationReportRejectedTitle';
      break;
    case 'CREDIT_ISSUED':
      return 'slcfProgrammeTimeline:creditIssuedTitle';
      break;
    case 'TRANSFER_REQUESTED':
      return 'slcfProgrammeTimeline:transferRequestedTitle';
      break;
    case 'TRANSFER_APPROVED':
      return 'slcfProgrammeTimeline:transferApprovedTitle';
      break;
    case 'TRANSFER_CANCELLED':
      return 'slcfProgrammeTimeline:transferCancelledTitle';
      break;
    case 'TRANSFER_REJECTED':
      return 'slcfProgrammeTimeline:transferRejectedTitle';
      break;
    case 'RETIRE_REQUESTED':
      return 'slcfProgrammeTimeline:retireRequestedTitle';
      break;
    case 'RETIRE_APPROVED':
      return 'slcfProgrammeTimeline:retireApprovedTitle';
      break;
    case 'RETIRE_CANCELLED':
      return 'slcfProgrammeTimeline:retireCancelledTitle';
      break;
    case 'RETIRE_REJECTED':
      return 'slcfProgrammeTimeline:retireRejectedTitle';
      break;

    default:
      break;
  }
};

const ProgrammeHistoryStepsComponent: React.FC<ProgrammeHistoryStepsProps> = ({
  historyData,
  translator,
}) => {
  const t = translator;
  const items = historyData.map((log) => ({
    title: t(getLogTitle(log.logType)),
    subTitle: DateTime.fromMillis(Number(log.createdTime)).toFormat(dateTimeFormat),
    description: (
      <div>
        <div>{getLogDescription(log, t)}</div>
        {log.data?.ref && <div>{`${t('slcfProgrammeTimeline:ref')} : ${log.data?.ref}`}</div>}
        {log.data?.remark && (
          <div>{`${t('slcfProgrammeTimeline:remarks')} : ${log.data?.remark}`}</div>
        )}
      </div>
    ),
    icon: (
      <span className={`${log.logType.toLowerCase()} timeline-icon`}>
        {logTypeIcons[log.logType] || logTypeIcons.DEFAULT}
      </span>
    ),
  }));

  return (
    <Steps
      direction="vertical"
      current={0} // Set current step as needed
      items={items}
    />
  );
};

export default ProgrammeHistoryStepsComponent;
