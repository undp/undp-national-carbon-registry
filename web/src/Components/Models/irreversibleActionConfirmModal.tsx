import { Button, Checkbox, Form, Modal } from "antd";
import { FC, ReactNode, useEffect, useState } from "react";
import { CheckCircleOutlined } from "@ant-design/icons";

// Matches the confirm-before-an-irreversible-action modal used elsewhere
// in the app (transferActionModel / creditRetirementSlActionModel /
// investmentActionModel / creditActionModal) — same popup-header/icon
// layout, same "I understand that this action cannot be undone"
// checkbox (view:confirmClosure) gating the confirm button. Kept as its
// own small component rather than copy-pasting that ~40-line pattern a
// third time for Corresponding Adjustment's Submit/Finalize actions.
export interface IrreversibleActionConfirmModalProps {
  open: boolean;
  title: string;
  message?: ReactNode;
  confirmText: string;
  cancelText: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}

const IrreversibleActionConfirmModal: FC<IrreversibleActionConfirmModalProps> = ({
  open,
  title,
  message,
  confirmText,
  cancelText,
  loading,
  onConfirm,
  onCancel,
  t,
}) => {
  const [checked, setChecked] = useState(false);

  // Re-arm the checkbox every time the modal reopens, so an earlier
  // confirmation can't silently carry over to a different action.
  useEffect(() => {
    if (open) setChecked(false);
  }, [open]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">
            <CheckCircleOutlined />
          </div>
          <div>{title}</div>
        </div>
      }
      className="popup-primary"
      open={open}
      width={Math.min(430, window.innerWidth)}
      centered
      footer={null}
      onCancel={onCancel}
      destroyOnClose
    >
      {message && <p style={{ textAlign: "center" }}>{message}</p>}
      <Form layout="vertical" onFinish={onConfirm}>
        <Form.Item className="text-left" valuePropName="checked" name="confirm">
          <Checkbox onChange={(e) => setChecked(e.target.checked)}>
            {t("view:confirmClosure")}
          </Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, marginTop: 15 }}>
          <Button htmlType="button" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            className="mg-left-2"
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!checked}
          >
            {confirmText}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IrreversibleActionConfirmModal;
