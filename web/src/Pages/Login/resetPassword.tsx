import React, { FC, useContext, useEffect, useState } from 'react';
import './login.scss';
import { Button, Col, Form, Input, Row, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

export interface ResetPasswordPageProps {
  forgotPassword?: boolean;
}

const ResetPassword: FC<ResetPasswordPageProps> = (props: ResetPasswordPageProps) => {
  const { i18n, t } = useTranslation(['common', 'resetPassword']);
  const [resetPasswordForm] = Form.useForm();
  const { put } = useConnection();
  const navigate = useNavigate();
  const { requestid } = useParams();
  const queryParameters = new URLSearchParams(window.location.search);
  const [loading, setLoading] = useState<boolean>(false);
  const [disable, setDisable] = useState<boolean>(false);
  //   const requestid = queryParameters.get('requestid');

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);
      const response: any = await put(`national/auth/resetPassword?requestId=${requestid}`, {
        newPassword: values.password,
      });
      if (response.status === 200 || response.status === 201) {
        message.open({
          type: 'success',
          content: response.message,
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
        navigate('/login');
      } else {
        message.open({
          type: 'error',
          content: response.message,
          duration: 3,
          style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
        });
      }
    } catch (exception: any) {
      console.log('error while resetting password -- ', exception);
      message.open({
        type: 'error',
        content: exception?.message || 'Something went wrong',
        duration: 3,
        style: { textAlign: 'right', marginRight: 15, marginTop: 10 },
      });
    } finally {
      setLoading(false);
    }
  };

  const checkResetPasswordReqId = async () => {
    setDisable(true);
    try {
      const response: any = await put(`national/auth/checkResetRequestId?requestId=${requestid}`);
      if (response.status !== 200 || response.status !== 201) {
        navigate('/login');
      } else if (response.status === 200 || response.status === 201) {
        setDisable(false);
      }
    } catch (exception: any) {
      navigate('/login');
    } finally {
    }
  };

  useEffect(() => {
    checkResetPasswordReqId();
  }, []);

  return (
    <div className="reset-password-container">
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={24} flex="auto">
          <div className="login-text-contents">
            <span className="login-text-signin">{t('resetPassword:reset-pwd-title')}</span>
          </div>
        </Col>
      </Row>
      <Row>
        <Col lg={{ span: 18, offset: 3 }} md={{ span: 18 }} flex="fill">
          <div className="login-input-fields">
            <Form
              form={resetPasswordForm}
              layout="vertical"
              onFinish={onSubmit}
              name="login-details"
              requiredMark={false}
            >
              <Form.Item
                name="password"
                label={`${t('resetPassword:newPwd')}`}
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`New password ${t('common:isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <div className="login-input-password">
                  <Input.Password type="password" />
                </div>
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label={`${t('resetPassword:confirmNewPwd')}`}
                rules={[
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === '' ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(`Confirm New Password ${t('common:isRequired')}`);
                      } else {
                        const val = value.trim();
                        const password = resetPasswordForm.getFieldValue('password');
                        if (password.trim() !== val) {
                          throw new Error(`${t('resetPassword:passwordNotMatch')}`);
                        }
                      }
                    },
                  },
                  {
                    required: true,
                    message: '',
                  },
                ]}
              >
                <div className="login-input-password">
                  <Input.Password type="password" />
                </div>
              </Form.Item>
              <Form.Item>
                <div className="login-submit-btn-container">
                  <Button
                    disabled={disable}
                    type="primary"
                    size="large"
                    htmlType="submit"
                    block
                    loading={loading}
                  >
                    SUMBIT
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ResetPassword;
