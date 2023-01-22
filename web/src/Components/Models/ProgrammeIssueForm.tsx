import { LockOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Form, Input, Modal, Row } from 'antd';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addCommSep, Programme } from '../../Definitions/InterfacesAndType/programme.definitions';
import { creditUnit } from '../../Pages/Common/configs';

export interface ProgrammeIssueFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
}

const ProgrammeIssueForm: FC<ProgrammeIssueFormProps> = (props: ProgrammeIssueFormProps) => {
  const { programme, onFinish, onCancel, actionBtnText, subText } = props;
  const { i18n, t } = useTranslation(['view']);
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

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
        onChange={() => setPopupError(undefined)}
        onFinish={async (d) => {
          setLoading(true);
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        <Row>
          <Col lg={11} md={24}>
            <div className="label">
              {t('view:issueCreditText')}
              <br />
              {`(${creditUnit})`}
            </div>
          </Col>
          <Col lg={6} md={12}>
            <Form.Item
              className="popup-credit-input"
              name={'issueAmount'}
              rules={[
                {
                  pattern: new RegExp(/^[+]?([.]\d+|\d+[.]?\d*)$/g),
                  message: 'Credit Should be a positive number',
                },
                ({ getFieldValue }) => ({
                  validator(rule, value) {
                    if (
                      getFieldValue('issueAmount') &&
                      parseFloat(getFieldValue('issueAmount')) > programme.creditEst
                    ) {
                      // eslint-disable-next-line prefer-promise-reject-errors
                      return Promise.reject('> estimated');
                    }
                    return Promise.resolve();
                  },
                }),
              ]}
            >
              <Input placeholder="" />
            </Form.Item>
          </Col>
          <Col lg={1} md={1} className="seperator">
            {'/'}
          </Col>
          <Col lg={6} md={12}>
            <Form.Item className="popup-credit-input">
              <Input placeholder={addCommSep(programme.creditEst)} disabled />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Item
              className="remarks-label"
              label="Remarks"
              name="comment"
              // rules={[
              //   {
              //     required: true,
              //     message: 'Required field',
              //   },
              // ]}
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
          <Button className="mg-left-2" type="primary" htmlType="submit" loading={loading}>
            {actionBtnText}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ProgrammeIssueForm;
