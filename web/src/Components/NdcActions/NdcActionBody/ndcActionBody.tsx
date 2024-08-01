/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable prefer-const */
/* eslint-disable eqeqeq */
import React, { FC, useEffect, useRef, useState } from 'react';
import './ndcActionBody.scss';
import {
  CheckCircleOutlined,
  DislikeOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  LikeOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import { Skeleton, Tooltip, message } from 'antd';
import moment from 'moment';
// import { CompanyRole, DocType, DocumentStatus, Role } from '../../../Definitions';
import { RejectDocumentationConfirmationModel } from '../../Models/rejectDocumenConfirmationModel';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { isValidateFileType } from '../../../Utils/DocumentValidator';
import { DocType } from '../../../Definitions/Enums/document.type';
import { DocumentStatus } from '../../../Definitions/Enums/document.status';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { Role } from '../../../Definitions/Enums/role.enum';
import { linkDocVisible, uploadDocUserPermission } from '../../../Utils/documentsPermission';
// import { isValidateFileType } from '../../../Utils/DocumentValidator';
// import { linkDocVisible, uploadDocUserPermission } from '../../../Utils/documentsPermission';
// import { useConnection, useUserContext } from '../../../Context';

export interface NdcActionBodyProps {
  data?: any;
  progressIcon?: any;
  programmeId?: any;
  canUploadMonitorReport?: boolean;
  programmeOwnerId?: any;
  getProgrammeDocs?: any;
  ministryLevelPermission?: boolean;
  translator: any;
  onFinish?: any;
  programme?: any;
}

export const NdcActionBody: FC<NdcActionBodyProps> = (props: NdcActionBodyProps) => {
  const {
    data,
    programmeId,
    canUploadMonitorReport,
    programmeOwnerId,
    getProgrammeDocs,
    ministryLevelPermission,
    translator,
    onFinish,
    programme,
  } = props;
  const t = translator.t;
  const { userInfoState } = useUserContext();
  const fileInputMonitoringRef: any = useRef(null);
  const fileInputVerificationRef: any = useRef(null);
  const { post } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);
  const [monitoringReportData, setMonitoringReportData] = useState<any>();
  const [monitoringReportversion, setMonitoringReportversion] = useState<any>('');
  const [verificationReportData, setVerificationReportData] = useState<any>();
  const [verificationReportVersion, setVerificationReportversion] = useState<any>('');
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

    try {
      if (isValidateFileType(file?.type)) {
        const response: any = await post('national/programme/addDocument', {
          type: type,
          data: logoBase64,
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
          if (
            type == DocType.VERIFICATION_REPORT &&
            response?.data.status == DocumentStatus.ACCEPTED &&
            response.data.programme.mitigationActions
          ) {
            let programmeData = response?.data.programme;
            let modified = false;
            programmeData.mitigationActions.map((action: any) => {
              if (action.actionId == ndcActionId) {
                modified = true;
                let docAdded = false;
                for (var documentDetails of action.projectMaterial) {
                  let document: any;
                  documentDetails.url
                    ? (document = documentDetails.url)
                    : (document = documentDetails);
                  if (document.includes('VERIFICATION_REPORT')) {
                    docAdded = true;
                    break;
                  }
                }
                if (!docAdded) {
                  action.projectMaterial.push(response?.data.url);
                }
              }
            });
            if (modified) {
              programme.mitigationActions = programmeData.mitigationActions;
              onFinish(programme);
            }
          }
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
      await post('national/programme/docAction', {
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
      if (type == DocType.VERIFICATION_REPORT && status == DocumentStatus.ACCEPTED) {
        let programmeRes = await post('national/programme/query', {
          page: 1,
          size: 2,
          filterAnd: [
            {
              key: 'programmeId',
              operation: '=',
              value: programmeId,
            },
          ],
        });
        let programmeData = programmeRes.data[0];

        if (programmeData.mitigationActions) {
          const docRepoRes: any = await post('national/programme/queryDocs', {
            page: 1,
            size: 100,
            filterAnd: [
              {
                key: 'id',
                operation: '=',
                value: id,
              },
            ],
          });
          const docUrl = docRepoRes.data[0].url;

          let modified = false;
          programmeData.mitigationActions.map((action: any) => {
            if (action.actionId == actionId) {
              modified = true;
              if (!action.projectMaterial.includes(docUrl)) {
                action.projectMaterial.push(docUrl);
              }
            }
          });
          if (modified) onFinish(programmeData);
        }
      }
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
        const versionfull =
          item?.monitoringReport.url.split('_')[item?.monitoringReport.url.split('_').length - 1];
        const version = versionfull ? versionfull.split('.')[0] : 'V1';
        setMonitoringReportversion(version.startsWith('V') ? version : 'V1');
      }
      if (item?.verificationReport) {
        setVerificationReportData(item?.verificationReport);
        const versionfull =
          item?.verificationReport.url.split('_')[
            item?.verificationReport.url.split('_').length - 1
          ];
        const version = versionfull ? versionfull.split('.')[0] : 'V1';
        setVerificationReportversion(version.startsWith('V') ? version : 'V1');
      }
    });
  }, [data]);

  const companyRolePermission =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
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
                  {' ~ ' + monitoringReportversion}
                </div>
              )}
            </div>
            <div className="icon">
              {monitoringReportData?.url ? (
                monitoringReportPending ? (
                  (companyRolePermission || ministryLevelPermission) && (
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
                        style={{ color: '#976ED7', paddingTop: '3px' }}
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
                        style={{ color: '#FD6F70', paddingTop: '3px' }}
                      />
                    </>
                  )
                ) : monitoringReportAccepted ? (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380', paddingTop: '3px' }}
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
                        style={{ color: '#FD6F70', paddingTop: '3px' }}
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
                    accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
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
                    <BookOutlined
                      className="common-progress-icon margin-right-1"
                      style={{ color: '#3F3A47', paddingTop: '3px' }}
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
                    accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
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
                  {' ~ ' + verificationReportVersion}
                </div>
              )}
            </div>
            <div className="icon">
              {verificationReportData?.url ? (
                verifcationReportPending ? (
                  (verficationCompanyRolePermission || ministryLevelPermission) && (
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
                        style={{ color: '#976ED7', paddingTop: '3px' }}
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
                        style={{ color: '#FD6F70', paddingTop: '3px' }}
                      />
                    </>
                  )
                ) : verificationReportAccepted ? (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380', paddingTop: '3px' }}
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
                        style={{ color: '#FD6F70', paddingTop: '3px' }}
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
                      accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
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
                    <BookOutlined
                      className="common-progress-icon margin-right-1"
                      style={{ color: '#3F3A47', paddingTop: '3px' }}
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
                    accept=".xls, .xlsx, .ppt, .pptx, .csv, .doc, .docx, .pdf, .png, .jpg"
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
        translator={translator}
      />
    </>
  );
};
