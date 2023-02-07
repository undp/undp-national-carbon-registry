import { Alert, Form, Modal } from 'antd';
import React, { FC, useState } from 'react';
import TextArea from 'antd/lib/input/TextArea';
import { useTranslation } from 'react-i18next';

export interface UserActionProps {
  actionInfo: any;
  onActionConfirmed: any;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
}

const UserActionConfirmationModel: FC<UserActionProps> = (props: UserActionProps) => {
  const { actionInfo, onActionConfirmed, onActionCanceled, openModal, errorMsg } = props;
  const [comment, setComment] = useState<any>('');
  const { i18n, t } = useTranslation(['userProfile']);
  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{actionInfo.icon}</div>
          <div>{actionInfo.headerText}</div>
        </div>
      }
      className={'popup-' + actionInfo.type}
      open={openModal}
      onOk={() => {
        onActionConfirmed(comment);
        setComment('');
      }}
      onCancel={() => {
        onActionCanceled();
        setComment('');
      }}
      okText={actionInfo.action}
      okButtonProps={{ disabled: comment === '' }}
      cancelText={t('userProfile:cancel')}
      width={Math.min(400, window.innerWidth)}
      centered={true}
      destroyOnClose={true}
    >
      <p style={{ whiteSpace: 'pre-line' }}>{actionInfo.text}</p>
      <Form layout="vertical">
        <Form.Item
          className="mg-bottom-0"
          label={t('userProfile:remarks')}
          name="remarks"
          required={true}
        >
          <TextArea defaultValue={comment} rows={2} onChange={(v) => setComment(v.target.value)} />
        </Form.Item>
      </Form>
      {errorMsg ? <Alert className="mg-top-1" message={errorMsg} type="error" showIcon /> : ''}
    </Modal>
  );
};

export default UserActionConfirmationModel;
