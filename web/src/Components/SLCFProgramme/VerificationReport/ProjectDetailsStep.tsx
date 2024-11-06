import { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';

export const ProjectDetailsStep = (props: any) => {
  const {
    useLocation,
    translator,
    current,
    form,
    formMode,
    next,
    cancel,
    countries,
    onValueChange,
  } = props;

  const { get, post } = useConnection();
  const [contactNoInput] = useState<any>();
  const [countryList, setCountryList] = useState<[]>([]);
  const accessToken = process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    ? process.env.REACT_APP_MAPBOXGL_ACCESS_TOKEN
    : '';

  const getCountryList = async () => {
    const response = await get('national/organisation/countries');
    if (response.data) {
      setCountryList(response.data);
    }
  };
  useEffect(() => {
    getCountryList();
  }, []);
  const t = translator.t;
  return (
    <>
      {current === 0 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              disabled={FormMode.VIEW === formMode}
              onFinish={(values: any) => {
                console.log('-----values---------', values);
                values.completionDate = moment(values?.completionDate).startOf('day').valueOf();
                values.versionDate = moment(values?.versionDate).startOf('day').valueOf();
                values.monitoringPeriodStart = moment(values?.monitoringPeriodStart)
                  .startOf('day')
                  .valueOf();
                values.monitoringPeriodEnd = moment(values?.monitoringPeriodEnd)
                  .startOf('day')
                  .valueOf();
                onValueChange({ projectDetails: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:projectName')}
                      name="projectName"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:projectName')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input disabled size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:client')}
                      name="client"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:client')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('verificationReport:version')}
                      name="version"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:version')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:contactPerson')}
                      name="contactPerson"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:contactPerson')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      name="telephone"
                      label={t('verificationReport:telephone')}
                      initialValue={useLocation?.record?.phoneNo}
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule: any, value: any) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:telephone')} ${t('isRequired')}`
                              );
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(
                                    `${t('verificationReport:telephone')} ${t('isRequired')}`
                                  );
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(
                                      `${t('verificationReport:telephone')} ${t('isInvalid')}`
                                    );
                                  }
                                }
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <PhoneInput
                        placeholder={t('verificationReport:telephone')}
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        disabled={FormMode.VIEW === formMode}
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:country')}
                      name="country"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:country')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Select size="large" placeholder={t('verificationReport:countryPlaceholder')}>
                        {countryList.map((country: { name: string }) => (
                          <Select.Option value={country.name}>{country.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:estimatedScer')}
                      name="estimatedScer"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:estimatedScer')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('verificationReport:completionDate')}
                      name="completionDate"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:completionDate')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:versionDate')}
                      name="versionDate"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:versionDate')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:email')}
                      name="email"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:email')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:address')}
                      name="address"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:address')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                    <h4 className="form-section-title">
                      {`${t('verificationReport:monitoringPeriod')}`}
                    </h4>
                    <Row>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="monitoringPeriodStart"
                          rules={[
                            {
                              required: true,
                              message: '',
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t('verificationReport:monitoringPeriodStart')} ${t(
                                      'isRequired'
                                    )}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <DatePicker
                            size="large"
                            disabledDate={(currentDate: any) =>
                              currentDate < moment().startOf('day')
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col xl={2} md={24}>
                        <div className="step-form-right-col">
                          <h4 className="to-lable">{t('verificationReport:to')}</h4>
                        </div>
                      </Col>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="monitoringPeriodEnd"
                          rules={[
                            {
                              required: true,
                              message: '',
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t('verificationReport:monitoringPeriodEnd')} ${t(
                                      'isRequired'
                                    )}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <DatePicker
                            size="large"
                            disabledDate={(currentDate: any) =>
                              currentDate < moment().startOf('day')
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      label={t('verificationReport:verifiedScer')}
                      name="verifiedScer"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:verifiedScer')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:summary')}
                      name="summary"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:summary')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:projectTitle')}
                      name="projectTitle"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:projectTitle')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:workCarriedOutBy')}
                      name="workCarriedOutBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:workCarriedOutBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('verificationReport:reportNo')}
                      name="reportNo"
                      rules={[
                        {
                          required: true,
                          message: '',
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(
                                `${t('verificationReport:reportNo')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:workApprovedBy')}
                      name="workApprovedBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:workApprovedBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={3} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={cancel} disabled={false}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
                  Next
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
