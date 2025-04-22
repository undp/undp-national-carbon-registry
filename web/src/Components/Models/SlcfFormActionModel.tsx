import { Alert, Button, Checkbox, Col, Form, Input, Modal, Row } from 'antd';
import { FC, useEffect, useState } from 'react';
import './Models.scss';

export interface SlcfFormActionModelProps {
  icon: any;
  title: string;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText?: string | null;
  openModal: boolean;
  checkMessage?: string | null;
  type: string;
  remarkRequired: boolean;
  t: any;
}

export const SlcfFormActionModel: FC<SlcfFormActionModelProps> = (
  props: SlcfFormActionModelProps
) => {
  const {
    onFinish,
    onCancel,
    actionBtnText,
    subText,
    openModal,
    title,
    icon,
    type,
    remarkRequired,
    checkMessage,
    t,
  } = props;
  // const t = translator;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

  console.log('------------checkMessage----------', checkMessage);
  // Reset the `checked` state whenever the modal opens
  useEffect(() => {
    if (openModal) {
      setChecked(false);
    }
  }, [openModal]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
          {subText && <p className="model-subText">{subText}</p>}
        </div>
      }
      className={'popup-' + type}
      open={openModal}
      width={Math.min(430, window.innerWidth)}
      centered={true}
      footer={null}
      onCancel={onCancel}
      destroyOnClose={true}
    >
      <div className="transfer-form" style={{ display: 'flex', justifyContent: 'center' }}>
        <Form
          name="slcf_form_action_popup"
          layout="vertical"
          onChange={() => setPopupError(undefined)}
          onFinish={async (d) => {
            setLoading(true);
            if (d.comment) {
              d.comment = d.comment.trim();
            }
            const res = await onFinish(d.comment);
            setPopupError(res);
            setLoading(false);
          }}
        >
          {remarkRequired && (
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label="Remarks"
                  name="comment"
                  rules={[
                    {
                      required: remarkRequired,
                      message: 'Required!',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, v) {
                        if (remarkRequired && v !== undefined && v !== '' && v.trim() === '') {
                          // eslint-disable-next-line prefer-promise-reject-errors
                          return Promise.reject('Required!');
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.TextArea placeholder="" />
                </Form.Item>
              </Col>
            </Row>
          )}
          <Row>
            <Col span={24}>
              <Form.Item className="text-left" valuePropName="checked" label="" name="confirm">
                <Checkbox className="label" onChange={(v) => setChecked(v.target.checked)}>
                  {checkMessage ? checkMessage : t('view:confirmClosure')}
                </Checkbox>
              </Form.Item>
            </Col>
          </Row>

          {popupError ? <Alert className="error" message={popupError} type="error" showIcon /> : ''}

          <Form.Item className="footer">
            <Button htmlType="button" onClick={onCancel}>
              {t('view:cancel')}
            </Button>
            <Button
              className="mg-left-2"
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!checked}
            >
              {actionBtnText}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};
