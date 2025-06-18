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
              <Form.Item
                className="full-width-form-item"
                label={`7.1 ${t('PDD:dataAndParametersAvailable')}`}
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
                          `${t('PDD:dataAndParametersAvailable')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('PDD:dataAndParametersAvailable')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <>
                <div className="form-section">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('PDD:data_parameter')}
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
                                throw new Error(`${t('PDD:data_parameter')} ${t('isRequired')}`);
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
                        label={t('PDD:unit')}
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
                                throw new Error(`${t('PDD:unit')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder={`${t('PDD:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:description')}
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
                                throw new Error(`${t('PDD:description')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:dataSource')}
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
                                throw new Error(`${t('PDD:dataSource')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:justificationOfChoice')}
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
                                  `${t('PDD:justificationOfChoice')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:justificationOfChoicePlaceholder')}`}
                          rows={5}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={12} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t('PDD:purpose')}
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
                                  throw new Error(`${t('PDD:purpose')} ${t('isRequired')}`);
                                }
                              },
                            },
                          ]}
                        >
                          {/* <Input size="large" placeholder={`${t('PDD:purposePlaceholder')}`} /> */}
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
                        label={t('PDD:valueApplied')}
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
                                throw new Error(`${t('PDD:valueApplied')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder={`${t('PDD:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>

              <>
                <h4 className="form-section-title">{`7.2 ${t(
                  'PDD:dataAndParametersMonitored'
                )}`}</h4>
                <div className="form-section">
                  <Row justify={'space-between'} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t('PDD:data_parameter')}
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
                                throw new Error(`${t('PDD:data_parameter')} ${t('isRequired')}`);
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
                        label={t('PDD:unit')}
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
                                throw new Error(`${t('PDD:unit')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          placeholder={`${t('PDD:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:description')}
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
                                throw new Error(`${t('PDD:description')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:dataSource')}
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
                                throw new Error(`${t('PDD:dataSource')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t('PDD:measurementMethodDescription')}
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
                                  `${t('PDD:measurementMethodDescription')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:measuremenMethodDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={t('PDD:monitoringFrequency')}
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
                                  `${t('PDD:monitoringFrequency')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          placeholder={`${t('PDD:monitoringFrequencyPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('PDD:valueApplied')}
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
                                throw new Error(`${t('PDD:valueApplied')} ${t('isRequired')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('PDD:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('PDD:monitoringEquipment')}
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
                                  `${t('PDD:monitoringEquipment')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('PDD:monitoringEquipmentPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t('PDD:monitoringQAProcedures')}
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
                                  `${t('PDD:monitoringQAProcedures')} ${t('isRequired')}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          placeholder={`${t('PDD:monitoringQAProceduresPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <>
                        <LabelWithTooltip
                          label={t('PDD:purpose')}
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
                                  throw new Error(`${t('PDD:purpose')} ${t('isRequired')}`);
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
                        label={t('PDD:calculationMethod')}
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
                                throw new Error(`${t('PDD:calculationMethod')} ${t('isRequired')}`);
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
                        label={t('PDD:monitoringComments')}
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
                                  `${t('PDD:monitoringComments')} ${t('isRequired')}`
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
                  label={`7.3 ${t('PDD:monitoringPlan')}`}
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
                          throw new Error(`${t('PDD:monitoringPlan')} ${t('isRequired')}`);
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

export default Monitoring;
