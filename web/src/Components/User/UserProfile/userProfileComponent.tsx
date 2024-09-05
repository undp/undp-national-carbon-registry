import { Row, Col, Card, Button, Skeleton } from 'antd';
import { UserOutlined, BankOutlined } from '@ant-design/icons';
import './userProfileComponent.scss';
import { useEffect, useState } from 'react';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';
import LanguageSelection from '../../LanguageSelection/languageSelection';
import { UserRoleIcon } from '../../IconComponents/UserRoleIcon/userRoleIcon';
import { CompanyDetailsComponent } from '../../Company/CompanyDetails/companyDetailsComponent';
// import { UserRoleIcon } from '../../Common/UserRoleIcon/userRoleIcon';
// import CompanyRoleIcon from '../../Common/CompanyRoleIcon/companyRoleIcon';
// import LanguageSelection from '../../Common/LanguageSelection/languageSelection';
// import React from 'react';
// import { SectoralScope, addCommSep } from '../../../Definitions';
// import { CompanyRole } from '../../../Definitions/Enums/company.role.enum';
// import { useConnection, useUserContext } from '../../../Context';
// import { CompanyDetailsComponent } from '../../Company/CompanyDetails/companyDetailsComponent';
// import { GovDepartment } from '../../../Definitions';

export const UserProfileComponent = (props: any) => {
  const { t, i18n, onNavigateUpdateUser, onNavigateLogin } = props;
  const { get } = useConnection();
  const [organisationDetails, setOrganisationDetails] = useState<any>(undefined);
  const [userDetails, setUserDetails] = useState<any>(undefined);
  const { updateToken, updateRefreshToken } = useConnection();
  const { removeUserInfo } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);

  const signOut = (): void => {
    updateToken();
    updateRefreshToken();
    removeUserInfo();
    onNavigateLogin();
  };

  const getUserProfileDetails = async () => {
    try {
      setIsLoading(true);
      const response = await get('national/User/profile');
      if (response.data) {
        setOrganisationDetails(response.data.Organisation);
        setUserDetails(response.data.user);
        setIsLoading(false);
      }
    } catch (exception) {}
  };

  useEffect(() => {
    getUserProfileDetails();
  }, []);

  return (
    <div className="content-container user-profile">
      <Row>
        <Col md={24} lg={8}>
          <div className="title-bar">
            <div>
              <div className="body-title">{t('userProfile:title')}</div>
            </div>
          </div>
        </Col>
        <Col md={24} lg={16}>
          <Row justify="end">
            <Button className="mg-left-1 btn-danger mg-bottom-1" onClick={() => signOut()}>
              {t('userProfile:logOut')}
            </Button>
            {userDetails && organisationDetails && (
              <Button
                className="mg-left-1 mg-bottom-1"
                type="primary"
                onClick={() => {
                  onNavigateUpdateUser(organisationDetails, userDetails);
                }}
              >
                {t('userProfile:edit')}
              </Button>
            )}
            <LanguageSelection i18n={i18n}></LanguageSelection>
          </Row>
        </Col>
      </Row>

      {(!userDetails || !organisationDetails) && (
        <div className="content-body">
          <Skeleton active loading={true}></Skeleton>
        </div>
      )}
      {userDetails && organisationDetails && (
        <div className="content-body">
          <Row gutter={16}>
            <Col md={24} lg={8}>
              <Card className="card-container">
                <Row justify="center">
                  <Skeleton loading={isLoading} active>
                    <img className="profile-img" alt="profile-img" src={organisationDetails.logo} />
                  </Skeleton>
                </Row>
                <Row justify="center">
                  <div className=" company-name mg-top-1">{organisationDetails.name}</div>
                </Row>
              </Card>
            </Col>
            <Col md={24} lg={16}>
              <Card className="card-container">
                <div className="info-view">
                  <div className="title">
                    <span className="title-icon">
                      <UserOutlined />
                    </span>
                    <span className="title-text">{t('userProfile:userDetailsHeading')}</span>
                  </div>
                  <Skeleton loading={isLoading} active>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('userProfile:name')}
                      </Col>
                      <Col span={12} className="field-value">
                        {userDetails.name ? userDetails.name : '-'}
                      </Col>
                    </Row>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('userProfile:email')}
                      </Col>
                      <Col span={12} className="field-value nextline-overflow">
                        {userDetails.email ? userDetails.email : '-'}
                      </Col>
                    </Row>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('userProfile:role')}
                      </Col>
                      <Col span={12} className="field-value">
                        <UserRoleIcon role={userDetails.role} />
                      </Col>
                    </Row>
                    <Row className="field">
                      <Col span={12} className="field-key">
                        {t('userProfile:phoneNo')}
                      </Col>
                      <Col span={12} className="field-value">
                        {userDetails.phoneNo ? userDetails.phoneNo : '-'}
                      </Col>
                    </Row>
                  </Skeleton>
                </div>
              </Card>
              <CompanyDetailsComponent
                t={t}
                companyDetails={organisationDetails}
                userDetails={userDetails}
                isLoading={isLoading}
                regionField
              />
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};
