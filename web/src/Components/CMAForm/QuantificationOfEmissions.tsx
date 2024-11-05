import { Button, Col, DatePicker, Form, Input, Row, StepProps } from 'antd';
import React, { useEffect } from 'react';
import { CustomStepsProps } from './StepProps';
import TextArea from 'antd/lib/input/TextArea';
import { t } from 'i18next';
import moment from 'moment';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';

const EMISSION_CATEGORY_AVG_MAP: { [key: string]: string } = {
  baselineEmissionReductions: 'avgBaselineEmissionReductions',
  projectEmissionReductions: 'avgProjectEmissionReductions',
  leakageEmissionReductions: 'avgLeakageEmissionReductions',
  netEmissionReductions: 'avgNetEmissionReductions',
};
const QuantificationOfEmissions = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } = props;

  useEffect(() => {
    if (!!form.getFieldValue('totalCreditingYears')) {
      form.setFieldValue('totalCreditingYears', 1);
    }
  }, []);

  const calculateNetGHGEmissions = (value?: any, index?: number) => {
    let baselineEmissionReductionsVal = 0;
    let projectEmissionReductionsVal = 0;
    let leakageEmissionReductionsVal = 0;

    if (index === undefined) {
      baselineEmissionReductionsVal = Number(form.getFieldValue('baselineEmissionReductions') || 0);
      projectEmissionReductionsVal = Number(form.getFieldValue('projectEmissionReductions') || 0);
      leakageEmissionReductionsVal = Number(form.getFieldValue('leakageEmissionReductions') || 0);
      const netGHGEmissions =
        baselineEmissionReductionsVal - projectEmissionReductionsVal - leakageEmissionReductionsVal;

      form.setFieldValue('netEmissionReductions', String(netGHGEmissions));
    } else {
      const listVals = form.getFieldValue('extraEmissionReductions');

      if (listVals[index] !== undefined) {
        baselineEmissionReductionsVal = Number(listVals[index].baselineEmissionReductions || 0);
        projectEmissionReductionsVal = Number(listVals[index].projectEmissionReductions || 0);
        leakageEmissionReductionsVal = Number(listVals[index].leakageEmissionReductions || 0);

        const netGHGEmissions =
          baselineEmissionReductionsVal -
          projectEmissionReductionsVal -
          leakageEmissionReductionsVal;

        listVals[index].netEmissionReductions = netGHGEmissions;

        form.setFieldValue('extraEmissionReductions', listVals);
      }
    }
  };

  const CalculateNetTotalEmissions = () => {
    const category = 'netEmissionReductions';
    const categoryToAdd = 'totalNetEmissionReductions';
    let tempTotal = Number(form.getFieldValue(category) || 0);
    const listVals = form.getFieldValue('extraEmissionReductions');
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        if (item[category]) {
          tempTotal += Number(item[category]);
        }
      });
    }
    const creditingYears = Number(form.getFieldValue('totalCreditingYears') || 0);
    form.setFieldValue(categoryToAdd, String(tempTotal));
    const avgTempTotal = creditingYears > 0 ? Math.round(tempTotal / creditingYears) : 0;
    form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], avgTempTotal);
  };

  const calculateTotalEmissions = (value: any, category: string, categoryToAdd: string) => {
    let tempTotal = Number(form.getFieldValue(category) || 0);
    const listVals = form.getFieldValue('extraEmissionReductions');
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        if (item[category]) {
          tempTotal += Number(item[category]);
        }
      });
    }
    const creditingYears = Number(form.getFieldValue('totalCreditingYears') || 0);
    form.setFieldValue(categoryToAdd, String(tempTotal));
    const total = creditingYears > 0 ? Math.round(tempTotal / creditingYears) : 0;
    form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], total);

    CalculateNetTotalEmissions();
  };

  const onPeriodEndChange = (value: any, fieldCounts: number) => {
    let totalCreditingYears = form.getFieldValue('totalCreditingYears') || 0;
    if (value && totalCreditingYears < fieldCounts) {
      totalCreditingYears += 1;
    } else if (value === null && totalCreditingYears !== 0) {
      totalCreditingYears -= 1;
    }
    form.setFieldValue('totalCreditingYears', totalCreditingYears);
    // calculateAvgAnnualERs();
    calculateNetGHGEmissions(value);
    calculateTotalEmissions(value, 'baselineEmissionReductions', 'totalBaselineEmissionReductions');
    calculateTotalEmissions(value, 'projectEmissionReductions', 'totalProjectEmissionReductions');
    calculateTotalEmissions(value, 'leakageEmissionReductions', 'totalLeakageEmissionReductions');
  };

  const onFinish = (values: any) => {
    const tempValues = {
      baselineEmissions: values?.baselineEmissions,
      projectEmissions: values?.projectEmissions,
      leakage: values?.leakage,
      netGHGEmissionReductions: (function () {
        const tempGHG: any = {
          description: values?.netGHGEmissionReductionsAndRemovals,
        };

        const tempYearlyReductions: any = [];

        const firstReduction = {
          startDate: moment(values?.emissionsPeriodStart).startOf('month').unix(),
          endDate: moment(values?.emissionsPeriodEnd).endOf('month').unix(),
          baselineEmissionReductions: Number(values?.baselineEmissionReductions),
          projectEmissionReductions: Number(values?.projectEmissionReductions),
          leakageEmissionReductions: Number(values?.leakageEmissionReductions),
          netEmissionReductions: Number(values?.netEmissionReductions),
        };

        tempYearlyReductions.push(firstReduction);

        if (values?.extraEmissionReductions) {
          values.extraEmissionReductions.forEach((item: any) => {
            const tempObj = {
              startDate: moment(item?.emissionsPeriodStart).startOf('month').unix(),
              endDate: moment(item?.emissionsPeriodEnd).endOf('month').unix(),
              baselineEmissionReductions: Number(item?.baselineEmissionReductions),
              projectEmissionReductions: Number(item?.projectEmissionReductions),
              leakageEmissionReductions: Number(item?.leakageEmissionReductions),
              netEmissionReductions: Number(item?.netEmissionReductions),
            };

            tempYearlyReductions.push(tempObj);
          });
        }
        tempGHG.yearlyGHGEmissionReductions = tempYearlyReductions;
        tempGHG.totalBaselineEmissionReductions = Number(values?.totalBaselineEmissionReductions);
        tempGHG.totalProjectEmissionReductions = Number(values?.totalProjectEmissionReductions);
        tempGHG.totalLeakageEmissionReductions = Number(values?.totalLeakageEmissionReductions);
        tempGHG.totalNetEmissionReductions = Number(values?.totalNetEmissionReductions);
        tempGHG.totalNumberOfCredingYears = Number(values?.totalCreditingYears);
        tempGHG.avgBaselineEmissionReductions = Number(values?.avgBaselineEmissionReductions);
        tempGHG.avgProjectEmissionReductions = Number(values?.avgProjectEmissionReductions);
        tempGHG.avgLeakageEmissionReductions = Number(values?.avgLeakageEmissionReductions);
        tempGHG.avgNetEmissionReductions = Number(values?.avgNetEmissionReductions);

        return tempGHG;
      })(),
    };

    console.log('----------tempValues-----------', tempValues);
    handleValuesUpdate({ quantificationOfGHG: tempValues });
  };

  return (
    <>
      {current === 6 && (
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
                className='className="full-width-form-item'
                label={`${t('CMAForm:baselineEmissions')}`}
                name="baselineEmissions"
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
                        throw new Error(`${t('CMAForm:baselineEmissions')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  placeholder={`${t('CMAForm:baselineEmissionsPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:projectEmissions')}`}
                name="projectEmissions"
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
                        throw new Error(`${t('CMAForm:projectEmissions')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:projectEmissionPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:leakage')}`}
                name="leakage"
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
                        throw new Error(`${t('CMAForm:leakage')} ${t('isRequired')}`);
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={`${t('CMAForm:leakagePlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>

              <Form.Item
                className='className="full-width-form-item'
                label={`${t('CMAForm:netGHGEmissionReductionsAndRemovals')}`}
                name="netGHGEmissionReductionsAndRemovals"
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
                          `${t('CMAForm:netGHGEmissionReductionsAndRemovals')} ${t('isRequired')}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              {/* Estimated Emmissions table start */}
              <>
                <div className="estimated-emmissions-table-form">
                  <Row className="header" justify={'space-between'}>
                    <Col md={6} xl={6}>
                      Year
                    </Col>
                    <Col md={3} xl={3}>
                      Estimated baseline emissions or removals (tCO2e)
                    </Col>
                    <Col md={3} xl={3}>
                      Estimated project emissions or removals (tCO2e)
                    </Col>
                    <Col md={3} xl={3}>
                      Estimated leakage emissions (tCO2e)
                    </Col>
                    <Col md={3} xl={3}>
                      Estimated net GHG emission reductions or removals (tCO2e)
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>

                  <Row justify={'space-between'} align={'middle'}>
                    <Col md={6} xl={6} className="col1">
                      <Form.Item
                        label={``}
                        name="emissionsPeriodStart"
                        className="datepicker"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          placeholder="Start Date"
                          picker="month"
                          format="YYYY MMM"
                          disabled={disableFields}
                          // disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                        />
                      </Form.Item>
                      <p>to</p>
                      <Form.Item
                        label={``}
                        name="emissionsPeriodEnd"
                        className="datepicker"
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
                                throw new Error(`${t('CMAForm:required')}`);
                              }

                              const startDate = moment(
                                form.getFieldValue('emissionsPeriodStart')
                              ).startOf('month');
                              const selectedDate = moment(value).endOf('month');
                              const duration = moment.duration(selectedDate.diff(startDate));

                              const isOneYear = Math.round(duration.asMonths()) === 12;

                              if (!isOneYear) {
                                throw new Error('Duration should be a year');
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          placeholder="End Date"
                          picker="month"
                          format="YYYY MMM"
                          onChange={(value) => onPeriodEndChange(value, 1)}
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate <
                            moment(form.getFieldValue('emissionsPeriodStart')).startOf('month')
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name="baselineEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input
                          disabled={disableFields}
                          onChange={(value) => {
                            calculateNetGHGEmissions(value);
                            calculateTotalEmissions(
                              value,
                              'baselineEmissionReductions',
                              'totalBaselineEmissionReductions'
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name="projectEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input
                          disabled={disableFields}
                          onChange={(value) => {
                            calculateNetGHGEmissions(value);
                            calculateTotalEmissions(
                              value,
                              'projectEmissionReductions',
                              'totalProjectEmissionReductions'
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name="leakageEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input
                          disabled={disableFields}
                          onChange={(value) => {
                            calculateNetGHGEmissions(value);
                            calculateTotalEmissions(
                              value,
                              'leakageEmissionReductions',
                              'totalLeakageEmissionReductions'
                            );
                          }}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name="netEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input onChange={(value) => calculateNetGHGEmissions(value)} disabled />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>

                  <Form.List name="extraEmissionReductions">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <>
                            <Row justify={'space-between'} align={'middle'}>
                              <Col md={6} xl={6} className="col1">
                                <Form.Item
                                  label={``}
                                  name={[name, 'emissionsPeriodStart']}
                                  className="datepicker"
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
                                          throw new Error(`${t('CMAForm:required')}`);
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabled={disableFields}
                                    placeholder="Start Date"
                                    picker="month"
                                    format="YYYY MMM"
                                    // disabledDate={(currentDate: any) => currentDate < moment().startOf('day')}
                                  />
                                </Form.Item>
                                <p>to</p>
                                <Form.Item
                                  label={``}
                                  name={[name, 'emissionsPeriodEnd']}
                                  className="datepicker"
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
                                          throw new Error(`${t('CMAForm:required')}`);
                                        }

                                        const startDate = moment(
                                          form.getFieldValue('extraEmissionReductions')[name]
                                            .emissionsPeriodStart
                                        ).startOf('month');
                                        const selectedDate = moment(value).endOf('month');
                                        const duration = moment.duration(
                                          selectedDate.diff(startDate)
                                        );

                                        const isOneYear = Math.round(duration.asMonths()) === 12;

                                        if (!isOneYear) {
                                          throw new Error('Duration should be a year');
                                        }
                                      },
                                    },
                                  ]}
                                >
                                  <DatePicker
                                    size="large"
                                    disabled={disableFields}
                                    placeholder="End Date"
                                    picker="month"
                                    format="YYYY MMM"
                                    onChange={(value) =>
                                      onPeriodEndChange(value, fields.length + 1)
                                    }
                                    disabledDate={(currentDate: any) =>
                                      currentDate <
                                      moment(
                                        form.getFieldValue('extraEmissionReductions')[name]
                                          .emissionsPeriodStart
                                      ).startOf('month')
                                    }
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={3} xl={3}>
                                <Form.Item
                                  name={[name, 'baselineEmissionReductions']}
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

                                        // eslint-disable-next-line no-restricted-globals
                                        if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value, name);
                                      calculateTotalEmissions(
                                        value,
                                        'baselineEmissionReductions',
                                        'totalBaselineEmissionReductions'
                                      );
                                    }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={3} xl={3}>
                                <Form.Item
                                  name={[name, 'projectEmissionReductions']}
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

                                        // eslint-disable-next-line no-restricted-globals
                                        if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value, name);
                                      calculateTotalEmissions(
                                        value,
                                        'projectEmissionReductions',
                                        'totalProjectEmissionReductions'
                                      );
                                    }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={3} xl={3}>
                                <Form.Item
                                  name={[name, 'leakageEmissionReductions']}
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

                                        // eslint-disable-next-line no-restricted-globals
                                        if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value, name);
                                      calculateTotalEmissions(
                                        value,
                                        'leakageEmissionReductions',
                                        'totalLeakageEmissionReductions'
                                      );
                                    }}
                                  />
                                </Form.Item>
                              </Col>
                              <Col md={3} xl={3}>
                                <Form.Item
                                  name={[name, 'netEmissionReductions']}
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

                                        // eslint-disable-next-line no-restricted-globals
                                        if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input disabled />
                                </Form.Item>
                              </Col>
                              <Col md={2} xl={2}>
                                <Form.Item>
                                  <Button
                                    // type="dashed"
                                    onClick={() => {
                                      // reduceTotalCreditingYears()
                                      remove(name);
                                      onPeriodEndChange(null, fields.length + 1);
                                      calculateTotalEmissions(
                                        null,
                                        'projectEmissionReductions',
                                        'totalProjectEmissionReductions'
                                      );
                                      calculateTotalEmissions(
                                        null,
                                        'baselineEmissionReductions',
                                        'totalBaselineEmissionReductions'
                                      );
                                      calculateTotalEmissions(
                                        null,
                                        'leakageEmissionReductions',
                                        'totalLeakageEmissionReductions'
                                      );
                                    }}
                                    size="small"
                                    className="addMinusBtn"
                                    icon={<MinusOutlined />}
                                    disabled={disableFields}
                                  >
                                    {/* Add Entity */}
                                  </Button>
                                </Form.Item>
                              </Col>
                            </Row>
                          </>
                        ))}

                        <Form.Item>
                          <Button
                            // type="dashed"
                            onClick={() => {
                              // reduceTotalCreditingYears()
                              add();
                            }}
                            size="middle"
                            className="addMinusBtn"
                            // block
                            icon={<PlusOutlined />}
                            disabled={disableFields}
                          >
                            {/* Add Entity */}
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>

                  {/* Emmissions calculations */}
                  {/* calc Row 1 start */}
                  <Row justify={'space-between'} align={'top'}>
                    <Col md={6} xl={6}>
                      Total
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="totalBaselineEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="totalProjectEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="totalLeakageEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="totalNetEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>
                  {/* calc Row 1 end */}

                  {/* calc row 2 start */}
                  <Row justify={'space-between'} align={'top'}>
                    <Col md={6} xl={6}>
                      Total number of crediting years
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="totalCreditingYears"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      {' '}
                    </Col>
                    <Col md={3} xl={3}>
                      {' '}
                    </Col>
                    <Col md={3} xl={3}>
                      {' '}
                    </Col>
                    <Col md={2} xl={2}>
                      {' '}
                    </Col>
                  </Row>
                  {/* calc row 2 end */}

                  {/* calc row 3 start */}
                  <Row justify={'space-between'} align={'top'}>
                    <Col md={6} xl={6}>
                      Annual average over the crediting period
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="avgBaselineEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="avgProjectEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="avgLeakageEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3} className="total-cols">
                      <Form.Item
                        name="avgNetEmissionReductions"
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

                              // eslint-disable-next-line no-restricted-globals
                              if (isNaN(value)) {
                                return Promise.reject(new Error('Should be a number'));
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <Input disabled />
                      </Form.Item>
                    </Col>
                    <Col md={2} xl={2} className="total-cols">
                      {' '}
                    </Col>
                  </Row>
                  {/* calc row 3 end */}
                </div>
              </>
              {/* Estimated Emmissions table end */}
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

export default QuantificationOfEmissions;
