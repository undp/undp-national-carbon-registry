import React, { useEffect, useState } from 'react';
import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, DatePicker, Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';
import validator from 'validator';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ProcessSteps } from './ValidationStepperComponent';
import { FormMode } from '../../Definitions/Enums/formMode.enum';

// import { Form } from 'react-router-dom';

const ProjectDetails = (props: ValidationStepsProps) => {
  const {
    next,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    cmaDetails,
    existingFormValues,
    formMode,
    prev,
  } = props;

  const [contactNoInput] = useState<any>();

  const onFinish = (values: any) => {
    const projectDetailsFormValues = {
      client: values?.client,
      dateOfIssue: moment(values?.dateOfIssue).valueOf(),
      versionNo: values?.versionNo,
      versionDate: moment(values?.versionDate).valueOf(),
      address: values?.address,
      telephone: values?.telephone,
      email: values?.email,
      website: values?.website,
      summary: values?.summary,
      projectTitle: values?.projectTitle,
      workCarriedOutBy: values?.workCarriedOutBy,
      workApprovedBy: values?.workApprovedBy,
      reportNo: values?.reportNo,
    };

    console.log(ProcessSteps.VR_PROJECT_DETAILS, projectDetailsFormValues);

    handleValuesUpdate({ [ProcessSteps.VR_PROJECT_DETAILS]: projectDetailsFormValues });
  };

  return (
    <>
      {current === 0 && (
        <div>
          <div className="val-report-step-form-container">
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
              disabled={FormMode.VIEW === formMode}
            >
              <>
                <div className="form-section mg-top-1">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('validationReport:client')}
                          name="client"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:client')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:versionNo')}
                          name="versionNo"
                          rules={[
                            {
                              required: true,
                              message: `${t('validationReport:versionNo')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          <Input size="large" />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:telephone')}
                          name="telephone"
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
                                    `${t('validationReport:telephone')} ${t('isRequired')}`
                                  );
                                } else {
                                  const phoneNo = formatPhoneNumber(String(value));
                                  if (String(value).trim() !== '') {
                                    if (
                                      phoneNo === null ||
                                      phoneNo === '' ||
                                      phoneNo === undefined
                                    ) {
                                      throw new Error(
                                        `${t('validationReport:telephone')} ${t('isRequired')}`
                                      );
                                    } else {
                                      if (!isPossiblePhoneNumber(String(value))) {
                                        throw new Error(
                                          `${t('validationReport:telephone')} ${t('isInvalid')}`
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
                            // placeholder={t('validationReport:telephone')}
                            international
                            value={formatPhoneNumberIntl(contactNoInput)}
                            defaultCountry="LK"
                            countryCallingCodeEditable={false}
                            onChange={(v) => {}}
                            countries={countries as Country[]}
                            disabled={FormMode.VIEW === formMode}
                          />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:email')}
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
                                    `${t('validationReport:email')} ${t('isRequired')}`
                                  );
                                } else {
                                  const val = value.trim();
                                  const reg =
                                    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                                  const matches = val.match(reg) ? val.match(reg) : [];
                                  if (matches.length === 0) {
                                    throw new Error(
                                      `${t('validationReport:email')} ${t('isInvalid')}`
                                    );
                                  }
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
                      <Form.Item
                        label={t('validationReport:dateOfIssue')}
                        name="dateOfIssue"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:dateOfIssue')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>
                      <Form.Item
                        label={t('validationReport:versionDate')}
                        name="versionDate"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:versionDate')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:address')}
                        name="address"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:address')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>

                      <Form.Item
                        label={t('validationReport:website')}
                        name="website"
                        rules={[
                          {
                            required: true,
                            message: `${t('validationReport:website')} ${t('isRequired')}`,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() !== '' ||
                                String(value).trim() !== undefined ||
                                value !== null ||
                                value !== undefined
                              ) {
                                if (value && !validator.isURL(value))
                                  throw new Error(
                                    `${t('validationReport:website')} ${t('isInvalid')}`
                                  );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:summary')}`}
                // tooltip={{
                //   title: (
                //     <div className="tooltip">
                //       <p>Provinde a brief summary of the following</p>
                //       <ul>
                //         <li>A brief description of the validation and the project.</li>
                //         <li>The purpose and scope of validation.</li>
                //         <li>The method and criteria used for validation.</li>
                //         <li>The number of findings raised during validation.</li>
                //         <li>Any uncertainties associated with the validation.</li>
                //         <li>Summary of the validation conclusion.</li>
                //       </ul>
                //     </div>
                //   ),
                //   icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                //   placement: 'topLeft',
                // }}
                name="summary"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:summary')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea disabled={FormMode.VIEW === formMode} rows={4} />
              </Form.Item>

              <Row className="row" gutter={[40, 8]} justify={'space-between'}>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('validationReport:projectTitle')}
                      name="projectTitle"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:projectTitle')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <Form.Item
                      label={t('validationReport:workCarryOutBy')}
                      name="workCarriedOutBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:workCarryOutBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('validationReport:reportNo')}
                      name="reportNo"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:reportNo')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size={'large'} />
                    </Form.Item>
                    <Form.Item
                      label={t('validationReport:workApprovedBy')}
                      name="workApprovedBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:workApprovedBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} disabled={false} onClick={prev}>
                  {t('validationReport:cancel')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  disabled={false}
                  // onClick={next}
                  htmlType="submit"
                >
                  {t('validationReport:next')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectDetails;
