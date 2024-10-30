import { Button, Col, Form, Row, Select, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import { t } from 'i18next';
import TextArea from 'antd/lib/input/TextArea';

const EligibilityCriteria = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  const onFinish = (values: any) => {
    console.log('-----values---------', values);
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

    console.log('--temp value------', tempValues);
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
                      Sub Section
                    </Col>
                    <Col md={10} xl={10}>
                      Eligibility Criteria
                    </Col>
                    <Col md={6} xl={6}>
                      Project Activity
                    </Col>
                    <Col md={4} xl={4}>
                      Yes/No
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.1
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project activity shall be a new project, which will reduce/absorb GHG
                      emissions or the project activity shall be a project, which was implemented on
                      or after 2010 in order to offset GHG emission within the organization.
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.2
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project activity shall be located in Sri Lanka.
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.3
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project activity shall not happen in the absence of benefits received from
                      trading Sri Lanka Certified Emission Reduction units (SCERs). (This is not
                      applicable Track II)
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.4
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project shall be implemented voluntarily by the project owner but not
                      implemented based on legislation or regulations in the country
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.5
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project activity satisfies environmental standard and regulations of the
                      country
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.1.6
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The project shall not have been registered under any other national or
                      international scheme. However, if a registered project under other scheme is
                      willing to register with SLCCS, then, such project shall be deregistered from
                      the other scheme in order to be eligible
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
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
                      Sub Section
                    </Col>
                    <Col md={10} xl={10}>
                      Eligibility Criteria
                    </Col>
                    <Col md={6} xl={6}>
                      Project Activity
                    </Col>
                    <Col md={4} xl={4}>
                      Yes/No
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.1
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      The composition of bundles shall not change over time
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.2
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      All project activities in the bundle shall have the same crediting period
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.3
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      All project activities in the bundle shall have the same baseline.
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.4
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      All project activities in the bundle shall have the same project type,
                      methodologies and technology/measure
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.5
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      Maximum number of project activities per bundle shall be seven.
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row className="data-row" gutter={24}>
                    <Col md={4} xl={4} className="col-1">
                      4.2.6
                    </Col>
                    <Col md={10} xl={10} className="col-2">
                      Maximum capacity of a project activity of the bundle shall be less than 1.5
                      MW.
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
                        <Select size="large" disabled={disableFields}>
                          <Select.Option value={true}>Yes</Select.Option>
                          <Select.Option value={false}>No</Select.Option>
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
