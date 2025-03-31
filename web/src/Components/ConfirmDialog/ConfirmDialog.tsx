import { Button, Checkbox, Form, Modal } from 'antd';
import React, { useState } from 'react';
import './ConfirmDialog.scss';

interface IConfirmDialog {
  showDialog: boolean;
  Icon: any;
  message: string;
  subMessage?: string;
  showCheckbox?: string;
  checkboxText?: string;
  okText: string;
  cancelText: string;
  okAction?: (remarks?: string) => void;
  closeDialog: () => void;
  isReject: boolean; // if true modal is a reject action modal
  getRemarks?: boolean;
}
const ConfirmDialog = (props: IConfirmDialog) => {
  const {
    showDialog,
    Icon,
    message,
    subMessage,
    showCheckbox,
    checkboxText,
    okText,
    cancelText,
    okAction,
    closeDialog,
    isReject,
    getRemarks,
  } = props;

  const [allowOk, setAllowOk] = useState<boolean>();

  return (
    <Modal
      open={showDialog}
      title={null}
      footer={null}
      className="dialog-box"
      onCancel={closeDialog}
    >
      <div>
        <Icon className="icon" />
      </div>
      <h4 className="message">{message}</h4>
      {subMessage && !getRemarks && <p className="subMessage">{subMessage}</p>}

      {showCheckbox && (
        <div>
          <Checkbox />
          <p></p>
        </div>
      )}
      <div className="modal-actions">
        <Button onClick={closeDialog} color="#3A354180">
          {cancelText}
        </Button>

        <Button
          danger={isReject}
          type={'primary'}
          onClick={() => {
            if (okAction) {
              okAction();
            }

            closeDialog();
          }}
        >
          {okText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
