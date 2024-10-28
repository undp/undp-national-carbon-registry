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

// import { Form } from 'react-router-dom';

const ProjectDetails = (props: ValidationStepsProps) => {
  const { next, form, current, t, countries, handleValuesUpdate, cmaDetails, existingFormValues } =
    props;

  const [contactNoInput] = useState<any>();

  useEffect(() => {
    // if (existingFormValues) {
    //   form.setFieldsValue({
    //     client: existingFormValues.client,
    //     dateOfIssue: existingFormValues.dateOfIssue,
    //     versionNo: existingFormValues.versionNo,
    //     versionDate: moment(existingFormValues.versionDate),
    //     address: existingFormValues.physicalAddress,
    //     telephone: existingFormValues.telephone,
    //     email: existingFormValues.email,
    //     website: existingFormValues.website,
    //     summary: existingFormValues.summary,
    //     projectTitle: existingFormValues.summary,
    //     workCarriedOutBy: existingFormValues.workCarryOutBy,
    //     workApprovedBy: existingFormValues.workApprovedBy,
    //     reportId: existingFormValues.reportId,
    //   });
    // }
  }, []);

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
                              message: `${t('validationReport:telephone')} ${t('isRequired')}`,
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
                          />
                        </Form.Item>

                        <Form.Item
                          label={t('validationReport:email')}
                          name="email"
                          rules={[
                            {
                              required: true,
                              // message: `${t('validationReport:email')} ${t('isRequired')}`,
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === '' ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t('validation:email')} ${t('isRequired')}`);
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
                                if (value && !validator.isURL('https://' + value))
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
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>Provinde a brief summary of the following</p>
                      <ul>
                        <li>A brief description of the validation and the project.</li>
                        <li>The purpose and scope of validation.</li>
                        <li>The method and criteria used for validation.</li>
                        <li>The number of findings raised during validation.</li>
                        <li>Any uncertainties associated with the validation.</li>
                        <li>Summary of the validation conclusion.</li>
                      </ul>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
                name="summary"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:summary')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('validationReport:projectTitle')}
                      name="projectTitle"
                      rules={[
                        {
                          required: true,
                          message: `${t('validationReport:title')} ${t('isRequired')}`,
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
                          message: `${t('validationReport:reportId')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input readOnly size={'large'} />
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
              {/* <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:stakeHolderConsultationProcess')}`}
                name="stakeHolderConsultationProcess"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:stakeHolderConsultationProcess')} ${t('isRequired')}`,
                  },
                ]}
                tooltip={{
                  title: (
                    <div>
                      <p>
                        Describe the process for, and the outcomes from, the local stakeholder
                        consultation conducted prior to validation. Include details on the
                        following:
                      </p>
                      <ul>
                        <li>
                          The procedures or methods used for engaging local stakeholders (e.g.,
                          dates of announcements or meetings, periods during which input was
                          sought).
                        </li>
                        <li>
                          The procedures or methods used for documenting the outcomes of the local
                          stakeholder consultation.{' '}
                        </li>
                        <li>The mechanism for on-going communication with local stakeholders.</li>
                        <li>
                          How due account of all and any input received during the consultation has
                          been taken. Include details on any updates to the project design or
                          justify why updates are not appropriate.
                        </li>
                      </ul>

                      <p>
                        For AFOLU projects, also demonstrate how the project has or will communicate
                        the following:
                      </p>
                      <ul>
                        <li>
                          The project design and implementation, including the results of
                          monitoring.
                        </li>
                        <li>
                          The risks, costs and benefits the project may bring to local stakeholders.
                        </li>
                        <li>
                          All relevant laws and regulations covering workers’ rights in the host
                          country.
                        </li>
                        <li>
                          The process of SLCCS validation and verification and the
                          validation/verification body’s site visit.
                        </li>
                      </ul>
                    </div>
                  ),
                }}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:summaryOfCommentsRecieved')}`}
                name="summaryOfCommentsRecieved"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:summaryOfCommentsRecieved')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:summaryOfCommentsRecievedPlaceholder')}`}
                />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('CMAForm:considerationOfCommentsRecieved')}`}
                name="considerationOfCommentsRecieved"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:considerationOfCommentsRecieved')}`,
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:considerationOfCommentsRecievedPlaceholder')}`}
                />
              </Form.Item> */}

              <Row justify={'end'} className="step-actions-end">
                <Button
                  danger
                  size={'large'}
                  // onClick={prev}
                >
                  {t('validationReport:cancel')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
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
