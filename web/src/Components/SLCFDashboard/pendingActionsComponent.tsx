import { FC } from 'react';
import { List, Row, Col, Button, Skeleton, Tooltip, Empty } from 'antd';
import {
  ShieldPlus,
  ArrowRepeat,
  InfoCircle,
  ChevronDoubleRight,
  ClipboardData,
} from 'react-bootstrap-icons';
import {
  ActivityEntityResponse,
  ProjectEntityResponse,
} from '../../Definitions/InterfacesAndType/dashboard.interface';
import { ProjectProposalStage } from '../../Definitions/Enums/projectProposalStage.enum';
import { ActivityStateEnum } from '../../Definitions/Enums/activityStatus.enum';
import { ROUTES } from '../../Config/uiRoutingConfig';
import { useNavigate } from 'react-router-dom';

export interface PendingActionsCardItemProps {
  pendingActionData?: ProjectEntityResponse[];
  loading: boolean;
  toolTipText: string;
  t: any;
}

const clipBoardColor = 'rgba(133, 54, 255, 1)';
const shieldPlusColor = 'rgba(223, 197, 0, 1)';
const arrowRepeatColor = 'rgba(24, 144, 255, 1)';

export function getNextTaskForProjectProposalStage(stage: ProjectProposalStage): {
  icon: JSX.Element;
  nextTask: string;
} {
  switch (stage) {
    case ProjectProposalStage.PENDING:
      return {
        icon: <ClipboardData color={clipBoardColor} />,
        nextTask: 'Approve/Reject the INF',
      };
    case ProjectProposalStage.APPROVED:
      return { icon: <ShieldPlus color={shieldPlusColor} />, nextTask: 'Submit the PDD' };
    case ProjectProposalStage.PDD_SUBMITTED:
      return {
        icon: <ClipboardData color="" />,
        nextTask: 'Approve/Reject the PDD',
      };
    case ProjectProposalStage.PDD_REJECTED_BY_CERTIFIER:
      return { icon: <ArrowRepeat color={arrowRepeatColor} />, nextTask: 'Re-submit the PDD' };
    case ProjectProposalStage.PDD_APPROVED_BY_CERTIFIER:
      return {
        icon: <ClipboardData color={clipBoardColor} />,
        nextTask: 'Approve/Reject the PDD',
      };
    case ProjectProposalStage.PDD_REJECTED_BY_DNA:
      return { icon: <ArrowRepeat color={arrowRepeatColor} />, nextTask: 'Re-submit the PDD' };
    case ProjectProposalStage.PDD_APPROVED_BY_DNA:
      return {
        icon: <ShieldPlus color={shieldPlusColor} />,
        nextTask: 'Submit the Validation Report',
      };
    case ProjectProposalStage.VALIDATION_REPORT_SUBMITTED:
      return {
        icon: <ClipboardData color={clipBoardColor} />,
        nextTask: 'Appove/Reject the Validation Report',
      };
    case ProjectProposalStage.VALIDATION_REPORT_REJECTED:
      return {
        icon: <ArrowRepeat color={arrowRepeatColor} />,
        nextTask: 'Re-submit the Validation Report',
      };
    case ProjectProposalStage.AUTHORISED:
      return {
        icon: <ShieldPlus color={shieldPlusColor} />,
        nextTask: 'Create the Monitoring Report',
      };
    default:
      return { icon: <ArrowRepeat />, nextTask: '' };
  }
}

export function getNextTaskForActivity(status: ActivityStateEnum): {
  icon: JSX.Element;
  nextTask: string;
} {
  switch (status) {
    case ActivityStateEnum.MONITORING_REPORT_UPLOADED:
      return {
        icon: <ClipboardData color={clipBoardColor} />,
        nextTask: 'Approve/Reject the Monitoring Report',
      };
    case ActivityStateEnum.MONITORING_REPORT_REJECTED:
      return {
        icon: <ArrowRepeat color={arrowRepeatColor} />,
        nextTask: 'Re-Submit the Monitoring Report',
      };
    case ActivityStateEnum.MONITORING_REPORT_VERIFIED:
      return {
        icon: <ShieldPlus color={shieldPlusColor} />,
        nextTask: 'Submit the Verification Report',
      };
    case ActivityStateEnum.VERIFICATION_REPORT_UPLOADED:
      return {
        icon: <ClipboardData color={clipBoardColor} />,
        nextTask: 'Approve/Reject Verification report',
      };
    case ActivityStateEnum.VERIFICATION_REPORT_REJECTED:
      return {
        icon: <ArrowRepeat color={arrowRepeatColor} />,
        nextTask: 'Re-Submit the Verification Report',
      };
    case ActivityStateEnum.VERIFICATION_REPORT_VERIFIED:
      return { icon: <ShieldPlus color={shieldPlusColor} />, nextTask: 'Issue Credits' };
    default:
      return { icon: <ArrowRepeat />, nextTask: '' };
  }
}

export const PendingActionsComponent: FC<PendingActionsCardItemProps> = ({
  pendingActionData,
  loading,
  toolTipText,
  t,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="statistics-and-pie-card height-pie-rem">
        <div style={{ marginTop: '50px' }}>
          <Skeleton active />
          <Skeleton active />
        </div>
      </div>
    );
  }

  if (!pendingActionData || pendingActionData.length === 0) {
    return (
      <div className="statistics-and-pie-card height-pie-rem">
        <div className="pending-task-section">
          <Row justify={'start'} className="title-section">
            <div className="title">{t('pendingTask')}</div>
            <div className="info-container">
              <Tooltip
                arrowPointAtCenter
                placement="bottomRight"
                trigger="hover"
                title={toolTipText}
              >
                <InfoCircle color="#000000" size={17} />
              </Tooltip>
            </div>
          </Row>
          <div className="pending-item-list">{t('noPendingActions')}</div>
        </div>
      </div>
    );
  }

  const flattenedData: Array<{
    id: string;
    projectTitle: string;
    icon: JSX.Element;
    nextTask: string;
  }> = [];

  pendingActionData.forEach((project) => {
    if (!project.activities || project.activities.length === 0) {
      const { icon, nextTask } = getNextTaskForProjectProposalStage(project.projectProposalStage);

      flattenedData.push({
        id: project.refId,
        projectTitle: project.title,
        icon,
        nextTask,
      });
    } else {
      project.activities.forEach((activity: ActivityEntityResponse) => {
        const { icon, nextTask } = getNextTaskForActivity(activity.state);
        flattenedData.push({
          id: project.refId,
          projectTitle: project.title,
          icon,
          nextTask,
        });
      });
    }
  });

  return (
    <div className="statistics-and-pie-card height-pie-rem">
      <div className="pending-task-section">
        <Row justify={'start'} className="title-section">
          <div className="title">{t('pendingTask')}</div>
          <div className="info-container">
            <Tooltip arrowPointAtCenter placement="bottomRight" trigger="hover" title={toolTipText}>
              <InfoCircle color="#000000" size={17} />
            </Tooltip>
          </div>
        </Row>

        <div className="pending-item-list">
          <List
            dataSource={flattenedData}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={flattenedData.length === 0 ? t('noPendingActions') : null}
                />
              ),
            }}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                style={{
                  background: '#f9fafb',
                  marginBottom: 8,
                  borderRadius: 8,
                  padding: '12px 16px',
                }}
              >
                <Row
                  className="pending-action-row"
                  style={{ width: '100%' }}
                  gutter={[16, 16]}
                  align="middle"
                  wrap={true}
                >
                  <Col flex="auto">
                    <div style={{ fontWeight: 500 }}>{item.projectTitle}</div>
                  </Col>

                  <Col>
                    <Row justify={'start'} align="middle" gutter={8} wrap={true}>
                      <Col>{item.icon}</Col>
                      <Col>{item.nextTask}</Col>
                    </Row>
                  </Col>

                  <Col>
                    <Button
                      type="default"
                      className="pending-action-button"
                      icon={
                        <ChevronDoubleRight
                          className="pending-action-button-icon"
                          color="rgba(22, 177, 255, 1)"
                        />
                      }
                      onClick={() => {
                        navigate(ROUTES.PROGRAMME_DETAILS_BY_ID(String(item.id)));
                      }}
                    />
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </div>
      </div>
    </div>
  );
};
