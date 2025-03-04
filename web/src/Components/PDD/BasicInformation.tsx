import React, { useState } from 'react';
import { CustomStepsProps } from './StepProps';
import { Button, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import moment from 'moment';
import validator from 'validator';
import PhoneInput, {
  Country,
  formatPhoneNumber,
  formatPhoneNumberIntl,
  isPossiblePhoneNumber,
} from 'react-phone-number-input';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import { CMASectoralScope } from '../../Definitions/Enums/programmeStage.enum';

const ProjectDetails = (props: CustomStepsProps) => {
  const { next, form, current, t, countries, handleValuesUpdate, disableFields, prev, formMode } =
    props;

  const [contactNoInput] = useState<any>();

  const onFinish = (values: any) => {
    console.log('-----------temp Values before-------');
    const tempValues: any = {
      projectDetails: {
        projectTitle: values?.projectTitle,
        versionNumber: values?.versionNumber,
        appliedMethodologies: values?.appliedMethodologies,
        estimatedAvgGHGEmissionReductionBasicInformation:
          values?.estimatedAvgGHGEmissionReductionBasicInformation,
        // dateOfIssue: moment(values?.dateOfIssue).startOf('day').unix(),
        projectProponent: values?.projectProponent,
        completionDate: moment(values?.completionDate).startOf('day').unix(),
        hostParty: values?.hostParty,
        sectoralScope: values?.sectoralScope,
      },
    };

    console.log('----------tempValues-------------', tempValues);
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
                      label={t('PDD:projectTitle')}
                      name="projectTitle"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:projectTitle')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:versionNumber')}
                      name="versionNumber"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:pddVersion')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:appliedMethodologies')}
                      name="appliedMethodologies"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:appliedMethodologies')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:estimatedAvgGHGEmissionReductionBasicInformation')}
                      name="estimatedAvgGHGEmissionReductionBasicInformation"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:estimatedAvgGHGEmissionReduction')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    {/* <Form.Item
                      label={t('PDD:dateOfIssue')}
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
                              throw new Error(`${t('PDD:dateOfIssue')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        // disabled
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:preparedBy')}
                      name="preparedBy"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:preparedBy')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:physicalAddress')}
                      name="physicalAddress"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:physicalAddress')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:email')}
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
                              throw new Error(`${t('PDD:email')} ${t('isRequired')}`);
                            } else {
                              const val = value.trim();
                              const reg =
                                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                              const matches = val.match(reg) ? val.match(reg) : [];
                              if (matches.length === 0) {
                                throw new Error(`${t('PDD:email')} ${t('isInvalid')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item> */}
                  </div>
                </Col>

                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('PDD:proponents')}
                      name="projectProponent"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:proponents')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:completionDate')}
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
                              throw new Error(`${t('PDD:completionDate')} ${t('isRequired')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <DatePicker
                        size="large"
                        // disabled
                        disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:hostParty')}
                      name="hostParty"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:hostParty')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Input
                        size="large"
                        // disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:sectoralScope')}
                      name="sectoralScope"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:sectoralScope')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <Select size="large" disabled={disableFields}>
                        {Object.values(CMASectoralScope).map(
                          (sectoralScope: string, index: number) => (
                            <Select.Option value={sectoralScope} key={sectoralScope + index}>
                              {sectoralScope}
                            </Select.Option>
                          )
                        )}
                      </Select>
                    </Form.Item>

                    {/* <Form.Item
                      label={t('PDD:telephone')}
                      name="telephone"
                      rules={[
                        {
                          required: true,
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
                              throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                            } else {
                              const phoneNo = formatPhoneNumber(String(value));
                              if (String(value).trim() !== '') {
                                if (phoneNo === null || phoneNo === '' || phoneNo === undefined) {
                                  throw new Error(`${t('PDD:telephone')} ${t('isRequired')}`);
                                } else {
                                  if (!isPossiblePhoneNumber(String(value))) {
                                    throw new Error(`${t('PDD:telephone')} ${t('isInvalid')}`);
                                  }
                                }
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <PhoneInput
                        international
                        value={formatPhoneNumberIntl(contactNoInput)}
                        defaultCountry="LK"
                        countryCallingCodeEditable={false}
                        onChange={(v) => {}}
                        countries={countries as Country[]}
                        disabled
                      />
                    </Form.Item>

                    <Form.Item
                      label={t('PDD:website')}
                      name="website"
                      className="website-input"
                      rules={[
                        {
                          required: true,
                          message: `${t('PDD:website')} ${t('isRequired')}`,
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
                                throw new Error(`${t('PDD:website')} ${t('isInvalid')}`);
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" disabled={disableFields} />
                    </Form.Item> */}

                    {formMode === FormMode.VIEW ? (
                      <Form.Item label={t('PDD:reportID')} name="reportID">
                        <Input size={'large'} disabled />
                      </Form.Item>
                    ) : (
                      ''
                    )}
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                {/* In this page prev is navigateToDetailPage */}
                <Button danger size={'large'} onClick={prev}>
                  {t('PDD:cancel')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('PDD:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('PDD:next')}
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
