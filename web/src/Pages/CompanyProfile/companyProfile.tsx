import { BankOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { Button, Card, Col, message, Row, Skeleton } from 'antd';
import { plainToClass } from 'class-transformer';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { AbilityContext } from '../../Casl/Can';
import { Company } from '../../Casl/entities/Company';
import { Action } from '../../Casl/enums/action.enum';
import CompanyRoleIcon from '../../Components/CompanyRoleIcon/CompanyRoleIcon';
import UserActionConfirmationModel from '../../Components/Models/UserActionConfirmationModel';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import './companyProfile.scss';
import * as Icon from 'react-bootstrap-icons';
import OrganisationStatus from '../../Components/Organisation/OrganisationStatus';

const CompanyProfile = () => {
  const { get, put } = useConnection();
  const [companyDetails, setCompanyDetails] = useState<any>([]);
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['companyProfile']);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openDeauthorisationModal, setOpenDeauthorisationModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');
  const [userRole, setUserRole] = useState<any>('');
  const [companyRole, setCompanyRole] = useState<any>('');
  const ability = useContext(AbilityContext);

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

  useEffect(() => {
    if (!state) {
      navigate('/companyManagement/viewAll');
    } else {
      getCompanyDetails(state.record.companyId);
      const userRoleValue = localStorage.getItem('userRole') as string;
      setUserRole(userRoleValue);
      setCompanyRole(localStorage.getItem('companyRole') as string);
    }
  }, []);

  const onDeauthoriseOrgConfirmed = async (remarks: string) => {
    try {
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
    }
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
      icon: <Icon.BuildingDash />,
    });
    setErrorMsg('');
    setOpenDeauthorisationModal(true);
  };

  return (
    <div className="content-container company-profile">
      <div className="title-bar">
        <div>
          <div className="body-title">{t('companyProfile:title')}</div>
          <div className="body-sub-title">{t('companyProfile:subTitle')}</div>
        </div>
        <div className="flex-display">
          {ability.can(Action.Delete, plainToClass(Company, companyDetails)) &&
          !isLoading &&
          parseInt(companyDetails.state) !== 0 ? (
            <Button danger className="btn-danger" onClick={onDeauthoriseOrganisation}>
              {t('companyProfile:deauthorise')}
            </Button>
          ) : (
            ''
          )}
          {ability.can(Action.Update, plainToClass(Company, companyDetails)) && !isLoading && (
            <Button
              className="mg-left-1"
              type="primary"
              onClick={() =>
                navigate('/companyManagement/updateCompany', { state: { record: companyDetails } })
              }
            >
              {t('common:edit')}
            </Button>
          )}
        </div>
      </div>

      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={8}>
            <Card className="card-container">
              <Skeleton loading={isLoading} active>
                <Row justify="center">
                  <img className="profile-img" src={companyDetails.logo} />
                </Row>
                <Row justify="center">
                  <div className="padding-top-1 company-name">{companyDetails.name}</div>
                </Row>
                <Row justify="center">
                  <OrganisationStatus
                    organisationStatus={parseInt(companyDetails.state)}
                  ></OrganisationStatus>
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
                  {parseInt(companyDetails.state) === 0 ? (
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('companyProfile:remarks')}
                      </Col>
                      <Col span={12} className="field-value">
                        {companyDetails.remarks ? companyDetails.remarks : '-'}
                      </Col>
                    </Row>
                  ) : (
                    ''
                  )}
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
