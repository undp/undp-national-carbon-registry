import { LockOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  SelectProps,
} from 'antd';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { addCommSep, Programme } from '../../Definitions/InterfacesAndType/programme.definitions';
import { creditUnit } from '../../Pages/Common/configs';

export interface ProgrammeTransferFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  disableToCompany?: boolean;
  toCompanyDefault?: any;
  receiverLabelText: string;
}

const ProgrammeTransferForm: FC<ProgrammeTransferFormProps> = (
  props: ProgrammeTransferFormProps
) => {
  const {
    programme,
    onFinish,
    onCancel,
    actionBtnText,
    subText,
    toCompanyDefault,
    disableToCompany,
    receiverLabelText,
  } = props;
  const { i18n, t } = useTranslation(['view']);
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [companyList, setCompanyList] = useState<SelectProps['options']>([]);
  const [value, setValue] = useState<string>();
  const { get, delete: del, post } = useConnection();

  if (!programme.creditOwnerPercentage && programme.companyId.length === 1) {
    programme.creditOwnerPercentage = [100];
  }

  const handleSearch = async (newValue: string) => {
    if (newValue) {
      const resp = await post('national/organisation/queryNames', {
        page: 1,
        size: 50,
        filterAnd: {
          key: 'name',
          operation: 'like',
          value: newValue + '%',
        },
        sort: {
          key: 'name',
          order: 'ASC',
        },
      });
      setCompanyList(resp.data);
    } else {
      setCompanyList([]);
    }
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  return (
    <div className="transfer-form">
      {/* <Row>
        <Col span={24} className="sub-text">
          {subText}
        </Col>
      </Row> */}
      <Form
        name="transfer_init_popup"
        layout="vertical"
        initialValues={{ toCompanyId: toCompanyDefault.value }}
        onChange={() => setPopupError(undefined)}
        onValuesChange={(v, allVal) => {
          setCurrentSum(
            allVal.companyCredit.reduce((a: any, b: any) => (a ? a : 0) + (b ? b : 0), 0)
          );
        }}
        onFinish={async (d) => {
          setLoading(true);
          d.fromCompanyIds = programme.companyId.map((e: any) => parseInt(e));
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        <Row>
          <Col span={24}>
            <Form.Item
              className="remarks-label"
              label={receiverLabelText}
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
                disabled={disableToCompany}
                placeholder={t('view:searchCompany')}
                showArrow={true}
                filterOption={false}
                onSearch={handleSearch}
                onChange={handleChange}
                notFoundContent={null}
                options={(companyList || []).map((d) => ({
                  value: d.value,
                  label: d.text,
                }))}
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
            <Form.Item className="remarks-label" label={t('view:programme')} name="programme">
              <Input placeholder={programme.title} disabled />
            </Form.Item>
          </Col>
        </Row>
        {programme.creditOwnerPercentage.map((pert, index) => {
          const companyAvailableTotal =
            ((programme.creditBalance -
              (programme.creditFrozen ? programme.creditFrozen[index] : 0)) *
              pert) /
            100;
          return (
            <Row>
              <Col lg={11} md={24}>
                <div className="label">{programme.company[index].name}</div>
              </Col>
              <Col lg={6} md={12}>
                <Form.Item
                  className="popup-credit-input"
                  name={['companyCredit', index]}
                  rules={[
                    {
                      pattern: new RegExp(/^[+]?([.]\d+|\d+[.]?\d*)$/g),
                      message: 'Credit Should be a positive number',
                    },
                    ({ getFieldValue }) => ({
                      validator(rule, v) {
                        if (
                          getFieldValue(['companyCredit', index]) &&
                          parseFloat(getFieldValue(['companyCredit', index])) >
                            companyAvailableTotal
                        ) {
                          // eslint-disable-next-line prefer-promise-reject-errors
                          return Promise.reject('> estimated');
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber placeholder="" controls={false} />
                </Form.Item>
              </Col>
              <Col lg={1} md={1} className="seperator">
                {'/'}
              </Col>
              <Col lg={6} md={12}>
                <Form.Item className="popup-credit-input">
                  <Input placeholder={addCommSep(companyAvailableTotal)} disabled />
                </Form.Item>
              </Col>
            </Row>
          );
        })}
        {programme.creditOwnerPercentage.length > 1 && (
          <Row>
            <Col lg={11} md={24}>
              <div className="label">{`${t('view:totalTransferCredit')} (${creditUnit})`}</div>
            </Col>
            <Col lg={6} md={12}>
              <Form.Item className="popup-credit-input">
                <Input placeholder={addCommSep(currentSum)} disabled />
              </Form.Item>
            </Col>
            <Col lg={1} md={1} className="seperator">
              {'/'}
            </Col>
            <Col lg={6} md={12}>
              <Form.Item className="popup-credit-input">
                <Input placeholder={addCommSep(programme.creditBalance)} disabled />
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

export default ProgrammeTransferForm;
