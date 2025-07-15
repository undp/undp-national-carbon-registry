// import React from 'react';
import { Alert, Form, Modal, Button, Input } from 'antd';
import { FC, useEffect, useState } from 'react';
import '../../Styles/app.scss';
import { GHGRecordState } from '../../Definitions/Enums/ghg.record.state.enum';
const { TextArea } = Input;

export interface UserActionProps {
  t: any;
  actionInfo: any;
  onActionConfirmed: any;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
  loading: any;
}

const GHGUserActionConfirmationModel: FC<UserActionProps> = (props: UserActionProps) => {
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
          const status =
            actionInfo.action === 'submit' ? GHGRecordState.SAVED : GHGRecordState.FINALIZED;
          onActionConfirmed(comment, status);
        }}
      >
        <Form.Item
          className="mg-bottom-0"
          label={t('ghgInventory:remarks')}
          name="remarks"
          required={actionInfo.type === 'danger'}
        >
          <TextArea defaultValue={comment} rows={2} onChange={(v) => setComment(v.target.value)} />
        </Form.Item>

        {errorMsg ? <Alert className="mg-top-1" message={errorMsg} type="error" showIcon /> : ''}

        <div className="mg-top-1 ant-modal-footer padding-bottom-0">
          <Button
            htmlType="button"
            onClick={() => {
              onActionCanceled();
            }}
          >
            {t('userProfile:cancel')}
          </Button>
          <Button
            className="mg-left-2"
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={actionInfo.type === 'danger' && comment === ''}
          >
            {actionInfo.action}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default GHGUserActionConfirmationModel;
