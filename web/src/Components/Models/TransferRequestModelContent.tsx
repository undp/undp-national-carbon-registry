import { LockOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './ChangePasswordModel.scss';
import exclamationOctagon from '../../Assets/Images/exclamation-octagon.svg';
import { Programme } from '../../Definitions/InterfacesAndType/programme.definitions';

export interface TransferRequestModelContentProps {
  programme: Programme;
  onFinish: any;
  companyName: string;
  companyId: string;
}

const TransferRequestModelContent: FC<TransferRequestModelContentProps> = (
  props: TransferRequestModelContentProps
) => {
  const { programme, companyName, companyId, onFinish } = props;
  const { i18n, t } = useTranslation(['view']);

  return (
    <Form
      name="transfer_init_popup"
      layout="vertical"
      className="transfer-form"
      onFinish={onFinish}
    >
      {/* <Form.Item
          className="mg-top-1"
          name="By"
          label={t('view:by')}
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

        {errorMsg ? <Alert className="mg-top-1" message={errorMsg} type="error" showIcon /> : ''}

        <Form.Item className="mg-top-2">
          <Button htmlType="button" onClick={onCanceled}>
            {t('passwordReset:cancel')}
          </Button>
          <Button className="mg-left-3" type="primary" htmlType="submit">
            {t('passwordReset:setPassword')}
          </Button>
        </Form.Item> */}
    </Form>
  );
};

export default TransferRequestModelContent;
