import { Button, Col, Row, Skeleton, Steps, Tag, Tooltip, message } from 'antd';
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
  CloseOutlined,
  CloseCircleOutlined,
  ExclamationCircleTwoTone,
  SendOutlined,
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
  getIssuerCertificateContent,
  getMonitoringContent,
  getVerificationContent,
  getVerificationRequestStatusName,
  getVerificationRequestStatusType,
  getVerificationTimelineCurrentStep,
} from '../../../Definitions/Definitions/verificationSl.definition';
import { VerificationRequest } from '../../../Definitions/Entities/verificationRequest';
import {
  CarbonNeutralConfirmationModelSl,
  CarbonNeutralConfirmationPopupInfo,
} from '../../Models/carbonNeutralConfirmationModelSl';

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

// type PopupInfo = {
//   headerText: string;
//   icon: any;
//   text: any;
//   actionBtnText: string;
//   okAction: any;
//   type: 'primary' | 'danger';
//   remarkRequired: boolean;
// };

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
  const { delete: del, post } = useConnection();
  const [docData, setDocData] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedReq, setSelectedReq] = useState<VerificationRequest>();
  const [popupInfo, setPopupInfo] = useState<any>({});
  const [actionInfo, setActionInfo] = useState<any>({});
  const [rejectDocData, setRejectDocData] = useState<any>({});
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

  const showCarbonNeutralCertificateRequestApproveModal = (
    record: any,
    info: CarbonNeutralConfirmationPopupInfo
  ) => {
    setSelectedReq(record);
    setModalVisible(true);
    setPopupInfo(info);
  };

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

  const requestCarbonNeutralCertificate = async (verificationRequestId: number) => {
    setLoading(true);
    try {
      const response: any = await post('national/verification/requestCarbonNeutralCertificate', {
        verificationRequestId: verificationRequestId,
      });
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: `${t('projectDetailsView:requestCarbonNeutralCertificateSuccess')}`,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });

        getVerificationData();
      }
    } catch (err: any) {
      console.log('Error in getting documents - ', err);
      message.open({
        type: 'error',
        content: err.message,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (
    reqId: number,
    level: string,
    startDate: number,
    endDate: number,
    year: number,
    comment: string,
    approve: boolean
  ) => {
    setLoading(true);
    try {
      const response: any = await post('national/verification/issueCarbonNeutralCertificate', {
        verificationRequestId: reqId,
        scope: level,
        assessmentPeriodStart: startDate,
        assessmentPeriodEnd: endDate,
        year,
        approve,
        orgBoundary: comment,
      });
      const successMsg = approve
        ? `${t('projectDetailsView:carbonNeutralCertificateApproved')}`
        : `${t('projectDetailsView:carbonNeutralCertificateRejected')}`;
      message.open({
        type: 'success',
        content: successMsg,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      getVerificationData();
    } catch (error: any) {
      console.log('Error in issuing  request', error);
      message.open({
        type: 'error',
        content: error.message,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      // return error.message;
    } finally {
      setModalVisible(false);
      setLoading(false);
    }
  };

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
                    // title: 'Finished',
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
                              {/* <EyeOutlined
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
                          ) &&
                          navigateToMonitoringReportView(
                            getLatestReportId(item.documents, DocumentTypeEnum.MONITORING_REPORT)
                          )
                        }
                      /> */}
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
                                  {/* <EditOutlined
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
                              ) &&
                              navigateToMonitoringReportCreate(
                                getLatestReportId(
                                  item.documents,
                                  DocumentTypeEnum.MONITORING_REPORT
                                )
                              )
                            }
                          /> */}
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
                                    {/* <PlusOutlined
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
                                ) && navigateToMonitoringReportCreate(null)
                              }
                            /> */}
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
                    // icon: getVerificationContent(item.status).icon,
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
                              {/* <EyeOutlined
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
                          ) &&
                          navigateToVerificationReportView(
                            getLatestReportId(item.documents, DocumentTypeEnum.VERIFICATION_REPORT)
                          )
                        }
                      /> */}
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
                                    ) && t('projectDetailsView:orgNotAuthCreate')
                                  }
                                  overlayClassName="custom-tooltip"
                                >
                                  {/* <EditOutlined
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
                              ) &&
                              navigateToVerificationReportCreate(
                                getLatestReportId(
                                  item.documents,
                                  DocumentTypeEnum.VERIFICATION_REPORT
                                )
                              )
                            }
                          /> */}
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
                                    {/* <PlusOutlined
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
                                ) && navigateToVerificationReportCreate(null)
                              }
                            /> */}
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
              {/* <Row className="field" key="Monitoring Report">
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
                        {moment(parseInt(latestReport?.createdTime, 10)).format('DD MMMM YYYY') +
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
                          : !getLatestReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) &&
                            t('projectDetailsView:noMonitoringReports')
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
                            ) && getLatestReport(item.documents, DocumentTypeEnum.MONITORING_REPORT)
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
                {!hasAcceptedReport(item.documents, DocumentTypeEnum.MONITORING_REPORT) ? (
                  <Col span={6} className="field-value">
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
                ) : (
                  <Col span={6} className="field-value">
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </Col>
                )}
              </Row> */}
              {/* <Row className="field" key={`VerificationReport${item.id}`}>
                <Col span={12} className="field-key">
                  <div className="label-container">
                    <div className="label">{t('projectDetailsView:verificationReport')}</div>
                  </div>
                  {(() => {
                    const latestReport = getLatestReport(
                      item.documents,
                      DocumentTypeEnum.VERIFICATION_REPORT
                    );
                    return latestReport ? (
                      <div className="time">
                        {moment(parseInt(latestReport?.createdTime, 10)).format('DD MMMM YYYY') +
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
                            getLatestReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT)
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
                {!hasAcceptedReport(item.documents, DocumentTypeEnum.VERIFICATION_REPORT) ? (
                  <Col span={6} className="field-value">
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
                ) : (
                  <Col span={6} className="field-value">
                    <CheckCircleTwoTone twoToneColor="#52c41a" />
                  </Col>
                )}
              </Row> */}
              {/* {item.creditIssueCertificateUrl && (
                <Row className="field" key="creditIssueCertificate">
                  <Col span={12} className="field-key">
                    <div className="label-container">
                      <div className="label">{t('projectDetailsView:creditIssueCertificate')}</div>
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
                            userInfoState?.companyId !== companyId &&
                            userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
                            !formViewPermission(
                              userInfoState,
                              DocType.VERIFICATION_REPORT,
                              projectProposalStage
                            )
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
              )} */}
              {/* MARK: Carbon Neutral Certificate */}
              {/* {item.carbonNeutralCertificateUrl ? (
                <Row className="field" key="carbonNeutralCertificate">
                  <Col span={12} className="field-key">
                    <div className="label-container">
                      <div className="label">
                        {t('projectDetailsView:carbonNeutralCertificate')}
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
                            downloadCreditIssueCertificate(item.carbonNeutralCertificateUrl)
                          }
                          disabled={
                            userInfoState?.companyId !== companyId &&
                            userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
                            !formViewPermission(
                              userInfoState,
                              DocType.VERIFICATION_REPORT,
                              projectProposalStage
                            )
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
              ) : index === array.length - 1 &&
                !item.carbonNeutralCertificateUrl &&
                item.status === VerificationRequestStatusEnum.VERIFICATION_REPORT_VERIFIED &&
                userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER ? (
                <Row className="field" key="carbonNeutralCertificate">
                  <Col span={12} className="field-key">
                    <div className="label-container">
                      <div className="label">
                        {t('projectDetailsView:carbonNeutralCertificate')}
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
                          userInfoState?.companyId !== companyId
                            ? t('projectDetailsView:orgNotAuthDownload')
                            : item.carbonNeutralCertificateRequested &&
                              t('projectDetailsView:carbonNeutralCertificateRequestPending')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <Button
                          type="default"
                          onClick={() => requestCarbonNeutralCertificate(item.id)}
                          disabled={
                            !(
                              userInfoState?.companyId === companyId &&
                              !item.carbonNeutralCertificateRequested &&
                              formCreatePermission(
                                userInfoState,
                                DocType.MONITORING_REPORT,
                                projectProposalStage
                              )
                            )
                          }
                          size="small"
                          className="btnProjectForms"
                        >
                          {t('projectDetailsView:btnSend')}
                        </Button>
                      </Tooltip>
                    </>
                  </Col>
                </Row>
              ) : (
                index === array.length - 1 &&
                !item.carbonNeutralCertificateUrl &&
                item.carbonNeutralCertificateRequested &&
                userInfoState?.companyRole === CompanyRole.CLIMATE_FUND && (
                  <Row className="field" key="carbonNeutralCertificate">
                    <Col span={12} className="field-key approve-cnc-title-col">
                      <div className="label-container">
                        <div className="label">
                          {t('projectDetailsView:carbonNeutralCertificate')}
                          <span className="approve-cnc-title-icon">
                            <ExclamationCircleTwoTone twoToneColor="#eb8f34" />
                          </span>
                        </div>
                      </div>
                    </Col>
                    <Col span={6} className="field-value">
                      <Tooltip
                        arrowPointAtCenter
                        placement="top"
                        trigger="hover"
                        title={
                          !item.carbonNeutralCertificateRequested &&
                          t('projectDetailsView:noCarbonNeutralCertificateRequest')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <Button
                          type="default"
                          onClick={() => {
                            // Check permissions and if carbonNeutralCertificateRequested is true
                            const hasPermission = formCreatePermission(
                              userInfoState,
                              DocType.VERIFICATION_REPORT,
                              projectProposalStage
                            );

                            if (hasPermission && item.carbonNeutralCertificateRequested) {
                              showCarbonNeutralCertificateRequestApproveModal(item, {
                                headerText: t('projectDetailsView:approveCNCModelTitle'),
                                icon: <CheckCircleOutlined />,
                                actionBtnText: t('projectDetailsView:approve'),
                                okAction: (
                                  comment: any,
                                  level: any,
                                  startDate: any,
                                  endDate: any,
                                  year: any
                                ) => {
                                  handleApprove(
                                    item.id,
                                    level,
                                    startDate,
                                    endDate,
                                    year,
                                    comment,
                                    true
                                  );
                                },
                                type: 'primary',
                                remarkRequired: false,
                              });
                            }
                          }}
                          disabled={
                            !(
                              formCreatePermission(
                                userInfoState,
                                DocType.VERIFICATION_REPORT,
                                projectProposalStage
                              ) && item.carbonNeutralCertificateRequested
                            )
                          }
                          size="small"
                          className="btnProjectForms"
                        >
                          {t('projectDetailsView:btnApprove')}
                        </Button>
                      </Tooltip>
                    </Col>
                    <Col span={6} className="field-value">
                      <Tooltip
                        arrowPointAtCenter
                        placement="top"
                        trigger="hover"
                        title={
                          !item.carbonNeutralCertificateRequested &&
                          t('projectDetailsView:noCarbonNeutralCertificateRequest')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <Button
                          danger
                          type="default"
                          onClick={() => {
                            // Check permissions and if carbonNeutralCertificateRequested is true
                            const hasPermission = formCreatePermission(
                              userInfoState,
                              DocType.VERIFICATION_REPORT,
                              projectProposalStage
                            );

                            if (hasPermission && item.carbonNeutralCertificateRequested) {
                              showCarbonNeutralCertificateRequestApproveModal(item, {
                                headerText: t('projectDetailsView:rejectCNCModelTitle'),
                                icon: <CloseCircleOutlined />,
                                actionBtnText: t('projectDetailsView:Reject'),
                                okAction: (
                                  comment: any,
                                  level: any,
                                  startDate: any,
                                  endDate: any,
                                  year: any
                                ) => {
                                  handleApprove(
                                    item.id,
                                    level,
                                    startDate,
                                    endDate,
                                    year,
                                    comment,
                                    false
                                  );
                                },
                                type: 'danger',
                                remarkRequired: true,
                              });
                            }
                          }}
                          disabled={
                            !(
                              formCreatePermission(
                                userInfoState,
                                DocType.VERIFICATION_REPORT,
                                projectProposalStage
                              ) && item.carbonNeutralCertificateRequested
                            )
                          }
                          size="small"
                          className="btnDangerProjectForms"
                        >
                          {t('projectDetailsView:btnReject')}
                        </Button>
                      </Tooltip>
                    </Col>
                  </Row>
                )
              )} */}
            </div>
          </div>
        ))}
      </div>
      <CarbonNeutralConfirmationModelSl
        actionInfo={popupInfo}
        onActionCanceled={handleCancel}
        openModal={modalVisible}
        errorMsg={''}
        loading={loading}
        translator={translator}
      />
    </>
  );
};
