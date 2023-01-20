import { Button, Col, Form, Input, message, Row, Select } from 'antd';
import React, { useContext, useEffect, useState } from 'react';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import './login.scss';
// import sha1 from 'sha1';
import countryLogo from '../../Assets/Images/nigeria.png';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { useUserContext } from '../../Context/UserInformationContext/userInformationContext';
import { LoginProps } from '../../Definitions/InterfacesAndType/userLogin.definitions';
import { useNavigate } from 'react-router-dom';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { AbilityContext } from '../../Casl/Can';
import { updateUserAbility } from '../../Casl/ability';

const Login = () => {
  const { post, updateToken, removeToken } = useConnection();
  const { IsAuthenticated, setUserInfo } = useUserContext();
  const { i18n, t } = useTranslation(['common', 'login']);
  const [loading, setLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const navigate = useNavigate();
  const ability = useContext(AbilityContext);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const onSubmit = async (values: LoginProps) => {
    setLoading(true);
    setShowError(false);
    try {
      const email = values.email.trim();
      const response = await post('national/auth/login', {
        username: email.trim(),
        password: values.password.trim(),
      });

      updateUserAbility(ability, {
        id: response.data.id,
        role: response.data.role,
        companyId: response.data.companyId,
      });

      if (response.status === 200 || response.status === 201) {
        if (showError) setShowError(false);
        updateToken(response.data.access_token);
        setUserInfo({
          id: response.data.id,
          userRole: response.data.role,
          companyId: response.data.companyId,
          companyRole: response.data.companyRole,
          companyLogo: response.data.companyLogo,
        });
        removeToken();
        return IsAuthenticated() ? navigate('/dashboard', { replace: true }) : navigate('/login');
      }
    } catch (error: any) {
      console.log('Error in Login', error);
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('i18nextLng')!.length > 2) {
      i18next.changeLanguage('en');
    }
  }, []);

  return (
    <div className="login-container">
      <Row>
        <Col md={24} lg={15} flex="auto">
          <div className="login-img-container">
            <span>
              {t('login:carbon')} <br /> {t('login:credit')} <br />
              {t('login:management')}
            </span>
          </div>
        </Col>
        <Col md={24} lg={9} flex="auto">
          <Row>
            <Col lg={{ span: 18, offset: 4 }} md={{ span: 24 }} flex="auto">
              <Row>
                <Col lg={{ span: 9, offset: 15 }} md={{ span: 24 }} flex="auto">
                  <div className="login-country-logo">
                    <img src={countryLogo} alt="country-logo" />
                  </div>
                  <div className="login-country-name">
                    <span>{t('common:nigeria')}</span>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
          <Row>
            <Col lg={{ span: 18, offset: 3 }} md={24} flex="auto">
              <div className="login-text-contents">
                <span className="login-text-signin">
                  {t('common:login')} <br />
                  <span className="login-text-welcome">{t('login:welcome-back')}</span>
                </span>
              </div>
            </Col>
          </Row>
          <Row>
            <Col lg={{ span: 18, offset: 3 }} md={{ span: 18 }} flex="fill">
              <div className="login-input-fields">
                <Form
                  layout="vertical"
                  onFinish={onSubmit}
                  name="login-details"
                  requiredMark={false}
                >
                  <Form.Item
                    name="email"
                    label={`${t('common:email')}`}
                    validateTrigger={'onSubmit'}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator() {
                          if (
                            getFieldValue('email') &&
                            !getFieldValue('email')
                              ?.trim()
                              .match(
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                              )
                          ) {
                            return Promise.reject('Please enter a valid email');
                          }
                          return Promise.resolve();
                        },
                      }),
                      {
                        required: true,
                        message: 'Email cannot be empty',
                      },
                    ]}
                  >
                    <div className="login-input-email">
                      <Input type="username" />
                    </div>
                  </Form.Item>
                  <Form.Item
                    name="password"
                    validateTrigger={'onSubmit'}
                    label={`${t('common:pwd')}`}
                    rules={[
                      {
                        required: true,
                        message: 'Password cannot be empty',
                      },
                    ]}
                  >
                    <div className="login-input-password">
                      <Input.Password type="password" />
                    </div>
                  </Form.Item>
                  {showError && (
                    <div className="login-error-message-container">
                      <ExclamationCircleOutlined
                        style={{
                          color: 'rgba(255, 77, 79, 0.8)',
                          marginRight: '0.5rem',
                          fontSize: '1.1rem',
                        }}
                      />
                      <span className="login-error-message-txt">Invalid login credentials</span>
                    </div>
                  )}
                  <div className="login-forget-pwd-container">
                    <span className="login-forget-pwd-txt">{t('login:forgot-pwd')}?</span>
                  </div>
                  <Form.Item>
                    <div className="login-submit-btn-container">
                      <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                        {t('common:login')}
                      </Button>
                    </div>
                  </Form.Item>
                </Form>
                <div className="login-register-new-container">
                  <span className="login-register-new-txt">
                    {t('login:register-acc')}?&nbsp;&nbsp;
                    <span className="login-register-new-txt-span">{t('common:signUp')}</span>
                  </span>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <div className="login-language-selection-container">
              <span className="login-language-selection-txt">
                {t('common:language')} :
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
    </div>
  );
};

export default Login;
