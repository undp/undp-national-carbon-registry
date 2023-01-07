import { useTranslation } from 'react-i18next';
import { Row, Col, Card, Button, Modal, Select, Alert } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { UserOutlined, BankOutlined, DeleteOutlined } from '@ant-design/icons';
import userProfile from '../../Assets/Images/nigeria.png';
import './UserProfile.scss';
import InfoView from '../../Components/InfoView/info.view';
import { useEffect, useState } from 'react';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import UserActionConfirmationModel from '../../Components/Models/UserActionConfirmationModel';
import ChangePasswordModel from '../../Components/Models/ChangePasswordModel';

const UserProfile = () => {
  const { i18n, t } = useTranslation(['userProfile']);
  const { get, delete: del, put } = useConnection();
  const [organisationDetails, setOrganisationDetails] = useState<any>([]);
  const [userDetails, setUserDetails] = useState<any>([]);
  const [language, setLanguage] = useState<string>('');
  const organisationDetailsHiddenColumns = ['companyId', 'logo', 'country', 'companyRole', 'state'];
  const userDetailsHiddenColumns = ['id', 'country', 'companyId', 'companyRole'];
  const navigate = useNavigate();
  const { updateToken } = useConnection();
  const { removeUserInfo } = useUserContext();
  const [actionInfo, setActionInfo] = useState<any>({});
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] = useState(false);
  const [openPasswordChangeModal, setopenPasswordChangeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');

  const mapArrayToi18n = (map: any) => {
    const info: any = {};
    Object.entries(map).forEach(([k, v]) => {
      const text = t('userProfile:' + k);
      info[text] = v;
    });
    return info;
  };

  const signOut = (): void => {
    updateToken();
    removeUserInfo();
  };

  const getUserProfileDetails = async () => {
    try {
      const response = await get('national/User/profile');
      if (response.data) {
        setOrganisationDetails(response.data.Organisation);
        setUserDetails(response.data.user);
      }
    } catch (exception) {}
  };

  useEffect(() => {
    getUserProfileDetails();
  }, []);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  const onDeleteProfileUser = () => {
    setActionInfo({
      action: 'Delete',
      headerText: 'Are you sure you want to permanently delete this user?',
      text: `You can’t undo this action`,
      type: 'danger',
      icon: <DeleteOutlined />,
    });
    setErrorMsg('');
    setOpenDeleteConfirmationModal(true);
  };

  const onDeleteProfileUserConfirmed = async () => {
    try {
      const response = await del(`national/user/delete?email=${userDetails.email}`);
      setOpenDeleteConfirmationModal(false);
      setErrorMsg('');
      signOut();
    } catch (exception: any) {
      setErrorMsg(exception.message);
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

  const onPasswordChangeCanceled = () => {
    setopenPasswordChangeModal(false);
  };

  return (
    <div className="content-container">
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
            <Button className="mg-left-1" onClick={() => onDeleteProfileUser()}>
              DELETE
            </Button>
            <Button
              className="mg-left-1"
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
              EDIT
            </Button>
            <div className="login-language-selection-container mg-left-1">
              <span className="login-language-selection-txt">
                <Select
                  placeholder="Search to Select"
                  defaultValue={
                    localStorage.getItem('i18nextLng') !== null
                      ? localStorage.getItem('i18nextLng')
                      : 'en'
                  }
                  placement="topRight"
                  onChange={(lan: string) => handleLanguageChange(lan)}
                  optionFilterProp="children"
                  filterOption={(input, option) => (option?.label ?? '').includes(input)}
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={[
                    {
                      value: 'en',
                      label: 'English',
                    },
                    {
                      value: 'es',
                      label: 'Española',
                    },
                    {
                      value: 'fr',
                      label: 'française',
                    },
                  ]}
                />
              </span>
            </div>
          </Row>
        </Col>
      </Row>

      <div className="content-body">
        <Row gutter={16}>
          <Col md={24} lg={8}>
            <Card className="card-container">
              <Row justify="center">
                <img className="user-profile-img" src={userProfile} alt="user-profile" />
              </Row>
              <Row justify="center">
                <div className="padding-top-1">{organisationDetails.name}</div>
              </Row>
            </Card>
            <Row justify="center">
              <Button className="mg-left-1" onClick={() => signOut()}>
                LOG OUT
              </Button>
              <Button className="mg-left-1" type="primary" onClick={onChangedPassword}>
                CHANGE PASSWORD
              </Button>
            </Row>
          </Col>
          <Col md={24} lg={16}>
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(userDetails)}
                  hiddenColumns={userDetailsHiddenColumns}
                  title={t('userProfile:userDetailsHeading')}
                  icon={<UserOutlined />}
                />
              </div>
            </Card>
            <Card className="card-container">
              <div>
                <InfoView
                  data={mapArrayToi18n(organisationDetails)}
                  hiddenColumns={organisationDetailsHiddenColumns}
                  title={t('userProfile:organisationDetailsHeading')}
                  icon={<BankOutlined />}
                />
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
      />

      <ChangePasswordModel
        onPasswordChanged={onPasswordChangeCompleted}
        onCanceled={onPasswordChangeCanceled}
        openModal={openPasswordChangeModal}
        errorMsg={errorMsg}
      ></ChangePasswordModel>
    </div>
  );
};

export default UserProfile;
