import { Alert, Button, Col, Form, Input, InputNumber, Modal, Row, Select } from 'antd';
import React, { FC, useState, useEffect } from 'react';
import { Programme } from '../../Definitions/Definitions/programme.definitions';

export interface ProgrammeRevokeFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  showCertifiers: boolean;
  translator: any;
}

export const ProgrammeRevokeForm: FC<ProgrammeRevokeFormProps> = (
  props: ProgrammeRevokeFormProps
) => {
  const { programme, onFinish, onCancel, actionBtnText, subText, showCertifiers, translator } =
    props;
  const t = translator.t;
  const [form] = Form.useForm();
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [remarks, setRemarks] = useState<boolean>(false);

  const onRemarkValues = async () => {
    const comment = form.getFieldValue('comment');
    if (comment === undefined || comment === '') {
      setRemarks(false);
    } else {
      setRemarks(true);
    }
  };

  useEffect(() => {
    onRemarkValues();
  });

  return (
    <div className="transfer-form">
      <Row>
        <Col span={24} className="sub-text">
          {subText}
        </Col>
      </Row>
      <Form
        name="transfer_init_popup"
        layout="vertical"
        initialValues={{
          certifierId:
            programme.certifierId && programme.certifierId.length === 1
              ? Number(programme.certifierId[0])
              : undefined,
        }}
        onChange={() => setPopupError(undefined)}
        onValuesChange={onRemarkValues}
        form={form}
        onFinish={async (d) => {
          setLoading(true);
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        {showCertifiers && (
          <Row>
            <Col span={24}>
              <Form.Item
                className="remarks-label"
                label={t('view:certifier')}
                name="certifierId"
                rules={[
                  {
                    required: true,
                    message: 'Required field',
                  },
                ]}
              >
                <Select
                  disabled={!programme.certifierId || programme.certifierId.length <= 1}
                  showArrow={true}
                  filterOption={false}
                  defaultActiveFirstOption={true}
                  options={programme.certifier.map((c) => ({
                    label: c.name,
                    value: c.companyId,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        )}
        <Row>
          <Col span={24}>
            <Form.Item
              className="remarks-label"
              label="Remarks"
              name="comment"
              rules={[
                {
                  required: true,
                  message: 'Required field',
                },
              ]}
            >
              <Input.TextArea placeholder="" />
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
            disabled={!remarks}
          >
            {actionBtnText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
