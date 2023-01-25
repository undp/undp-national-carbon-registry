import { Alert, Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row, Select } from 'antd';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgrammeTransfer } from '../../Casl/entities/ProgrammeTransfer';
import { addCommSep } from '../../Definitions/InterfacesAndType/programme.definitions';
import { creditUnit } from '../../Pages/Common/configs';

export interface TransferActionModelProps {
  icon: any;
  title: string;
  transfer: ProgrammeTransfer;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  disableToCompany?: boolean;
  toCompanyDefault?: any;
  openModal: boolean;
  type: string;
}

const TransferActionModel: FC<TransferActionModelProps> = (props: TransferActionModelProps) => {
  const { transfer, onFinish, onCancel, actionBtnText, subText, openModal, title, icon, type } =
    props;
  const { i18n, t } = useTranslation(['view']);
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);

  const companyList = !transfer.isRetirement
    ? [
        {
          value: transfer.toCompanyId,
          label: transfer.receiver[0].name,
        },
      ]
    : [
        {
          value: transfer.fromCompanyId,
          label: transfer.sender[0].name,
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
            toCompanyId: !transfer.isRetirement ? transfer.toCompanyId : transfer.fromCompanyId,
            programmeName: transfer.programmeTitle,
            serialNo: transfer.serialNo,
            creditAmount: transfer.creditAmount,
          }}
          onChange={() => setPopupError(undefined)}
          onFinish={async (d) => {
            setLoading(true);
            const res = await onFinish(transfer.requestId, d.comment);
            setPopupError(res);
            setLoading(false);
          }}
        >
          <Row>
            <Col span={24}>
              <Form.Item
                className="remarks-label"
                label={t('view:from')}
                name="toCompanyId"
                rules={[
                  {
                    required: true,
                    message: 'Required field',
                  },
                ]}
              >
                <Select
                  showSearch
                  disabled={true}
                  placeholder={t('view:searchCompany')}
                  showArrow={true}
                  filterOption={false}
                  options={companyList}
                />
                {/* <Select
                showSearch
                disabled={disableToCompany}
                placeholder="Select a company"
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={companyList}
              /> */}
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
            <Col span={24}>
              <Form.Item className="remarks-label" label={t('view:serialNoField')} name="serialNo">
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Row>
            <Col lg={18} md={20}>
              <div className="label">{`${t('view:transferApproveTotal')} (${creditUnit})`}</div>
            </Col>
            <Col lg={6} md={4}>
              <Form.Item className="popup-credit-input">
                <InputNumber placeholder={addCommSep(transfer.creditAmount)} disabled />
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
          <Row>
            <Col span={24}>
              <Form.Item
                className="text-left"
                valuePropName="checked"
                label=""
                name="confirm"
                rules={[
                  {
                    required: true,
                    message: 'Required field',
                  },
                  ({ getFieldValue }) => ({
                    validator(rule, v) {
                      if (v === false) {
                        // eslint-disable-next-line prefer-promise-reject-errors
                        return Promise.reject('Required field');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Checkbox className="label">{t('view:confirmClosure')}</Checkbox>
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
    </Modal>
  );
};

export default TransferActionModel;
