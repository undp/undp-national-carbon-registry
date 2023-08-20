import React, { FC, useEffect, useRef, useState } from 'react';
import './ndcActionBody.scss';
import {
  CheckCircleOutlined,
  DislikeOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  LikeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { DocType } from '../../Casl/enums/document.type';
import { RcFile } from 'antd/lib/upload';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { Skeleton, Tooltip, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { DocumentStatus } from '../../Casl/enums/document.status';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole, Role } from '@undp/carbon-library';
import RejectDocumentationConfirmationModel from '../Models/rejectDocumentForm';
import moment from 'moment';
import { linkDocVisible, uploadDocUserPermission } from '../../Casl/documentsPermission';

export interface NdcActionBodyProps {
  data?: any;
  progressIcon?: any;
  programmeId?: any;
  canUploadMonitorReport?: boolean;
  programmeOwnerId?: any;
  getProgrammeDocs?: any;
  ministryLevelPermission?: boolean;
}

const NdcActionBody: FC<NdcActionBodyProps> = (props: NdcActionBodyProps) => {
  const {
    data,
    programmeId,
    canUploadMonitorReport,
    programmeOwnerId,
    getProgrammeDocs,
    ministryLevelPermission,
  } = props;
  const { t } = useTranslation(['programme']);
  const { userInfoState } = useUserContext();
  const fileInputMonitoringRef: any = useRef(null);
  const fileInputVerificationRef: any = useRef(null);
  const { get, put, post } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  const [monitoringReportData, setMonitoringReportData] = useState<any>();
  const [verificationReportData, setVerificationReportData] = useState<any>();
  const [ndcActionId, setNdcActionId] = useState<any>();
  const [openRejectDocConfirmationModal, setOpenRejectDocConfirmationModal] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [rejectDocData, setRejectDocData] = useState<any>({});
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleFileUploadMonitor = () => {
    fileInputMonitoringRef?.current?.click();
  };

  const handleFileUploadVerification = () => {
    fileInputVerificationRef?.current?.click();
  };

  const onUploadDocument = async (file: any, type: any) => {
    if (file.size > maximumImageSize) {
      message.open({
        type: 'error',
        content: `${t('common:maxSizeVal')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      return;
    }
    setLoading(true);
    const logoBase64 = await getBase64(file as RcFile);
    let imgData = logoBase64;
    if (type !== DocType.MONITORING_REPORT) {
      const logoUrls = logoBase64.split(',');
      imgData = logoUrls[1];
    }

    try {
      if (
        file?.type === 'application/pdf' ||
        (type === DocType.MONITORING_REPORT &&
          (file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file?.type === 'text/csv'))
      ) {
        const response: any = await post('national/programme/addDocument', {
          type: type,
          data: imgData,
          programmeId: programmeId,
          actionId: ndcActionId,
        });
        if (response?.data) {
          message.open({
            type: 'success',
            content: `${t('programme:isUploaded')}`,
            duration: 4,
            style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
          });
        }
      } else {
        message.open({
          type: 'error',
          content: `${t('programme:invalidFileFormat')}`,
          duration: 4,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    } catch (error: any) {
      message.open({
        type: 'error',
        content: `${t('programme:notUploaded')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      getProgrammeDocs();
      fileInputMonitoringRef.current = null;
      fileInputVerificationRef.current = null;
      setLoading(false);
    }
  };

  const docAction = async (id: any, status: DocumentStatus, actionId: any, type: any) => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/docAction', {
        id: id,
        status: status,
        actionId: actionId,
      });
      message.open({
        type: 'success',
        content:
          status === DocumentStatus.ACCEPTED
            ? `${t('programme:docApproved')}`
            : `${t('programme:docRejected')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } catch (error: any) {
      message.open({
        type: 'error',
        content: error?.message,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      getProgrammeDocs();
      setOpenRejectDocConfirmationModal(false);
      setLoading(false);
    }
  };

  const handleOk = () => {
    docAction(
      rejectDocData?.id,
      DocumentStatus.REJECTED,
      rejectDocData?.actionId,
      rejectDocData?.type
    );
  };

  const handleCancel = () => {
    setOpenRejectDocConfirmationModal(false);
  };

  useEffect(() => {
    data?.map((item: any) => {
      setNdcActionId(item?.id);
      if (item?.monitoringReport) {
        setMonitoringReportData(item?.monitoringReport);
      }
      if (item?.verificationReport) {
        setVerificationReportData(item?.verificationReport);
      }
    });
  }, [data]);

  const companyRolePermission =
    (userInfoState?.companyRole === CompanyRole.GOVERNMENT ||
      (userInfoState?.companyRole === CompanyRole.MINISTRY && ministryLevelPermission)) &&
    userInfoState?.userRole !== Role.ViewOnly;

  const verficationCompanyRolePermission =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
    userInfoState?.userRole !== Role.ViewOnly;

  const monitoringReportPending = monitoringReportData?.status === DocumentStatus.PENDING;
  const monitoringReportAccepted = monitoringReportData?.status === DocumentStatus.ACCEPTED;
  const monitoringReportRejected = monitoringReportData?.status === DocumentStatus.REJECTED;
  const verifcationReportPending = verificationReportData?.status === DocumentStatus.PENDING;
  const verificationReportAccepted = verificationReportData?.status === DocumentStatus.ACCEPTED;
  const verifcationReportRejected = verificationReportData?.status === DocumentStatus.REJECTED;

  return loading ? (
    <Skeleton />
  ) : (
    <>
      <div className="ndc-action-body">
        <div className="report-details">
          <div className="report-type">
            <div className="name-time-container">
              <div className={canUploadMonitorReport ? 'name' : 'empty'}>
                {t('programme:monitoringReport')}
              </div>
              {monitoringReportData?.txTime && (
                <div className="time">
                  {moment(parseInt(monitoringReportData?.txTime)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              )}
            </div>
            <div className="icon">
              {monitoringReportData?.url ? (
                monitoringReportPending ? (
                  companyRolePermission && (
                    <>
                      <LikeOutlined
                        onClick={() =>
                          docAction(
                            monitoringReportData?.id,
                            DocumentStatus.ACCEPTED,
                            monitoringReportData?.actionId,
                            monitoringReportData?.type
                          )
                        }
                        className="common-progress-icon"
                        style={{ color: '#976ED7' }}
                      />
                      <DislikeOutlined
                        onClick={() => {
                          setRejectDocData({
                            id: monitoringReportData?.id,
                            actionId: monitoringReportData?.actionId,
                            type: monitoringReportData?.type,
                          });
                          setActionInfo({
                            action: 'Reject',
                            headerText: `${t('programme:rejectDocHeader')}`,
                            text: `${t('programme:rejectDocBody')}`,
                            type: 'reject',
                            icon: <DislikeOutlined />,
                          });
                          setOpenRejectDocConfirmationModal(true);
                        }}
                        className="common-progress-icon margin-left-1"
                        style={{ color: '#FD6F70' }}
                      />
                    </>
                  )
                ) : monitoringReportAccepted ? (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380' }}
                  />
                ) : (
                  monitoringReportRejected && (
                    <Tooltip
                      arrowPointAtCenter
                      placement="top"
                      trigger="hover"
                      title={t('programme:rejectTip')}
                      overlayClassName="custom-tooltip"
                    >
                      <ExclamationCircleOutlined
                        className="common-progress-icon"
                        style={{ color: '#FD6F70' }}
                      />
                    </Tooltip>
                  )
                )
              ) : (
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      userInfoState?.userRole === Role.ViewOnly
                        ? t('programme:notAuthToUploadDoc')
                        : uploadDocUserPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ? !canUploadMonitorReport && t('programme:programmeNotAuth')
                        : t('programme:orgNotAuth')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        canUploadMonitorReport &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.MONITORING_REPORT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() => {
                        if (
                          canUploadMonitorReport &&
                          uploadDocUserPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ) {
                          handleFileUploadMonitor();
                        }
                      }}
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputMonitoringRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.xlsx,.csv,.xls"
                    onChange={(e: any) => {
                      const selectedFile = e.target.files[0];
                      e.target.value = null;
                      onUploadDocument(selectedFile, DocType.MONITORING_REPORT);
                    }}
                  />
                </>
              )}
            </div>
          </div>
          {monitoringReportData?.url && (
            <div className="report-link">
              {/* <div className="version">V1.0</div> */}
              <div className="link">
                {linkDocVisible(monitoringReportData?.status) && (
                  <a
                    href={monitoringReportData?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <LinkOutlined
                      className="common-progress-icon margin-right-1"
                      style={{ color: '#3F3A47' }}
                    />
                  </a>
                )}
              </div>
              {!monitoringReportAccepted && (
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      userInfoState?.userRole === Role.ViewOnly
                        ? t('programme:notAuthToUploadDoc')
                        : uploadDocUserPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ? !canUploadMonitorReport && t('programme:programmeNotAuth')
                        : t('programme:orgNotAuth')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        canUploadMonitorReport &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.MONITORING_REPORT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() => {
                        if (
                          canUploadMonitorReport &&
                          uploadDocUserPermission(
                            userInfoState,
                            DocType.MONITORING_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ) {
                          handleFileUploadMonitor();
                        }
                      }}
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputMonitoringRef}
                    style={{ display: 'none' }}
                    accept=".pdf,.xlsx,.csv,.xls"
                    onChange={(e: any) => {
                      const selectedFile = e.target.files[0];
                      e.target.value = null;
                      onUploadDocument(selectedFile, DocType.MONITORING_REPORT);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
        <div className="report-details">
          <div className="report-type">
            <div className="name-time-container">
              <div
                className={canUploadMonitorReport && monitoringReportAccepted ? 'name' : 'empty'}
              >
                {t('programme:verificationReport')}
              </div>
              {verificationReportData?.txTime && (
                <div className="time">
                  {moment(parseInt(verificationReportData?.txTime)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              )}
            </div>
            <div className="icon">
              {verificationReportData?.url ? (
                verifcationReportPending ? (
                  verficationCompanyRolePermission && (
                    <>
                      <LikeOutlined
                        onClick={() =>
                          docAction(
                            verificationReportData?.id,
                            DocumentStatus.ACCEPTED,
                            verificationReportData?.actionId,
                            verificationReportData?.type
                          )
                        }
                        className="common-progress-icon"
                        style={{ color: '#976ED7' }}
                      />
                      <DislikeOutlined
                        onClick={() => {
                          setRejectDocData({
                            id: verificationReportData?.id,
                            actionId: verificationReportData?.actionId,
                            type: verificationReportData?.type,
                          });
                          setActionInfo({
                            action: 'Reject',
                            headerText: `${t('programme:rejectDocHeader')}`,
                            text: `${t('programme:rejectDocBody')}`,
                            type: 'reject',
                            icon: <DislikeOutlined />,
                          });
                          setOpenRejectDocConfirmationModal(true);
                        }}
                        className="common-progress-icon margin-left-1"
                        style={{ color: '#FD6F70' }}
                      />
                    </>
                  )
                ) : verificationReportAccepted ? (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380' }}
                  />
                ) : (
                  verifcationReportRejected && (
                    <Tooltip
                      arrowPointAtCenter
                      placement="top"
                      trigger="hover"
                      title={t('programme:rejectTip')}
                      overlayClassName="custom-tooltip"
                    >
                      <ExclamationCircleOutlined
                        className="common-progress-icon"
                        style={{ color: '#FD6F70' }}
                      />
                    </Tooltip>
                  )
                )
              ) : (
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      userInfoState?.userRole === Role.ViewOnly
                        ? t('programme:notAuthToUploadDoc')
                        : uploadDocUserPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ? !monitoringReportAccepted && t('programme:monitoringRepNotApproved')
                        : t('programme:notAuthToUploadDoc')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        monitoringReportAccepted &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.VERIFICATION_REPORT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() => {
                        if (
                          monitoringReportAccepted &&
                          uploadDocUserPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ) {
                          handleFileUploadVerification();
                        }
                      }}
                    />
                  </Tooltip>
                  {monitoringReportAccepted && (
                    <input
                      type="file"
                      ref={fileInputVerificationRef}
                      style={{ display: 'none' }}
                      accept=".pdf"
                      onChange={(e: any) => {
                        const selectedFile = e.target.files[0];
                        e.target.value = null;
                        onUploadDocument(selectedFile, DocType.VERIFICATION_REPORT);
                      }}
                    />
                  )}
                </>
              )}
            </div>
          </div>
          {verificationReportData?.url && (
            <div className="report-link">
              {/* <div className="version">V1.1</div> */}
              <div className="link">
                {linkDocVisible(verificationReportData?.status) && (
                  <a
                    href={verificationReportData?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <LinkOutlined
                      className="common-progress-icon margin-right-1"
                      style={{ color: '#3F3A47' }}
                    />
                  </a>
                )}
              </div>
              {!verificationReportAccepted && monitoringReportAccepted && (
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      userInfoState?.userRole === Role.ViewOnly
                        ? t('programme:notAuthToUploadDoc')
                        : uploadDocUserPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ? !monitoringReportAccepted && t('programme:monitoringRepNotApproved')
                        : t('programme:notAuthToUploadDoc')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        monitoringReportAccepted &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.VERIFICATION_REPORT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() => {
                        if (
                          monitoringReportAccepted &&
                          uploadDocUserPermission(
                            userInfoState,
                            DocType.VERIFICATION_REPORT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ) {
                          handleFileUploadVerification();
                        }
                      }}
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputVerificationRef}
                    style={{ display: 'none' }}
                    accept=".pdf"
                    onChange={(e: any) => {
                      const selectedFile = e.target.files[0];
                      e.target.value = null;
                      onUploadDocument(selectedFile, DocType.VERIFICATION_REPORT);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <RejectDocumentationConfirmationModel
        actionInfo={actionInfo}
        onActionConfirmed={handleOk}
        onActionCanceled={handleCancel}
        openModal={openRejectDocConfirmationModal}
        errorMsg={''}
        loading={loading}
      />
    </>
  );
};

export default NdcActionBody;
