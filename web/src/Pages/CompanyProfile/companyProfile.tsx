import { BankOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import CompanyRoleIcon from '../../Components/CompanyRoleIcon/CompanyRoleIcon';
import UserActionConfirmationModel from '../../Components/Models/UserActionConfirmationModel';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import './companyProfile.scss';

const CompanyProfile = () => {
  const { get } = useConnection();
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['companyProfile']);
  const [isLoading, setIsLoading] = useState(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openDeauthorisationModal, setOpenDeauthorisationModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');
  const [userRole, setUserRole] = useState<any>('');

  const getCompanyDetails = async (companyId: string) => {
    try {
      setIsLoading(true);
      const response = await get(`national/company/profile?id=${companyId}`);
      if (response.data) {
        setCompanyDetails(response.data);
        setIsLoading(false);
      }
    } catch (exception) {}
  };

  useEffect(() => {
    if (!state) {
      navigate('/companyManagement/viewAll');
    } else {
      getCompanyDetails(state.record.companyId);
      const userRoleValue = localStorage.getItem('userRole') as string;
      setUserRole(userRoleValue);
    }
  }, []);

  const onDeauthoriseOrgConfirmed = () => {
    setOpenDeauthorisationModal(false);
  };

  const onDeauthoriseOrgCanceled = () => {
    setOpenDeauthorisationModal(false);
  };

  const onDeauthoriseOrganisation = () => {
    setActionInfo({
      action: `${t('companyProfile:deauthorise')}`,
      headerText: `${t('companyProfile:deauthoriseConfirmHeaderText')}`,
      text: `${t('companyProfile:deauthoriseConfirmText')}`,
      type: 'danger',
      icon: <MinusCircleOutlined />,
    });
    setErrorMsg('');
    setOpenDeauthorisationModal(true);
  };

  return (
    <div className="content-container">
      <Row>
        <Col md={24} lg={8}>
          <div className="title-bar">
            <div>
              <div className="body-title">{t('companyProfile:title')}</div>
              <div className="body-sub-title">{t('companyProfile:subTitle')}</div>
            </div>
          </div>
        </Col>
        <Col md={24} lg={16}>
          <Row justify="end">
            {['Admin', 'Root', 'Manager'].includes(userRole) ? (
              <Button
                disabled={parseInt(companyDetails.state) === 0}
                className="mg-right-5 btn-text-red"
                onClick={onDeauthoriseOrganisation}
              >
                {t('companyProfile:deauthorise')}
              </Button>
            ) : (
              ''
            )}
          </Row>
        </Col>
      </Row>

      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={8}>
            <Card className="card-container">
              <Skeleton loading={isLoading} active>
                <Row justify="center">
                  <img
                    className="profile-img"
                    src={'data:image/jpeg;base64,' + companyDetails.logo}
                  />
                </Row>
                <Row justify="center">
                  <div className="padding-top-1">{companyDetails.name}</div>
                </Row>
                <Row justify="center">
                  {parseInt(companyDetails.state) === 1 ? (
                    <div className="padding-top-1 active">{t('companyProfile:activeStatus')}</div>
                  ) : (
                    <div className="padding-top-1 deauthorised">
                      {t('companyProfile:deauthorisedStatus')}
                    </div>
                  )}
                </Row>
              </Skeleton>
            </Card>
          </Col>
          <Col md={24} lg={16}>
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">
                    <BankOutlined />
                  </span>
                  <span className="title-text">
                    {t('companyProfile:organisationDetailsHeading')}
                  </span>
                </div>
                <Skeleton loading={isLoading} active>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:name')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.name ? companyDetails.name : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:taxId')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.taxId ? companyDetails.taxId : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:companyRole')}
                    </Col>
                    <Col span={12} className="field-value">
                      <CompanyRoleIcon role={companyDetails.companyRole} />
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:email')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.email ? companyDetails.email : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:phoneNo')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.phoneNo ? companyDetails.phoneNo : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:website')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.website ? companyDetails.website : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:address')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.address ? companyDetails.address : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:programmeCount')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.programmeCount ? companyDetails.programmeCount : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('companyProfile:creditBalance')}
                    </Col>
                    <Col span={12} className="field-value">
                      {companyDetails.creditBalance ? companyDetails.creditBalance : '-'}
                    </Col>
                  </Row>
                </Skeleton>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      <UserActionConfirmationModel
        actionInfo={actionInfo}
        onActionConfirmed={onDeauthoriseOrgConfirmed}
        onActionCanceled={onDeauthoriseOrgCanceled}
        openModal={openDeauthorisationModal}
        errorMsg={errorMsg}
      />
    </div>
  );
};

export default CompanyProfile;
