import { Col, Row, Skeleton, Tooltip, message } from 'antd';
import React, { FC, useEffect, useRef, useState } from 'react';
import './programmeDocuments.scss';
import {
  CheckCircleOutlined,
  DislikeOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  LikeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload';
import moment from 'moment';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { DocType } from '../../Casl/enums/document.type';
import { useTranslation } from 'react-i18next';
import { DocumentStatus } from '../../Casl/enums/document.status';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../Casl/enums/company.role.enum';
import RejectDocumentationConfirmationModel from '../Models/rejectDocumentForm';
import { Role } from '@undp/carbon-library';
import { linkDocVisible, uploadDocUserPermission } from '../../Casl/documentsPermission';

export interface ProgrammeDocumentsProps {
  data: any;
  title: any;
  icon: any;
  programmeId: any;
  programmeOwnerId: any[];
  getDocumentDetails: any;
  getProgrammeById: any;
  ministryLevelPermission?: boolean;
}

const ProgrammeDocuments: FC<ProgrammeDocumentsProps> = (props: ProgrammeDocumentsProps) => {
  const {
    data,
    title,
    icon,
    programmeId,
    programmeOwnerId,
    getDocumentDetails,
    getProgrammeById,
    ministryLevelPermission,
  } = props;
  const { t } = useTranslation(['programme']);
  const { userInfoState } = useUserContext();
  const { delete: del, post } = useConnection();
  const fileInputRef: any = useRef(null);
  const fileInputRefMeth: any = useRef(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [designDocUrl, setDesignDocUrl] = useState<any>('');
  const [noObjectionDocUrl, setNoObjectionDocUrl] = useState<any>('');
  const [authorisationDocUrl, setAuthorisationDocUrl] = useState<any>('');
  const [methodologyDocUrl, setMethodologyDocUrl] = useState<any>('');
  const [designDocDate, setDesignDocDate] = useState<any>('');
  const [noObjectionDate, setNoObjectionDate] = useState<any>('');
  const [methodologyDate, setMethodologyDate] = useState<any>('');
  const [authorisationDocDate, setAuthorisationDocDate] = useState<any>('');
  const [designDocStatus, setDesignDocStatus] = useState<any>('');
  const [methodDocStatus, setMethodDocStatus] = useState<any>('');
  const [designDocId, setDesignDocId] = useState<any>('');
  const [methDocId, setMethDocId] = useState<any>('');
  const [docData, setDocData] = useState<any[]>([]);
  const [openRejectDocConfirmationModal, setOpenRejectDocConfirmationModal] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [rejectDocData, setRejectDocData] = useState<any>({});
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const handleDesignDocFileUpload = () => {
    fileInputRef?.current?.click();
  };

  const handleMethodologyFileUpload = () => {
    fileInputRefMeth?.current?.click();
  };

  useEffect(() => {
    setDocData(data);
  }, [data]);

  useEffect(() => {
    if (docData?.length) {
      docData?.map((item: any) => {
        if (item?.url?.includes('DESIGN')) {
          setDesignDocUrl(item?.url);
          setDesignDocDate(item?.txTime);
          setDesignDocStatus(item?.status);
          setDesignDocId(item?.id);
        }
        if (item?.url?.includes('METHODOLOGY')) {
          setMethodologyDocUrl(item?.url);
          setMethodologyDate(item?.txTime);
          setMethodDocStatus(item?.status);
          setMethDocId(item?.id);
        }
        if (item?.url?.includes('OBJECTION')) {
          setNoObjectionDocUrl(item?.url);
          setNoObjectionDate(item?.txTime);
        }
        if (item?.url?.includes('AUTHORISATION')) {
          setAuthorisationDocUrl(item?.url);
          setAuthorisationDocDate(item?.txTime);
        }
      });
    }
  }, [docData]);

  const getBase64 = (file: RcFile): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

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
        (type === DocType.DESIGN_DOCUMENT && file?.type === 'application/pdf') ||
        (type === DocType.METHODOLOGY_DOCUMENT &&
          file?.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      ) {
        const response: any = await post('national/programme/addDocument', {
          type: type,
          data: imgData,
          programmeId: programmeId,
        });
        fileInputRefMeth.current = null;
        if (response?.data) {
          setDocData([...docData, response?.data]);
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
      fileInputRefMeth.current = null;
      message.open({
        type: 'error',
        content: `${t('programme:notUploaded')}`,
        duration: 4,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      getDocumentDetails();
      setLoading(false);
    }
  };

  const docAction = async (id: any, status: DocumentStatus) => {
    setLoading(true);
    try {
      const response: any = await post('national/programme/docAction', {
        id: id,
        status: status,
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
      setOpenRejectDocConfirmationModal(false);
      getDocumentDetails();
      getProgrammeById();
      setLoading(false);
    }
  };

  const handleOk = () => {
    docAction(rejectDocData?.id, DocumentStatus.REJECTED);
  };

  const handleCancel = () => {
    setOpenRejectDocConfirmationModal(false);
  };

  const companyRolePermission =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
    userInfoState?.userRole !== Role.ViewOnly;

  const designDocActionPermission =
    userInfoState?.companyRole === CompanyRole.GOVERNMENT &&
    userInfoState?.userRole !== Role.ViewOnly;

  const designDocPending = designDocStatus === DocumentStatus.PENDING;

  return loading ? (
    <Skeleton />
  ) : (
    <>
      <div className="info-view">
        <div className="title">
          <span className="title-icon">{icon}</span>
          <span className="title-text">{title}</span>
        </div>
        <div>
          <Row className="field" key="Design Document">
            <Col span={14} className="field-key">
              <div className="label-container">
                <div className={designDocUrl !== '' ? 'label-uploaded' : 'label'}>
                  {t('programme:designDoc')}
                </div>
                {designDocPending && designDocActionPermission && (
                  <>
                    <LikeOutlined
                      onClick={() => docAction(designDocId, DocumentStatus.ACCEPTED)}
                      className="common-progress-icon"
                      style={{ color: '#976ED7' }}
                    />
                    <DislikeOutlined
                      onClick={() => {
                        setRejectDocData({ id: designDocId });
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
                )}
                {designDocStatus === DocumentStatus.ACCEPTED && (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380' }}
                  />
                )}
                {designDocStatus === DocumentStatus.REJECTED && (
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
                )}
              </div>
              {designDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(designDocDate)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              )}
            </Col>
            <Col span={10} className="field-value">
              {designDocUrl !== '' ? (
                <div className="link">
                  {linkDocVisible(designDocStatus) && (
                    <a href={designDocUrl} target="_blank" rel="noopener noreferrer" download>
                      <LinkOutlined
                        className="common-progress-icon margin-right-1"
                        style={{ color: '#3F3A47' }}
                      />
                    </a>
                  )}
                  {designDocStatus !== DocumentStatus.ACCEPTED && (
                    <>
                      <Tooltip
                        arrowPointAtCenter
                        placement="top"
                        trigger="hover"
                        title={
                          userInfoState?.userRole === Role.ViewOnly ||
                          userInfoState?.companyRole === CompanyRole.CERTIFIER
                            ? t('programme:notAuthToUploadDoc')
                            : !uploadDocUserPermission(
                                userInfoState,
                                DocType.DESIGN_DOCUMENT,
                                programmeOwnerId,
                                ministryLevelPermission
                              ) && t('programme:orgNotAuth')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <FileAddOutlined
                          className="common-progress-icon"
                          style={
                            uploadDocUserPermission(
                              userInfoState,
                              DocType.DESIGN_DOCUMENT,
                              programmeOwnerId,
                              ministryLevelPermission
                            )
                              ? { color: '#3F3A47', cursor: 'pointer' }
                              : { color: '#cacaca', cursor: 'default' }
                          }
                          onClick={() =>
                            uploadDocUserPermission(
                              userInfoState,
                              DocType.DESIGN_DOCUMENT,
                              programmeOwnerId,
                              ministryLevelPermission
                            ) && handleDesignDocFileUpload()
                          }
                        />
                      </Tooltip>
                      <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf"
                        onChange={(e: any) => {
                          const selectedFile = e.target.files[0];
                          e.target.value = null;
                          onUploadDocument(selectedFile, DocType.DESIGN_DOCUMENT);
                        }}
                      />
                    </>
                  )}
                </div>
              ) : (
                <>
                  <Tooltip
                    arrowPointAtCenter
                    placement="top"
                    trigger="hover"
                    title={
                      userInfoState?.userRole === Role.ViewOnly ||
                      userInfoState?.companyRole === CompanyRole.CERTIFIER
                        ? t('programme:notAuthToUploadDoc')
                        : !uploadDocUserPermission(
                            userInfoState,
                            DocType.DESIGN_DOCUMENT,
                            programmeOwnerId,
                            ministryLevelPermission
                          ) && t('programme:orgNotAuth')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.DESIGN_DOCUMENT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() =>
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.DESIGN_DOCUMENT,
                          programmeOwnerId,
                          ministryLevelPermission
                        ) && handleDesignDocFileUpload()
                      }
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept=".pdf"
                    onChange={(e: any) => {
                      const selectedFile = e.target.files[0];
                      e.target.value = null;
                      onUploadDocument(selectedFile, DocType.DESIGN_DOCUMENT);
                    }}
                  />
                </>
              )}
            </Col>
          </Row>
          {noObjectionDocUrl !== '' && (
            <Row className="field" key="Objection Document">
              <Col span={14} className="field-key">
                <div className="label-uploaded">{t('programme:objectionLett')}</div>
                <div className="time">
                  {moment(parseInt(noObjectionDate)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              </Col>
              <Col span={10} className="field-value">
                <div className="link">
                  <a href={noObjectionDocUrl} target="_blank" rel="noopener noreferrer" download>
                    <LinkOutlined className="common-progress-icon" style={{ color: '#3F3A47' }} />
                  </a>
                </div>
              </Col>
            </Row>
          )}
          <Row className="field" key="Methodology Document">
            <Col span={14} className="field-key">
              <div className="label-container">
                <div className={methodologyDocUrl !== '' ? 'label-uploaded' : 'label'}>
                  {t('programme:methDoc')}
                </div>
                {methodDocStatus === DocumentStatus.PENDING && companyRolePermission && (
                  <>
                    <LikeOutlined
                      onClick={() => docAction(methDocId, DocumentStatus.ACCEPTED)}
                      className="common-progress-icon"
                      style={{ color: '#976ED7' }}
                    />
                    <DislikeOutlined
                      onClick={() => {
                        setRejectDocData({ id: methDocId });
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
                )}
                {methodDocStatus === DocumentStatus.ACCEPTED && (
                  <CheckCircleOutlined
                    className="common-progress-icon"
                    style={{ color: '#5DC380' }}
                  />
                )}
                {methodDocStatus === DocumentStatus.REJECTED && (
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
                )}
              </div>
              {methodologyDocUrl !== '' && (
                <div className="time">
                  {moment(parseInt(methodologyDate)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              )}
            </Col>
            <Col span={10} className="field-value">
              {methodologyDocUrl !== '' ? (
                <div className="link">
                  {linkDocVisible(methodDocStatus) && (
                    <a href={methodologyDocUrl} target="_blank" rel="noopener noreferrer" download>
                      <LinkOutlined
                        className="common-progress-icon margin-right-1"
                        style={{ color: '#3F3A47' }}
                      />
                    </a>
                  )}
                  {methodDocStatus !== DocumentStatus.ACCEPTED && (
                    <>
                      <Tooltip
                        arrowPointAtCenter
                        placement="top"
                        trigger="hover"
                        title={
                          userInfoState?.userRole === Role.ViewOnly
                            ? t('programme:notAuthToUploadDoc')
                            : !uploadDocUserPermission(
                                userInfoState,
                                DocType.METHODOLOGY_DOCUMENT,
                                programmeOwnerId,
                                ministryLevelPermission
                              ) && t('programme:orgNotAuth')
                        }
                        overlayClassName="custom-tooltip"
                      >
                        <FileAddOutlined
                          className="common-progress-icon"
                          style={
                            designDocStatus === DocumentStatus.ACCEPTED &&
                            uploadDocUserPermission(
                              userInfoState,
                              DocType.METHODOLOGY_DOCUMENT,
                              programmeOwnerId,
                              ministryLevelPermission
                            )
                              ? { color: '#3F3A47', cursor: 'pointer' }
                              : { color: '#cacaca' }
                          }
                          onClick={() =>
                            designDocStatus === DocumentStatus.ACCEPTED &&
                            uploadDocUserPermission(
                              userInfoState,
                              DocType.METHODOLOGY_DOCUMENT,
                              programmeOwnerId,
                              ministryLevelPermission
                            ) &&
                            handleMethodologyFileUpload()
                          }
                        />
                      </Tooltip>
                      <input
                        type="file"
                        ref={fileInputRefMeth}
                        style={{ display: 'none' }}
                        accept=".xlsx,.xls"
                        onChange={(e: any) => {
                          const selectedFile = e.target.files[0];
                          e.target.value = null;
                          if (designDocStatus === DocumentStatus.ACCEPTED)
                            onUploadDocument(selectedFile, DocType.METHODOLOGY_DOCUMENT);
                        }}
                      />
                    </>
                  )}
                </div>
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
                            DocType.METHODOLOGY_DOCUMENT,
                            programmeOwnerId,
                            ministryLevelPermission
                          )
                        ? designDocStatus !== DocumentStatus.ACCEPTED &&
                          t('programme:designDocNotApproved')
                        : t('programme:orgNotAuth')
                    }
                    overlayClassName="custom-tooltip"
                  >
                    <FileAddOutlined
                      className="common-progress-icon"
                      style={
                        designDocStatus === DocumentStatus.ACCEPTED &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.METHODOLOGY_DOCUMENT,
                          programmeOwnerId,
                          ministryLevelPermission
                        )
                          ? { color: '#3F3A47', cursor: 'pointer' }
                          : { color: '#cacaca', cursor: 'default' }
                      }
                      onClick={() =>
                        designDocStatus === DocumentStatus.ACCEPTED &&
                        uploadDocUserPermission(
                          userInfoState,
                          DocType.METHODOLOGY_DOCUMENT,
                          programmeOwnerId,
                          ministryLevelPermission
                        ) &&
                        handleMethodologyFileUpload()
                      }
                    />
                  </Tooltip>
                  <input
                    type="file"
                    ref={fileInputRefMeth}
                    style={{ display: 'none' }}
                    accept=".xlsx,.xls"
                    onChange={(e: any) => {
                      const selectedFile = e.target.files[0];
                      e.target.value = null;
                      if (designDocStatus === DocumentStatus.ACCEPTED)
                        onUploadDocument(selectedFile, DocType.METHODOLOGY_DOCUMENT);
                    }}
                  />
                </>
              )}
            </Col>
          </Row>
          {authorisationDocUrl !== '' && (
            <Row className="field" key="Authorisation Document">
              <Col span={14} className="field-key">
                <div className="label-uploaded">{t('programme:authLetterLabel')}</div>
                <div className="time">
                  {moment(parseInt(authorisationDocDate)).format('DD MMMM YYYY @ HH:mm')}
                </div>
              </Col>
              <Col span={10} className="field-value">
                <div className="link">
                  <a href={authorisationDocUrl} target="_blank" rel="noopener noreferrer" download>
                    <LinkOutlined className="common-progress-icon" style={{ color: '#3F3A47' }} />
                  </a>
                </div>
              </Col>
            </Row>
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

export default ProgrammeDocuments;
