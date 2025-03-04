import { useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import PhoneInput, {
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';

import moment from 'moment';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

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

  const [contactNoInput] = useState<any>();

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
                onValueChange({ projectDetails: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('monitoringReport:pd_projectTitle')}
                      name="title"
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
                                `${t('monitoringReport:pd_projectTitle')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:pd_projectProponents')}
                      name="projectProponent"
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
                                `${t('monitoringReport:pd_projectProponents')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pd_dateOfIssue')}
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
                              throw new Error(
                                `${t('monitoringReport:pd_dateOfIssue')} ${t('isRequired')}`
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
                      label={t('monitoringReport:address')}
                      name="physicalAddress"
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
                                `${t('monitoringReport:address')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:pd_website')}
                      name="website"
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
                                `${t('monitoringReport:pd_website')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('monitoringReport:pd_reportTitle')}
                      name="reportTitle"
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
                                `${t('monitoringReport:pd_reportTitle')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('monitoringReport:pd_preparedBy')}
                      name="preparedBy"
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
                                `${t('monitoringReport:pd_preparedBy')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>

                    <Form.Item
                      name="telephone"
                      label={t('monitoringReport:pd_telephone')}
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
                                `${t('monitoringReport:pd_telephone')} ${t('isRequired')}`
                              );
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(
                                    `${t('monitoringReport:pd_telephone')} ${t('isRequired')}`
                                  );
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(
                                      `${t('monitoringReport:pd_telephone')} ${t('isInvalid')}`
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
                        disabled
                        placeholder={t('monitoringReport:pd_telephone')}
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries}
                      />
                    </Form.Item>
                    <Form.Item
                      label={t('monitoringReport:pd_email')}
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
                                `${t('monitoringReport:pd_email')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled />
                    </Form.Item>
                    {FormMode.VIEW === formMode ? (
                      <Form.Item label={t('monitoringReport:reportID')} name="reportID">
                        <Input size={'large'} disabled />
                      </Form.Item>
                    ) : (
                      ''
                    )}
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={cancel} disabled={false}>
                  {t('monitoringReport:cancel')}
                </Button>
                <Button type="primary" htmlType="submit" disabled={false}>
                  {t('monitoringReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
