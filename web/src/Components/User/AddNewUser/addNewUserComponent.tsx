/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Form, Input, message, Radio, Tooltip, Skeleton } from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './addNewUserComponent.scss';
import '../../../Styles/app.scss';
import { EyeOutlined, StarOutlined, ToolOutlined } from '@ant-design/icons';
import { User } from '../../../Definitions/Entities/user';
import * as Icon from 'react-bootstrap-icons';
import { plainToClass } from 'class-transformer';
import { Action } from '../../../Definitions/Enums/action.enum';
import UserActionConfirmationModel from '../../Models/userActionConfirmationModel';
import ChangePasswordModel from '../../Models/changePasswordModel';
import { Role } from '../../../Definitions/Enums/role.enum';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import { useUserContext } from '../../../Context/UserInformationContext/userInformationContext';

export const AddNewUserComponent = (props: any) => {
  const {
    t,
    onNavigateToUserManagement,
    onNavigateLogin,
    useLocation,
    useAbilityContext,
    themeColor,
  } = props;

  const { post, put, delete: del, get } = useConnection();
  const [formOne] = Form.useForm();
  const { state } = useLocation();
  const { updateToken } = useConnection();
  const { removeUserInfo } = useUserContext();
  const [loading, setLoading] = useState<boolean>(false);
  const [actionInfo, setActionInfo] = useState<any>({});
  const [isUpdate, setIsUpdate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteConfirmationModal, setOpenDeleteConfirmationModal] = useState(false);
  const [openPasswordChangeModal, setopenPasswordChangeModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<any>('');
  const { userInfoState } = useUserContext();
  const ability = useAbilityContext();
  const [countries, setCountries] = useState<[]>([]);
  const [isCountryListLoading, setIsCountryListLoading] = useState(false);

  const getCountryList = async () => {
    setIsCountryListLoading(true);
    try {
      const response = await get('national/organisation/countries');
      if (response.data) {
        const alpha2Names = response.data.map((item: any) => {
          return item.alpha2;
        });
        setCountries(alpha2Names);
      }
    } catch (error: any) {
      console.log('Error in getCountryList', error);
      message.open({
        type: 'error',
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setIsCountryListLoading(false);
    }
  };

  const onAddUser = async (values: any) => {
    setLoading(true);
    try {
      if (values.phoneNo && values.phoneNo.length > 4) {
        values.phoneNo = formatPhoneNumberIntl(values.phoneNo);
      } else {
        values.phoneNo = undefined;
      }
      const response = await post('national/user/add', values);
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: t('addUserSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        onNavigateToUserManagement();
        setLoading(false);
      }
    } catch (error: any) {
      console.log('Error in user creation', error);
      message.open({
        type: 'error',
        content: `${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const onUpdateUser = async () => {
    setLoading(true);
    const formOneValues = formOne.getFieldsValue();
    formOneValues.phoneNo = formatPhoneNumberIntl(formOneValues.phoneNo);
    try {
      const values: any = {
        id: state?.record?.id,
        name: formOneValues?.name,
        phoneNo: formOneValues?.phoneNo,
      };

      if (ability.can(Action.Update, plainToClass(User, state?.record), 'role'))
        values.role = formOneValues?.role;

      if (ability.can(Action.Update, plainToClass(User, state?.record), 'email'))
        values.email = formOneValues?.email;

      const response = await put('national/user/update', values);
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: t('updateUserSuccess'),
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        onNavigateToUserManagement();
        state.record = {};
        setLoading(false);
      }
    } catch (error: any) {
      console.log('Error in user update', error);
      message.open({
        type: 'error',
        content: `${t('updateUserError')} ${error.message}`,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setLoading(false);
    }
  };

  const onSubmitData = async (values: any) => {
    if (isUpdate) onUpdateUser();
    else onAddUser(values);
  };

  const signOut = (): void => {
    onNavigateLogin();
    updateToken();
    removeUserInfo();
  };

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

  const onDeleteProfileUserCanceled = () => {
    setOpenDeleteConfirmationModal(false);
    setErrorMsg('');
  };

  const onDeleteProfileUserConfirmed = async () => {
    try {
      setIsLoading(true);
      const userId = userInfoState?.id;
      await del(`national/user/delete?userId=${userId}`);
      setOpenDeleteConfirmationModal(false);
      message.open({
        type: 'success',
        content: t('userProfile:userDeletionSuccess'),
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setErrorMsg('');
      signOut();
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const onPasswordChangeCompleted = async (props: any) => {
    setIsLoading(true);
    try {
      const response = await put('national/user/resetPassword', {
        newPassword: props.newPassword,
        oldPassword: props.oldPassword,
      });
      const responseMsg = response.message;
      setopenPasswordChangeModal(false);
      message.open({
        type: 'success',
        content: responseMsg,
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
      setErrorMsg('');
      signOut();
    } catch (exception: any) {
      setErrorMsg(exception.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onChangedPassword = () => {
    setErrorMsg('');
    setopenPasswordChangeModal(true);
  };

  const onPasswordChangeCanceled = () => {
    setopenPasswordChangeModal(false);
  };

  const onFormsValueChanged = async () => {
    setErrorMsg('');
  };

  useEffect(() => {
    getCountryList();
    setIsUpdate(state?.record ? true : false);
  }, []);

  return (
    <div className="add-user-main-container">
      <div className="title-container">
        <div className="titles">
          <div className="main">{isUpdate ? t('addUser:editUser') : t('addUser:addNewUser')}</div>
        </div>
        {isUpdate && !ability.can(Action.Update, plainToClass(User, state?.record), 'email') && (
          <div className="actions">
            {userInfoState?.userRole !== Role.Root && (
              <Button className="mg-left-1 btn-danger" onClick={() => onDeleteProfileUser()}>
                {t('userProfile:delete')}
              </Button>
            )}
            <Button className="mg-left-1" type="primary" onClick={onChangedPassword}>
              {t('userProfile:changePassword')}
            </Button>
          </div>
        )}
      </div>
      <div className="content-card user-content-card">
        <Form
          name="user-details"
          className="user-details-form"
          layout="vertical"
          form={formOne}
          requiredMark={true}
          onFinish={onSubmitData}
        >
          <Row className="row" gutter={[16, 16]}>
            <Col xl={12} md={24}>
              <div className="details-part-one">
                <Form.Item
                  label={t('addUser:name')}
                  initialValue={state?.record?.name}
                  name="name"
                  rules={[
                    {
                      required: true,
                      message: '',
                    },
                    {
                      validator: async (rule, value) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('addUser:name')} ${t('addUser:isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
                <Form.Item
                  label={t('addUser:email')}
                  name="email"
                  initialValue={state?.record?.email}
                  rules={[
                    {
                      required: true,
                      message: '',
                    },
                    {
                      validator: async (rule, value) => {
                        if (
                          String(value).trim() === '' ||
                          String(value).trim() === undefined ||
                          value === null ||
                          value === undefined
                        ) {
                          throw new Error(`${t('addUser:email')} ${t('addUser:isRequired')}`);
                        } else {
                          const val = value.trim();
                          const reg =
                            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                          const matches = val.match(reg) ? val.match(reg) : [];
                          if (matches.length === 0) {
                            throw new Error(`${t('addUser:email')} ${t('addUser:isInvalid')}`);
                          }
                        }
                      },
                    },
                  ]}
                >
                  <Input
                    disabled={
                      isUpdate &&
                      !ability.can(Action.Update, plainToClass(User, state?.record), 'email')
                    }
                    size="large"
                  />
                </Form.Item>
              </div>
            </Col>
            <Col xl={12} md={24}>
              <div className="details-part-two">
                <Form.Item
                  className="role-group"
                  label={t('addUser:role')}
                  initialValue={state?.record?.role}
                  name="role"
                  rules={[
                    {
                      required: true,
                      message: `${t('addUser:role')} ${t('addUser:isRequired')}`,
                    },
                  ]}
                >
                  <Radio.Group
                    value={state?.record?.role}
                    size="large"
                    disabled={
                      isUpdate &&
                      !ability.can(Action.Update, plainToClass(User, state?.record), 'role')
                    }
                  >
                    <div className="admin-radio-container">
                      <Tooltip placement="top" title={t('addUser:adminToolTip')}>
                        <Radio.Button className="admin" value="Admin">
                          <StarOutlined className="role-icons" />
                          {t('addUser:admin')}
                        </Radio.Button>
                      </Tooltip>
                    </div>
                    <div className="manager-radio-container">
                      <Tooltip placement="top" title={t('addUser:managerToolTip')}>
                        <Radio.Button className="manager" value="Manager">
                          <ToolOutlined className="role-icons" />
                          {t('addUser:manager')}
                        </Radio.Button>
                      </Tooltip>
                    </div>
                    <div className="view-only-radio-container">
                      <Tooltip placement="top" title={t('addUser:viewerToolTip')}>
                        <Radio.Button className="view-only" value="ViewOnly">
                          <EyeOutlined className="role-icons" />
                          {t('addUser:viewer')}
                        </Radio.Button>
                      </Tooltip>
                    </div>
                  </Radio.Group>
                </Form.Item>
                <Skeleton loading={isCountryListLoading} active>
                  {countries.length > 0 && (
                    <Form.Item
                      name="phoneNo"
                      label={t('addUser:phoneNo')}
                      initialValue={state?.record?.phoneNo}
                      rules={[
                        {
                          required: false,
                        },
                        {
                          validator: async (rule: any, value: any) => {
                            const phoneNo = formatPhoneNumber(String(value));
                            if (String(value).trim() !== '') {
                              if (
                                (String(value).trim() !== '' &&
                                  String(value).trim() !== undefined &&
                                  value !== null &&
                                  value !== undefined &&
                                  phoneNo !== null &&
                                  phoneNo !== '' &&
                                  phoneNo !== undefined &&
                                  !isPossiblePhoneNumber(String(value))) ||
                                value?.length > 17
                              ) {
                                throw new Error(`${t('addUser:phoneNo')} ${t('isInvalid')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <PhoneInput
                        placeholder={t('addUser:phoneNo')}
                        international
                        // value={contactNoInput}
                        defaultCountry="LK"
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries}
                      />
                    </Form.Item>
                  )}
                </Skeleton>
              </div>
            </Col>
          </Row>
          <div className="actions">
            <Form.Item>
              <div className="create-user-btn-container">
                <Button type="primary" htmlType="submit" loading={loading}>
                  {isUpdate ? t('addUser:update') : t('addUser:submit')}
                </Button>
              </div>
            </Form.Item>
          </div>
        </Form>
      </div>
      <UserActionConfirmationModel
        t={t}
        actionInfo={actionInfo}
        onActionConfirmed={onDeleteProfileUserConfirmed}
        onActionCanceled={onDeleteProfileUserCanceled}
        openModal={openDeleteConfirmationModal}
        errorMsg={errorMsg}
        loading={isLoading}
      />
      <ChangePasswordModel
        t={t}
        onPasswordChanged={onPasswordChangeCompleted}
        onFieldsChanged={onFormsValueChanged}
        onCanceled={onPasswordChangeCanceled}
        openModal={openPasswordChangeModal}
        errorMsg={errorMsg}
        loadingBtn={isLoading}
        themeColor={themeColor}
      ></ChangePasswordModel>
    </div>
  );
};
