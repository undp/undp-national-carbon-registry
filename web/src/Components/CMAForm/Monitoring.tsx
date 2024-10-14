import { Button, Col, Form, Input, Row, Select, StepProps } from 'antd';
import React from 'react';
import { CustomStepsProps } from './StepProps';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';
import { countries } from 'react-circle-flags';
import {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  formatPhoneNumberIntl,
  Country,
} from 'react-phone-number-input';
import { InfoCircleOutlined } from '@ant-design/icons';

const Monitoring = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, projectCategory } = props;

  const onFinish = (values: any) => {
    console.log('-----values---------', values);
    const tempValues = {
      dataAndParametersDescription: values?.dataAndParametersAvailable,
      validationParameters: {
        parameter: values?.parameter,
        unit: values?.unit,
        description: values?.description,
        source: values?.source,
        purpose: values?.purpose,
        valueApplied: values?.valueApplied,
        justification: values?.justification,
      },
      monitoredParameters: {
        parameter: values?.monitoringParameter,
        unit: values?.monitoringUnit,
        description: values?.monitoringDescription,
        source: values?.monitoringSource,
        measurementMethods: values?.monitoringMeasurementMethods,
        frequency: values?.monitoringFrequency,
        valueApplied: values?.monitoringValueApplied,
        monitoringEquipment: values?.monitoringEquipment,
        qaQCProcedures: values?.monitoringQAProcedures,
        purpose: values?.monitoringPurpose,
        calculationMethod: values?.monitoringCalculation,
        comments: values?.monitoringComments,
      },
      monitoringPlan: values?.monitoringPlan,
    };
    handleValuesUpdate({ monitoring: tempValues });
  };
  return (
    <>
      {current === 7 && (
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
                console.log('-----values---------', values);
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Form.Item
                className="full-width-form-item"
                label={`7.1 ${t('CMAForm:dataAndParametersAvailable')}`}
                name="dataAndParametersAvailable"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:dataAndParametersAvailable')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} placeholder={`${t('CMAForm:dataAndParametersAvailable')}`} />
              </Form.Item>

              <>
                <div className="form-section">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:data_parameter')}
                        name="parameter"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:data_parameter')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:unit')}
                        name="unit"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:unit')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input placeholder={`${t('CMAForm:unitPlaceholder')}`} size="large" />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:description')}
                        name="description"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:description')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:dataSource')}
                        name="source"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:dataSource')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:justificationOfChoice')}
                        name="justification"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:justificationOfChoice')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:justificationOfChoicePlaceholder')}`}
                          rows={5}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('CMAForm:purpose')}
                          name="purpose"
                          rules={[
                            {
                              required: true,
                              message: `${t('CMAForm:purpose')} ${t('isRequired')}`,
                            },
                          ]}
                        >
                          {/* <Input size="large" placeholder={`${t('CMAForm:purposePlaceholder')}`} /> */}
                          <Select size="large">
                            {projectCategory === 'RENEWABLE_ENERGY' && (
                              <Select.Option value="Determination of baseline scenario">
                                Determination of baseline scenario
                              </Select.Option>
                            )}
                            <Select.Option value="Calculation of baseline emissions">
                              Calculation of baseline emissions
                            </Select.Option>
                            <Select.Option value="Calculation of project emissions">
                              Calculation of project emissions
                            </Select.Option>
                            <Select.Option value="Calculation of leakage">
                              Calculation of leakage
                            </Select.Option>
                          </Select>
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:valueApplied')}
                        name="valueApplied"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:valueApplied')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder={`${t('CMAForm:valueAppliedPlaceholder')}`}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <>
                <h4 className="form-section-title">{`7.2 ${t(
                  'CMAForm:dataAndParametersMonitored'
                )}`}</h4>
                <div className="form-section">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:data_parameter')}
                        name="monitoringParameter"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:data_parameter')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input size="large" />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:unit')}
                        name="monitoringUnit"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:unit')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <Input placeholder={`${t('CMAForm:unitPlaceholder')}`} size="large" />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:description')}
                        name="monitoringDescription"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:description')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:dataSource')}
                        name="monitoringSource"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:dataSource')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:measurementMethodDescription')}
                        name="monitoringMeasurementMethods"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:measurementMethodDescription')} ${t(
                              'isRequired'
                            )}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:measuremenMethodDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={t('CMAForm:monitoringFrequency')}
                        name="monitoringFrequency"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:monitoringFrequency')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:monitoringFrequencyPlaceholder')}`}
                          rows={2}
                          size="large"
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:valueApplied')}
                        name="monitoringValueApplied"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:valueApplied')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:valueAppliedPlaceholder')}`}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:monitoringEquipment')}
                        name="monitoringEquipment"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:monitoringEquipment')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:monitoringEquipmentPlaceholder')}`}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:monitoringQAProcedures')}
                        name="monitoringQAProcedures"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:monitoringQAProcedures')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:monitoringQAProceduresPlaceholder')}`}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:purpose')}
                        name="monitoringPurpose"
                        tooltip={{
                          title: (
                            <div className="tooltip">
                              <p>Indicate one of the following:</p>
                              <ul>
                                <li>Calculation of baseline emissions. </li>
                                <li>Calculation of project emissions</li>
                                <li>Calculation of leakage </li>
                              </ul>
                            </div>
                          ),
                          icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                          placement: 'topLeft',
                        }}
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:purpose')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea rows={4} size="large" />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:calculationMethod')}
                        name="monitoringCalculation"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:calculationMethod')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder="Where relevant, provide the calculation method, including  any equations, used to establish the data/parameter."
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:monitoringComments')}
                        name="monitoringComments"
                        rules={[
                          {
                            required: true,
                            message: `${t('CMAForm:monitoringComments')} ${t('isRequired')}`,
                          },
                        ]}
                      >
                        <TextArea rows={4} size="large" placeholder="Provide any comments" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <Form.Item
                className="full-width-form-item"
                label={`7.3 ${t('CMAForm:monitoringPlan')}`}
                name="monitoringPlan"
                rules={[
                  {
                    required: true,
                    message: `${t('CMAForm:monitoringPlan')} ${t('isRequired')}`,
                  },
                ]}
                tooltip={{
                  title: (
                    <div className="tooltip">
                      <p>
                        Describe the process and schedule for obtaining, recording, compiling and
                        analysing the monitored data and parameters set out in Section 0 (Data and
                        Parameters Monitored) above. Include details on the following:
                      </p>
                      <ul>
                        <li>
                          The methods for measuring, recording, storing, aggregating, collating and
                          reporting data and parameters. Where relevant, include the procedures for
                          calibrating monitoring equipment.{' '}
                        </li>
                        <li>
                          The organizational structure, responsibilities and competencies of the
                          personnel that will be carrying out monitoring activities. The policies
                          for oversight and accountability of monitoring activities. The procedures
                          for internal auditing and QA/QC.{' '}
                        </li>
                        <li>
                          The procedures for handling non-conformances with the validated monitoring
                          plan.{' '}
                        </li>
                        <li>
                          Any sampling approaches used, including target precision levels, sample
                          sizes, sample site locations, stratification, frequency of measurement and
                          QA/QC procedures.
                        </li>
                      </ul>
                      <p>
                        Where appropriate, include line diagrams to display the GHG data collection
                        and management system.
                      </p>
                    </div>
                  ),
                  icon: <InfoCircleOutlined style={{ color: 'rgba(58, 53, 65, 0.5)' }} />,
                  placement: 'topLeft',
                }}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('CMAForm:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  // onClick={next}
                  htmlType="submit"
                >
                  {t('CMAForm:nextP')}
                </Button>
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default Monitoring;
