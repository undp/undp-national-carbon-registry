import React, { useEffect, useState } from 'react';
import { CustomStepsProps } from './StepProps';
import { Button, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';
import moment from 'moment';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';

const StartDateCreditingPeriod = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  useEffect(() => {
    //console.log('---------form_values----------', form.getFieldsValue(), disableFields);
  }, []);

  const onFinish = (values: any) => {
    const tempValues: any = {
      projectActivityStartDate: moment(values?.projectActivityStartDate).startOf('day').unix(),
      projectCreditingPeriodStartDate: moment(values?.projectCreditingPeriodStartDate)
        .startOf('day')
        .unix(),
      projectCreditingPeriodEndDate: moment(values?.projectCreditingPeriodEndDate)
        .startOf('day')
        .unix(),
      creditingPeriodStart: moment(values?.creditingPeriodStart).startOf('day').unix(),
      operationalLifetime: values?.operationalLifetime,
      creditingPeriodType: values?.creditingPeriodType,
      projectCreditingPeriodDuration: values?.projectCreditingPeriodDuration,
    };

    handleValuesUpdate({ startDateCreditingPeriod: tempValues });
  };

  const updateCreditingPeriodDuration = () => {
    const projectCreditingPeriodStartDate = form.getFieldValue('projectCreditingPeriodStartDate');
    const projectCreditingPeriodEndDate = form.getFieldValue('projectCreditingPeriodEndDate');

    if (projectCreditingPeriodEndDate && projectCreditingPeriodStartDate) {
      const momentStartDate = moment(projectCreditingPeriodStartDate);
      const momentEndDate = moment(projectCreditingPeriodEndDate);
      const duration = moment.duration(momentEndDate.diff(momentStartDate));
      const durationString = `${duration.years()} years, ${duration.months()} months and ${duration.days()} days`;
      form.setFieldValue('projectCreditingPeriodDuration', durationString);
    }
  };

  return (
    <>
      {current === 3 && (
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
              <Row gutter={[40, 16]}>
                <Col md={24} xl={12}>
                  <Form.Item
                    label={`${t('PDD:projectActivityStartDate')}`}
                    name="projectActivityStartDate"
                  >
                    {/* <DatePicker
                      size="large"
                      value={
                        programData
                          ? moment(programData?.startDate * 1000)
                          : null
                      }
                      disabled
                    /> */}
                    <Input size="large" disabled />
                  </Form.Item>

                  <LabelWithTooltip label={t('PDD:projectCreditingPeriod')} required={true} />
                  <Row gutter={[40, 16]} justify={'space-between'} align={'stretch'}>
                    <Col md={11} xl={11}>
                      <Form.Item
                        // label={`${t('PDD:projectActivityStartDate')}`}
                        name="projectCreditingPeriodStartDate"
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
                                throw new Error(`${t('PDD:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                          onChange={() => updateCreditingPeriodDuration()}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      <p className="to-margin">to</p>
                    </Col>
                    <Col md={11} xl={11}>
                      <Form.Item
                        // label={`${t('PDD:projectActivityStartDate')}`}
                        name="projectCreditingPeriodEndDate"
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
                                throw new Error(
                                  `${t('PDD:projectCreditingPeriodEndDate')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                          onChange={() => updateCreditingPeriodDuration()}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label={`${t('PDD:creditingPeriodStart')}`}
                    name="creditingPeriodStart"
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
                            throw new Error(`${t('PDD:creditingPeriodStart')} ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <DatePicker
                      size="large"
                      disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>

                <Col md={24} xl={12}>
                  <Form.Item
                    label={`${t('PDD:operationalLifetime')}`}
                    name="operationalLifetime"
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
                            throw new Error(`${t('PDD:operationalLifetime')} ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled={disableFields} />
                  </Form.Item>

                  <Form.Item
                    label={`${t('PDD:creditingPeriodType')}`}
                    name="creditingPeriodType"
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
                            throw new Error(`${t('PDD:creditingPeriodType')} ${t('isRequired')}`);
                          }
                        },
                      },
                    ]}
                  >
                    <Select size="large" disabled={disableFields}>
                      <Select.Option value="Fixed">{t('PDD:creditingPeriodOption1')}</Select.Option>
                      <Select.Option value="Renewable">
                        {t('PDD:creditingPeriodOption2')}
                      </Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={`${t('PDD:projectCreditingPeriodDuration')}`}
                    name="projectCreditingPeriodDuration"
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
                            throw new Error(
                              `${t('PDD:projectCreditingPeriodDuration')} ${t('isRequired')}`
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <Input size="large" disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('PDD:prev')}
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

export default StartDateCreditingPeriod;
