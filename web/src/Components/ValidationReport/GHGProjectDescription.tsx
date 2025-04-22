import { ValidationStepsProps } from './StepProps';
import { Row, Button, Form, Col, Input } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import LabelWithTooltip from '../LabelWithTooltip/LabelWithTooltip';
import { useEffect, useState } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import NetEmissionReduction from '../Common/NetEmissonReduction';
import { useLocation } from 'react-router-dom';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import moment from 'moment';

const GHGProjectDescription = (props: ValidationStepsProps) => {
  const { prev, next, form, current, t, countries, handleValuesUpdate, disableFields, formMode } =
    props;

  console.log('----------------', form.getFieldValue('baselineEmissions'));
  // useEffect(() => {
  //   if (formMode === FormMode.CREATE) {
  //     //form.setFieldValue('baselineEmissions', [{ location: '' }]);
  //     form.setFieldValue('estimatedNetEmissionReductions', [{ baselineEmissionReductions: 0 }]);
  //   }
  // }, []);

  const onFinish = (values: any) => {
    const body = {
      ...values,
      estimatedNetEmissionReductions: values?.estimatedNetEmissionReductions.map((item: any) => {
        const temp = {
          ...item,
          startDate: item?.startDate ? moment(item?.startDate).startOf('day').unix() : undefined,
          endDate: item?.endDate ? moment(item?.endDate).startOf('day').unix() : undefined,
        };
        return temp;
      }),
      calculationOfBaselineEmissionFactor: values?.calculationOfBaselineEmissionFactor,
      plantFactor: values?.plantFactor,
      annualEmissionReductionCalculation: values?.annualEmissionReductionCalculation,
      projectemission: values?.projectemission,
      leakageEmission: values?.leakageEmission,
      baselineEmissions: values?.baselineEmissions,
    };
    console.log('--------body---------', body);
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
              disabled={disableFields}
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
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              {/* Grid Emissions start */}
              <Row gutter={[40, 16]} className="grid-emission-factor">
                <Col xl={6}>
                  <p>{t('validationReport:gridEmissionFactorEFCM')}</p>
                </Col>
                <Col xl={3}>
                  <Form.Item
                    className="full-width-form-item"
                    name="gridEmissionFactorValue"
                    rules={[
                      {
                        required: false,
                        message: `${t('validationReport:gridEmissionFactorValue')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <Input placeholder="Value" />
                  </Form.Item>
                </Col>
                <Col xl={5}>
                  <Form.Item
                    className="full-width-form-item"
                    name="gridEmissionFactorUnit"
                    rules={[
                      {
                        required: false,
                        message: `${t('validationReport:gridEmissionFactorUnit')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <Input placeholder="Unit" />
                  </Form.Item>
                </Col>
                <Col xl={5}>
                  <Form.Item
                    className="full-width-form-item"
                    name="gridEmissionFactorSource"
                    rules={[
                      {
                        required: false,
                        message: `${t('validationReport:gridEmissionFactorSource')} ${t(
                          'isRequired'
                        )}`,
                      },
                    ]}
                  >
                    <Input placeholder="Source" />
                  </Form.Item>
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
                <TextArea rows={4} disabled={disableFields} />
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
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              {/* Baseline Emmission table start */}
              <h4 className="form-section-heading">
                {t('validationReport:baselineEmission')} <span style={{ color: '#FF4D4F' }}>*</span>
              </h4>

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
                    Grid Emission
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
                                <Input disabled={disableFields} />
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
                                <Input disabled={disableFields} />
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
                                <Input disabled={disableFields} />
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
                                <Input disabled={disableFields} />
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
                                <Input disabled={disableFields} />
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
                                <Input disabled={disableFields} />
                              </Form.Item>
                            </Col>
                            <Col xl={3} className="actions">
                              <Form.Item>
                                <Button
                                  onClick={add}
                                  size="small"
                                  className="addMinusBtn"
                                  icon={<PlusOutlined />}
                                  disabled={disableFields}
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
                                    disabled={disableFields}
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
                <TextArea rows={4} disabled={disableFields} />
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
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              {/* Estimated net emissions reduction start */}
              <h4 className="form-section-heading">
                {t('validationReport:estimatedNetEmissionReduction')}
              </h4>
              <NetEmissionReduction
                form={form}
                t={t}
                projectCategory={null}
                disabled={disableFields}
              ></NetEmissionReduction>
              {/* Estimated net emissions reduction end */}

              <Row justify={'end'} className="step-actions-end">
                <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" size={'large'} disabled={false} onClick={next}>
                    {t('validationReport:next')}
                  </Button>
                ) : (
                  <Button type="primary" size={'large'} disabled={false} htmlType="submit">
                    {t('validationReport:next')}
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

export default GHGProjectDescription;
