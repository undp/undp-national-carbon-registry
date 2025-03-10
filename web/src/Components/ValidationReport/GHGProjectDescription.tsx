import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';
import { useEffect } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import NetEmissionReduction from '../Common/NetEmissonReduction';

const GHGProjectDescription = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate } = props;

  useEffect(() => {
    form.setFieldValue('baselineEmissions', [{ location: '' }]);
    form.setFieldValue('estimatedNetEmissionReductions', [{ baselineEmissionReductions: 0 }]);
  }, []);
  const onFinish = (values: any) => {
    const body = {
      calculationOfBaselineEmissionFactor: values?.calculationOfBaselineEmissionFactor,
      plantFactor: values?.plantFactor,
      annualEmissionReductionCalculation: values?.annualEmissionReductionCalculation,
      projectemission: values?.projectemission,
      leakageEmission: values?.leakageEmission,
      baselineEmissions: values?.baselineEmissions,
    };
    handleValuesUpdate({ ghgProjectDescription: body });
  };
  return (
    <>
      {current === 1 && (
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
              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:calculationOfBaselineEmissionFactor')}`}
                name="calculationOfBaselineEmissionFactor"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:calculationOfBaselineEmissionFactor')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>
              {/* Grid Emissions start */}
              <Row gutter={[40, 16]} className="grid-emission-factor">
                <Col xl={5}>
                  <p>{t('validationReport:gridEmissionFactorEFCM')}</p>
                </Col>
                <Col xl={4}>
                  <Input disabled placeholder="0.7298" />
                </Col>
                <Col xl={5}>
                  <Input disabled placeholder="tCO2e/MWh" />
                </Col>
                <Col xl={5}>
                  <Input disabled placeholder="Published by  SLSEA (2020)" />
                </Col>
              </Row>
              {/* Grid Emissions end */}

              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:plantFactor')}`}
                name="plantFactor"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:plantFactor')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:annualEmissionReductionCalculation')}`}
                name="annualEmissionReductionCalculation"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:annualEmissionReductionCalculation')} ${t(
                      'isRequired'
                    )}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              {/* Baseline Emmission table start */}
              <LabelWithTooltip label={t('validationReport:baselineEmission')} required={true} />

              <div className="baseline-emisions-table">
                <Row gutter={[40, 16]}>
                  <Col xl={5}></Col>
                  <Col xl={3}>Project Capacity</Col>
                  <Col xl={3}>Plant Factor</Col>
                  <Col xl={3}>
                    Average Energy
                    <br /> Output (EGy)
                  </Col>
                  <Col xl={3}>
                    Average Emission
                    <br /> Factor (EFy)
                  </Col>
                  <Col xl={3}>
                    Emission Reduction
                    <br /> (ERy)
                  </Col>
                </Row>

                <Row gutter={[40, 16]} className="mg-top-1">
                  <Col xl={2}></Col>
                  <Col xl={3} style={{ textAlign: 'right' }}>
                    Units
                  </Col>
                  <Col xl={3}>
                    <Input placeholder="kWp" disabled />
                  </Col>
                  <Col xl={3}>
                    <Input placeholder="%" disabled />
                  </Col>
                  <Col xl={3}>
                    <Input placeholder="MWh/Year" disabled />
                  </Col>
                  <Col xl={3}>
                    <Input placeholder="tCO2/MWh" disabled />
                  </Col>
                  <Col xl={3}>
                    <Input placeholder="tCO2/Year" disabled />
                  </Col>
                </Row>

                <Row gutter={[40, 16]}>
                  <Col xl={3}>Location</Col>
                </Row>

                <Row gutter={[40, 16]} className="mg-top-1 mg-bottom-2 baseline-emissions-table">
                  <Form.List name="baselineEmissions">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restFields }) => (
                          <>
                            <Col xl={5}>
                              <Form.Item
                                name={[name, 'location']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col xl={3}>
                              <Form.Item
                                name={[name, 'projectCapacity']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col xl={3}>
                              <Form.Item
                                name={[name, 'plantFactor']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col xl={3} className="actions">
                              <Form.Item
                                name={[name, 'avgEnergyOutput']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col xl={3}>
                              <Form.Item
                                name={[name, 'gridEmissionFactor']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col xl={3}>
                              <Form.Item
                                name={[name, 'emissionReduction']}
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
                                        throw new Error(`${t('validationReport:required')}`);
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                            <Col xl={3} className="actions">
                              <Form.Item>
                                <Button
                                  onClick={add}
                                  size="small"
                                  className="addMinusBtn"
                                  icon={<PlusOutlined />}
                                ></Button>
                              </Form.Item>
                              {name > 0 && (
                                <Form.Item>
                                  <Button
                                    // type="dashed"
                                    onClick={() => {
                                      // removeParticipants(name2);
                                      remove(name);
                                    }}
                                    size="small"
                                    className="addMinusBtn"
                                    // block
                                    icon={<MinusOutlined />}
                                    // disabled={disableFields}
                                  >
                                    {/* Minus Participant */}
                                  </Button>
                                </Form.Item>
                              )}
                            </Col>
                          </>
                        ))}
                      </>
                    )}
                  </Form.List>
                </Row>
              </div>
              {/* Baseline Emmission table end */}

              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:projectemission')}`}
                name="projectemission"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:projectemission')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item
                className="full-width-form-item"
                label={`${t('validationReport:leakageEmission')}`}
                name="leakageEmission"
                rules={[
                  {
                    required: true,
                    message: `${t('validationReport:leakageEmission')} ${t('isRequired')}`,
                  },
                ]}
              >
                <TextArea rows={4} />
              </Form.Item>

              {/* Estimated net emissions reduction start */}
              <h4 className="form-section-heading">
                {t('validationReport:estimatedNetEmissionReduction')}
              </h4>
              <NetEmissionReduction
                form={form}
                t={t}
                projectCategory={null}
                disableFields={false}
              ></NetEmissionReduction>
              {/* Estimated net emissions reduction end */}

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev}>
                  {t('validationReport:prev')}
                </Button>
                <Button
                  type="primary"
                  size={'large'}
                  onClick={next}
                  // htmlType="submit"
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

export default GHGProjectDescription;
