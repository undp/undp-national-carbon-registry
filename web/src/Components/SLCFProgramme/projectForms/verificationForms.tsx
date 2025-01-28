import { Button, Col, Row, Skeleton, Steps, Tag, Tooltip, message } from 'antd';
import { FC, useEffect, useState } from 'react';
import './projectForms.scss';
import { VerifiedOutlined } from '@ant-design/icons';
import moment from 'moment';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { DocType, DocumentTypeEnum } from '../../../Definitions/Enums/document.type';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { formCreatePermission, formViewPermission } from '../../../Utils/documentsPermissionSl';
import { useNavigate } from 'react-router-dom';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { addSpaces } from '../../../Definitions/Definitions/programme.definitions';
import {
  getIssuerCertificateContent,
  getMonitoringContent,
  getVerificationContent,
  getVerificationRequestStatusName,
  getVerificationRequestStatusType,
  getVerificationTimelineCurrentStep,
} from '../../../Definitions/Definitions/verificationSl.definition';
import { VerificationRequest } from '../../../Definitions/Entities/verificationRequest';

export interface VerificationFormsProps {
  data: any;
  title: any;
  icon: any;
  programmeId: any;
  companyId: any;
  programmeOwnerId: number;
  getDocumentDetails: any;
  getVerificationData: any;
  ministryLevelPermission?: boolean;
  translator: any;
  projectProposalStage?: any;
}

export const VerificationForms: FC<VerificationFormsProps> = (props: VerificationFormsProps) => {
  const {
    data,
    title,
    icon,
    programmeId,
    companyId,
    getDocumentDetails,
    getVerificationData,
    translator,
    projectProposalStage,
  } = props;

  const t = translator.t;
  const { userInfoState } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [docData, setDocData] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  useEffect(() => {
    setDocData(data);
  }, [data]);

  const handleCancel = () => {
    setModalVisible(false);
  };

  const navigateToMonitoringReportCreate = (docId: any) => {
    navigate(`/programmeManagementSLCF/monitoringReport/${programmeId}`, {
      state: {
        mode: FormMode.CREATE,
        docId: docId,
      },
    });
  };

  const navigateToMonitoringReportEdit = (docId: any, verificationRequestId: any) => {
    navigate(`/programmeManagementSLCF/monitoringReport/${programmeId}/${verificationRequestId}`, {
      state: {
        mode: FormMode.EDIT,
        docId: docId,
      },
    });
  };

  const navigateToMonitoringReportView = (verificationRequestId: any) => {
    navigate(`/programmeManagementSLCF/monitoringReport/${programmeId}/${verificationRequestId}`, {
      state: {
        mode: FormMode.VIEW,
      },
    });
  };

  const downloadCreditIssueCertificate = async (url: string) => {
    // setLoading(true);
    try {
      if (url !== undefined && url !== '') {
        const response = await fetch(url); // Ensure the URL is fetched properly
        if (response.ok) {
          const blob = await response.blob(); // Create a blob from the response
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = downloadUrl;
          a.download = url.split('/').pop() || 'Credit_Issuance_Certificate.pdf'; // Extract filename or provide default
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(downloadUrl); // Clean up the created object URL
        } else {
          message.open({
            type: 'error',
            content: response.statusText,
            duration: 3,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      }
      // setLoading(false);
    } catch (error: any) {
      console.log('Error in exporting transfers', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      // setLoading(false);
    }
  };

  function navigateToVerificationReportCreate(docId: any): void {
    navigate(`/programmeManagementSLCF/verificationReport/${programmeId}`, {
      state: {
        mode: FormMode.CREATE,
        docId: docId,
      },
    });
  }

  const navigateToVerificationReportEdit = (docId: any, verificationRequestId: any) => {
    navigate(
      `/programmeManagementSLCF/verificationReport/${programmeId}/${verificationRequestId}`,
      {
        state: {
          mode: FormMode.EDIT,
          docId: docId,
        },
      }
    );
  };

  function navigateToVerificationReportView(verificationRequestId: any): void {
    navigate(
      `/programmeManagementSLCF/verificationReport/${programmeId}/${verificationRequestId}`,
      {
        state: {
          mode: FormMode.VIEW,
        },
      }
    );
  }

  const getLatestReport = (reports: any[], docType: DocumentTypeEnum): any => {
    const filteredReports = reports.filter((report) => report.type === docType);

    let latestReport = null;
    let maxTime = 0;

    filteredReports.forEach((report) => {
      const createdTime = parseInt(report.createdTime);
      if (createdTime > maxTime) {
        maxTime = createdTime;
        latestReport = report;
      }
    });

    return latestReport;
  };

  const getLatestReportId = (reports: any[], docType: DocumentTypeEnum) => {
    const filteredReports = reports.filter((report) => report.type === docType);

    let latestReport: any = null;
    let maxTime = 0;

    filteredReports.forEach((report) => {
      const createdTime = parseInt(report.createdTime);
      if (createdTime > maxTime) {
        maxTime = createdTime;
        latestReport = report;
      }
    });
    return latestReport?.id;
  };

  const hasPendingReport = (reports: any[], docType: DocumentTypeEnum) => {
    const latest: any = getLatestReport(reports, docType);
    return latest ? latest.status === 'Pending' : false;
  };

  const hasAcceptedReport = (reports: any[], docType: DocumentTypeEnum) => {
    const latest: any = getLatestReport(reports, docType);
    return latest ? latest.status === 'Accepted' : false;
  };

  const hasRejectedReport = (reports: any[], docType: DocumentTypeEnum) => {
    const latest: any = getLatestReport(reports, docType);
    return latest ? latest.status === 'Rejected' : false;
  };

  return loading ? (
    <Skeleton />
  ) : (
    <>
      <div className="info-view">
        <div className="title">
          <span className="title-icon">{icon}</span>
          <span className="title-text">{title}</span>
        </div>
        {docData.map((item, index, array) => (
          <div className="verification-row">
            <Row className="field-verification-title" key="Verification Request Title">
              <Col span={24} className="field-key">
                <div className="verification-title-main">
                  <span className="verification-title-icon">
                    <VerifiedOutlined />
                  </span>
                  {moment(parseInt(item.createdTime)).format('DD MMMM YYYY @ HH:mm')}
                  {item.verificationSerialNo && ` - ${item.verificationSerialNo}`} {'    '}
                  <span className="verification-title-status-tag">
                    <Tag color={getVerificationRequestStatusType(item.status)}>
                      {addSpaces(getVerificationRequestStatusName(item.status))}
                    </Tag>
                  </span>
                </div>
              </Col>
            </Row>
            <div>
              <Steps
                direction="vertical"
                size="small"
                current={getVerificationTimelineCurrentStep(item.status)}
                items={[
                  {
                    icon: (
                      <div
                        className={`${getMonitoringContent(item.status).className} timeline-icon`}
                      >
                        {getMonitoringContent(item.status).icon}
                      </div>
                    ),
                    title: (
                      <Row className="field" key="Monitoring Report">
                        <Col span={12} className="field-key">
                          <div className="label-container">
                            <div className="label">{t('projectDetailsView:monitoringReport')}</div>
                          </div>
                          {(() => {
                            const latestReport = getLatestReport(
                              item.documents,
                              DocumentTypeEnum.MONITORING_REPORT
                            );
                            return latestReport ? (
                              <div className="time">
                                {moment(parseInt(latestReport?.createdTime, 10)).format(
                                  'DD MMMM YYYY'
                                ) +
                                  ' ~ V' +
                                  latestReport.version}
                              </div>
                            ) : null;
                          })()}
                        </Col>
                        <Col span={6} className="field-value">
                          <>
                            <Tooltip
                              arrowPointAtCenter
                              placement="top"
                              trigger="hover"
                              title={
                                !formViewPermission(
                                  userInfoState,
                                  DocType.MONITORING_REPORT,
                                  projectProposalStage
                                )
                                  ? t('projectDetailsView:orgNotAuthView')
                                  : !getLatestReport(
                                      item.documents,
                                      DocumentTypeEnum.MONITORING_REPORT
                                    ) && t('projectDetailsView:noMonitoringReports')
                              }
                              overlayClassName="custom-tooltip"
                            >
                              <Button
                                type="default"
                                onClick={() => navigateToMonitoringReportView(item.id)}
                                disabled={
                                  !(
                                    formViewPermission(
                                      userInfoState,
                                      DocType.MONITORING_REPORT,
                                      projectProposalStage
                                    ) &&
                                    getLatestReport(
                                      item.documents,
                                      DocumentTypeEnum.MONITORING_REPORT
                                    )
                                  )
                                }
                                size="small"
                                className="btnProjectForms"
                              >
                                {t('projectDetailsView:btnView')}
                              </Button>
                            </Tooltip>
                          </>
                        </Col>
                        {!hasAcceptedReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) && (
                          <Col span={6} className="field-value">
                            {hasRejectedReport(
                              item.documents,
                              DocumentTypeEnum.MONITORING_REPORT
                            ) ? (
                              <>
                                <Tooltip
                                  arrowPointAtCenter
                                  placement="top"
                                  trigger="hover"
                                  title={
                                    !formCreatePermission(
                                      userInfoState,
                                      DocType.MONITORING_REPORT,
                                      projectProposalStage
                                    ) && t('projectDetailsView:orgNotAuthEdit')
                                  }
                                  overlayClassName="custom-tooltip"
                                >
                                  <Button
                                    type="default"
                                    onClick={() =>
                                      navigateToMonitoringReportEdit(
                                        getLatestReportId(
                                          item.documents,
                                          DocumentTypeEnum.MONITORING_REPORT
                                        ),
                                        item.id
                                      )
                                    }
                                    disabled={
                                      !formCreatePermission(
                                        userInfoState,
                                        DocType.MONITORING_REPORT,
                                        projectProposalStage
                                      )
                                    }
                                    size="small"
                                    className="btnProjectForms"
                                  >
                                    {t('projectDetailsView:btnEdit')}
                                  </Button>
                                </Tooltip>
                              </>
                            ) : (
                              !hasPendingReport(
                                item.documents,
                                DocumentTypeEnum.MONITORING_REPORT
                              ) && (
                                <>
                                  <Tooltip
                                    arrowPointAtCenter
                                    placement="top"
                                    trigger="hover"
                                    title={
                                      !formCreatePermission(
                                        userInfoState,
                                        DocType.MONITORING_REPORT,
                                        projectProposalStage
                                      ) && t('projectDetailsView:orgNotAuthCreate')
                                    }
                                    overlayClassName="custom-tooltip"
                                  >
                                    <Button
                                      type="default"
                                      onClick={() => navigateToMonitoringReportCreate(null)}
                                      disabled={
                                        !formCreatePermission(
                                          userInfoState,
                                          DocType.MONITORING_REPORT,
                                          projectProposalStage
                                        )
                                      }
                                      size="small"
                                      className="btnProjectForms"
                                    >
                                      {t('projectDetailsView:btnAdd')}
                                    </Button>
                                  </Tooltip>
                                </>
                              )
                            )}
                          </Col>
                        )}
                      </Row>
                    ),
                  },
                  {
                    icon: (
                      <div
                        className={`${getVerificationContent(item.status).className} timeline-icon`}
                      >
                        {getVerificationContent(item.status).icon}
                      </div>
                    ),
                    title: (
                      <Row className="field" key={`VerificationReport${item.id}`}>
                        <Col span={12} className="field-key">
                          <div className="label-container">
                            <div className="label">
                              {t('projectDetailsView:verificationReport')}
                            </div>
                          </div>
                          {(() => {
                            const latestReport = getLatestReport(
                              item.documents,
                              DocumentTypeEnum.VERIFICATION_REPORT
                            );
                            return latestReport ? (
                              <div className="time">
                                {moment(parseInt(latestReport?.createdTime, 10)).format(
                                  'DD MMMM YYYY'
                                ) +
                                  ' ~ V' +
                                  latestReport.version}
                              </div>
                            ) : null;
                          })()}
                        </Col>
                        <Col span={6} className="field-value">
                          <>
                            <Tooltip
                              arrowPointAtCenter
                              placement="top"
                              trigger="hover"
                              title={
                                !formViewPermission(
                                  userInfoState,
                                  DocType.VERIFICATION_REPORT,
                                  projectProposalStage
                                )
                                  ? t('projectDetailsView:orgNotAuthView')
                                  : !getLatestReport(
                                      item.documents,
                                      DocumentTypeEnum.VERIFICATION_REPORT
                                    ) && t('projectDetailsView:noVerificationReports')
                              }
                              overlayClassName="custom-tooltip"
                            >
                              <Button
                                type="default"
                                onClick={() => navigateToVerificationReportView(item.id)}
                                disabled={
                                  !(
                                    formViewPermission(
                                      userInfoState,
                                      DocType.VERIFICATION_REPORT,
                                      projectProposalStage
                                    ) &&
                                    getLatestReport(
                                      item.documents,
                                      DocumentTypeEnum.VERIFICATION_REPORT
                                    )
                                  )
                                }
                                size="small"
                                className="btnProjectForms"
                              >
                                {t('projectDetailsView:btnView')}
                              </Button>
                            </Tooltip>
                          </>
                        </Col>
                        {!hasAcceptedReport(
                          item.documents,
                          DocumentTypeEnum.VERIFICATION_REPORT
                        ) && (
                          <Col span={6} className="field-value">
                            {hasRejectedReport(
                              item.documents,
                              DocumentTypeEnum.VERIFICATION_REPORT
                            ) ? (
                              <>
                                <Tooltip
                                  arrowPointAtCenter
                                  placement="top"
                                  trigger="hover"
                                  title={
                                    !formCreatePermission(
                                      userInfoState,
                                      DocType.VERIFICATION_REPORT,
                                      projectProposalStage
                                    ) && t('projectDetailsView:orgNotAuthEdit')
                                  }
                                  overlayClassName="custom-tooltip"
                                >
                                  <Button
                                    type="default"
                                    onClick={() =>
                                      navigateToVerificationReportEdit(
                                        getLatestReportId(
                                          item.documents,
                                          DocumentTypeEnum.VERIFICATION_REPORT
                                        ),
                                        item.id
                                      )
                                    }
                                    disabled={
                                      !formCreatePermission(
                                        userInfoState,
                                        DocType.VERIFICATION_REPORT,
                                        projectProposalStage
                                      )
                                    }
                                    size="small"
                                    className="btnProjectForms"
                                  >
                                    {t('projectDetailsView:btnEdit')}
                                  </Button>
                                </Tooltip>
                              </>
                            ) : (
                              hasAcceptedReport(
                                item.documents,
                                DocumentTypeEnum.MONITORING_REPORT
                              ) &&
                              !hasPendingReport(
                                item.documents,
                                DocumentTypeEnum.VERIFICATION_REPORT
                              ) && (
                                <>
                                  <Tooltip
                                    arrowPointAtCenter
                                    placement="top"
                                    trigger="hover"
                                    title={
                                      !formCreatePermission(
                                        userInfoState,
                                        DocType.VERIFICATION_REPORT,
                                        projectProposalStage
                                      ) && t('projectDetailsView:orgNotAuthCreate')
                                    }
                                    overlayClassName="custom-tooltip"
                                  >
                                    <Button
                                      type="default"
                                      onClick={() => navigateToVerificationReportCreate(null)}
                                      disabled={
                                        !formCreatePermission(
                                          userInfoState,
                                          DocType.VERIFICATION_REPORT,
                                          projectProposalStage
                                        )
                                      }
                                      size="small"
                                      className="btnProjectForms"
                                    >
                                      {t('projectDetailsView:btnAdd')}
                                    </Button>
                                  </Tooltip>
                                </>
                              )
                            )}
                          </Col>
                        )}
                      </Row>
                    ),
                  },
                  {
                    title: (
                      <Row className="field" key="creditIssueCertificate">
                        <Col span={12} className="field-key">
                          <div className="label-container">
                            <div className="label">
                              {t('projectDetailsView:creditIssueCertificate')}
                            </div>
                          </div>
                        </Col>
                        <Col span={6} className="field-value">
                          <>
                            <Tooltip
                              arrowPointAtCenter
                              placement="top"
                              trigger="hover"
                              title={
                                userInfoState?.companyId !== companyId &&
                                userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
                                t('projectDetailsView:orgNotAuthDownload')
                              }
                              overlayClassName="custom-tooltip"
                            >
                              <Button
                                type="default"
                                onClick={() =>
                                  downloadCreditIssueCertificate(item.creditIssueCertificateUrl)
                                }
                                disabled={
                                  item.creditIssueCertificateUrl === null ||
                                  (userInfoState?.companyId !== companyId &&
                                    userInfoState?.companyRole ===
                                      CompanyRole.PROGRAMME_DEVELOPER &&
                                    !formViewPermission(
                                      userInfoState,
                                      DocType.VERIFICATION_REPORT,
                                      projectProposalStage
                                    ))
                                }
                                size="small"
                                className="btnProjectForms"
                              >
                                {t('projectDetailsView:btnDownload')}
                              </Button>
                            </Tooltip>
                          </>
                        </Col>
                      </Row>
                    ),
                    icon: (
                      <div
                        className={`${
                          getIssuerCertificateContent(item.status).className
                        } timeline-icon`}
                      >
                        {getIssuerCertificateContent(item.status).icon}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
