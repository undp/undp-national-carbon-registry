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
import React, { FC, useEffect, useState } from 'react';
import { CompanyState } from '../../Definitions/Enums/company.state.enum';
import { addCommSep, Programme } from '../../Definitions/Definitions/programme.definitions';
import { creditUnit } from '../../Definitions/Definitions/common.definitions';
import { CompanyRole } from '../../Definitions/Enums/company.role.enum';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';

export interface ProgrammeTransferFormProps {
  programme: Programme;
  onCancel: any;
  actionBtnText: string;
  onFinish: any;
  subText: string;
  disableToCompany?: boolean;
  toCompanyDefault?: any;
  receiverLabelText: string;
  userCompanyId: number | undefined;
  companyRole: string;
  translator: any;
  ministryLevelPermission?: boolean;
}

export const ProgrammeTransferForm: FC<ProgrammeTransferFormProps> = (
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
    userCompanyId,
    companyRole,
    translator,
    ministryLevelPermission = false,
  } = props;
  const t = translator.t;
  const [popupError, setPopupError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentSum, setCurrentSum] = useState<number>(0);
  const [companyList, setCompanyList] = useState<SelectProps['options']>(
    toCompanyDefault ? [toCompanyDefault] : []
  );
  const [value, setValue] = useState<string>();
  const { get, delete: del, post } = useConnection();

  const handleSearch = async (newValue: string) => {
    if (newValue !== undefined) {
      const resp = await post('national/organisation/queryNames', {
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
            return d.value !== userCompanyId && parseInt(d.state) === CompanyState.ACTIVE.valueOf();
          })
      );
    } else {
      setCompanyList(toCompanyDefault ? [toCompanyDefault] : []);
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
  const validCompanies: {
    percentage: number;
    name: any;
    companyId: any;
    available: number;
  }[] = [];
  let totalCredits = 0;
  const companyCredit = [];
  for (const index in programme.creditOwnerPercentage) {
    if (
      ((toCompanyDefault && userCompanyId !== Number(programme.companyId[index])) ||
        (!toCompanyDefault &&
          (userCompanyId === Number(programme.companyId[index]) ||
            companyRole === CompanyRole.GOVERNMENT ||
            ministryLevelPermission))) &&
      parseInt(companies[Number(programme.companyId[index])].state) ===
        CompanyState.ACTIVE.valueOf()
    ) {
      const companyAvailableTotal =
        ((programme.creditBalance - (programme.creditFrozen ? programme.creditFrozen[index] : 0)) *
          programme.creditOwnerPercentage[index]) /
        100;
      validCompanies.push({
        percentage: programme.creditOwnerPercentage[index],
        name: companies[Number(programme.companyId[index])].name,
        companyId: Number(programme.companyId[index]),
        available: companyAvailableTotal,
      });
      companyCredit.push(0);

      totalCredits += companyAvailableTotal;
    }
  }

  useEffect(() => {
    handleSearch('');
  }, []);

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
        initialValues={{
          toCompanyId: toCompanyDefault ? toCompanyDefault.value : undefined,
          companyCredit: companyCredit,
        }}
        onChange={() => setPopupError(undefined)}
        onValuesChange={(v, allVal) => {
          setCurrentSum(
            allVal.companyCredit.reduce((a: any, b: any) => (a ? a : 0) + (b ? b : 0), 0)
          );
        }}
        onFinish={async (d) => {
          if (currentSum === 0) {
            setPopupError('Total Amount should be greater than 0');
            return;
          }
          setLoading(true);
          d.fromCompanyIds = validCompanies.map((e) => Number(e.companyId));
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
                  required: !disableToCompany,
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
            <Form.Item className="remarks-label" label={t('view:programme')} name="programme">
              <Input placeholder={programme.title} disabled />
            </Form.Item>
          </Col>
        </Row>
        {validCompanies.map((pert, index) => {
          return (
            <Row>
              <Col lg={11} md={24}>
                <div className="label">{pert.name}</div>
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
                          return Promise.reject('Amount > Available');
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <InputNumber
                    placeholder=""
                    controls={false}
                    disabled={value === pert.companyId}
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
        {validCompanies.length > 1 && (
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
                <InputNumber placeholder={addCommSep(programme.creditBalance)} disabled />
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
