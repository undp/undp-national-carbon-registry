import { LockOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Select,
  SelectProps,
  Space,
} from 'antd';
import { FC, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { CompanyState } from '../../Definitions/InterfacesAndType/companyManagement.definitions';
import { addCommSep, Programme } from '../../Definitions/InterfacesAndType/programme.definitions';
import { creditUnit } from '../../Pages/Common/configs';

export interface ProgrammeRetireFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText?: string;
  hideType: boolean;
  myCompanyId?: number;
}

const ProgrammeRetireForm: FC<ProgrammeRetireFormProps> = (props: ProgrammeRetireFormProps) => {
  const { programme, onFinish, onCancel, actionBtnText, subText, hideType, myCompanyId } = props;
  const { i18n, t } = useTranslation(['view']);
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [form] = Form.useForm();

  const [currentSum, setCurrentSum] = useState<number>(0);
  const [countryList, setCountryList] = useState<SelectProps['options']>([]);
  const [value, setValue] = useState<string>();
  const [checked, setChecked] = useState<boolean>(false);

  const { get, delete: del, post } = useConnection();

  const handleSearch = async (newValue: string) => {
    if (newValue !== undefined) {
      const resp = await post('national/organisation/countries', {
        page: 1,
        size: 250,
        filterAnd: [
          {
            key: 'name',
            operation: 'like',
            value: newValue.charAt(0).toUpperCase() + newValue.slice(1) + '%',
          },
        ],
        sort: {
          key: 'name',
          order: 'ASC',
        },
      });
      setCountryList(resp.data.map((d: any) => ({ label: d.name, value: d.alpha2 })));
    }
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  // if (!toCompanyDefault) {
  //   const myIndex = programme.companyId.map(e => Number(e)).indexOf(userCompanyId!);
  //   if (myIndex >= 0) {
  //     programme.companyId.splice(myIndex, 1);
  //     programme.creditOwnerPercentage.splice(myIndex, 1);
  //   }
  // }

  if (!programme.creditOwnerPercentage && programme.companyId.length === 1) {
    programme.creditOwnerPercentage = [100];
  }

  const companies: any = {};
  for (const c of programme.company) {
    companies[c.companyId] = c;
  }
  const validCompanies: { percentage: number; name: any; available: number; companyId: any }[] = [];
  const companyCredit = [];
  let totalCredits = 0;
  let companyName = undefined;
  for (const index in programme.creditOwnerPercentage) {
    if (
      (hideType && Number(programme.companyId[index]) !== myCompanyId) ||
      parseInt(companies[Number(programme.companyId[index])].state) ===
        CompanyState.SUSPENDED.valueOf()
    ) {
      continue;
    } else {
      companyName = companies[Number(programme.companyId[index])].name;
    }
    const companyAvailableTotal =
      ((programme.creditBalance - (programme.creditFrozen ? programme.creditFrozen[index] : 0)) *
        programme.creditOwnerPercentage[index]) /
      100;
    validCompanies.push({
      percentage: programme.creditOwnerPercentage[index],
      name: companies[Number(programme.companyId[index])].name,
      available: companyAvailableTotal,
      companyId: Number(programme.companyId[index]),
    });
    companyCredit.push(0);

    totalCredits += companyAvailableTotal;
  }

  useEffect(() => {
    handleSearch('');
    if (hideType) {
      setType('0');
    }
  }, []);

  return (
    <div className="transfer-form">
      {subText && (
        <Row>
          <Col span={24} className="sub-text">
            {subText}
          </Col>
        </Row>
      )}

      <Form
        name="transfer_init_popup"
        layout="vertical"
        form={form}
        initialValues={{
          companyCredit: companyCredit,
        }}
        onChange={() => setPopupError(undefined)}
        onValuesChange={(v, allVal) => {
          if (allVal.companyCredit) {
            setCurrentSum(
              allVal.companyCredit.reduce((a: any, b: any) => (a ? a : 0) + (b ? b : 0), 0)
            );
          }
        }}
        onFinish={async (d) => {
          setLoading(true);
          if (d.comment) {
            d.comment = d.comment.trim();
          }
          if (hideType) {
            d.type = '0';
          }
          if (d.type === '0') {
            if (currentSum === 0) {
              setPopupError('Total Amount should be greater than 0');
              setLoading(false);
              return;
            }
            d.fromCompanyIds = validCompanies.map((e) => Number(e.companyId));
            // programme.companyId.map((n) => Number(n));
            // d.companyCredit = d.companyCredit.map((n: any) => (n === undefined ? 0 : n));
            d.toCompanyMeta = {
              name: d.company,
              country: d.country,
            };
          }
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        {hideType && (
          <>
            <Row>
              <Col span={24}>
                <Form.Item className="remarks-label" label={t('view:from')} name="from">
                  <Input placeholder={companyName} disabled />
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
          </>
        )}
        {!hideType && (
          <Row>
            <Col span={24}>
              <Form.Item
                className="remarks-label"
                label=""
                name="type"
                valuePropName="type"
                rules={[
                  {
                    required: true,
                    message: 'Required field',
                  },
                ]}
              >
                <Radio.Group
                  onChange={(v: any) => {
                    setType(v.target.value);
                    form.setFieldsValue({ type: v.target.value });
                  }}
                >
                  <Space direction="vertical">
                    <Radio value={'0'}>Cross-border transfer</Radio>
                    <Radio value={'1'}>Legal Action</Radio>
                    <Radio value={'2'}>Other</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>
        )}
        {type === '0' && (
          <div>
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('view:country')}
                  name="country"
                  rules={[
                    {
                      required: true,
                      message: 'Required field',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder={t('view:searchCountry')}
                    showArrow={true}
                    filterOption={false}
                    onSearch={handleSearch}
                    onChange={handleChange}
                    notFoundContent={null}
                    options={countryList}
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
                <Form.Item className="remarks-label" label={t('view:company')} name="company">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            {validCompanies.map((pert, index) => {
              return (
                <Row>
                  <Col lg={11} md={24}>
                    {hideType ? (
                      <div className="label">{`${t(
                        'view:totalRetireCredit'
                      )} (${creditUnit})`}</div>
                    ) : (
                      <div className="label">{pert.name}</div>
                    )}
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
                        {
                          required: true,
                          message: 'Required field',
                        },
                        ({ getFieldValue }) => ({
                          validator(rule, v) {
                            if (
                              getFieldValue(['companyCredit', index]) &&
                              parseFloat(getFieldValue(['companyCredit', index])) > pert.available
                            ) {
                              // eslint-disable-next-line prefer-promise-reject-errors
                              return Promise.reject('Retire Amount > Credit Balance');
                            }
                            return Promise.resolve();
                          },
                        }),
                      ]}
                    >
                      <InputNumber
                        placeholder=""
                        controls={false}
                        onKeyPress={(event) => {
                          if (!/[0-9\.]/.test(event.key)) {
                            event.preventDefault();
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col lg={1} md={1} className="seperator">
                    {'/'}
                  </Col>
                  <Col lg={6} md={12}>
                    <Form.Item className="popup-credit-input">
                      <InputNumber placeholder={addCommSep(pert.available)} disabled />
                    </Form.Item>
                  </Col>
                </Row>
              );
            })}
            {!hideType && validCompanies.length > 1 && (
              <Row>
                <Col lg={11} md={24}>
                  <div className="label">{`${t('view:totalTransferCredit')} (${creditUnit})`}</div>
                </Col>
                <Col lg={6} md={12}>
                  <Form.Item className="popup-credit-input">
                    <InputNumber placeholder={addCommSep(currentSum)} disabled />
                  </Form.Item>
                </Col>
                <Col lg={1} md={1} className="seperator">
                  {'/'}
                </Col>
                <Col lg={6} md={12}>
                  <Form.Item className="popup-credit-input">
                    <InputNumber placeholder={addCommSep(totalCredits)} disabled />
                  </Form.Item>
                </Col>
              </Row>
            )}
            {/* {hideType && (
              <Row>
                <Col lg={11} md={24}>
                  <div className="label">{`${t('view:totalRetireCredit')} (${creditUnit})`}</div>
                </Col>
                <Col lg={6} md={12}>
                  <Form.Item className="popup-credit-input">
                    <InputNumber
                      placeholder=""
                      controls={false}
                      onKeyPress={(event) => {
                        if (!/[0-9\.]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col lg={1} md={1} className="seperator">
                  {'/'}
                </Col>
                <Col lg={6} md={12}>
                  <Form.Item className="popup-credit-input">
                    <InputNumber placeholder={addCommSep(totalCredits)} disabled />
                  </Form.Item>
                </Col>
              </Row>
            )} */}
          </div>
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
                ({ getFieldValue }) => ({
                  validator(rule, v) {
                    if (v !== undefined && v !== '' && v.trim() === '') {
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
                {hideType ? t('view:confirmRetire') : t('view:confirmClosure')}
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
  );
};

export default ProgrammeRetireForm;
