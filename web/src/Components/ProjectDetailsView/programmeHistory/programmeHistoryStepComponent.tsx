import React from 'react';
import { Steps } from 'antd';
import { FileOutlined } from '@ant-design/icons';

import * as Icon from 'react-bootstrap-icons';

import './programmeHistoryStepComponent.scss';
import { DateTime } from 'luxon';
import { dateTimeFormat } from '../../../Definitions/Definitions/common.definitions';
import { ProjectActivityStage } from '../../../Definitions/Enums/programmeStage.enum';

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
  PENDING: <Icon.CaretRight />,
  REJECTED: <Icon.XCircle />,
  APPROVED: <Icon.Check2Circle />,
  PDD_SUBMITTED: <Icon.FileText />,
  NO_OBJECTION_LETTER_GENERATED: <Icon.FileText />,
  PDD_REJECTED_BY_CERTIFIER: <Icon.FileX />,
  PDD_APPROVED_BY_CERTIFIER: <Icon.Check2Circle />,
  PDD_REJECTED_BY_DNA: <Icon.FileX />,
  PDD_APPROVED_BY_DNA: <Icon.Check2Circle />,
  VALIDATION_REPORT_SUBMITTED: <Icon.FileText />,
  VALIDATION_REPORT_REJECTED: <Icon.FileX />,
  AUTHORISED: <Icon.ClipboardCheck />,
  CREDITS_AUTHORISED: <Icon.FileCheck />,
  MONITORING_REPORT_SUBMITTED: <Icon.ListCheck />,
  MONITORING_REPORT_REJECTED: <Icon.FileX />,
  MONITORING_REPORT_APPROVED: <Icon.Check2Circle />,
  VERIFICATION_REPORT_SUBMITTED: <Icon.FileEarmarkBarGraph />,
  VERIFICATION_REPORT_REJECTED: <Icon.FileX />,
  VERIFICATION_REPORT_APPROVED: <Icon.Check2Circle />,
  CREDITS_ISSUED: <Icon.CurrencyExchange />,
  CREDIT_TRANSFERED: <Icon.BoxArrowRight />,
  RETIRE_REQUESTED: <Icon.BoxArrowInDown />,
  RETIRE_APPROVED: <Icon.Check2Circle />,
  RETIRE_REJECTED: <Icon.FileX />,
  RETIRE_CANCELLED: <Icon.X />,
  DEFAULT: <FileOutlined />,
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
  const countryName = process.env.REACT_APP_COUNTRY_NAME || 'CountryX';
  switch (log.logType) {
    case ProjectActivityStage.PENDING:
      return formatString('slcfProgrammeTimeline:programmeCreatedDescription', [log.name], t);
      break;
    case ProjectActivityStage.APPROVED:
      return formatString('slcfProgrammeTimeline:infApprovedDescription', [log.name], t);
      break;
    case ProjectActivityStage.REJECTED:
      return formatString('slcfProgrammeTimeline:infRejectedDescription', [log.name], t);
      break;
    case ProjectActivityStage.NO_OBJECTION_LETTER_GENERATED:
      return formatString('slcfProgrammeTimeline:noObjectionLetterGeneratedDescription', [], t);
    case ProjectActivityStage.PDD_SUBMITTED:
      return formatString('slcfProgrammeTimeline:pddSubmittedDescription', [log.name], t);
    case ProjectActivityStage.PDD_REJECTED_BY_CERTIFIER:
      return formatString('slcfProgrammeTimeline:pddRejectedDescription', [log.name], t);
    case ProjectActivityStage.PDD_APPROVED_BY_CERTIFIER:
      return formatString('slcfProgrammeTimeline:pddApprovedDescription', [log.name], t);
    case ProjectActivityStage.PDD_REJECTED_BY_DNA:
      return formatString('slcfProgrammeTimeline:pddRejectedDescription', [log.name], t);
    case ProjectActivityStage.PDD_APPROVED_BY_DNA:
      return formatString('slcfProgrammeTimeline:pddApprovedDescription', [log.name], t);
    case ProjectActivityStage.VALIDATION_REPORT_SUBMITTED:
      return formatString(
        'slcfProgrammeTimeline:validationReportCreatedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.VALIDATION_REPORT_REJECTED:
      return formatString(
        'slcfProgrammeTimeline:validationReportRejectedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.AUTHORISED:
      return formatString('slcfProgrammeTimeline:authorisedDescription', [], t);
    case ProjectActivityStage.CREDITS_AUTHORISED:
      return formatString(
        'slcfProgrammeTimeline:creditsAuthorisedDescription',
        [log.data.amount],
        t
      );
    case ProjectActivityStage.MONITORING_REPORT_SUBMITTED:
      return formatString(
        'slcfProgrammeTimeline:monitoringReportCreatedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.MONITORING_REPORT_REJECTED:
      return formatString(
        'slcfProgrammeTimeline:monitoringReportRejectedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.MONITORING_REPORT_APPROVED:
      return formatString(
        'slcfProgrammeTimeline:monitoringReportApprovedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.VERIFICATION_REPORT_SUBMITTED:
      return formatString(
        'slcfProgrammeTimeline:verificationReportCreatedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.VERIFICATION_REPORT_REJECTED:
      return formatString(
        'slcfProgrammeTimeline:verificationReportRejectedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.VERIFICATION_REPORT_APPROVED:
      return formatString(
        'slcfProgrammeTimeline:verificationReportApprovedDescription',
        [log.name],
        t
      );
    case ProjectActivityStage.CREDITS_ISSUED:
      return formatString('slcfProgrammeTimeline:creditIssuedDescription', [log.data.amount], t);
    case ProjectActivityStage.CREDIT_TRANSFERED:
      return formatString(
        'slcfProgrammeTimeline:creditTransferedDescription',
        [log.data.amount, log.toCompanyName, log.fromCompanyName],
        t
      );
    case ProjectActivityStage.RETIRE_REQUESTED:
      return formatString(
        'slcfProgrammeTimeline:retireRequestedDescription',
        [log.data.amount, log.fromCompanyName, log.data.retirementType],
        t
      );
    case ProjectActivityStage.RETIRE_CANCELLED:
      return formatString(
        'slcfProgrammeTimeline:retirementCancelledDescription',
        [log.data.amount, log.fromCompanyName, log.data.retirementType],
        t
      );
    case ProjectActivityStage.RETIRE_APPROVED:
      return formatString(
        'slcfProgrammeTimeline:retirementApprovedDescription',
        [log.data.amount, log.fromCompanyName, log.data.retirementType],
        t
      );
    case ProjectActivityStage.RETIRE_REJECTED:
      return formatString(
        'slcfProgrammeTimeline:retirementRejectedDescription',
        [log.data.amount, log.fromCompanyName, log.data.retirementType],
        t
      );
    default:
      break;
    // case 'CREATE_COST_QUOTATION':
    //   return formatString(
    //     'slcfProgrammeTimeline:costQuoteCreatedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'CREATE_PROJECT_PROPOSAL':
    //   return formatString(
    //     'slcfProgrammeTimeline:proposalCreatedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'CREATE_VALIDATION_AGREEMENT':
    //   return formatString(
    //     'slcfProgrammeTimeline:validationAgreementCreatedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'PROJECT_PROPOSAL_ACCEPTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:projectProposalAcceptedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'PROJECT_PROPOSAL_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:projectProposalRejectedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'CMA_CREATE':
    //   return formatString('slcfProgrammeTimeline:cmaCreatedDescription', [log.name], t);
    //   break;
    // case 'CMA_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:cmaApprovedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'CMA_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:cmaRejectedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'VALIDATION_REPORT_CREATED':
    //   return formatString(
    //     'slcfProgrammeTimeline:validationReportCreatedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'VALIDATION_REPORT_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:validationReportApprovedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'AUTHORISED':
    //   return formatString('slcfProgrammeTimeline:authorisedDescription', [], t);
    //   break;
    // case 'VALIDATION_REPORT_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:validationReportRejectedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'MONITORING_CREATE':
    //   return formatString(
    //     'slcfProgrammeTimeline:monitoringReportCreatedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'MONITORING_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:monitoringReportRejectedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'MONITORING_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:monitoringReportApprovedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'VERIFICATION_CREATE':
    //   return formatString(
    //     'slcfProgrammeTimeline:verificationReportCreatedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'VERIFICATION_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:verificationReportApprovedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'VERIFICATION_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:verificationReportRejectedDescription',
    //     [log.name],
    //     t
    //   );
    //   break;
    // case 'CREDIT_ISSUED':
    //   return formatString(
    //     'slcfProgrammeTimeline:creditIssuedDescription',
    //     [log.data.creditIssued],
    //     t
    //   );
    //   break;
    // case 'TRANSFER_REQUESTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:transferRequestedDescription',
    //     [log.name, log.data.creditAmount, log.toCompanyName],
    //     t
    //   );
    //   break;
    // case 'TRANSFER_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:transferApprovedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'TRANSFER_CANCELLED':
    //   return formatString(
    //     'slcfProgrammeTimeline:transferCancelledDescription',
    //     [log.name, log.data.creditAmount],
    //     t
    //   );
    //   break;
    // case 'TRANSFER_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:transferRejectedDescription',
    //     [log.name, countryName, log.data.creditAmount, log.toCompanyName],
    //     t
    //   );
    //   break;
    // case 'RETIRE_REQUESTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:retireRequestedDescription',
    //     [log.name, log.data.creditAmount],
    //     t
    //   );
    //   break;
    // case 'RETIRE_APPROVED':
    //   return formatString(
    //     'slcfProgrammeTimeline:retireApprovedDescription',
    //     [log.name, countryName],
    //     t
    //   );
    //   break;
    // case 'RETIRE_CANCELLED':
    //   return formatString(
    //     'slcfProgrammeTimeline:retireCancelledDescription',
    //     [log.name, log.data.creditAmount],
    //     t
    //   );
    //   break;
    // case 'RETIRE_REJECTED':
    //   return formatString(
    //     'slcfProgrammeTimeline:retireRejectedDescription',
    //     [log.name, countryName, log.data.creditAmount],
    //     t
    //   );
    //   break;
  }
};

const getLogTitle = (logType: any) => {
  switch (logType) {
    case ProjectActivityStage.PENDING:
      return 'slcfProgrammeTimeline:programmeCreatedTitle';
      break;
    case ProjectActivityStage.APPROVED:
      return 'slcfProgrammeTimeline:infApprovedTitle';
      break;
    case ProjectActivityStage.REJECTED:
      return 'slcfProgrammeTimeline:infRejectedTitle';
      break;
    case ProjectActivityStage.NO_OBJECTION_LETTER_GENERATED:
      return 'slcfProgrammeTimeline:noObjectionLetterGeneratedTitle';
      break;
    case ProjectActivityStage.PDD_SUBMITTED:
      return 'slcfProgrammeTimeline:pddSubmttedTitle';
      break;
    case ProjectActivityStage.PDD_APPROVED_BY_CERTIFIER:
      return 'slcfProgrammeTimeline:pddApprovedICTitle';
      break;
    case ProjectActivityStage.PDD_REJECTED_BY_CERTIFIER:
      return 'slcfProgrammeTimeline:pddRejectedICTitle';
      break;
    case ProjectActivityStage.PDD_APPROVED_BY_DNA:
      return 'slcfProgrammeTimeline:pddApprovedDNATitle';
      break;
    case ProjectActivityStage.PDD_REJECTED_BY_DNA:
      return 'slcfProgrammeTimeline:pddRejectedDNATitle';
      break;
    case ProjectActivityStage.VALIDATION_REPORT_SUBMITTED:
      return 'slcfProgrammeTimeline:validationReportCreatedTitle';
      break;
    case ProjectActivityStage.VALIDATION_REPORT_REJECTED:
      return 'slcfProgrammeTimeline:validationReportRejectedTitle';
      break;
    case ProjectActivityStage.AUTHORISED:
      return 'slcfProgrammeTimeline:authorisedTitle';
      break;
    case ProjectActivityStage.CREDITS_AUTHORISED:
      return 'slcfProgrammeTimeline:creditsAuthorisedTitle';
      break;
    case ProjectActivityStage.MONITORING_REPORT_SUBMITTED:
      return 'slcfProgrammeTimeline:monitoringReportCreatedTitle';
      break;
    case ProjectActivityStage.MONITORING_REPORT_APPROVED:
      return 'slcfProgrammeTimeline:monitoringReportApprovedTitle';
      break;
    case ProjectActivityStage.MONITORING_REPORT_REJECTED:
      return 'slcfProgrammeTimeline:monitoringReportRejectedTitle';
      break;
    case ProjectActivityStage.VERIFICATION_REPORT_SUBMITTED:
      return 'slcfProgrammeTimeline:verificationReportCreatedTitle';
      break;
    case ProjectActivityStage.VERIFICATION_REPORT_REJECTED:
      return 'slcfProgrammeTimeline:verificationReportRejectedTitle';
      break;
    case ProjectActivityStage.VERIFICATION_REPORT_APPROVED:
      return 'slcfProgrammeTimeline:verificationReportApprovedTitle';
      break;
    case ProjectActivityStage.CREDITS_ISSUED:
      return 'slcfProgrammeTimeline:creditIssuedTitle';
      break;
    case ProjectActivityStage.CREDIT_TRANSFERED:
      return 'slcfProgrammeTimeline:creditTransferedTitle';
      break;
    case ProjectActivityStage.RETIRE_APPROVED:
      return 'slcfProgrammeTimeline:retirementApprovedTitle';
      break;
    case ProjectActivityStage.RETIRE_REJECTED:
      return 'slcfProgrammeTimeline:retirementRejectedTitle';
      break;
    case ProjectActivityStage.RETIRE_CANCELLED:
      return 'slcfProgrammeTimeline:retirementCancelledTitle';
      break;
    case ProjectActivityStage.RETIRE_REQUESTED:
      return 'slcfProgrammeTimeline:retireRequestedTitle';
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
        {log.data && log.data.remarks && (
          <p className="remarks">
            <span>{`${t('slcfProgrammeTimeline:remarks')}`}</span>: {log.data.remarks}
          </p>
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
