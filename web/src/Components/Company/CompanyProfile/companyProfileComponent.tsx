/* eslint-disable eqeqeq */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-use-before-define */
import { BankOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Row, Skeleton } from 'antd';
import { plainToClass } from 'class-transformer';
import React, { useEffect, useState } from 'react';
import { Action } from '../../../Definitions/Enums/action.enum';
import { Company } from '../../../Definitions/Entities/company';
import UserActionConfirmationModel from '../../Models/userActionConfirmationModel';
import './companyProfileComponent.scss';
import * as Icon from 'react-bootstrap-icons';
import { OrganisationStatus } from '../../OrganisationStatus/organisationStatus';
import { CompanyDetailsComponent } from '../CompanyDetails/companyDetailsComponent';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';

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
  const ability = useAbilityContext();

  const getCompanyDetails = async (companyId: string) => {
    try {
      setIsLoading(true);
      const response = await get(`national/organisation/profile?id=${companyId}`);
      if (response.data) {
        setCompanyDetails(response.data);
        setIsLoading(false);
      }
    } catch (exception) {}
  };

  const getUserDetails = async (companyId: string) => {
    setIsLoading(true);
    try {
      const response: any = await post('national/user/query', {
        page: 1,
        size: 10,
        filterAnd: [
          {
            key: 'companyId',
            operation: '=',
            value: companyId,
          },
          {
            key: 'isPending',
            operation: '=',
            value: true,
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
    }
  }, []);

  const onDeauthoriseOrgConfirmed = async (remarks: string) => {
    try {
      setIsLoading(true);
      const response: any = await put(
        `national/organisation/suspend?id=${companyDetails.companyId}`,
        {
          remarks: remarks,
        }
      );
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
      const response: any = await put(
        `national/organisation/activate?id=${companyDetails.companyId}`,
        {
          remarks: remarks,
        }
      );
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
      const response: any = await put(
        `national/organisation/approve?id=${companyDetails.companyId}`,
        {
          remarks: remarks,
        }
      );
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
      const response: any = await put(
        `national/organisation/reject?id=${companyDetails.companyId}`,
        {
          remarks: remarks,
        }
      );
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

  return (
    <div className="content-container company-profile">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('companyProfile:title')}</div>
        </div>
        <div className="flex-display">
          {ability.can(Action.Delete, plainToClass(Company, companyDetails)) &&
          !isLoading &&
          parseInt(companyDetails?.state) === 1 ? (
            <Button danger className="btn-danger" onClick={onDeauthoriseOrganisation}>
              {t('companyProfile:deauthorise')}
            </Button>
          ) : (
            ''
          )}

          {ability.can(Action.Delete, plainToClass(Company, companyDetails)) &&
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
            <Col md={24} lg={8}>
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
            </Col>
            <Col md={24} lg={16}>
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
    </div>
  );
};
