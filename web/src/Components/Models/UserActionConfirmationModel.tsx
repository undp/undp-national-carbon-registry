import { Alert, Form, Modal, Button } from 'antd';
import { FC, useEffect, useState } from 'react';
import TextArea from 'antd/lib/input/TextArea';
import { useTranslation } from 'react-i18next';

export interface UserActionProps {
  actionInfo: any;
  onActionConfirmed: any;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
  loading: any;
}

const UserActionConfirmationModel: FC<UserActionProps> = (props: UserActionProps) => {
  const { actionInfo, onActionConfirmed, onActionCanceled, openModal, errorMsg, loading } = props;
  const [comment, setComment] = useState<any>('');
  const { i18n, t } = useTranslation(['userProfile']);

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
      destroyOnClose={true}
      footer={null}
    >
      <p style={{ whiteSpace: 'pre-line' }}>{actionInfo.text}</p>
      <Form
        layout="vertical"
        onFinish={() => {
          onActionConfirmed(comment);
        }}
      >
        <Form.Item
          className="mg-bottom-0"
          label={t('userProfile:remarks')}
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

export default UserActionConfirmationModel;
