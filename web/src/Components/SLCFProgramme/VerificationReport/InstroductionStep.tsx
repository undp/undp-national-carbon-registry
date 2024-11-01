import { useEffect, useState } from 'react';
import { Button, Col, DatePicker, Form, Input, Row, Select, Upload } from 'antd';
import moment from 'moment';
import { useConnection } from '../../../Context/ConnectionContext/connectionContext';
import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../../Definitions/Enums/formMode.enum';
export const IntroductionStep = (props: any) => {
  const { useLocation, translator, current, form, formMode, next, countries, prev, onValueChange } =
    props;

  const t = translator.t;
  return (
    <>
      {current === 1 && (
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
              initialValues={{}}
              onFinish={async (values: any) => {
                values.creditionPeriodStart = moment(values?.creditionPeriodStart)
                  .startOf('day')
                  .unix();
                values.creditionPeriodEnd = moment(values?.creditionPeriodEnd)
                  .startOf('day')
                  .unix();
                values.periodVerifiedStart = moment(values?.periodVerifiedStart)
                  .startOf('day')
                  .unix();
                values.periodVerifiedEnd = moment(values?.periodVerifiedEnd).startOf('day').unix();
                onValueChange({ introduction: values });
                next();
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('verificationReport:introduction')}`}
                      name="introduction"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:introduction')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                    <Form.Item
                      label={`1.1 ${t('verificationReport:objective')}`}
                      name="objective"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:objective')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                    <Form.Item
                      label={`1.2 ${t('verificationReport:scopeAndCriteria')}`}
                      name="scopeAndCriteria"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:scopeAndCriteria')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <h4 className="form-section-title">{`1.3  ${t(
                'verificationReport:projectActivityDescription'
              )}`}</h4>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={t('verificationReport:titleOfTheActivity')}
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
                                `${t('verificationReport:titleOfTheActivity')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:hostParty')}
                      name="hostParty"
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
                                `${t('verificationReport:hostParty')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <h4 className="form-section-title">
                      {`${t('verificationReport:creditionPeriod')}`}
                    </h4>
                    <Row>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="creditionPeriodStart"
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
                                    `${t('verificationReport:creditionPeriodStart')} ${t(
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
                          name="creditionPeriodEnd"
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
                                    `${t('verificationReport:creditionPeriodEnd')} ${t(
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
                  </div>
                </Col>
                <Col xl={12} md={24}>
                  <div className="step-form-right-col">
                    <Form.Item
                      label={t('verificationReport:projectParticipants')}
                      name="tiprojectParticipantstle"
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
                                `${t('verificationReport:projectParticipants')} ${t('isRequired')}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>

                    <Form.Item
                      label={t('verificationReport:monitoringMethodology')}
                      name="monitoringMethodology"
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
                                `${t('verificationReport:monitoringMethodology')} ${t(
                                  'isRequired'
                                )}`
                              );
                            }
                          },
                        },
                      ]}
                    >
                      <Input size="large" />
                    </Form.Item>
                    <h4 className="form-section-title">
                      {`${t('verificationReport:periodVerified')}`}
                    </h4>
                    <Row>
                      <Col xl={11} md={24}>
                        <Form.Item
                          name="periodVerifiedStart"
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
                                    `${t('verificationReport:periodVerifiedStart')} ${t(
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
                          name="periodVerifiedEnd"
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
                                    `${t('verificationReport:periodVerifiedEnd')} ${t(
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
                  </div>
                </Col>
              </Row>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`1.4 ${t('verificationReport:emissionReductionMethodology')}`}
                      name="methodology"
                      rules={[
                        {
                          required: true,
                          message: `${t('verificationReport:emissionReductionMethodology')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={FormMode.VIEW === formMode} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>

              <Row justify={'end'} className="step-actions-end">
                <Button style={{ margin: '0 8px' }} onClick={prev} disabled={false}>
                  Back
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
