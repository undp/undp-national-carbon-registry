import { Button, Col, Form, Input, Row, Select } from 'antd';
import { CustomStepsProps } from './StepProps';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';

import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';

const Monitoring = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, projectCategory, disableFields } = props;

  const onFinish = (values: any) => {
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
                          `${t('CMAForm:dataAndParametersAvailable')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:dataAndParametersAvailable')}`}
                  disabled={disableFields}
                />
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
                                  `${t('CMAForm:data_parameter')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:unit')}
                        name="unit"
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
                                throw new Error(`${t('CMAForm:unit')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder={`${t('CMAForm:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:description')}
                        name="description"
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
                                throw new Error(`${t('CMAForm:description')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                throw new Error(`${t('CMAForm:dataSource')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                  `${t('CMAForm:justificationOfChoice')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:justificationOfChoicePlaceholder')}`}
                          rows={5}
                          size="large"
                          disabled={disableFields}
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
                                  throw new Error(`${t('CMAForm:purpose')} ${t('isRequired')}`);
                                }
                              },
                            },
                          ]}
                        >
                          {/* <Input size="large" placeholder={`${t('CMAForm:purposePlaceholder')}`} /> */}
                          <Select size="large" disabled={disableFields}>
                            {projectCategory === 'RENEWABLE_ENERGY' && (
                              <Select.Option value="Determination of Baseline Scenario">
                                Determination of Baseline Scenario
                              </Select.Option>
                            )}
                            <Select.Option value="Calculation of Baseline Emissions">
                              Calculation of Baseline Emissions
                            </Select.Option>
                            <Select.Option value="Calculation of project emissions">
                              Calculation of Project Emissions
                            </Select.Option>
                            <Select.Option value="Calculation of leakage">
                              Calculation of Leakage
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
                                throw new Error(`${t('CMAForm:valueApplied')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder={`${t('CMAForm:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
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
                                  `${t('CMAForm:data_parameter')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input size="large" disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('CMAForm:unit')}
                        name="monitoringUnit"
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
                                throw new Error(`${t('CMAForm:unit')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder={`${t('CMAForm:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('CMAForm:description')}
                        name="monitoringDescription"
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
                                throw new Error(`${t('CMAForm:description')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                throw new Error(`${t('CMAForm:dataSource')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                  `${t('CMAForm:measurementMethodDescription')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:measuremenMethodDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                  `${t('CMAForm:monitoringFrequency')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('CMAForm:monitoringFrequencyPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
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
                                throw new Error(`${t('CMAForm:valueApplied')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
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
                                  `${t('CMAForm:monitoringEquipment')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:monitoringEquipmentPlaceholder')}`}
                          disabled={disableFields}
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
                                  `${t('CMAForm:monitoringQAProcedures')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('CMAForm:monitoringQAProceduresPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <>
                        <LabelWithTooltip
                          label={t('CMAForm:purpose')}
                          required={true}
                          tooltipContent={
                            <div className="tooltip">
                              <p>Indicate one of the following:</p>
                              <ul>
                                <li>Calculation of baseline emissions. </li>
                                <li>Calculation of project emissions</li>
                                <li>Calculation of leakage </li>
                              </ul>
                            </div>
                          }
                          tooltipPosition={TooltipPostion.top}
                          tooltipWidth={290}
                        />
                        <Form.Item
                          name="monitoringPurpose"
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
                                  throw new Error(`${t('CMAForm:purpose')} ${t('isRequired')}`);
                                }
                              },
                            },
                          ]}
                        >
                          <TextArea rows={4} size="large" disabled={disableFields} />
                        </Form.Item>
                      </>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('CMAForm:calculationMethod')}
                        name="monitoringCalculation"
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
                                  `${t('CMAForm:calculationMethod')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          disabled={disableFields}
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
                                  `${t('CMAForm:monitoringComments')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder="Provide any comments"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <>
                <LabelWithTooltip
                  label={`7.3 ${t('CMAForm:monitoringPlan')}`}
                  tooltipPosition={TooltipPostion.top}
                  tooltipWidth={800}
                  required={true}
                  tooltipContent={
                    <div>
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
                  }
                />
                <Form.Item
                  className="full-width-form-item"
                  name="monitoringPlan"
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
                          throw new Error(`${t('CMAForm:monitoringPlan')} ${t('isRequired')}`);
                        }
                      },
                    },
                  ]}
                >
                  <TextArea rows={4} disabled={disableFields} />
                </Form.Item>
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

export default Monitoring;
