import React, { useEffect, useState } from 'react';
import { CustomStepsProps } from './StepProps';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import moment from 'moment';
import validator from 'validator';
import { useConnection } from '../../Context/ConnectionContext/connectionContext';
// import { t } from 'i18next';
import PhoneInput, {
  Country,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

const ProjectDetails = (props: CustomStepsProps) => {
  const { next, form, current, t, countries, handleValuesUpdate, disableFields, prev } = props;

  const { get, post } = useConnection();

  const [contactNoInput] = useState<any>();

  const onFinish = (values: any) => {
    console.log('-----values---------', values);

    const tempValues: any = {
      projectDetails: {
        title: values?.title,
        dateOfIssue: moment(values?.dateOfIssue).startOf('day').unix(),
        projectProponent: values?.projectProponent,
        preparedBy: values?.preparedBy,
        telephone: values?.telephone,
        physicalAddress: values?.physicalAddress,
        email: values?.email,
        website: values?.website,
      },
    };

    handleValuesUpdate(tempValues);
  };

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
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('CMAForm:projectTitle')}
                      name="title"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:title')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:dateOfIssue')}
                      name="dateOfIssue"
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
                              throw new Error(`${t('CMAForm:dateOfIssue')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        disabled
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:preparedBy')}
                      name="preparedBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:preparedBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:physicalAddress')}
                      name="physicalAddress"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:physicalAddress')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:email')}
                      name="email"
                      rules={[
                        {
                          required: true,
                          message: ``,
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('CMAForm:email')} ${t('isRequired')}`);
                            } else {
                              const val = value.trim();
                              const reg =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                              const matches = val.match(reg) ? val.match(reg) : [];
                              if (matches.length === 0) {
                                throw new Error(`${t('CMAForm:email')} ${t('isInvalid')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    {/* <Form.Item
                      label={t('CMAForm:version')}
                      name="version"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:version')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item> */}

                    <Form.Item
                      label={t('CMAForm:proponents')}
                      name="projectProponent"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:proponents')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:telephone')}
                      name="telephone"
                      rules={[
                        {
                          required: true,
                          // message: `${t('CMAForm:telephone')} ${t('isRequired')}`,
                          message: ``,
                        },
                        {
                          validator: async (rule: any, value: any) => {
                            if (
                              String(value).trim() === '' ||
                              String(value).trim() === undefined ||
                              value === null ||
                              value === undefined
                            ) {
                              throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(`${t('CMAForm:telephone')} ${t('isRequired')}`);
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(`${t('CMAForm:telephone')} ${t('isInvalid')}`);
                                  }
                                }
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <PhoneInput
                        // placeholder={t('addCompany:phoneNo')}
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries as Country[]}
                        disabled={disableFields}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('CMAForm:website')}
                      name="website"
                      className="website-input"
                      rules={[
                        {
                          required: true,
                          message: `${t('CMAForm:website')} ${t('isRequired')}`,
                        },
                        {
                          validator: async (rule, value) => {
                            if (
                              String(value).trim() !== '' ||
                              String(value).trim() !== undefined ||
                              value !== null ||
                              value !== undefined
                            ) {
                              if (value && !validator.isURL('https://' + value))
                                throw new Error(`${t('addCompany:website')} ${t('isInvalid')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} addonBefore="https://" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                {/* In this page prev is navigateToDetailPage */}
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:cancel')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('CMAForm:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('CMAForm:next')}
                  </Button>
                )}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetails;
