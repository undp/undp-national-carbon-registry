import { Alert, Form, Modal, Button, Input } from 'antd';
import React, { FC, useEffect, useState } from 'react';
import '../../Styles/app.scss';
const { TextArea } = Input;

export interface RejectDocumentationProps {
  actionInfo: any;
  onActionConfirmed: any;
  onActionCanceled: any;
  openModal: any;
  errorMsg: any;
  loading: any;
  translator: any;
}

export const RejectDocumentationConfirmationModel: FC<RejectDocumentationProps> = (
  props: RejectDocumentationProps
) => {
  const {
    actionInfo,
    onActionConfirmed,
    onActionCanceled,
    openModal,
    errorMsg,
    loading,
    translator,
  } = props;

  const t = translator.t;
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
          onActionConfirmed(comment);
        }}
      >
        <Form.Item
          className="mg-bottom-0"
          label={t('programme:remarks')}
          name="remarks"
          rules={[
            {
              required: true,
              message: `${t('programme:remarks')}` + ' ' + `${t('common:isRequired')}`,
            },
          ]}
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
            CANCEL
          </Button>
          <Button
            className="mg-left-2"
            type="primary"
            danger
            htmlType="submit"
            loading={loading}
            disabled={actionInfo.type === 'reject' && comment === ''}
          >
            REJECT
          </Button>
        </div>
      </Form>
    </Modal>
  );
};
