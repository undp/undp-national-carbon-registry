/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Steps } from 'antd';
import {
  CloseCircleFilled,
  NotificationOutlined,
  ReadOutlined,
  CloseOutlined,
  FileDoneOutlined,
  SafetyCertificateOutlined,
  LikeOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import './programmeStatusTimelineComponent.scss';
import * as Icon from 'react-bootstrap-icons';
import { getProjectProposalStageEnumVal } from '../../../Definitions/Definitions/programme.definitions';
import { ProjectProposalStage } from '../../../Definitions/Enums/programmeStage.enum';

interface ProgrammeStatusTimelineComponentProps {
  programmeDetails: any;
  translator: any;
}

const getCurrentStep = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.SUBMITTED_INF:
    //   return 0;
    // case ProjectProposalStage.APPROVED_INF:
    //   return 1;
    // case ProjectProposalStage.REJECTED_INF:
    //   return 0;
    // case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
    //   return 1;
    // case ProjectProposalStage.SUBMITTED_PROPOSAL:
    //   return 1;
    // case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
    //   return 1;
    // case ProjectProposalStage.ACCEPTED_PROPOSAL:
    //   return 2;
    // case ProjectProposalStage.REJECTED_PROPOSAL:
    //   return 1;
    // case ProjectProposalStage.SUBMITTED_CMA:
    //   return 2;
    // case ProjectProposalStage.APPROVED_CMA:
    //   return 3;
    // case ProjectProposalStage.REJECTED_CMA:
    //   return 2;
    // case ProjectProposalStage.VALIDATION_PENDING:
    //   return 3;
    // case ProjectProposalStage.AUTHORISED:
    //   return 4;
    // case ProjectProposalStage.REJECTED_VALIDATION:
    //   return 3;

    default:
      return 0;
  }
};

const getINFContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.SUBMITTED_INF:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:submitted'),
    //     statusKey: 'submitted',
    //     icon: <NotificationOutlined />,
    //     className: 'inf-submitted',
    //     subTaskOne: true,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.REJECTED_INF:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:rejected'),
    //     statusKey: 'rejected',
    //     icon: <CloseCircleFilled />,
    //     className: 'inf-rejected',
    //     subTaskOne: true,
    //     subTaskTwo: true,
    //   };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: 'approved',
        icon: <Icon.CheckCircleFill />,
        className: 'inf-approved',
        subTaskOne: true,
        subTaskTwo: true,
      };
  }
};
// future
// const getNoObjectionLetterContent = (stage: ProjectProposalStage, t: any) => {
//   switch (getProjectProposalStageEnumVal(stage)) {
//     // case ProjectProposalStage.NO_OBJECTION_LETTER_PENDING:
//     //   return {
//     //     subTitle: t('slcfRoadmapTimeline:pending'),
//     //     statusKey: 'pending',
//     //     icon: <ReadOutlined />,
//     //     className: 'no-objection-letter-pending',
//     //     subTasks: [t('slcfRoadmapTimeline:noObjectionPending')],
//     //   };
//     case ProjectProposalStage.NO_OBJECTION_LETTER_GENERATED:
//       return {
//         subTitle: t('slcfRoadmapTimeline:generated'),
//         statusKey: 'generated',
//         className: 'no-objection-letter-generated',
//         icon: <ReadOutlined />,
//         subTasks: [t('slcfRoadmapTimeline:noObjectionPending')],
//       };
//     default:
//       return {
//         subTitle: t('slcfRoadmapTimeline:pending'),
//         statusKey: 'pending',
//         icon: <ReadOutlined />,
//         className: 'no-objection-letter-pending',
//         subTasks: [t('slcfRoadmapTimeline:noObjectionPending')],
//       };
//   }
// };

const getProposalContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.SUBMITTED_INF:
    // case ProjectProposalStage.APPROVED_INF:
    // case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
    // case ProjectProposalStage.SUBMITTED_PROPOSAL:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:pending'),
    //     statusKey: 'pending',
    //     icon: <ReadOutlined />,
    //     className: 'proposal-pending',
    //     subTaskOne: false,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.REJECTED_INF:
    //   return {
    //     subTitle: '',
    //     statusKey: '',
    //     icon: <CloseOutlined />,
    //     className: 'proposal-pending',
    //     subTaskOne: false,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:submitted'),
    //     statusKey: 'submitted',
    //     icon: <ReadOutlined />,
    //     className: 'proposal-submitted',
    //     subTaskOne: true,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.REJECTED_PROPOSAL:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:rejected'),
    //     statusKey: 'rejected',
    //     icon: <CloseCircleFilled />,
    //     className: 'proposal-rejected',
    //     subTaskOne: true,
    //     subTaskTwo: true,
    //   };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:accepted'),
        statusKey: 'accepted',
        icon: <Icon.CheckCircleFill />,
        className: 'proposal-approved',
        subTaskOne: true,
        subTaskTwo: true,
      };
  }
};

const getCMAContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.SUBMITTED_INF:
    // case ProjectProposalStage.APPROVED_INF:
    // case ProjectProposalStage.SUBMITTED_COST_QUOTATION:
    // case ProjectProposalStage.SUBMITTED_PROPOSAL:
    // case ProjectProposalStage.SUBMITTED_VALIDATION_AGREEMENT:
    // case ProjectProposalStage.ACCEPTED_PROPOSAL:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:pending'),
    //     statusKey: 'pending',
    //     icon: <FileDoneOutlined />,
    //     className: 'cma-pending',
    //     subTaskOne: false,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.REJECTED_INF:
    // case ProjectProposalStage.REJECTED_PROPOSAL:
    //   return {
    //     subTitle: '',
    //     statusKey: '',
    //     icon: <CloseOutlined />,
    //     className: 'cma-pending',
    //     subTaskOne: false,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.SUBMITTED_CMA:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:submitted'),
    //     statusKey: 'submitted',
    //     icon: <FileDoneOutlined />,
    //     className: 'cma-submitted',
    //     subTaskOne: true,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.REJECTED_CMA:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:rejected'),
    //     statusKey: 'rejected',
    //     icon: <CloseCircleFilled />,
    //     className: 'cma-rejected',
    //     subTaskOne: true,
    //     subTaskTwo: true,
    //   };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: 'approved',
        icon: <Icon.CheckCircleFill />,
        className: 'cma-approved',
        subTaskOne: true,
        subTaskTwo: true,
      };
  }
};

const getValidationContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.REJECTED_INF:
    // case ProjectProposalStage.REJECTED_PROPOSAL:
    // case ProjectProposalStage.REJECTED_CMA:
    //   return {
    //     subTitle: '',
    //     statusKey: '',
    //     icon: <CloseOutlined />,
    //     className: 'validation-pending',
    //     subTaskOne: false,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.VALIDATION_PENDING:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:submitted'),
    //     statusKey: 'submitted',
    //     icon: <SafetyCertificateOutlined />,
    //     className: 'validation-submitted',
    //     subTaskOne: true,
    //     subTaskTwo: false,
    //   };
    // case ProjectProposalStage.AUTHORISED:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:approved'),
    //     statusKey: 'approved',
    //     icon: <Icon.CheckCircleFill />,
    //     className: 'validation-approved',
    //     subTaskOne: true,
    //     subTaskTwo: true,
    //   };
    // case ProjectProposalStage.REJECTED_VALIDATION:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:rejected'),
    //     statusKey: 'rejected',
    //     icon: <CloseCircleFilled />,
    //     className: 'validation-rejected',
    //     subTaskOne: true,
    //     subTaskTwo: true,
    //   };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: 'pending',
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
        subTaskOne: false,
        subTaskTwo: false,
      };
  }
};

const getAuthorisedContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    // case ProjectProposalStage.REJECTED_INF:
    // case ProjectProposalStage.REJECTED_CMA:
    // case ProjectProposalStage.REJECTED_PROPOSAL:
    // case ProjectProposalStage.REJECTED_VALIDATION:
    //   return {
    //     subTitle: '',
    //     statusKey: '',
    //     icon: <CloseOutlined />,
    //     className: 'auth-pending',
    //   };
    // case ProjectProposalStage.AUTHORISED:
    //   return {
    //     subTitle: t('slcfRoadmapTimeline:completed'),
    //     statusKey: 'completed',
    //     icon: <Icon.CheckCircleFill />,
    //     className: 'auth-approved',
    //   };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: 'pending',
        icon: <LikeOutlined />,
        className: 'auth-pending',
      };
  }
};

const ProgrammeStatusTimelineComponent: React.FC<ProgrammeStatusTimelineComponentProps> = ({
  programmeDetails,
  translator,
}) => {
  console.log('---------programmeStatus-----------', programmeDetails);
  const t = translator;
  const currentStep = getCurrentStep(programmeDetails.projectProposalStage);
  const infContent = getINFContent(programmeDetails.projectProposalStage, t);
  const proposalContent = getProposalContent(programmeDetails.projectProposalStage, t); // need to update
  const cmaContent = getCMAContent(programmeDetails.projectProposalStage, t); // need to update
  const validationContent = getValidationContent(programmeDetails.projectProposalStage, t); // need to update

  // const noObjectionLetterContent = getNoObjectionLetterContent(
  //   programmeDetails.projectProposalStage,
  //   t
  // );

  return (
    <Steps
      current={currentStep}
      items={[
        {
          title: t('slcfRoadmapTimeline:infTitle'),
          subTitle: infContent.subTitle,
          description: (
            <div className="item-description">
              <ul>
                <li className="timeline-description-approved-true">
                  {infContent.subTaskOne && (
                    <span className="timeline-description-item-complete">
                      <CheckOutlined />
                    </span>
                  )}
                  <div>{t('slcfRoadmapTimeline:submissionByPP')}</div>
                </li>
                <li
                  className={`timeline-description-${infContent.statusKey}-${infContent.subTaskTwo}`}
                >
                  {infContent.subTaskTwo ? (
                    infContent.statusKey === 'rejected' ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    )
                  ) : null}
                  {t('slcfRoadmapTimeline:approveBySLCF')}
                </li>
              </ul>
            </div>
          ),
          icon: (
            <div
              className={`${infContent.className}-${
                currentStep === 0 ? 'process' : 'finish'
              } timeline-icon`}
            >
              {infContent.icon}
            </div>
          ),
          status: currentStep === 0 ? 'process' : 'finish',
        },
        {
          title: t('slcfRoadmapTimeline:projectProposal'),
          description: (
            <div className="item-description">
              <ul>
                <li
                  className={`timeline-description-${proposalContent.statusKey}-${proposalContent.subTaskOne}`}
                >
                  {proposalContent.subTaskOne ? (
                    <span className="timeline-description-item-complete">
                      <CheckOutlined />
                    </span>
                  ) : null}
                  <div>{t('slcfRoadmapTimeline:subCostQuoteBySLCF')}</div>
                </li>
                <li
                  className={`timeline-description-${proposalContent.statusKey}-${proposalContent.subTaskTwo}`}
                >
                  {proposalContent.subTaskTwo ? (
                    proposalContent.statusKey === 'rejected' ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    )
                  ) : null}
                  {t('slcfRoadmapTimeline:acceptByPP')}
                </li>
              </ul>
            </div>
          ),
          subTitle: proposalContent.subTitle,
          icon: (
            <div
              className={`${proposalContent.className}-${
                currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {proposalContent.icon}
            </div>
          ),
          status: currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait',
        },
        {
          title: (
            <div className="cma-title">
              {t('slcfRoadmapTimeline:cmaTitlePart1')} <br />
              {t('slcfRoadmapTimeline:cmaTitlePart2')}
            </div>
          ),
          description: (
            <div className="item-description">
              <ul>
                <li
                  className={`timeline-description-${cmaContent.statusKey}-${cmaContent.subTaskOne}`}
                >
                  {cmaContent.subTaskOne ? (
                    <span className="timeline-description-item-complete">
                      <CheckOutlined />
                    </span>
                  ) : null}
                  {t('slcfRoadmapTimeline:submissionByPP')}
                </li>
                <li
                  className={`timeline-description-${cmaContent.statusKey}-${cmaContent.subTaskTwo}`}
                >
                  {cmaContent.subTaskTwo ? (
                    cmaContent.statusKey === 'rejected' ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    )
                  ) : null}
                  {t('slcfRoadmapTimeline:approveBySLCF')}
                </li>
              </ul>
            </div>
          ),
          subTitle: cmaContent.subTitle,
          icon: (
            <div
              className={`${cmaContent.className}-${
                currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {cmaContent.icon}
            </div>
          ),
          status: currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait',
        },
        {
          title: t('slcfRoadmapTimeline:validationTitle'),
          description: (
            <div className="item-description">
              <ul>
                <li
                  className={`timeline-description-${validationContent.statusKey}-${validationContent.subTaskOne}`}
                >
                  {validationContent.subTaskOne ? (
                    <span className="timeline-description-item-complete">
                      <CheckOutlined />
                    </span>
                  ) : null}
                  {t('slcfRoadmapTimeline:submissionBySLCF')}
                </li>
                <li
                  className={`timeline-description-${validationContent.statusKey}-${validationContent.subTaskTwo}`}
                >
                  {validationContent.subTaskTwo ? (
                    validationContent.statusKey === 'rejected' ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    )
                  ) : null}
                  {t('slcfRoadmapTimeline:approveByExCom')}
                </li>
              </ul>
            </div>
          ),
          subTitle: validationContent.subTitle,
          icon: (
            <div
              className={`${validationContent.className}-${
                currentStep === 3 ? 'process' : currentStep > 3 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {validationContent.icon}
            </div>
          ),
          status: currentStep === 3 ? 'process' : currentStep > 3 ? 'finish' : 'wait',
        },
        {
          title: t('slcfRoadmapTimeline:authorisedTitle'),
          subTitle: getAuthorisedContent(programmeDetails.projectProposalStage, t).subTitle,
          icon: (
            <div
              className={`${
                getAuthorisedContent(programmeDetails.projectProposalStage, t).className
              }-${currentStep === 4 ? 'finish' : 'wait'} timeline-icon`}
            >
              {getAuthorisedContent(programmeDetails.projectProposalStage, t).icon}
            </div>
          ),
          status: currentStep === 4 ? 'finish' : 'wait',
        },
      ]}
    />
  );
};

export default ProgrammeStatusTimelineComponent;
