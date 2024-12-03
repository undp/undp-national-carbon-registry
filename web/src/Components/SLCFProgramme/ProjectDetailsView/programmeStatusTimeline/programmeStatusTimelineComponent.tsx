/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Steps } from 'antd';
import {
  SmileOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  NotificationOutlined,
  ReadOutlined,
  CloseOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import './programmeStatusTimelineComponent.scss';
import * as Icon from 'react-bootstrap-icons';
import { getProjectProposalStageEnumVal } from '../../../../Definitions/Definitions/programme.definitions';
import { ProjectProposalStage } from '../../../../Definitions/Enums/programmeStage.enum';

interface StepProps {
  title: any;
  subTitle?: any;
  description?: any;
  status: 'finish' | 'process' | 'wait'; // Define acceptable statuses
}

interface ProgrammeStatusTimelineComponentProps {
  programmeDetails: any; // Example prop structure
}

const getCurrentStep = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.SUBMITTED_INF:
      return 0;
    case ProjectProposalStage.APPROVED_INF:
      return 1;
    case ProjectProposalStage.REJECTED_INF:
      return 0;
    case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
      return 1;
    case ProjectProposalStage.SUBMITTED_PROPOSAL:
      return 1;
    case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
      return 1;
    case ProjectProposalStage.ACCEPTED_PROPOSAL:
      return 2;
    case ProjectProposalStage.REJECTED_PROPOSAL:
      return 1;
    case ProjectProposalStage.SUBMITTED_CMA:
      return 2;
    case ProjectProposalStage.APPROVED_CMA:
      return 3;
    case ProjectProposalStage.REJECTED_CMA:
      return 2;
    case ProjectProposalStage.VALIDATION_PENDING:
      return 3;
    case ProjectProposalStage.AUTHORISED:
      return 4;
    case ProjectProposalStage.REJECTED_VALIDATION:
      return 3;

    default:
      return 0;
  }
};

const getProposalContent = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.SUBMITTED_INF:
      return { subTitle: 'Pending', icon: <ReadOutlined />, className: 'proposal-pending' };
    case ProjectProposalStage.APPROVED_INF:
      return { subTitle: 'Pending', icon: <ReadOutlined />, className: 'proposal-pending' };
    case ProjectProposalStage.REJECTED_INF:
      return { subTitle: '', icon: <CloseOutlined />, className: 'proposal-pending' };
    case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
      return { subTitle: 'Pending', icon: <ReadOutlined />, className: 'proposal-pending' };
    case ProjectProposalStage.SUBMITTED_PROPOSAL:
      return { subTitle: 'Pending', icon: <ReadOutlined />, className: 'proposal-pending' };
    case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
      return { subTitle: 'Submitted', icon: <ReadOutlined />, className: 'proposal-submitted' };
    case ProjectProposalStage.ACCEPTED_PROPOSAL:
      return {
        subTitle: 'Accepted',
        icon: <Icon.CheckCircleFill />,
        className: 'proposal-approved',
      };
    case ProjectProposalStage.REJECTED_PROPOSAL:
      return { subTitle: 'Rejected', icon: <CloseCircleFilled />, className: 'proposal-rejected' };
    default:
      return {
        subTitle: 'Accepted',
        icon: <Icon.CheckCircleFill />,
        className: 'proposal-approved',
      };
  }
};

const getINFContent = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.SUBMITTED_INF:
      return { subTitle: 'Submitted', icon: <NotificationOutlined />, className: 'inf-submitted' };
    case ProjectProposalStage.APPROVED_INF:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'inf-approved' };
    case ProjectProposalStage.REJECTED_INF:
      return { subTitle: 'Rejected', icon: <CloseCircleFilled />, className: 'inf-rejected' };
    default:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'inf-approved' };
  }
};

const getCMAContent = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.SUBMITTED_INF:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.APPROVED_INF:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.REJECTED_INF:
      return { subTitle: '', icon: <CloseOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.SUBMITTED_PROPOSAL:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.ACCEPTED_PROPOSAL:
      return { subTitle: 'Pending', icon: <FileDoneOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.REJECTED_PROPOSAL:
      return { subTitle: '', icon: <CloseOutlined />, className: 'cma-pending' };
    case ProjectProposalStage.SUBMITTED_CMA:
      return { subTitle: 'Submitted', icon: <FileDoneOutlined />, className: 'cma-submitted' };
    case ProjectProposalStage.APPROVED_CMA:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'cma-approved' };
    case ProjectProposalStage.REJECTED_CMA:
      return { subTitle: 'Rejected', icon: <CloseCircleFilled />, className: 'cma-rejected' };
    case ProjectProposalStage.VALIDATION_PENDING:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'cma-approved' };
    case ProjectProposalStage.AUTHORISED:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'cma-approved' };
    case ProjectProposalStage.REJECTED_VALIDATION:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'cma-approved' };
    default:
      return { subTitle: 'Approved', icon: <Icon.CheckCircleFill />, className: 'cma-approved' };
  }
};

const getValidationContent = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.SUBMITTED_INF:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.APPROVED_INF:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.REJECTED_INF:
      return {
        subTitle: '',
        icon: <CloseOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.SUBMITTED_PROPOSAL:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.ACCEPTED_PROPOSAL:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.REJECTED_PROPOSAL:
      return {
        subTitle: '',
        icon: <CloseOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.SUBMITTED_CMA:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.APPROVED_CMA:
      return {
        subTitle: 'Pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.REJECTED_CMA:
      return {
        subTitle: '',
        icon: <CloseOutlined />,
        className: 'validation-pending',
      };
    case ProjectProposalStage.VALIDATION_PENDING:
      return {
        subTitle: 'Submitted',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-submitted',
      };
    case ProjectProposalStage.AUTHORISED:
      return {
        subTitle: 'Approved',
        icon: <Icon.CheckCircleFill />,
        className: 'validation-approved',
      };
    case ProjectProposalStage.REJECTED_VALIDATION:
      return {
        subTitle: 'Rejected',
        icon: <CloseCircleFilled />,
        className: 'validation-rejected',
      };
    default:
      return {
        subTitle: 'Approved',
        icon: <Icon.CheckCircleFill />,
        className: 'validation-approved',
      };
  }
};

const getAuthorisedContent = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.REJECTED_INF:
    case ProjectProposalStage.REJECTED_CMA:
    case ProjectProposalStage.REJECTED_PROPOSAL:
    case ProjectProposalStage.REJECTED_VALIDATION:
      return {
        subTitle: '',
        icon: <CloseOutlined />,
        className: 'auth-pending',
      };
    case ProjectProposalStage.AUTHORISED:
      return {
        subTitle: 'Completed',
        icon: <Icon.CheckCircleFill />,
        className: 'auth-approved',
      };
    default:
      return {
        subTitle: 'Pending',
        icon: <LikeOutlined />,
        className: 'auth-pending',
      };
  }
};

const ProgrammeStatusTimelineComponent: React.FC<ProgrammeStatusTimelineComponentProps> = ({
  programmeDetails,
}) => {
  const currentStep = getCurrentStep(programmeDetails.projectProposalStage);

  return (
    <Steps
      current={currentStep}
      items={[
        {
          title: 'Initial Notification',
          subTitle: getINFContent(programmeDetails.projectProposalStage).subTitle,
          description: (
            <div className="item-description">
              <ul>
                <li>Submission by Project Participant</li>
                <li>Approval by SLCF</li>
              </ul>
            </div>
          ),
          icon: (
            <div
              className={`${getINFContent(programmeDetails.projectProposalStage).className}-${
                currentStep === 0 ? 'process' : 'finish'
              } timeline-icon`}
            >
              {getINFContent(programmeDetails.projectProposalStage).icon}
            </div>
          ),
          status: currentStep === 0 ? 'process' : 'finish',
        },
        {
          title: 'Project Proposal',
          description: (
            <div className="item-description">
              <ul>
                <li>
                  Submission of <b>Cost Quotation, Proposal</b> and <b>Validation Agreement</b> by
                  SLCF
                </li>
                <li>Approval by Project Participant</li>
              </ul>
            </div>
          ),
          subTitle: getProposalContent(programmeDetails.projectProposalStage).subTitle,
          icon: (
            <div
              className={`${getProposalContent(programmeDetails.projectProposalStage).className}-${
                currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {getProposalContent(programmeDetails.projectProposalStage).icon}
            </div>
          ),
          status: currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait',
        },
        {
          title: (
            <div className="cma-title">
              Carbon Management <br /> Assessment
            </div>
          ),
          description: (
            <div className="item-description">
              <ul>
                <li>Submission by Project Participant</li>
                <li>Approval by SLCF</li>
              </ul>
            </div>
          ),
          subTitle: getCMAContent(programmeDetails.projectProposalStage).subTitle,
          icon: (
            <div
              className={`${getCMAContent(programmeDetails.projectProposalStage).className}-${
                currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {getCMAContent(programmeDetails.projectProposalStage).icon}
            </div>
          ),
          status: currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait',
        },
        {
          title: 'Validation Report',
          description: (
            <div className="item-description">
              <ul>
                <li>Submission by SLCF</li>
                <li>Approval by SLCF</li>
              </ul>
            </div>
          ),
          subTitle: getValidationContent(programmeDetails.projectProposalStage).subTitle,
          icon: (
            <div
              className={`${
                getValidationContent(programmeDetails.projectProposalStage).className
              }-${
                currentStep === 3 ? 'process' : currentStep > 3 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {getValidationContent(programmeDetails.projectProposalStage).icon}
            </div>
          ),
          status: currentStep === 3 ? 'process' : currentStep > 3 ? 'finish' : 'wait',
        },
        {
          title: 'Project Registration',
          // description: (
          //   <div className="item-description">
          //     <ul>
          //       <li>Submission by SLCF</li>
          //       <li>Approval by SLCF</li>
          //     </ul>
          //   </div>
          // ),
          subTitle: getAuthorisedContent(programmeDetails.projectProposalStage).subTitle,
          icon: (
            <div
              className={`${
                getAuthorisedContent(programmeDetails.projectProposalStage).className
              }-${currentStep === 4 ? 'finish' : 'wait'} timeline-icon`}
            >
              {getAuthorisedContent(programmeDetails.projectProposalStage).icon}
            </div>
          ),
          status: currentStep === 4 ? 'finish' : 'wait',
        },
      ]}
    />
  );
};

export default ProgrammeStatusTimelineComponent;
