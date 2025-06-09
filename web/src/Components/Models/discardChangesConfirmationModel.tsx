// import React from 'react';
import { Alert, Form, Modal, Button, Input } from 'antd';
import { FC, useEffect, useState } from 'react';
import '../../Styles/app.scss';
const { TextArea } = Input;

export interface DiscardChangesProps {
  t: any;
  actionInfo: any;
  onActionConfirmed: any;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
  loading: any;
}

const DiscardChangesConfirmationModel: FC<DiscardChangesProps> = (props: DiscardChangesProps) => {
  const { t, actionInfo, onActionConfirmed, onActionCanceled, openModal, errorMsg, loading } =
    props;
  const [comment, setComment] = useState<any>('');

  useEffect(() => {
    setComment('');
  }, [openModal]);

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
      width={Math.min(400, window.innerWidth)}
      centered={true}
      onCancel={onActionCanceled}
      destroyOnClose={true}
      footer={null}
    >
      <p style={{ whiteSpace: 'pre-line' }}>{actionInfo.text}</p>
      <Form
        layout="vertical"
        onFinish={() => {
          onActionConfirmed();
        }}
      >
        <div className="mg-top-1 ant-modal-footer padding-bottom-0">
          <Button
            htmlType="button"
            onClick={() => {
              onActionCanceled();
            }}
          >
            {t('userProfile:cancel')}
          </Button>
          <Button className="mg-left-2" type="primary" htmlType="submit" loading={loading}>
            {actionInfo.action}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default DiscardChangesConfirmationModel;
