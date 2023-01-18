import { ExclamationCircleOutlined, LockOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './ChangePasswordModel.scss';
import exclamationOctagon from '../../Assets/Images/exclamation-octagon.svg';

export interface ChangePasswordProps {
  onPasswordChanged: any;
  onFieldsChanged: any;
  onCanceled: any;
  openModal: any;
  errorMsg: any;
}

const ChangePasswordModel: FC<ChangePasswordProps> = (props: ChangePasswordProps) => {
  const { onPasswordChanged, onFieldsChanged, onCanceled, openModal, errorMsg } = props;
  const { i18n, t } = useTranslation(['passwordReset']);

  return (
    <Modal
      width={548}
      title={
        <div className="popup-header">
          <div className="icon">
            <img src={exclamationOctagon}></img>
          </div>
          <div>{t('passwordReset:changePassword')}</div>
        </div>
      }
      open={openModal}
      className={'popup-success password-reset-model'}
      centered={true}
      destroyOnClose={true}
      footer={null}
      onCancel={onCanceled}
    >
      <Form
        name="change_password"
        layout="vertical"
        className="login-form"
        onFieldsChange={onFieldsChanged}
        onFinish={onPasswordChanged}
      >
        <Form.Item
          className="mg-top-1"
          name="oldPassword"
          label={t('passwordReset:oldPassword')}
          rules={[
            {
              required: true,
              message: `${t('passwordReset:oldPassword')} ${t('passwordReset:isRequired')}`,
            },
          ]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label={t('passwordReset:newPassword')}
          rules={[
            {
              required: true,
              message: `${t('passwordReset:newPassword')} ${t('passwordReset:isRequired')}`,
            },
          ]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label={t('passwordReset:confirmNewPassword')}
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: `${t('passwordReset:confirmNewPassword')} ${t('passwordReset:isRequired')}`,
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(t('passwordReset:passwordsNotMatchedErr').toString())
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        {errorMsg && (
          <div className="error-message-container">
            <ExclamationCircleOutlined
              style={{
                color: 'rgba(255, 77, 79, 0.8)',
                marginRight: '0.5rem',
                fontSize: '1.1rem',
              }}
            />
            <span className="error-message-txt">{errorMsg}</span>
          </div>
        )}

        <Form.Item className="mg-top-2">
          <Button htmlType="button" onClick={onCanceled}>
            {t('passwordReset:cancel')}
          </Button>
          <Button className="mg-left-3" type="primary" htmlType="submit">
            {t('passwordReset:setPassword')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModel;
