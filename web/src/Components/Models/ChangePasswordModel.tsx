import { LockOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal } from 'antd';
import { FC } from 'react';
import './ChangePasswordModel.scss';

export interface ChangePasswordProps {
  onPasswordChanged: any;
  onCanceled: any;
  openModal: any;
  errorMsg: any;
}

const ChangePasswordModel: FC<ChangePasswordProps> = (props: ChangePasswordProps) => {
  const { onPasswordChanged, onCanceled, openModal, errorMsg } = props;

  return (
    <Modal
      open={openModal}
      width={Math.min(400, window.innerWidth)}
      centered={true}
      destroyOnClose={true}
      footer={null}
      onCancel={onCanceled}
    >
      <Form
        name="change_password"
        layout="vertical"
        className="login-form"
        onFinish={onPasswordChanged}
      >
        <Form.Item>
          <div>Change Password</div>
        </Form.Item>
        <Form.Item
          name="oldPassword"
          label="Old Password"
          rules={[{ required: true, message: 'Please input old Password!' }]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[{ required: true, message: 'Please input new Password!' }]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        <Form.Item
          name="confirm_password"
          label="Confirm New Password"
          dependencies={['newPassword']}
          rules={[
            {
              required: true,
              message: 'Please confirm your password!',
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('The two passwords that you entered do not match!')
                );
              },
            }),
          ]}
        >
          <Input.Password placeholder="" />
        </Form.Item>

        {errorMsg ? <Alert className="mg-top-1" message={errorMsg} type="error" showIcon /> : ''}

        <Form.Item className="mg-top-1">
          <Button className="mg-left-1" htmlType="button" onClick={onCanceled}>
            CANCEL
          </Button>
          <Button className="mg-left-1" type="primary" htmlType="submit">
            SET PASSWORD
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModel;
