import React, { FC, useContext, useEffect, useState } from 'react';
import './login.scss';
import { Button, Col, Form, Input, Row } from 'antd';
import { useTranslation } from 'react-i18next';
import { userForgotPasswordProps } from '../../Definitions/InterfacesAndType/userForgotPassword.definitions';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import i18next from 'i18next';

const ForgotPassword = () => {
  const { post } = useConnection();
  const [loading, setLoading] = useState<boolean>(false);

  const onSubmit = async (values: userForgotPasswordProps) => {
    setLoading(true);
    try {
      const email = values.email.trim();
      const response = await post('national/auth/forgotPassword', {
        email: email.trim(),
      });

      if (response.status === 200 || response.status === 201) {
        console.log('response forgot password --- > ', response);
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
            <span className="login-text-signin">
              Forgot Your Password? <br />
              <span className="login-text-welcome">
                Please enter the email used to sign into the Carbon Registry
              </span>
            </span>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 18 }} flex="fill">
          <div className="login-input-fields">
            <Form layout="vertical" onFinish={onSubmit} name="login-details" requiredMark={false}>
              <Form.Item
                name="email"
                label="Email"
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
              <Form.Item>
                <div className="login-submit-btn-container">
                  <Button type="primary" size="large" htmlType="submit" block loading={loading}>
                    SUBMIT
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={24} flex="auto">
          <div className="note-container">
            <div className="label">Note:</div>
            <div className="note">
              <p>
                We will email you instructions for setting your password if an account exists with
                the email you entered.
              </p>
              <p>
                If you don’t receive an email, please make sure you have entered the address
                connected to the Carbon Registry account and check your spam folder.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ForgotPassword;
