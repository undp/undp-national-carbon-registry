import React, { FC, Suspense, useContext, useEffect, useState } from 'react';
import './login.scss';
import { Button, Col, Form, Input, Row, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { userForgotPasswordProps } from '../../Definitions/InterfacesAndType/userForgotPassword.definitions';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import i18next from 'i18next';

const ForgotPassword = () => {
  const { post } = useConnection();
  const { i18n, t } = useTranslation(['common', 'forgotPassword']);
  const [loading, setLoading] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  const onSubmit = async (values: userForgotPasswordProps) => {
    setLoading(true);
    try {
      const email = values.email.trim();
      const response = await post('national/auth/forgotPassword', {
        email: email.trim(),
      });

      if (response.status === 200 || response.status === 201) {
        setEmailSent(true);
      }
    } catch (error: any) {
      console.log('Error in sending resetting password', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={24} flex="auto">
          <div className="login-text-contents">
            <span className="login-text-signin">{t('forgotPassword:forgot-pwd-title')}</span>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 18 }} flex="fill">
          <div className="forgot-input-fields-container login-input-fields">
            <Form layout="vertical" onFinish={onSubmit} name="login-details" requiredMark={false}>
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
                        return Promise.reject(`${t('common:email')} ${t('common:isInvalid')}`);
                      }
                      return Promise.resolve();
                    },
                  }),
                  {
                    required: true,
                    message: `${t('common:email')} ${t('common:isRequired')}`,
                  },
                ]}
              >
                <div className="login-input-email">
                  <Input type="username" />
                </div>
              </Form.Item>
              <Form.Item>
                <div className="forgot-submit-btn-container">
                  <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                    {t('forgotPassword:submit')}
                  </Button>
                </div>
                {emailSent && (
                  <div className="email-success-msg">{t('forgotPassword:emailSent')}</div>
                )}
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={24} flex="auto">
          <div className="note-container">
            <div className="note">
              <p>{t('forgotPassword:note-1')}</p>
              <p>{t('forgotPassword:note-2')}</p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;
