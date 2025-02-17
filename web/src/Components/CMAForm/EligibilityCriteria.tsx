import { Button, Col, Form, Row, Select, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';

const EligibilityCriteria = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    const tempValues = {
      generalCriteria411ProjectActivity: values?.generalCriteria411ProjectActivity,
      generalCriteria411IsAgreed: values?.generalCriteria411IsAgreed,
      generalCriteria412ProjectActivity: values?.generalCriteria412ProjectActivity,
      generalCriteria412IsAgreed: values?.generalCriteria412IsAgreed,
      generalCriteria413ProjectActivity: values?.generalCriteria413ProjectActivity,
      generalCriteria413IsAgreed: values?.generalCriteria413IsAgreed,
      generalCriteria414ProjectActivity: values?.generalCriteria414ProjectActivity,
      generalCriteria414IsAgreed: values?.generalCriteria414IsAgreed,
      generalCriteria415ProjectActivity: values?.generalCriteria415ProjectActivity,
      generalCriteria415IsAgreed: values?.generalCriteria415IsAgreed,
      generalCriteria416ProjectActivity: values?.generalCriteria416ProjectActivity,
      generalCriteria416IsAgreed: values?.generalCriteria416IsAgreed,
      bundlingCriteria421ProjectActivity: values?.bundlingCriteria421ProjectActivity,
      bundlingCriteria421IsAgreed: values?.bundlingCriteria421IsAgreed,
      bundlingCriteria422ProjectActivity: values?.bundlingCriteria422ProjectActivity,
      bundlingCriteria422IsAgreed: values?.bundlingCriteria422IsAgreed,
      bundlingCriteria423ProjectActivity: values?.bundlingCriteria423ProjectActivity,
      bundlingCriteria423IsAgreed: values?.bundlingCriteria423IsAgreed,
      bundlingCriteria424ProjectActivity: values?.bundlingCriteria424ProjectActivity,
      bundlingCriteria424IsAgreed: values?.bundlingCriteria424IsAgreed,
      bundlingCriteria425ProjectActivity: values?.bundlingCriteria425ProjectActivity,
      bundlingCriteria425IsAgreed: values?.bundlingCriteria425IsAgreed,
      bundlingCriteria426ProjectActivity: values?.bundlingCriteria426ProjectActivity,
      bundlingCriteria426IsAgreed: values?.bundlingCriteria426IsAgreed,
    };

    handleValuesUpdate({ eligibilityCriteria: tempValues });
  };
  return (
    <>
      {current === 4 && (
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
              <>
                <h4 className="form-section-title custom-required">{`4.1 ${t(
                  'CMAForm:generalCriteria'
                )}`}</h4>

                <div className="eligibility-table-form">
                  <Row className="header" gutter={24}>
                    <Col md={4} xl={4}>
                      {t('CMAForm:subSection')}
                    </Col>
                    <Col md={10} xl={10}>
                      {t('CMAForm:eligibilityCriteria')}
                    </Col>
                    <Col md={6} xl={6}>
                      {t('CMAForm:eligibilityCriteriaProjectActivityHeader')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('CMAForm:yesNoHeader')}
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.1
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria01')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria411ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria411IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.2
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria02', {
                        countryName: process.env.REACT_APP_COUNTRY_NAME || 'CountryX',
                      })}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria412ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria412IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.3
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria03', {
                        countryName: process.env.REACT_APP_COUNTRY_NAME || 'CountryX',
                      })}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria413ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria413IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.4
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria04')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria414ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria414IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.5
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria05')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria415ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria415IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.6
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria06')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="generalCriteria416ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="generalCriteria416IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <>
                <h4 className="form-section-title custom-required">{`4.1 ${t(
                  'CMAForm:bundlingCriteria'
                )}`}</h4>

                <div className="eligibility-table-form">
                  <Row className="header" gutter={24}>
                    <Col md={4} xl={4}>
                      {t('CMAForm:subSection')}
                    </Col>
                    <Col md={10} xl={10}>
                      {t('CMAForm:eligibilityCriteria')}
                    </Col>
                    <Col md={6} xl={6}>
                      {t('CMAForm:eligibilityCriteriaProjectActivityHeader')}
                    </Col>
                    <Col md={4} xl={4}>
                      {t('CMAForm:yesNoHeader')}
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.1
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria07')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria421ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria421IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.2
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria08')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria422ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria422IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.3
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria09')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria423ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria423IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.4
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria10')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria424ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria424IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.5
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria11')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria425ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria425IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.6
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      {t('CMAForm:criteria12')}
                    </Col>
                    <Col md={6} xl={6}>
                      <Form.Item
                        name="bundlingCriteria426ProjectActivity"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={2} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={4} xl={4}>
                      <Form.Item
                        name="bundlingCriteria426IsAgreed"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:required')}`,
                          },
                        ]}
                      >
                        <Select size="large" disabled={disableFields} placeholder="Select">
                          <Select.Option value={true}>{t('CMAForm:yes')}</Select.Option>
                          <Select.Option value={false}>{t('CMAForm:no')}</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
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

export default EligibilityCriteria;
