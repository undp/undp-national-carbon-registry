import { Col, Row, Skeleton, Tag, Tooltip, message } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import './projectForms.scss';
import Icon, {
  CheckCircleOutlined,
  DislikeOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  LikeOutlined,
  BookOutlined,
  FolderViewOutlined,
  VerifiedOutlined,
  DownloadOutlined,
  EyeOutlined,
  EditOutlined,
  CheckOutlined,
  CheckCircleTwoTone,
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import moment from 'moment';
import { RejectDocumentationConfirmationModel } from '../../Models/rejectDocumenConfirmationModel';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { ProgrammeStageUnified } from '../../../Definitions/Enums/programmeStage.enum';
import { DocType, DocumentTypeEnum } from '../../../Definitions/Enums/document.type';
import { Role } from '../../../Definitions/Enums/role.enum';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import {
  formCreatePermission,
  formViewPermission,
  linkDocVisible,
} from '../../../Utils/documentsPermissionSl';
import { useNavigate } from 'react-router-dom';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
import { VerificationRequestStatusEnum } from '../../../Definitions/Enums/verification.request.status.enum';
import { addSpaces } from '../../../Definitions/Definitions/programme.definitions';
import {
  getVerificationRequestStatusName,
  getVerificationRequestStatusType,
} from '../../../Definitions/Definitions/verificationSl.definition';

export interface VerificationFormsProps {
  data: any;
  title: any;
  icon: any;
  programmeId: any;
  companyId: any;
  programmeOwnerId: number;
  getDocumentDetails: any;
  getProgrammeById: any;
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
    getProgrammeById,
    translator,
    projectProposalStage,
  } = props;

  const t = translator.t;
  const { userInfoState } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [docData, setDocData] = useState<any[]>([]);
  // const { delete: del, post } = useConnection();
  // const fileInputRef: any = useRef(null);
  // const fileInputRefMeth: any = useRef(null);

  // const [designDocStatus, setDesignDocStatus] = useState<any>('');

  // const [openRejectDocConfirmationModal, setOpenRejectDocConfirmationModal] = useState(false);
  // const [actionInfo, setActionInfo] = useState<any>({});
  // const [rejectDocData, setRejectDocData] = useState<any>({});

  // const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
  //   ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
  //   : 5000000;

  useEffect(() => {
    setDocData(data);
  }, [data]);

  const navigateToMonitoringReportCreate = () => {
    navigate(`/programmeManagementSLCF/monitoringReport/${programmeId}`, {
      state: {
        mode: FormMode.CREATE,
      },
    });
  };
  const navigateToMonitoringReportView = () => {
    navigate(`/programmeManagementSLCF/monitoringReport/${programmeId}`, {
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

  // const getBase64 = (file: RcFile): Promise<string> =>
  //   new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result as string);
  //     reader.onerror = (error) => reject(error);
  //   });

  // const onUploadDocument = async (file: any, type: any) => {
  //   if (file.size > maximumImageSize) {
  //     message.open({
  //       type: 'error',
  //       content: `${t('common:maxSizeVal')}`,
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   const logoBase64 = await getBase64(file as RcFile);
  //   try {
  //     if (isValidateFileType(file?.type, type)) {
  //       const response: any = await post('national/programme/addDocument', {
  //         type: type,
  //         data: logoBase64,
  //         programmeId: programmeId,
  //       });
  //       fileInputRefMeth.current = null;
  //       if (response?.data) {
  //         setDocData([...docData, response?.data]);
  //         // methodologyDocumentUpdated();
  //         message.open({
  //           type: 'success',
  //           content: `${t('projectDetailsView:isUploaded')}`,
  //           duration: 4,
  //           style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //         });
  //       }
  //     } else {
  //       message.open({
  //         type: 'error',
  //         content: `${t('projectDetailsView:invalidFileFormat')}`,
  //         duration: 4,
  //         style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //       });
  //     }
  //   } catch (error: any) {
  //     fileInputRefMeth.current = null;
  //     message.open({
  //       type: 'error',
  //       content: `${t('projectDetailsView:notUploaded')}`,
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   } finally {
  //     getDocumentDetails();
  //     setLoading(false);
  //   }
  // };

  // const docAction = async (id: any, status: DocumentStatus) => {
  //   setLoading(true);
  //   try {
  //     const response: any = await post('national/programme/docAction', {
  //       id: id,
  //       status: status,
  //     });
  //     message.open({
  //       type: 'success',
  //       content:
  //         status === DocumentStatus.ACCEPTED
  //           ? `${t('projectDetailsView:docApproved')}`
  //           : `${t('projectDetailsView:docRejected')}`,
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   } catch (error: any) {
  //     message.open({
  //       type: 'error',
  //       content: error?.message,
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   } finally {
  //     setOpenRejectDocConfirmationModal(false);
  //     getDocumentDetails();
  //     getProgrammeById();
  //     setLoading(false);
  //   }
  // };

  // const handleOk = () => {
  //   docAction(rejectDocData?.id, DocumentStatus.REJECTED);
  // };

  // const handleCancel = () => {
  //   setOpenRejectDocConfirmationModal(false);
  // };

  // const companyRolePermission =
  //   userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
  //   userInfoState?.userRole !== Role.ViewOnly;

  // const designDocActionPermission =
  //   userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
  //   userInfoState?.userRole !== Role.ViewOnly;

  // const designDocPending = designDocStatus === DocumentStatus.PENDING;

  function navigateToVerificationReportCreate(): void {
    navigate(`/programmeManagementSLCF/verificationReport/${programmeId}`, {
      state: {
        mode: FormMode.CREATE,
      },
    });
  }
  function navigateToVerificationReportView(): void {
    navigate(`/programmeManagementSLCF/verificationReport/${programmeId}`, {
      state: {
        mode: FormMode.VIEW,
      },
    });
  }

  const getLatestReport = (reports: any[], docType: DocumentTypeEnum) => {
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
        {docData.map((item) => (
          <div className="verification-row">
            <Row className="field-verification-title" key="Verification Request Title">
              <Col span={15} className="field-key">
                <div>
                  <span className="verification-title-icon">
                    <VerifiedOutlined />
                  </span>
                  {moment(parseInt(item.createdTime)).format('DD MMMM YYYY @ HH:mm')}
                  {item.verificationSerialNo && ` - ${item.verificationSerialNo}`} {'    '}
                </div>
              </Col>
              <Col span={6} className="field-value verification-req-status-col">
                <Tag className="clickable" color={getVerificationRequestStatusType(item.status)}>
                  {addSpaces(getVerificationRequestStatusName(item.status))}
                </Tag>
              </Col>
            </Row>
            <div>
              <Row className="field" key="Monitoring Report">
                <Col span={18} className="field-key">
                  <div className="label-container">
                    <div className="label">{t('projectDetailsView:monitoringReport')}</div>
                  </div>
                </Col>
                <Col span={3} className="field-value">
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
                          : !getLatestReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) &&
                            t('projectDetailsView:noMonitoringReports')
                      }
                      overlayClassName="custom-tooltip"
                    >
                      <EyeOutlined
                        className="common-progress-icon"
                        style={
                          formViewPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            projectProposalStage
                          ) && getLatestReport(item.documents, DocumentTypeEnum.MONITORING_REPORT)
                            ? {
                                color: '#3F3A47',
                                cursor: 'pointer',
                                margin: '0px 0px 1.5px 0px',
                              }
                            : {
                                color: '#cacaca',
                                cursor: 'default',
                                margin: '0px 0px 1.5px 0px',
                              }
                        }
                        onClick={() =>
                          formViewPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            projectProposalStage
                          ) && navigateToMonitoringReportView()
                        }
                      />
                    </Tooltip>
                  </>
                </Col>
                {!hasAcceptedReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) ? (
                  <Col span={3} className="field-value">
                    {hasRejectedReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) ? (
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
                          <EditOutlined
                            className="common-progress-icon"
                            style={
                              formCreatePermission(
                                userInfoState,
                                DocType.MONITORING_REPORT,
                                projectProposalStage
                              )
                                ? {
                                    color: '#3F3A47',
                                    cursor: 'pointer',
                                    margin: '0px 0px 1.5px 0px',
                                  }
                                : {
                                    color: '#cacaca',
                                    cursor: 'default',
                                    margin: '0px 0px 1.5px 0px',
                                  }
                            }
                            onClick={() =>
                              formCreatePermission(
                                userInfoState,
                                DocType.MONITORING_REPORT,
                                projectProposalStage
                              ) && navigateToMonitoringReportCreate()
                            }
                          />
                        </Tooltip>
                      </>
                    ) : (
                      !hasPendingReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) && (
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
                            <PlusOutlined
                              className="common-progress-icon"
                              style={
                                formCreatePermission(
                                  userInfoState,
                                  DocType.MONITORING_REPORT,
                                  projectProposalStage
                                )
                                  ? {
                                      color: '#3F3A47',
                                      cursor: 'pointer',
                                      margin: '0px 0px 1.5px 0px',
                                    }
                                  : {
                                      color: '#cacaca',
                                      cursor: 'default',
                                      margin: '0px 0px 1.5px 0px',
                                    }
                              }
                              onClick={() =>
                                formCreatePermission(
                                  userInfoState,
                                  DocType.MONITORING_REPORT,
                                  projectProposalStage
                                ) && navigateToMonitoringReportCreate()
                              }
                            />
                          </Tooltip>
                        </>
                      )
                    )}
                  </Col>
                ) : (
                  <Col span={3} className="field-value">
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </Col>
                )}
              </Row>
              <Row className="field" key={`VerificationReport${item.id}`}>
                <Col span={18} className="field-key">
                  <div className="label-container">
                    <div className="label">{t('projectDetailsView:verificationReport')}</div>
                  </div>
                </Col>
                <Col span={3} className="field-value">
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
                      <EyeOutlined
                        className="common-progress-icon"
                        style={
                          formViewPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            projectProposalStage
                          ) && getLatestReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT)
                            ? {
                                color: '#3F3A47',
                                cursor: 'pointer',
                                margin: '0px 0px 1.5px 0px',
                              }
                            : {
                                color: '#cacaca',
                                cursor: 'default',
                                margin: '0px 0px 1.5px 0px',
                              }
                        }
                        onClick={() =>
                          formViewPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            projectProposalStage
                          ) && navigateToVerificationReportView()
                        }
                      />
                    </Tooltip>
                  </>
                </Col>
                {!hasAcceptedReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT) ? (
                  <Col span={3} className="field-value">
                    {hasRejectedReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT) ? (
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
                          <EditOutlined
                            className="common-progress-icon"
                            style={
                              formCreatePermission(
                                userInfoState,
                                DocType.VERIFICATION_REPORT,
                                projectProposalStage
                              )
                                ? {
                                    color: '#3F3A47',
                                    cursor: 'pointer',
                                    margin: '0px 0px 1.5px 0px',
                                  }
                                : {
                                    color: '#cacaca',
                                    cursor: 'default',
                                    margin: '0px 0px 1.5px 0px',
                                  }
                            }
                            onClick={() =>
                              formCreatePermission(
                                userInfoState,
                                DocType.VERIFICATION_REPORT,
                                projectProposalStage
                              ) && navigateToVerificationReportCreate()
                            }
                          />
                        </Tooltip>
                      </>
                    ) : (
                      hasAcceptedReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) &&
                      !hasPendingReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT) && (
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
                            <PlusOutlined
                              className="common-progress-icon"
                              style={
                                formCreatePermission(
                                  userInfoState,
                                  DocType.VERIFICATION_REPORT,
                                  projectProposalStage
                                )
                                  ? {
                                      color: '#3F3A47',
                                      cursor: 'pointer',
                                      margin: '0px 0px 1.5px 0px',
                                    }
                                  : {
                                      color: '#cacaca',
                                      cursor: 'default',
                                      margin: '0px 0px 1.5px 0px',
                                    }
                              }
                              onClick={() =>
                                formCreatePermission(
                                  userInfoState,
                                  DocType.VERIFICATION_REPORT,
                                  projectProposalStage
                                ) && navigateToVerificationReportCreate()
                              }
                            />
                          </Tooltip>
                        </>
                      )
                    )}
                  </Col>
                ) : (
                  <Col span={3} className="field-value">
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </Col>
                )}
              </Row>
              {item.creditIssueCertificateUrl && (
                <Row className="field" key="creditIssueCertificate">
                  <Col span={18} className="field-key">
                    <div className="label-container">
                      <div className="label">{t('projectDetailsView:creditIssueCertificate')}</div>
                    </div>
                  </Col>
                  <Col span={3} className="field-value">
                    <>
                      <Tooltip
                        arrowPointAtCenter
                        placement="top"
                        trigger="hover"
                        title={
                          userInfoState?.companyId !== companyId &&
                          t('projectDetailsView:orgNotAuthDownload')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <DownloadOutlined
                          className="common-progress-icon"
                          style={
                            userInfoState?.companyId === companyId
                              ? {
                                  color: '#3F3A47',
                                  cursor: 'pointer',
                                  margin: '0px 0px 1.5px 0px',
                                }
                              : {
                                  color: '#cacaca',
                                  cursor: 'default',
                                  margin: '0px 0px 1.5px 0px',
                                }
                          }
                          onClick={() =>
                            formViewPermission(
                              userInfoState,
                              DocType.VERIFICATION_REPORT,
                              projectProposalStage
                            ) && downloadCreditIssueCertificate(item.creditIssueCertificateUrl)
                          }
                        />
                      </Tooltip>
                    </>
                  </Col>
                </Row>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* <RejectDocumentationConfirmationModel
        actionInfo={actionInfo}
        onActionConfirmed={handleOk}
        onActionCanceled={handleCancel}
        openModal={openRejectDocConfirmationModal}
        errorMsg={''}
        loading={loading}
        translator={translator}
      /> */}
    </>
  );
};
