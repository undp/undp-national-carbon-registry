/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import {
  CheckCircleOutlined,
  ExclamationCircleTwoTone,
  FileSyncOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, message, Row, Skeleton, Tooltip } from 'antd';
import { plainToClass } from 'class-transformer';
import { useEffect, useState } from 'react';
import { Action } from '../../../Definitions/Enums/action.enum';
import { Company } from '../../../Definitions/Entities/company';
import UserActionConfirmationModel from '../../Models/userActionConfirmationModel';
import './companyProfileComponent.scss';
import * as Icon from 'react-bootstrap-icons';
import { OrganisationStatus } from '../../OrganisationStatus/organisationStatus';
import { CompanyDetailsComponent } from '../CompanyDetails/companyDetailsComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import {
  CarbonNeutralConfirmationModelSl,
  CarbonNeutralConfirmationPopupInfo,
} from '../../Models/carbonNeutralConfirmationModelSl';
import moment from 'moment';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
import { Role } from '../../../Definitions/Enums/role.enum';
import { API_PATHS } from '../../../Config/apiConfig';

export const CompanyProfileComponent = (props: any) => {
  const {
    t,
    useAbilityContext,
    useLocation,
    onNavigateToCompanyManagement,
    onNavigateToCompanyEdit,
    regionField,
    systemType,
  } = props;
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [companyDetails, setCompanyDetails] = useState<any>(undefined);
  const [userDetails, setUserDetails] = useState<any>(undefined);
  const { state } = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openDeauthorisationModal, setOpenDeauthorisationModal] = useState(false);
  const [openReactivateModal, setOpenReactivateModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');
  const [userRole, setUserRole] = useState<any>('');
  const [companyRole, setCompanyRole] = useState<any>('');
  const [cncModalVisible, setCNCModalVisible] = useState<boolean>(false);
  const [cncModelInfo, setCNCModelInfo] = useState<any>({});
  const [carbonNeutralCertificateData, setCarbonNeutralCertificateData] = useState<any>([]);
  const ability = useAbilityContext();

  const getCompanyDetails = async (companyId: string) => {
    try {
      setIsLoading(true);
      const response = await get(API_PATHS.ORGANIZATION_PROFILE_DETAILS(companyId));
      if (response.data) {
        setCompanyDetails(response.data);
        setIsLoading(false);
      }
    } catch (exception) {}
  };

  const getUserDetails = async (companyId: string) => {
    setIsLoading(true);
    try {
      const response: any = await post(API_PATHS.USER_DETAILS, {
        page: 1,
        size: 10,
        filterAnd: [
          {
            key: 'companyId',
            operation: '=',
            value: companyId,
          },
          {
            key: 'user"."isActive',
            operation: '=',
            value: false,
          },
        ],
      });
      if (response && response.data) {
        setUserDetails(response.data[0]);
      }
      setIsLoading(false);
    } catch (error: any) {
      console.log('Error in getting users', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!state) {
      onNavigateToCompanyManagement();
    } else {
      getCompanyDetails(state.record.companyId);
      const userRoleValue = localStorage.getItem('userRole') as string;
      setUserRole(userRoleValue);
      setCompanyRole(localStorage.getItem('companyRole') as string);
      if (state.record?.state == '2' || state.record?.state == '3') {
        getUserDetails(state.record.companyId);
      }
      // getCarbonNeutralCertificates(state.record.companyId);
    }
  }, []);

  const onDeauthoriseOrgConfirmed = async (remarks: string) => {
    try {
      setIsLoading(true);
      // const response: any = await put(`organisation/suspend?id=${companyDetails.companyId}`, {
      //   remarks: remarks,
      // });
      const response: any = await post(API_PATHS.ORG_CHANGE_STATUS, {
        id: companyDetails.companyId,
        state: '0',
      });
      setOpenDeauthorisationModal(false);
      message.open({
        type: 'success',
        content: t('companyProfile:deauthorisationSuccess'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      getCompanyDetails(companyDetails.companyId);
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onReactivateOrgConfirmed = async (remarks: string) => {
    try {
      setIsLoading(true);
      // const response: any = await put(`organisation/activate?id=${companyDetails.companyId}`, {
      //   remarks: remarks,
      // });
      const response: any = await post(API_PATHS.ORG_CHANGE_STATUS, {
        id: companyDetails.companyId,
        state: '1',
      });
      setOpenReactivateModal(false);
      message.open({
        type: 'success',
        content: t('companyProfile:reactivationSuccess'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      getCompanyDetails(companyDetails.companyId);
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onApproveOrgConfirmed = async (remarks: string) => {
    try {
      setIsLoading(true);
      const response: any = await put(API_PATHS.ORG_APPROVE(companyDetails.companyId), {
        remarks: remarks,
      });
      setOpenApproveModal(false);
      message.open({
        type: 'success',
        content: t('companyProfile:approvedSuccessfully'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      getCompanyDetails(companyDetails.companyId);
      getUserDetails(companyDetails.companyId);
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onApproveOrgCanceled = () => {
    setOpenApproveModal(false);
  };

  const onRejectOrgConfirmed = async (remarks: string) => {
    try {
      setIsLoading(true);
      const response: any = await put(API_PATHS.ORG_REJECT(companyDetails.companyId), {
        remarks: remarks,
      });
      setOpenRejectModal(false);
      message.open({
        type: 'success',
        content: t('companyProfile:rejectedSuccessfully'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      getCompanyDetails(companyDetails.companyId);
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRejectOrgCanceled = () => {
    setOpenRejectModal(false);
  };

  const onDeauthoriseOrgCanceled = () => {
    setOpenDeauthorisationModal(false);
  };

  const onReactivateOrgCanceled = () => {
    setOpenReactivateModal(false);
  };

  const onDeauthoriseOrganisation = () => {
    setActionInfo({
      action: `${t('companyProfile:deauthorise')}`,
      headerText: `${t('companyProfile:deauthoriseConfirmHeaderText')}`,
      text: `${t('companyProfile:deauthoriseConfirmText')}`,
      type: 'danger',
      icon: <Icon.BuildingDash />,
    });
    setErrorMsg('');
    setOpenDeauthorisationModal(true);
  };

  const onReActivateOrganisation = () => {
    setActionInfo({
      action: `${t('companyProfile:reActivate')}`,
      headerText: `${t('companyProfile:reActivateConfirmHeaderText')}`,
      text: `${t('companyProfile:reActivateConfirmText')}`,
      type: 'primary',
      icon: <Icon.BuildingCheck />,
    });
    setErrorMsg('');
    setOpenReactivateModal(true);
  };

  const onApproveOrganisation = () => {
    setActionInfo({
      action: `${t('companyProfile:approve')}`,
      headerText: `${t('companyProfile:approveConfirmHeaderText')}`,
      text: `${t('companyProfile:approveConfirmText')}`,
      type: 'primary',
      icon: <Icon.ClipboardCheck />,
    });
    setErrorMsg('');
    setOpenApproveModal(true);
  };

  const onRejectOrganisation = () => {
    setActionInfo({
      action: `${t('companyProfile:reject')}`,
      headerText: `${t('companyProfile:rejectConfirmHeaderText')}`,
      text: `${t('companyProfile:rejectConfirmText')}`,
      type: 'danger',
      icon: <Icon.ClipboardX />,
    });
    setErrorMsg('');
    setOpenRejectModal(true);
  };

  const handleCancel = () => {
    setCNCModalVisible(false);
  };

  const showCarbonNeutralCertificateRequestApproveModal = (
    info: CarbonNeutralConfirmationPopupInfo
  ) => {
    setCNCModalVisible(true);
    setCNCModelInfo(info);
  };

  // const getCarbonNeutralCertificates = async (companyId: number) => {
  //   // setLoading(true);
  //   try {
  //     const response: any = await post('programmeSl/getCarbonNeutralCertificates', {
  //       companyId: companyId,
  //     });
  //     if (response.status === 200 || response.status === 201) {
  //       console.log(response);
  //       setCarbonNeutralCertificateData(response?.data);
  //     }
  //   } catch (err: any) {
  //     console.log('Error in getting carbon neutral certificate data - ', err);
  //     message.open({
  //       type: 'error',
  //       content: err.message,
  //       duration: 4,
  //       style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
  //     });
  //   } finally {
  //     // setLoading(false);
  //   }
  // };

  function formatCreatedTime(createdTime: string): string {
    return moment(parseInt(createdTime, 10)).format('DD MMMM YYYY [@] HH:mm');
  }

  const downloadCertificate = async (item: any) => {
    // setLoading(true);
    try {
      const url = JSON.parse(item?.content)?.certificateUrl;
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

  const handleApprove = async (
    docId: number,
    level: string,
    startDate: number,
    endDate: number,
    year: number,
    comment: string,
    approve: boolean
  ) => {
    setIsLoading(true);
    try {
      await post(API_PATHS.ISSURE_CARBON_NEUTRAL_CERTIFICATE, {
        documentId: docId,
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
      // getCarbonNeutralCertificates(companyDetails.companyId);
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
      setCNCModalVisible(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="content-container company-profile">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('companyProfile:title')}</div>
        </div>
        <div className="flex-display">
          {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
          userRole === Role.Root &&
          ability.can(Action.Delete, plainToClass(Company, companyDetails)) &&
          !isLoading &&
          parseInt(companyDetails?.state) === 1 ? (
            <Button danger className="btn-danger" onClick={onDeauthoriseOrganisation}>
              {t('companyProfile:deauthorise')}
            </Button>
          ) : (
            ''
          )}

          {companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
          userRole === Role.Root &&
          ability.can(Action.Delete, plainToClass(Company, companyDetails)) &&
          !isLoading &&
          parseInt(companyDetails?.state) === 0 ? (
            <Button className="btn-activate" onClick={onReActivateOrganisation}>
              {t('companyProfile:reActivate')}
            </Button>
          ) : (
            ''
          )}

          {ability.can(Action.Update, plainToClass(Company, companyDetails)) &&
            !isLoading &&
            companyDetails && (
              <Button
                className="mg-left-1"
                type="primary"
                onClick={() => onNavigateToCompanyEdit(companyDetails)}
              >
                {t('common:edit')}
              </Button>
            )}
          {parseInt(companyDetails?.state) === 2 &&
            ability.can(Action.Reject, plainToClass(Company, companyDetails)) &&
            !isLoading &&
            companyDetails && (
              <Button className="btn-danger" onClick={onRejectOrganisation}>
                {t('common:reject')}
              </Button>
            )}
          {(parseInt(companyDetails?.state) === 2 || parseInt(companyDetails?.state) === 3) &&
            ability.can(Action.Approve, plainToClass(Company, companyDetails)) &&
            !isLoading &&
            companyDetails && (
              <Button className="mg-left-1" type="primary" onClick={onApproveOrganisation}>
                {t('common:approve')}
              </Button>
            )}
        </div>
      </div>
      {!companyDetails && (
        <div className="content-body">
          <Skeleton active loading={true}></Skeleton>
        </div>
      )}
      {companyDetails && (
        <div className="content-body">
          <Row gutter={16}>
            <Col md={24} lg={10}>
              <Card className="card-container">
                <Skeleton loading={isLoading} active>
                  <Row justify="center">
                    <img className="profile-img" alt="profile image" src={companyDetails.logo} />
                  </Row>
                  <Row justify="center">
                    <div className="padding-top-1 company-name">{companyDetails.name}</div>
                  </Row>
                  <Row justify="center">
                    <OrganisationStatus
                      t={t}
                      organisationStatus={parseInt(companyDetails.state)}
                    ></OrganisationStatus>
                  </Row>
                </Skeleton>
              </Card>
              {carbonNeutralCertificateData?.length > 0 && (
                <Card className="card-container cnc-container">
                  <div className="info-view">
                    <div className="title">
                      <span className="title-icon">
                        <FileSyncOutlined />
                      </span>
                      <span className="title-text">
                        {t('companyProfile:carbonNeutralCertificates')}
                      </span>
                    </div>
                    {carbonNeutralCertificateData.map((item: any, index: any) => (
                      <Row className="field" key={index}>
                        <Col span={12} className="field-key">
                          <div>
                            <div className="cnc-record-title">
                              Project {item.programmeId} -{' '}
                              <span className={item.status}>{item.status}</span>
                              {item.status === 'Pending' &&
                                userInfoState?.companyRole === CompanyRole.CLIMATE_FUND && (
                                  <span className="approve-cnc-title-icon">
                                    <ExclamationCircleTwoTone twoToneColor="#eb8f34" />
                                  </span>
                                )}
                            </div>
                            <div>{formatCreatedTime(item.createdTime)}</div>
                            {(() => {
                              const content = JSON.parse(item.content);
                              return content?.remark ? <div>Remark: {content.remark}</div> : null;
                            })()}
                          </div>
                        </Col>
                        {userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
                          item.status == 'Pending' && (
                            <>
                              <Col span={6} className="field-value">
                                <Button
                                  type="default"
                                  onClick={() => {
                                    showCarbonNeutralCertificateRequestApproveModal({
                                      headerText: t('companyProfile:approveCNCModelTitle'),
                                      icon: <CheckCircleOutlined />,
                                      actionBtnText: t('companyProfile:approve'),
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
                                  }}
                                  size="small"
                                  className="btnProjectForms"
                                >
                                  {t('companyProfile:btnApprove')}
                                </Button>
                              </Col>
                              <Col span={6} className="field-value">
                                <Button
                                  danger
                                  type="default"
                                  onClick={() => {
                                    showCarbonNeutralCertificateRequestApproveModal({
                                      headerText: t('companyProfile:rejectCNCModelTitle'),
                                      icon: <CheckCircleOutlined />,
                                      actionBtnText: t('companyProfile:reject'),
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
                                  }}
                                  size="small"
                                  className="btn-danger"
                                >
                                  {t('companyProfile:btnReject')}
                                </Button>
                              </Col>
                            </>
                          )}
                        {item.status == 'Accepted' && (
                          <Col span={6} className="field-value">
                            <>
                              <Button
                                type="default"
                                onClick={() => downloadCertificate(item)}
                                size="small"
                                className="btnProjectForms"
                              >
                                {t('companyProfile:btnDownload')}
                              </Button>
                            </>
                          </Col>
                        )}
                      </Row>
                    ))}
                  </div>
                </Card>
              )}
            </Col>
            <Col md={24} lg={14}>
              <CompanyDetailsComponent
                t={t}
                companyDetails={companyDetails}
                userDetails={userDetails}
                isLoading={isLoading}
                regionField
                systemType={systemType}
              />
              {(companyDetails?.state == '2' || companyDetails?.state == '3') && (
                <Card className="card-container">
                  <div className="info-view">
                    <div className="title">
                      <span className="title-icon">
                        <UserOutlined />
                      </span>
                      <span className="title-text">{t('companyProfile:adminDetailsHeading')}</span>
                    </div>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('companyProfile:adminName')}
                      </Col>
                      <Col span={12} className="field-value">
                        {userDetails?.name ? userDetails?.name : '-'}
                      </Col>
                    </Row>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('companyProfile:adminEmail')}
                      </Col>
                      <Col span={12} className="field-value">
                        {userDetails?.email ? userDetails?.email : '-'}
                      </Col>
                    </Row>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('companyProfile:adminPhone')}
                      </Col>
                      <Col span={12} className="field-value">
                        {userDetails?.phoneNo ? userDetails?.phoneNo : '-'}
                      </Col>
                    </Row>
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        </div>
      )}

      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onDeauthoriseOrgConfirmed}
        onActionCanceled={onDeauthoriseOrgCanceled}
        openModal={openDeauthorisationModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />

      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onReactivateOrgConfirmed}
        onActionCanceled={onReactivateOrgCanceled}
        openModal={openReactivateModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />

      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onApproveOrgConfirmed}
        onActionCanceled={onApproveOrgCanceled}
        openModal={openApproveModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />

      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onRejectOrgConfirmed}
        onActionCanceled={onRejectOrgCanceled}
        openModal={openRejectModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />

      <CarbonNeutralConfirmationModelSl
        actionInfo={cncModelInfo}
        onActionCanceled={handleCancel}
        openModal={cncModalVisible}
        errorMsg={''}
        loading={isLoading}
        t={t}
      />
    </div>
  );
};
