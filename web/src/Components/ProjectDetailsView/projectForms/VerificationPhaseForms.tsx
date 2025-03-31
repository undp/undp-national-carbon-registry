import { Button, Col, Row, Steps, Tag } from 'antd';
import './projectForms.scss';
import * as Icon from 'react-bootstrap-icons';
import { ActivityStateEnum } from '../../../Definitions/Enums/programmeStage.enum';
import moment from 'moment';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { useEffect, useState } from 'react';
import { activityPermissions } from '../../../Utils/documentsPermissionSl';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { DocType, DocumentTypeEnum } from '../../../Definitions/Enums/document.type';
import { DocumentEnum } from '../../../Definitions/Enums/document.enum';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../../Config/uiRoutingConfig';
import { CloseCircleFilled, CloseCircleOutlined, CloseOutlined } from '@ant-design/icons';

export interface Iactivity {
  stage: string;
  documents: any[];
  activityLastUpdatedDate: string;
  refId?: string;
}

interface IVerificationPhaseForms {
  activityData: Iactivity[];
  documents: any[];
}
interface IPermissionsState {
  mode: FormMode;
  userCompanyRole?: CompanyRole;
  documentRefId?: string;
}

const VerificationPhaseForms = (props: IVerificationPhaseForms) => {
  const { activityData, documents } = props;
  const { userInfoState } = useUserContext();
  const { id } = useParams();

  const navigate = useNavigate();

  const [monitoringReportPermissions, setMonitoringReportPermissions] = useState<
    IPermissionsState[]
  >([]);

  const [verificationReportPermissions, setVerificationReportPermissions] = useState<
    IPermissionsState[]
  >([]);

  const [items, setItems] = useState<any[]>([]);

  const navigateToMonitoringReport = (permissionsState: IPermissionsState) => {
    navigate(ROUTES.MONITORING_REPORT_CREATE(id as string), { state: permissionsState });
  };

  const navigateToVerificationReport = (permissionsState: IPermissionsState) => {
    navigate(ROUTES.VERIFICATION_REPORT(id as string), {
      state: permissionsState,
    });
  };

  useEffect(() => {
    const generatePermissions = () => {
      const monitoringPermissions: IPermissionsState[] = [];
      const verificationPermissions: IPermissionsState[] = [];

      activityData.forEach((activity, index) => {
        const tempMonitoringReportPermissions = activityPermissions(
          userInfoState,
          DocType.MONITORING_REPORT,
          activity,
          documents
        );

        // monitoringPermissions.push(tempMonitoringReportPermissions as IPermissionsState);

        const tempVerificationReportPermissions = activityPermissions(
          userInfoState,
          DocType.VERIFICATION_REPORT,
          activity,
          documents
        );

        // verificationPermissions.push(tempVerificationReportPermissions as IPermissionsState);

        const temp = [
          {
            title: (
              <>
                <Row className="document-info-row-first">
                  <Col md={18} className="documentTitle-col">
                    Monitoring Report
                  </Col>
                  <Col md={6} className="documentAction-col">
                    <Button
                      className="document-action-btn"
                      onClick={() => {
                        console.log('----------clidke 111');
                        navigateToMonitoringReport(tempMonitoringReportPermissions);
                      }}
                      disabled={tempMonitoringReportPermissions?.mode === FormMode?.DISABLED}
                    >
                      {tempMonitoringReportPermissions?.mode === FormMode.CREATE
                        ? 'CREATE'
                        : tempMonitoringReportPermissions?.mode === FormMode.VERIFY
                        ? 'VERIFY'
                        : tempMonitoringReportPermissions?.mode === FormMode.EDIT
                        ? 'EDIT'
                        : 'VIEW'}
                    </Button>
                  </Col>
                </Row>
              </>
            ),
            icon: (
              <span
                className={
                  activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED
                    ? 'step-icon-submitted'
                    : activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED
                    ? 'step-icon-rejected'
                    : 'step-icon-completed'
                }
              >
                {activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED ? (
                  <Icon.FileText />
                ) : activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED ? (
                  <CloseOutlined />
                ) : (
                  <Icon.Check />
                )}
              </span>
            ),
          },
          {
            title: (
              <>
                <Row className="document-info-row-first">
                  <Col md={18} className="documentTitle-col">
                    Verification Report
                  </Col>
                  <Col md={6} className="documentAction-col">
                    <Button
                      className="document-action-btn"
                      onClick={() => {
                        navigateToVerificationReport(tempVerificationReportPermissions);
                      }}
                      disabled={tempVerificationReportPermissions?.mode === FormMode?.DISABLED}
                    >
                      {tempVerificationReportPermissions?.mode === FormMode.CREATE
                        ? 'CREATE'
                        : tempVerificationReportPermissions?.mode === FormMode.VERIFY
                        ? 'VERIFY'
                        : tempVerificationReportPermissions?.mode === FormMode.EDIT
                        ? 'EDIT'
                        : 'VIEW'}
                    </Button>
                  </Col>
                </Row>
              </>
            ),
            icon: (
              <span
                className={
                  activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED
                    ? 'step-icon-submitted'
                    : activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED
                    ? 'step-icon-rejected'
                    : activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
                    ? 'step-icon-completed'
                    : 'step-icon-pending'
                }
              >
                {activity.stage === ActivityStateEnum.VERIFICATION_REPORT_UPLOADED ? (
                  <Icon.FileText />
                ) : activity.stage === ActivityStateEnum.VERIFICATION_REPORT_REJECTED ? (
                  <CloseOutlined />
                ) : activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED ? (
                  <Icon.Check />
                ) : (
                  <Icon.Hourglass />
                )}
              </span>
            ),
          },
        ];

        setItems((prev) => [...prev, temp]);
      });
      setMonitoringReportPermissions(monitoringPermissions);
      setVerificationReportPermissions(verificationPermissions);
    };
    generatePermissions();
  }, []);

  return (
    <div className="verification-forms">
      <div className="info-view">
        <div className="title">
          <div className="title-icon">
            <Icon.Grid />
          </div>
          <span className="title-text">Verification Phase Forms</span>
        </div>
      </div>

      {activityData.map((activity, index) => (
        <div key={index}>
          <Row className="document-info-row-first">
            <Col md={18} className="stage-title">
              <span className="stage-icon">
                <Icon.XDiamond />
              </span>
              <span className="stage-last-updated">
                {moment
                  .unix(Number(activity?.activityLastUpdatedDate) / 1000)
                  .format('DD MMMM YYYY @ HH:mm')}
              </span>
            </Col>
            <Col md={6} className="tag-col">
              {activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED ? (
                <Tag color="blue">Credit Issued</Tag>
              ) : (
                <Tag color="gold">Pending</Tag>
              )}
            </Col>

            <div className="activity-container">
              <Steps
                direction="vertical"
                current={
                  activity.stage === ActivityStateEnum.MONITORING_REPORT_REJECTED ||
                  activity.stage === ActivityStateEnum.MONITORING_REPORT_UPLOADED ||
                  activity.stage === ActivityStateEnum.MONITORING_REPORT_VERIFIED
                    ? 0
                    : activity.stage === ActivityStateEnum.VERIFICATION_REPORT_VERIFIED
                    ? 2
                    : 1
                }
                items={items[index]}
              />
            </div>
          </Row>
        </div>
      ))}
    </div>
  );
};

export default VerificationPhaseForms;
