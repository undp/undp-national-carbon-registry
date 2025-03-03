/* eslint-disable @typescript-eslint/no-unused-expressions */
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
  Tooltip,
} from 'antd';
import React, { FC, useEffect, useState } from 'react';
import { CompanyState } from '../../Definitions/Enums/company.state.enum';
import { addCommSep, ProgrammeSl } from '../../Definitions/Definitions/programme.definitions';
import { creditUnit } from '../../Definitions/Definitions/common.definitions';
import { InfoCircle } from 'react-bootstrap-icons';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { CreditType } from '../../Definitions/Enums/programmeStage.enum';
import { API_PATHS } from '../../Config/apiConfig';

export interface CreditRetirementSlRequestFormProps {
  programme: ProgrammeSl;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText?: string;
  hideType: boolean;
  myCompanyId?: number;
  translator: any;
}

export const CreditRetirementSlRequestForm: FC<CreditRetirementSlRequestFormProps> = (
  props: CreditRetirementSlRequestFormProps
) => {
  const {
    programme,
    onFinish,
    onCancel,
    actionBtnText,
    subText,
    hideType,
    myCompanyId,
    translator,
  } = props;

  const t = translator.t;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [type, setType] = useState<string>('');
  const [form] = Form.useForm();

  const [currentSum, setCurrentSum] = useState<number>(0);
  const [countryList, setCountryList] = useState<SelectProps['options']>([]);
  const [companyList, setCompanyList] = useState<SelectProps['options']>([]);
  const [value, setValue] = useState<string>();
  const [checked, setChecked] = useState<boolean>(false);
  const [govData, setGovData] = useState<any>();

  const { get, delete: del, post } = useConnection();

  const getGovernmentDetails = async () => {
    setLoading(true);
    try {
      const response = await post(API_PATHS.ORGANIZATION_DETAILS, {
        page: 1,
        size: 100,
        filterAnd: [
          {
            key: 'companyRole',
            operation: '=',
            value: CompanyRole.GOVERNMENT,
          },
        ],
      });
      if (response.data) {
        setGovData(response?.data[0]);
        return response?.data[0];
      }
    } catch (error: any) {
      console.log('Error in getting government data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (newValue: string) => {
    if (newValue !== undefined) {
      const resp = await post(API_PATHS.ORGANIZATION_NAMES, {
        page: 1,
        size: 50,
        filterAnd: [
          {
            key: 'name',
            operation: 'like',
            value: '%' + newValue + '%',
          },
          {
            key: 'companyRole',
            operation: '=',
            value: CompanyRole.PROGRAMME_DEVELOPER,
          },
        ],
        sort: {
          key: 'name',
          order: 'ASC',
        },
      });
      setCompanyList(
        resp.data
          .map((d: any) => ({
            label: d.name,
            value: d.companyId,
            state: d.state,
          }))
          .filter((d: any) => {
            return (
              d.value !== programme.companyId && parseInt(d.state) === CompanyState.ACTIVE.valueOf()
            );
          })
      );
    } else {
      setCompanyList([]);
    }
  };

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const companyCredit = programme.company.slcfAccountBalance
    ? programme.company.slcfAccountBalance[programme.purposeOfCreditDevelopment]
    : 0;

  const programmeCredit = programme.creditBalance ? programme.creditBalance : 0;

  useEffect(() => {
    handleSearch('');
    if (hideType) {
      setType('0');
    }
    2;
    getGovernmentDetails();
  }, []);
  if (!govData) {
    return <div>Loading</div>;
  }

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
              // allVal.companyCredit.reduce((a: any, b: any) => (a ? a : 0) + (b ? b : 0), 0)
              companyCredit
            );
          }
        }}
        onFinish={async (d) => {
          setLoading(true);
          if (d.comment) {
            d.comment = d.comment.trim();
          }
          d.creditType = programme.purposeOfCreditDevelopment;
          d.fromCompanyId = programme.companyId;
          const res = await onFinish(d);
          setPopupError(res);
          setLoading(false);
        }}
      >
        <>
          <Row>
            <Col span={24}>
              <Form.Item className="remarks-label" label={t('view:programme')} name="programme">
                <Input placeholder={programme.title} disabled />
              </Form.Item>
            </Col>
          </Row>
        </>
        {programme.purposeOfCreditDevelopment === CreditType.TRACK_1 && (
          <div>
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t('view:to')}
                  name="toCompanyId"
                  rules={[
                    {
                      required: true,
                      message: 'Required!',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    // disabled={disableToCompany}
                    placeholder={t('view:searchCompany')}
                    showArrow={true}
                    filterOption={false}
                    onSearch={handleSearch}
                    onChange={handleChange}
                    notFoundContent={null}
                    options={companyList}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
        <Row>
          <Col lg={11} md={24}>
            <div className="label">{`${t('view:creditsToRetire')} (${creditUnit})`}</div>
          </Col>
          <Col lg={6} md={12}>
            <Form.Item
              className="popup-credit-input"
              name={'creditAmount'}
              rules={[
                {
                  pattern: /^[1-9]\d*$/,
                  message: 'Credit Should be a positive number',
                },
                {
                  required: true,
                  message: 'Required!',
                },
                ({ getFieldValue }) => ({
                  validator(rule, v) {
                    if (
                      getFieldValue('creditAmount') &&
                      parseFloat(getFieldValue('creditAmount')) > programmeCredit
                    ) {
                      // eslint-disable-next-line prefer-promise-reject-errors
                      return Promise.reject('Retire Amount > Credit Balance');
                    }
                    if (
                      getFieldValue('creditAmount') &&
                      parseFloat(getFieldValue('creditAmount')) > companyCredit
                    ) {
                      // eslint-disable-next-line prefer-promise-reject-errors
                      return Promise.reject('Retire Amount > Organisation Credit Balance');
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
                  if (!/^\d$/.test(event.key)) {
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
              <InputNumber placeholder={addCommSep(programmeCredit)} disabled />
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
                  required: programme.purposeOfCreditDevelopment === CreditType.TRACK_2,
                  message: 'Required!',
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
            <Form.Item className="text-left" valuePropName="checked" label="" name="confirm">
              <Checkbox className="label" onChange={(v) => setChecked(v.target.checked)}>
                {programme.purposeOfCreditDevelopment === CreditType.TRACK_1
                  ? t('view:confirmTransferSl')
                  : t('view:confirmRetireSl')}
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
