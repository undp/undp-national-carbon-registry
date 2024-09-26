import { Alert, Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row, Select } from 'antd';
import { FC, useState } from 'react';

export interface InvestmentActionModelProps {
  icon: any;
  title: string;
  investment: any;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  disableToCompany?: boolean;
  toCompanyDefault?: any;
  openModal: boolean;
  type: string;
  remarkRequired: boolean;
  translator: any;
}

const InvestmentActionModel: FC<InvestmentActionModelProps> = (
  props: InvestmentActionModelProps
) => {
  const {
    investment,
    onFinish,
    onCancel,
    actionBtnText,
    subText,
    openModal,
    title,
    icon,
    type,
    remarkRequired,
    translator,
  } = props;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const t = translator.t;

  const companyList = !investment.isRetirement
    ? [
        {
          value: investment.toCompanyId,
          label: investment.receiver[0].name,
        },
      ]
    : [
        {
          value: investment.fromCompanyId,
          label: investment.sender[0].name,
        },
      ];
  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
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
      <div className="transfer-form">
        <Form
          name="transfer_init_popup"
          layout="vertical"
          initialValues={{
            toCompanyId: !investment.isRetirement
              ? investment.toCompanyId
              : investment.fromCompanyId,
            programmeName: investment.programmeTitle,
            serialNo: investment.serialNo,
            creditAmount: investment.creditAmount,
            company: investment.toCompanyMeta ? investment.toCompanyMeta.name : null,
            country: investment.toCompanyMeta ? investment.toCompanyMeta.country : null,
            countryName: investment.toCompanyMeta ? investment.toCompanyMeta.countryName : null,
          }}
          onChange={() => setPopupError(undefined)}
          onFinish={async (d) => {
            setLoading(true);
            if (d.comment) {
              d.comment = d.comment.trim();
            }
            const res = await onFinish(investment.requestId, d.comment);
            setPopupError(res);
            setLoading(false);
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item className="remarks-label" label={t('view:from')} name="toCompanyId">
                <Select
                  showSearch
                  disabled={true}
                  placeholder={t('view:searchCompany')}
                  showArrow={true}
                  filterOption={false}
                  options={companyList}
                />
                {}
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item className="remarks-label" label={t('view:programme')} name="programmeName">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col lg={18} md={20}>
              <div className="label">{`${t('view:ownershipPercentage')}`}</div>
            </Col>
            <Col lg={6} md={4}>
              <Form.Item className="popup-credit-input">
                <InputNumber placeholder={investment.percentage + '%'} disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Item
                className="remarks-label"
                label="Remarks"
                name="comment"
                rules={[
                  {
                    required: remarkRequired,
                    message: 'Required field',
                  },
                  ({ getFieldValue }) => ({
                    validator(rule, v) {
                      if (remarkRequired && v !== undefined && v !== '' && v.trim() === '') {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        return Promise.reject('Required field');
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
          <Row>
            <Col span={24}>
              <Form.Item className="text-left" valuePropName="checked" label="" name="confirm">
                <Checkbox className="label" onChange={(v) => setChecked(v.target.checked)}>
                  {t('view:confirmClosure')}
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

export default InvestmentActionModel;
