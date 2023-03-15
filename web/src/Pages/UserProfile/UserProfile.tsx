import { useTranslation } from 'react-i18next';
import { Row, Col, Card, Button, Modal, Select, Alert, Skeleton } from 'antd';
import { UserOutlined, BankOutlined, DeleteOutlined } from '@ant-design/icons';
import './UserProfile.scss';
import { useEffect, useState } from 'react';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import UserActionConfirmationModel from '../../Components/Models/UserActionConfirmationModel';
import ChangePasswordModel from '../../Components/Models/ChangePasswordModel';
import UserRoleIcon from '../../Components/UserRoleIcon/UserRoleIcon';
import CompanyRoleIcon from '../../Components/CompanyRoleIcon/CompanyRoleIcon';
import LanguageSelection from '../../Components/LanguageSelection/languageSelection';
import * as Icon from 'react-bootstrap-icons';
import { Role } from '../../Casl/enums/role.enum';

const UserProfile = () => {
  const { i18n, t } = useTranslation(['userProfile']);
  const { get, delete: del, put } = useConnection();
  const [organisationDetails, setOrganisationDetails] = useState<any>([]);
  const [userDetails, setUserDetails] = useState<any>([]);
  const navigate = useNavigate();
  const { updateToken } = useConnection();
  const { removeUserInfo } = useUserContext();
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] = useState(false);
  const [openPasswordChangeModal, setopenPasswordChangeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');
  const [isLoading, setIsLoading] = useState(false);
  const { userInfoState } = useUserContext();

  const signOut = (): void => {
    navigate('/login');
    updateToken();
    removeUserInfo();
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

  const onDeleteProfileUser = () => {
    setActionInfo({
      action: 'Delete',
      headerText: `${t('userProfile:deleteConfirmHeaderText')}`,
      text: `${t('userProfile:deleteConfirmText')}`,
      type: 'danger',
      icon: <Icon.PersonDash />,
    });
    setErrorMsg('');
    setOpenDeleteConfirmationModal(true);
  };

  const onDeleteProfileUserConfirmed = async () => {
    try {
      setIsLoading(true);
      const response = await del(`national/user/delete?email=${userDetails.email}`);
      setOpenDeleteConfirmationModal(false);
      setErrorMsg('');
      signOut();
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteProfileUserCanceled = () => {
    setOpenDeleteConfirmationModal(false);
    setErrorMsg('');
  };

  const onChangedPassword = () => {
    setErrorMsg('');
    setopenPasswordChangeModal(true);
  };

  const onPasswordChangeCompleted = async (props: any) => {
    try {
      const response = await put('national/user/resetPassword', {
        newPassword: props.newPassword,
        oldPassword: props.oldPassword,
      });
      setErrorMsg('');
      setopenPasswordChangeModal(false);
      signOut();
    } catch (exception: any) {
      setErrorMsg(exception.message);
    }
  };

  const onFormsValueChanged = async () => {
    setErrorMsg('');
  };

  const onPasswordChangeCanceled = () => {
    setopenPasswordChangeModal(false);
  };

  return (
    <div className="content-container user-profile">
      <Row>
        <Col md={24} lg={8}>
          <div className="title-bar">
            <div>
              <div className="body-title">{t('userProfile:title')}</div>
              <div className="body-sub-title">{t('userProfile:subTitle')}</div>
            </div>
          </div>
        </Col>
        <Col md={24} lg={16}>
          <Row justify="end">
            {userInfoState?.userRole !== Role.Root && (
              <Button
                className="mg-left-1 btn-danger mg-bottom-1"
                onClick={() => onDeleteProfileUser()}
              >
                {t('userProfile:delete')}
              </Button>
            )}
            <Button
              className="mg-left-1 mg-bottom-1"
              type="primary"
              onClick={() => {
                navigate('/userManagement/updateUser', {
                  state: {
                    record: {
                      company: organisationDetails,
                      ...userDetails,
                    },
                  },
                });
              }}
            >
              {t('userProfile:edit')}
            </Button>
            <LanguageSelection></LanguageSelection>
          </Row>
        </Col>
      </Row>

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
            <Row justify="center">
              <Button className="mg-left-1 btn-danger mg-bottom-1" onClick={() => signOut()}>
                {t('userProfile:logOut')}
              </Button>
              <Button className="mg-left-1 mg-bottom-1" type="primary" onClick={onChangedPassword}>
                {t('userProfile:changePassword')}
              </Button>
            </Row>
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
            <Card className="card-container">
              <div className="info-view">
                <div className="title">
                  <span className="title-icon">
                    <BankOutlined />
                  </span>
                  <span className="title-text">{t('userProfile:organisationDetailsHeading')}</span>
                </div>
                <Skeleton loading={isLoading} active>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:name')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.name ? organisationDetails.name : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:taxId')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.taxId ? organisationDetails.taxId : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:companyRole')}
                    </Col>
                    <Col span={12} className="field-value">
                      <CompanyRoleIcon role={organisationDetails.companyRole} />
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:email')}
                    </Col>
                    <Col span={12} className="field-value nextline-overflow">
                      {organisationDetails.email ? organisationDetails.email : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:phoneNo')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.phoneNo ? organisationDetails.phoneNo : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:website')}
                    </Col>
                    <Col span={12} className="field-value ellipsis-overflow">
                      {organisationDetails.website ? (
                        <a target={'blank'} href={organisationDetails.website}>
                          {organisationDetails.website}
                        </a>
                      ) : (
                        '-'
                      )}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:address')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.address ? organisationDetails.address : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:programmeCount')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.programmeCount
                        ? organisationDetails.programmeCount
                        : '-'}
                    </Col>
                  </Row>
                  <Row className="field">
                    <Col span={12} className="field-key">
                      {t('userProfile:creditBalance')}
                    </Col>
                    <Col span={12} className="field-value">
                      {organisationDetails.creditBalance ? organisationDetails.creditBalance : '-'}
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
        onActionConfirmed={onDeleteProfileUserConfirmed}
        onActionCanceled={onDeleteProfileUserCanceled}
        openModal={openDeleteConfirmationModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />

      <ChangePasswordModel
        onPasswordChanged={onPasswordChangeCompleted}
        onFieldsChanged={onFormsValueChanged}
        onCanceled={onPasswordChangeCanceled}
        openModal={openPasswordChangeModal}
        errorMsg={errorMsg}
      ></ChangePasswordModel>
    </div>
  );
};

export default UserProfile;
