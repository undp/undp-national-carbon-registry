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
  CloseCircleOutlined,
} from '@ant-design/icons';
import './programmeStatusTimelineComponent.scss';
import * as Icon from 'react-bootstrap-icons';
import { getProjectProposalStageEnumVal } from '../../../Definitions/Definitions/programme.definitions';
import { ProjectProposalStage } from '../../../Definitions/Enums/programmeStage.enum';

interface ProgrammeStatusTimelineComponentProps {
  programmeDetails: any;
  translator: any;
}

enum StatusKeys {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

const getCurrentStep = (stage: ProjectProposalStage) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.PENDING:
      return 0;
    case ProjectProposalStage.REJECTED:
      return 0;
    case ProjectProposalStage.APPROVED:
      return 1;
    case ProjectProposalStage.PDD_SUBMITTED:
      return 2;
    case ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER:
      return 2;
    case ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER:
      return 2;
    case ProjectProposalStage.PDD_REJECTED_BY_DNA:
      return 2;
    case ProjectProposalStage.PDD_APPROVED_BY_DNA:
      return 2;
    case ProjectProposalStage.VALIDATION_REPORT_SUBMITTED:
      return 3;
    case ProjectProposalStage.VALIDATION_REPORT_REJECTED:
      return 3;
    case ProjectProposalStage.AUTHORISED:
      return 4;
    default:
      return 0;
  }
};

const getINFContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.PENDING:
      return {
        subTitle: t('slcfRoadmapTimeline:submitted'),
        statusKey: StatusKeys.SUBMITTED,
        icon: <NotificationOutlined />,
        className: 'inf-submitted',
        subTaskOne: true,
        subTaskTwo: false,
      };
    case ProjectProposalStage.APPROVED:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: StatusKeys.APPROVED,
        icon: <Icon.CheckCircleFill />,
        className: 'inf-approved',
        subTaskOne: true,
        subTaskTwo: true,
      };

    case ProjectProposalStage.REJECTED:
      return {
        subTitle: t('slcfRoadMapTimeline:rejected'),
        statusKey: StatusKeys.REJECTED,
        icon: <CloseCircleOutlined />,
        subTaskOne: true,
        subTaskTwo: true,
      };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: StatusKeys.APPROVED,
        icon: <Icon.CheckCircleFill />,
        // className: 'inf-approved',
        subTaskOne: true,
        subTaskTwo: true,
      };
  }
};
// future
const getNoObjectionLetterContent = (stage: ProjectProposalStage, t: any) => {
  console.log('-------------stage-----------', stage);
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.PENDING:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: StatusKeys.PENDING,
        icon: <ReadOutlined />,
        className: 'no-objection-letter-pending',
        subTaskOne: true,
      };
    case ProjectProposalStage.REJECTED:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: StatusKeys.REJECTED,
        icon: <CloseOutlined />,
        className: 'no-objection-letter-pending',
        subTaskOne: true,
      };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:issued'),
        statusKey: StatusKeys.APPROVED,
        className: 'no-objection-letter-generated',
        icon: <Icon.CheckCircleFill />,
        subTaskOne: true,
      };
  }
};

const getPDDContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.PENDING:
    case ProjectProposalStage.APPROVED:
    case ProjectProposalStage.REJECTED:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: StatusKeys.PENDING,
        icon: <FileDoneOutlined />,
        className: 'pdd-pending',
        subTaskOne: false,
        subTaskTwo: false,
      };
    case ProjectProposalStage.PDD_SUBMITTED:
      return {
        subTitle: t('slcfRoadmapTimeline:submitted'),
        statusKey: StatusKeys.SUBMITTED,
        icon: <FileDoneOutlined />,
        className: 'pdd-submitted',
        subTaskOne: true,
        subTaskTwo: false,
        subTaskThree: false,
      };
    case ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER:
      return {
        subTitle: t('slcfRoadmapTimeline:submitted'),
        statusKey: StatusKeys.APPROVED,
        icon: <FileDoneOutlined />,
        className: 'pdd-submitted',
        subTaskOne: true,
        subTaskTwo: true,
        subTaskThree: false,
      };
    case ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER:
      return {
        subTitle: t('slcfRoadmapTimeline:rejected'),
        statusKey: StatusKeys.REJECTED,
        icon: <CloseCircleFilled />,
        className: 'pdd-rejected',
        subTaskOne: true,
        subTaskTwo: false,
        subTaskThree: null,
      };
    case ProjectProposalStage.PDD_REJECTED_BY_DNA:
      return {
        subTitle: t('slcfRoadmapTimeline:rejected'),
        statusKey: StatusKeys.REJECTED,
        icon: <CloseCircleFilled />,
        className: 'pdd-rejected',
        subTaskOne: true,
        subTaskTwo: true,
        subTaskThree: false,
      };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: 'approved',
        icon: <Icon.CheckCircleFill />,
        className: 'pdd-approved',
        subTaskOne: true,
        subTaskTwo: true,
        subTaskThree: true,
      };
  }
};

const getValidationContent = (stage: ProjectProposalStage, t: any) => {
  switch (getProjectProposalStageEnumVal(stage)) {
    case ProjectProposalStage.PENDING:
    case ProjectProposalStage.APPROVED:
    case ProjectProposalStage.REJECTED:
    case ProjectProposalStage.PDD_SUBMITTED:
    case ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER:
    case ProjectProposalStage.PDD_APPROVED_BY_DNA:
    case ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER:
    case ProjectProposalStage.PDD_REJECTED_BY_DNA:
      return {
        subTitle: t('slcfRoadmapTimeline:pending'),
        statusKey: StatusKeys.PENDING,
        icon: <SafetyCertificateOutlined />,
        className: 'validation-pending',
        subTaskOne: false,
        subTaskTwo: false,
        subTaskThree: false,
      };

    case ProjectProposalStage.VALIDATION_REPORT_SUBMITTED:
      return {
        subTitle: t('slcfRoadmapTimeline:submitted'),
        statusKey: StatusKeys.SUBMITTED,
        icon: <SafetyCertificateOutlined />,
        className: 'validation-submitted',
        subTaskOne: true,
        subTaskTwo: false,
        subTaskThree: false,
      };
    case ProjectProposalStage.VALIDATION_REPORT_REJECTED:
      return {
        subTitle: t('slcfRoadmapTimeline:rejected'),
        statusKey: StatusKeys.REJECTED,
        icon: <CloseCircleFilled />,
        className: 'validation-rejected',
        subTaskOne: true,
        subTaskTwo: false,
        subTaskThree: false,
      };
    default:
      return {
        subTitle: t('slcfRoadmapTimeline:approved'),
        statusKey: StatusKeys.APPROVED,
        icon: <Icon.CheckCircleFill />,
        className: 'validation-pending',
        subTaskOne: false,
        subTaskTwo: false,
      };
  }
};

const ProgrammeStatusTimelineComponent: React.FC<ProgrammeStatusTimelineComponentProps> = ({
  programmeDetails,
  translator,
}) => {
  const t = translator;
  // programmeDetails.projectProposalStage = ProjectProposalStage.VALIDATION_REPORT_REJECTED;
  const currentStep = getCurrentStep(programmeDetails.projectProposalStage);
  const infContent = getINFContent(programmeDetails.projectProposalStage, t);
  const noObjectionLetterContent = getNoObjectionLetterContent(
    programmeDetails.projectProposalStage,
    t
  );
  const pddContent = getPDDContent(programmeDetails.projectProposalStage, t); // need to update
  const validationContent = getValidationContent(programmeDetails.projectProposalStage, t); // need to update

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
                {infContent.statusKey === StatusKeys.SUBMITTED && (
                  <>
                    <li className="list-style-none ">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:infSubTask1')}
                    </li>
                    <li className="list-style-circle list-style-next">
                      {t('slcfRoadmapTimeline:infSubTask2')}
                    </li>
                  </>
                )}
                {infContent.statusKey === StatusKeys.REJECTED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:infSubTask1')}
                    </li>
                    <li className="list-style-none">
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:infSubTask2')}
                    </li>
                  </>
                )}
                {infContent.statusKey === StatusKeys.APPROVED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:infSubTask1')}
                    </li>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:infSubTask2')}
                    </li>
                  </>
                )}
                {/* <li className="timeline-description-approved-true">
                  {infContent.subTaskOne && (
                    <span className="timeline-description-item-complete">
                      <CheckOutlined />
                    </span>
                  )}
                  <div>{t('slcfRoadmapTimeline:infSubTask1')}</div>
                </li>
                <li
                  className={`timeline-description-${infContent.statusKey}-${infContent.subTaskTwo}`}
                >
                  {infContent.subTaskTwo ? (
                    infContent.statusKey === StatusKeys.REJECTED ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    )
                  ) : null}
                  {t('slcfRoadmapTimeline:infSubTask2')}
                </li> */}
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
          title: t('slcfRoadmapTimeline:noObjection'),
          description: (
            <div className="item-description">
              <ul>
                <li
                  className={`timeline-description-${noObjectionLetterContent.statusKey}-${noObjectionLetterContent.subTaskOne}`}
                >
                  {noObjectionLetterContent?.subTaskOne ? (
                    noObjectionLetterContent.statusKey === StatusKeys.REJECTED ? (
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                    ) : noObjectionLetterContent.statusKey === StatusKeys.APPROVED ? (
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                    ) : null
                  ) : null}
                  <div>{t('slcfRoadmapTimeline:noObjectionTask1')}</div>
                </li>
              </ul>
            </div>
          ),
          subTitle: noObjectionLetterContent.subTitle,
          icon: (
            <div
              className={`${noObjectionLetterContent.className}-${
                currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {noObjectionLetterContent.icon}
            </div>
          ),
          status: currentStep === 1 ? 'process' : currentStep > 1 ? 'finish' : 'wait',
        },
        {
          title: <div className="pdd-title">{t('slcfRoadmapTimeline:pddTitle')}</div>,
          description: (
            <div className="item-description">
              <ul>
                {pddContent?.statusKey === StatusKeys.PENDING && (
                  <>
                    <li className="list-style-circle">{t('slcfRoadmapTimeline:pddSubTask1')}</li>
                    <li className="list-style-circle">{t('slcfRoadmapTimeline:pddSubTask2')}</li>
                    <li className="list-style-circle">{t('slcfRoadmapTimeline:pddSubTask3')}</li>
                  </>
                )}

                {pddContent?.statusKey === StatusKeys.SUBMITTED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:pddSubTask1')}
                    </li>
                    <li className="list-style-circle list-style-next">
                      {t('slcfRoadmapTimeline:pddSubTask2')}
                    </li>
                    <li className="list-style-circle">{t('slcfRoadmapTimeline:pddSubTask3')}</li>
                  </>
                )}
                {pddContent?.statusKey === StatusKeys.REJECTED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:pddSubTask1')}
                    </li>
                    <li className={`list-style-none`}>
                      {pddContent.subTaskTwo ? (
                        <>
                          <span className="timeline-description-item-complete">
                            <CheckOutlined />
                          </span>
                          {t('slcfRoadmapTimeline:pddSubTask2')}
                        </>
                      ) : (
                        <>
                          <span className="timeline-description-item-rejected">
                            <CloseOutlined />
                          </span>
                          {t('slcfRoadmapTimeline:pddSubTask2')}
                        </>
                      )}
                    </li>

                    {pddContent.subTaskThree === null ? (
                      <li className="list-style-circle">
                        <span>{t('slcfRoadmapTimeline:pddSubTask3')}</span>
                      </li>
                    ) : pddContent.subTaskThree ? (
                      <li className="list-style-none">
                        <span className="timeline-description-item-complete">
                          <CheckOutlined />
                        </span>
                        {t('slcfRoadmapTimeline:pddSubTask3')}
                      </li>
                    ) : (
                      <li className="list-style-none">
                        <span className="timeline-description-item-rejected">
                          <CloseOutlined />
                        </span>
                        {t('slcfRoadmapTimeline:pddSubTask3')}
                      </li>
                    )}
                  </>
                )}
                {pddContent?.statusKey === StatusKeys.APPROVED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:pddSubTask1')}
                    </li>
                    <li className={`list-style-none`}>
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:pddSubTask2')}
                    </li>
                    {pddContent?.subTaskThree ? (
                      <li className="list-style-none">
                        <span className="timeline-description-item-complete">
                          <CheckOutlined />
                        </span>
                        {t('slcfRoadmapTimeline:pddSubTask3')}
                      </li>
                    ) : (
                      <li className="list-style-circle list-style-next">
                        {t('slcfRoadmapTimeline:pddSubTask3')}
                      </li>
                    )}
                  </>
                )}
              </ul>
            </div>
          ),
          subTitle: pddContent.subTitle,
          icon: (
            <div
              className={`${pddContent.className}-${
                currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait'
              } timeline-icon`}
            >
              {pddContent.icon}
            </div>
          ),
          status: currentStep === 2 ? 'process' : currentStep > 2 ? 'finish' : 'wait',
        },
        {
          title: t('slcfRoadmapTimeline:validationTitle'),
          description: (
            <div className="item-description">
              <ul>
                {validationContent.statusKey === StatusKeys.PENDING && (
                  <>
                    <li className="list-style-circle">
                      {t('slcfRoadmapTimeline:validationSubTask1part1')}
                      <br />
                      {t('slcfRoadmapTimeline:validationSubTask1part2')}
                    </li>
                    <li className="list-style-circle">
                      {t('slcfRoadmapTimeline:validationSubTask2')}
                    </li>
                    <li className="list-style-circle">
                      {t('slcfRoadmapTimeline:validationSubTask3')}
                    </li>
                  </>
                )}

                {validationContent.statusKey === StatusKeys.SUBMITTED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask1part1')}
                      <br />
                      {t('slcfRoadmapTimeline:validationSubTask1part2')}
                    </li>
                    <li className="list-style-circle list-style-next">
                      {t('slcfRoadmapTimeline:validationSubTask2')}
                    </li>
                    <li className="list-style-circle">
                      {t('slcfRoadmapTimeline:validationSubTask3')}
                    </li>
                  </>
                )}

                {validationContent.statusKey === StatusKeys.REJECTED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask1part1')}
                      <br />
                      {t('slcfRoadmapTimeline:validationSubTask1part2')}
                    </li>
                    <li className="list-style-none">
                      <span className="timeline-description-item-rejected">
                        <CloseOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask2')}
                    </li>
                    <li>{t('slcfRoadmapTimeline:validationSubTask3')}</li>
                  </>
                )}

                {validationContent.statusKey === StatusKeys.APPROVED && (
                  <>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask1part1')}
                      <br />
                      {t('slcfRoadmapTimeline:validationSubTask1part2')}
                    </li>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask2')}
                    </li>
                    <li className="list-style-none">
                      <span className="timeline-description-item-complete">
                        <CheckOutlined />
                      </span>
                      {t('slcfRoadmapTimeline:validationSubTask3')}
                    </li>
                  </>
                )}
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
      ]}
    />
  );
};

export default ProgrammeStatusTimelineComponent;
