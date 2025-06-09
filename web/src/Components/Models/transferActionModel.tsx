import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Tooltip,
} from 'antd';
import { FC, useState } from 'react';
import { creditUnit } from '../../Definitions/Definitions/common.definitions';
import { InfoCircle } from 'react-bootstrap-icons';
import { ProgrammeTransfer } from '../../Definitions/Entities/programmeTransfer';
import { addCommSep } from '../../Definitions/Definitions/programme.definitions';
import { RetireType } from '../../Definitions/Enums/retireType.enum';

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
  remarkRequired: boolean;
  translator: any;
}

export const TransferActionModel: FC<TransferActionModelProps> = (
  props: TransferActionModelProps
) => {
  const {
    transfer,
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
  const t = translator.t;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);

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
            company: transfer.toCompanyMeta ? transfer.toCompanyMeta.name : null,
            country: transfer.toCompanyMeta ? transfer.toCompanyMeta.country : null,
            countryName: transfer.toCompanyMeta ? transfer.toCompanyMeta.countryName : null,
          }}
          onChange={() => setPopupError(undefined)}
          onFinish={async (d) => {
            setLoading(true);
            if (d.comment) {
              d.comment = d.comment.trim();
            }
            const res = await onFinish(transfer.requestId, d.comment);
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
          {!transfer.isRetirement && (
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('view:serialNoField')}
                  name="serialNo"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          )}
          {transfer.toCompanyMeta && transfer.toCompanyMeta.country && (
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('creditTransfer:country')}
                  name="countryName"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          )}
          {transfer.toCompanyMeta && transfer.toCompanyMeta.name && (
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('creditTransfer:company')}
                  name="company"
                >
                  <Input disabled />
                </Form.Item>
              </Col>
            </Row>
          )}
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
          {transfer.retirementType === RetireType.CROSS_BORDER && (
            <Row>
              <Col lg={18} md={20}>
                <div className="label">{`${t('view:govInternationalAcc')}`}</div>
              </Col>
              <Col lg={6} md={4}>
                <Form.Item className="popup-credit-input">
                  <InputNumber
                    placeholder={
                      transfer.creditAmount
                        ? addCommSep(
                            transfer.creditAmount -
                              Number(
                                ((transfer.omgePercentage * transfer.creditAmount) / 100).toFixed(2)
                              )
                          )
                        : `-`
                    }
                    disabled
                  />
                </Form.Item>
              </Col>
            </Row>
          )}
          {transfer.retirementType === RetireType.CROSS_BORDER && (
            <Row>
              <Col lg={18} md={20} style={{ display: 'flex' }}>
                <div className="label">{`${t('view:omgeAcc')}`}</div>
                <div className="info-container">
                  <Tooltip
                    arrowPointAtCenter
                    placement="topLeft"
                    trigger="hover"
                    title={t('view:omgeDesc')}
                    overlayClassName="custom-tooltip"
                  >
                    <InfoCircle color="#000000" size={15} />
                  </Tooltip>
                </div>
              </Col>
              <Col lg={6} md={4}>
                <Form.Item className="popup-credit-input">
                  <InputNumber
                    placeholder={
                      transfer.creditAmount
                        ? addCommSep(
                            Number(
                              ((transfer.omgePercentage * transfer.creditAmount) / 100).toFixed(2)
                            )
                          )
                        : `-`
                    }
                    disabled
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
              <Form.Item
                className="text-left"
                valuePropName="checked"
                label=""
                name="confirm"
                // rules={[
                //   {
                //     required: true,
                //     message: 'Required field',
                //   },
                //   ({ getFieldValue }) => ({
                //     validator(rule, v) {
                //       if (v === false) {
                //         // eslint-disable-next-line prefer-promise-reject-errors
                //         return Promise.reject('Required field');
                //       }
                //       return Promise.resolve();
                //     },
                //   }),
                // ]}
              >
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
