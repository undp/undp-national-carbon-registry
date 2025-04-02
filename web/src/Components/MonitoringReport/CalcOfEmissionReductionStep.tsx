//import { UploadOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, Row, Upload, DatePicker } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { FormMode } from '../../Definitions/Enums/formMode.enum';
import LabelWithTooltip, { TooltipPostion } from '../LabelWithTooltip/LabelWithTooltip';
import { MinusOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import NetEmissionReduction from '../Common/NetEmissonReduction';
import { fileUploadValueExtract, formatNumberWithDecimalPlaces } from '../../Utils/utilityHelper';
import moment from 'moment';
import { getBase64 } from '../../Definitions/Definitions/programme.definitions';
import { RcFile } from 'antd/lib/upload';
import { CustomStepsProps } from './StepProps';

const EMISSION_CATEGORY_AVG_MAP: { [key: string]: string } = {
  baselineEmissionReductions: 'avgBaselineEmissionReductions',
  projectEmissionReductions: 'avgProjectEmissionReductions',
  leakageEmissionReductions: 'avgLeakageEmissionReductions',
  netEmissionReductions: 'avgNetEmissionReductions',
};

export const CalcEmissionReductionStep = (props: CustomStepsProps) => {
  const { t, current, form, formMode, next, prev, handleValuesUpdate, disableFields } = props;
  const maximumImageSize = process.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(process.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  // const t = translator.t;

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

      if (netGHGEmissions < 0) {
        form.setFields([
          {
            name: 'netEmissionReductions',
            errors: [`${t('monitoringReport:ce_shouldHavePositive')}`],
          },
        ]);
      } else {
        form.setFields([
          {
            name: 'netEmissionReductions',
            errors: [],
          },
        ]);
      }
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

        if (netGHGEmissions < 0) {
          form.setFields([
            {
              name: ['extraEmissionReductions', index, 'netEmissionReductions'],
              errors: [`${t('monitoringReport:ce_shouldHavePositive')}`],
            },
          ]);
        } else {
          form.setFields([
            {
              name: ['extraEmissionReductions', index, 'netEmissionReductions'],
              errors: [],
            },
          ]);
        }

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
    const avgTempTotal =
      creditingYears > 0 ? formatNumberWithDecimalPlaces(tempTotal / creditingYears) : 0;
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
    const total =
      creditingYears > 0 ? formatNumberWithDecimalPlaces(tempTotal / creditingYears) : 0;
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
    calculateNetGHGEmissions(value);
    calculateTotalEmissions(value, 'baselineEmissionReductions', 'totalBaselineEmissionReductions');
    calculateTotalEmissions(value, 'projectEmissionReductions', 'totalProjectEmissionReductions');
    calculateTotalEmissions(value, 'leakageEmissionReductions', 'totalLeakageEmissionReductions');
  };

  const onFinish = async (values: any) => {
    const tempValues: any = {
      calcEmissionReductions: {
        ce_baselineEmission: values?.ce_baselineEmission,
        ce_documentUpload: (await fileUploadValueExtract(values, 'ce_documentUpload'))[0],
        ce_projectEmissions: values?.ce_projectEmissions,
        ce_leakage: values?.ce_leakage,

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
          tempGHG.totalNumberOfCreditingYears = Number(values?.totalCreditingYears);
          tempGHG.avgBaselineEmissionReductions = Number(values?.avgBaselineEmissionReductions);
          tempGHG.avgProjectEmissionReductions = Number(values?.avgProjectEmissionReductions);
          tempGHG.avgLeakageEmissionReductions = Number(values?.avgLeakageEmissionReductions);
          tempGHG.avgNetEmissionReductions = Number(values?.avgNetEmissionReductions);

          return tempGHG;
        })(),

        item: values?.item,
        valueApplied: values?.valueApplied,
        actualValues: values?.actualValues,
        ce_remarks: values?.ce_remarks,
      },
    };
    handleValuesUpdate(tempValues);
    //     titleAndReference: values?.titleAndReferenceOfMethodology,
    //     applicability: values?.applicabilityOfMethodology,
    //     // baselineScenario: values?.baselineScenario,
    //     // additionality: values?.additionality,
    //     descriptionOfBaselineScenario: values?.descriptionOfBaselineScenario,
    //     demonstrationOfAdditionality: values?.demonstrationOfAdditionality,
    //     exAnteCalculationOfEmissionReduction: values?.exAnteCalculationOfEmissionReduction,
    //     emissionReductionEstimation: values?.emissionReductionEstimation,
    //     monitoringPlan: values?.monitoringPlan,
    //     dataAndParametersExAnte: {
    //       parameter: values?.parameter,
    //       unit: values?.unit,
    //       description: values?.description,
    //       dataSource: values?.dataSource,
    //       descriptionOfMeasurementMethods: values?.descriptionOfMeasurementMethods,
    //       purpose: values?.purpose,
    //       comments: values?.comments,
    //     },
    //     dataAndParametersMonitored: {
    //       monitoringParameter: values?.monitoringParameter,
    //       monitoringUnit: values?.monitoringUnit,
    //       unit: values?.unit,
    //       monitoringDescription: values?.monitoringDescription,
    //       data_parameterDescription: values?.data_parameterDescription,
    //       monitoringSource: values?.monitoringSource,
    //       monitoringMeasurementMethods: values?.monitoringMeasurementMethods,
    //       monitoringFrequency: values?.monitoringFrequency,
    //       monitoringValueApplied: values?.monitoringValueApplied,
    //       monitoringEquipment: values?.monitoringEquipment,
    //       monitoringQAProcedures: values?.monitoringQAProcedures,
    //       monitoringPurpose: values?.monitoringPurpose,
    //       monitoringCalculation: values?.monitoringCalculation,
    //       monitoringComments: values?.monitoringComments,
    //     },
    //     samplingPlan: values?.samplingPlan,
    //     otherElementsOfMonitoringPlan: values?.otherElementsOfMonitoringPlan,
    //     methodologyDeviations: values?.methodologyDeviations,
    //     projectBoundary: (function () {
    //       const tempVal: any = {};

    //       const tempbaseline = [];
    //       const firstBaseline = {
    //         source: values?.baselineSource,
    //         isCO2Included: values?.baselineIsCO2Included,
    //         co2Justification: values?.baselineco2Justification,
    //         isCH4Included: values?.baselineIsCH4Included,
    //         ch4Justification: values?.baselinech4Justification,
    //         isN2OIncluded: values?.baselineIsN2OIncluded,
    //         n2oJustification: values?.baselinen2oJustification,
    //         isOtherIncluded: values?.baselineIsOtherIncluded,
    //         otherJustification: values?.baselineotherJustification,
    //       };

    //       tempbaseline.push(firstBaseline);

    //       if (values?.extraBaseline) {
    //         values.extraBaseline.forEach((item: any) => {
    //           const tempObj: any = {
    //             source: item?.source,
    //             isCO2Included: item?.isCO2Included,
    //             co2Justification: item?.co2Justification,
    //             isCH4Included: item?.isCH4Included,
    //             ch4Justification: item?.ch4Justification,
    //             isN2OIncluded: item?.isN2OIncluded,
    //             n2oJustification: item?.n2oJustification,
    //             isOtherIncluded: item?.isOtherIncluded,
    //             otherJustification: item?.otherJustification,
    //           };
    //           tempbaseline.push(tempObj);
    //         });
    //       }

    //       const tempProject: any = [];
    //       const firstProject = {
    //         source: values?.projectSource,
    //         isCO2Included: values?.projectIsCO2Included,
    //         co2Justification: values?.projectco2Justification,
    //         isCH4Included: values?.projectIsCH4Included,
    //         ch4Justification: values?.projectch4Justification,
    //         isN2OIncluded: values?.projectIsN2OIncluded,
    //         n2oJustification: values?.projectn2oJustification,
    //         isOtherIncluded: values?.projectIsOtherIncluded,
    //         otherJustification: values?.projectotherJustification,
    //       };
    //       tempProject.push(firstProject);
    //       if (values.extraProject) {
    //         values.extraProject.forEach((item: any) => {
    //           const tempObj: any = {
    //             source: item?.source,
    //             isCO2Included: item?.isCO2Included,
    //             co2Justification: item?.co2Justification,
    //             isCH4Included: item?.isCH4Included,
    //             ch4Justification: item?.ch4Justification,
    //             isN2OIncluded: item?.isN2OIncluded,
    //             n2oJustification: item?.n2oJustification,
    //             isOtherIncluded: item?.isOtherIncluded,
    //             otherJustification: item?.otherJustification,
    //           };
    //           tempProject.push(tempObj);
    //         });
    //       }

    //       tempVal.baseline = tempbaseline;
    //       tempVal.project = tempProject;

    //       return tempVal;
    //     })(),
    //     netGHGEmissionReductions: (function () {
    //       const tempGHG: any = {
    //         description: values?.netGHGEmissionReductionsAndRemovals,
    //       };

    //       const tempYearlyReductions: any = [];

    //       const firstReduction = {
    //         startDate: moment(values?.emissionsPeriodStart).startOf('month').unix(),
    //         endDate: moment(values?.emissionsPeriodEnd).endOf('month').unix(),
    //         baselineEmissionReductions: Number(values?.baselineEmissionReductions),
    //         projectEmissionReductions: Number(values?.projectEmissionReductions),
    //         leakageEmissionReductions: Number(values?.leakageEmissionReductions),
    //         netEmissionReductions: Number(values?.netEmissionReductions),
    //       };

    //       tempYearlyReductions.push(firstReduction);

    //       if (values?.extraEmissionReductions) {
    //         values.extraEmissionReductions.forEach((item: any) => {
    //           const tempObj = {
    //             startDate: moment(item?.emissionsPeriodStart).startOf('month').unix(),
    //             endDate: moment(item?.emissionsPeriodEnd).endOf('month').unix(),
    //             baselineEmissionReductions: Number(item?.baselineEmissionReductions),
    //             projectEmissionReductions: Number(item?.projectEmissionReductions),
    //             leakageEmissionReductions: Number(item?.leakageEmissionReductions),
    //             netEmissionReductions: Number(item?.netEmissionReductions),
    //           };

    //           tempYearlyReductions.push(tempObj);
    //         });
    //       }
    //       tempGHG.yearlyGHGEmissionReductions = tempYearlyReductions;
    //       tempGHG.totalBaselineEmissionReductions = Number(values?.totalBaselineEmissionReductions);
    //       tempGHG.totalProjectEmissionReductions = Number(values?.totalProjectEmissionReductions);
    //       tempGHG.totalLeakageEmissionReductions = Number(values?.totalLeakageEmissionReductions);
    //       tempGHG.totalNetEmissionReductions = Number(values?.totalNetEmissionReductions);
    //       tempGHG.totalNumberOfCredingYears = Number(values?.totalCreditingYears);
    //       tempGHG.avgBaselineEmissionReductions = Number(values?.avgBaselineEmissionReductions);
    //       tempGHG.avgProjectEmissionReductions = Number(values?.avgProjectEmissionReductions);
    //       tempGHG.avgLeakageEmissionReductions = Number(values?.avgLeakageEmissionReductions);
    //       tempGHG.avgNetEmissionReductions = Number(values?.avgNetEmissionReductions);

    //       return tempGHG;
    //     })(),
    //   handleValuesUpdate({ applicationOfMethodology: tempValues });
  };

  return (
    <>
      {current === 5 && (
        <div>
          <div className="step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              // disabled={disableFields}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
            >
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item
                      label={`${t('monitoringReport:ce_baselineEmission')}`}
                      name="ce_baselineEmission"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:ce_baselineEmission')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={disableFields} />
                    </Form.Item>

                    {/* <Form.Item name="q_baselineEmission2">
                      <TextArea rows={4} disabled={true} />
                    </Form.Item> */}

                    <Form.Item
                      label={t('monitoringReport:ce_documentUpload')}
                      name="ce_documentUpload"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={false}
                      rules={[
                        {
                          validator: async (rule, file) => {
                            if (file?.length > 0) {
                              if (file[0]?.size > maximumImageSize) {
                                // default size format of files would be in bytes -> 1MB = 1000000bytes
                                throw new Error(`${t('common:maxSizeVal')}`);
                              }
                            }
                          },
                        },
                      ]}
                    >
                      <Upload
                        accept=".doc, .docx, .pdf, .png, .jpg"
                        beforeUpload={(file: any) => {
                          return false;
                        }}
                        className="design-upload-section"
                        name="design"
                        action="/upload.do"
                        listType="picture"
                        multiple={false}
                        // maxCount={1}
                      >
                        <Button
                          className="upload-doc"
                          size="large"
                          icon={<UploadOutlined />}
                          disabled={disableFields}
                        >
                          {t('monitoringReport:upload')}
                        </Button>
                      </Upload>
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:ce_projectEmissions')}`}
                      name="ce_projectEmissions"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:ce_projectEmissions')} ${t(
                            'isRequired'
                          )}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={`${t('monitoringReport:ce_leakage')}`}
                      name="ce_leakage"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:ce_leakage')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={disableFields} />
                    </Form.Item>

                    <>
                      <h3 className="form-section-title">
                        {`${t('monitoringReport:ce_estimatedEmissionReduction')}`}
                      </h3>

                      {/* need to update this */}
                      <>
                        <>
                          <div className="estimated-emmissions-table-form">
                            <Row className="header" justify={'space-between'}>
                              <Col md={6} xl={6}>
                                Year
                              </Col>
                              <Col md={3} xl={3}>
                                Estimated Baseline Emissions Or Removals (tCO₂e)
                              </Col>
                              <Col md={3} xl={3}>
                                Estimated Project Emissions Or Removals (tCO₂e)
                              </Col>
                              <Col md={3} xl={3}>
                                Estimated Leakage Emissions (tCO₂e)
                              </Col>
                              <Col md={3} xl={3}>
                                Estimated Net GHG Emission Reductions Or Removals (tCO₂e)
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
                                        }

                                        const startDate = moment(
                                          form.getFieldValue('emissionsPeriodStart')
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
                                    placeholder="End Date"
                                    picker="month"
                                    format="YYYY MMM"
                                    onChange={(value) => onPeriodEndChange(value, 1)}
                                    disabled={disableFields}
                                    disabledDate={(currentDate: any) =>
                                      currentDate <
                                      moment(form.getFieldValue('emissionsPeriodStart')).startOf(
                                        'month'
                                      )
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
                                          throw new Error(`${t('monitoringReport:required')}`);
                                        } else if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        } else if (Number(value) < 0) {
                                          return Promise.reject(
                                            new Error(
                                              `${t('monitoringReport:ce_shouldHavePositive')}`
                                            )
                                          );
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value);
                                      calculateTotalEmissions(
                                        value,
                                        'baselineEmissionReductions',
                                        'totalBaselineEmissionReductions'
                                      );
                                    }}
                                    step="1"
                                    onKeyDown={(e) =>
                                      (e.key === '.' || e.key === ',') && e.preventDefault()
                                    }
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
                                          throw new Error(`${t('monitoringReport:required')}`);
                                        } else if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        } else if (Number(value) < 0) {
                                          return Promise.reject(
                                            new Error(
                                              `${t('monitoringReport:ce_shouldHavePositive')}`
                                            )
                                          );
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value);
                                      calculateTotalEmissions(
                                        value,
                                        'projectEmissionReductions',
                                        'totalProjectEmissionReductions'
                                      );
                                    }}
                                    step="1"
                                    onKeyDown={(e) =>
                                      (e.key === '.' || e.key === ',') && e.preventDefault()
                                    }
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
                                          throw new Error(`${t('monitoringReport:required')}`);
                                        } else if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        } else if (Number(value) < 0) {
                                          return Promise.reject(
                                            new Error(
                                              `${t('monitoringReport:ce_shouldHavePositive')}`
                                            )
                                          );
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    disabled={disableFields}
                                    onChange={(value) => {
                                      calculateNetGHGEmissions(value);
                                      calculateTotalEmissions(
                                        value,
                                        'leakageEmissionReductions',
                                        'totalLeakageEmissionReductions'
                                      );
                                    }}
                                    step="1"
                                    onKeyDown={(e) =>
                                      (e.key === '.' || e.key === ',') && e.preventDefault()
                                    }
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
                                          throw new Error(`${t('monitoringReport:required')}`);
                                        } else if (isNaN(value)) {
                                          return Promise.reject(new Error('Should be a number'));
                                        } else if (Number(value) < 0) {
                                          return Promise.reject(
                                            new Error(
                                              `${t('monitoringReport:ce_shouldHavePositive')}`
                                            )
                                          );
                                        }

                                        return Promise.resolve();
                                      },
                                    },
                                  ]}
                                >
                                  <Input
                                    type="number"
                                    onChange={(value) => calculateNetGHGEmissions(value)}
                                    disabled
                                  />
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
                                                  }

                                                  const startDate = moment(
                                                    form.getFieldValue('extraEmissionReductions')[
                                                      name
                                                    ].emissionsPeriodStart
                                                  ).startOf('month');
                                                  const selectedDate = moment(value).endOf('month');
                                                  const duration = moment.duration(
                                                    selectedDate.diff(startDate)
                                                  );

                                                  const isOneYear =
                                                    Math.round(duration.asMonths()) === 12;

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
                                                  form.getFieldValue('extraEmissionReductions')[
                                                    name
                                                  ].emissionsPeriodStart
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
                                                  } else if (isNaN(value)) {
                                                    return Promise.reject(
                                                      new Error('Should be a number')
                                                    );
                                                  } else if (Number(value) < 0) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `${t(
                                                          'monitoringReport:ce_shouldHavePositive'
                                                        )}`
                                                      )
                                                    );
                                                  }

                                                  return Promise.resolve();
                                                },
                                              },
                                            ]}
                                          >
                                            <Input
                                              type="number"
                                              disabled={disableFields}
                                              onChange={(value) => {
                                                calculateNetGHGEmissions(value, name);
                                                calculateTotalEmissions(
                                                  value,
                                                  'baselineEmissionReductions',
                                                  'totalBaselineEmissionReductions'
                                                );
                                              }}
                                              step="1"
                                              onKeyDown={(e) =>
                                                (e.key === '.' || e.key === ',') &&
                                                e.preventDefault()
                                              }
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
                                                  } else if (isNaN(value)) {
                                                    return Promise.reject(
                                                      new Error('Should be a number')
                                                    );
                                                  } else if (Number(value) < 0) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `${t(
                                                          'monitoringReport:ce_shouldHavePositive'
                                                        )}`
                                                      )
                                                    );
                                                  }

                                                  return Promise.resolve();
                                                },
                                              },
                                            ]}
                                          >
                                            <Input
                                              type="number"
                                              disabled={disableFields}
                                              onChange={(value) => {
                                                calculateNetGHGEmissions(value, name);
                                                calculateTotalEmissions(
                                                  value,
                                                  'projectEmissionReductions',
                                                  'totalProjectEmissionReductions'
                                                );
                                              }}
                                              step="1"
                                              onKeyDown={(e) =>
                                                (e.key === '.' || e.key === ',') &&
                                                e.preventDefault()
                                              }
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
                                                  } else if (isNaN(value)) {
                                                    return Promise.reject(
                                                      new Error('Should be a number')
                                                    );
                                                  } else if (Number(value) < 0) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `${t(
                                                          'monitoringReport:ce_shouldHavePositive'
                                                        )}`
                                                      )
                                                    );
                                                  }

                                                  return Promise.resolve();
                                                },
                                              },
                                            ]}
                                          >
                                            <Input
                                              type="number"
                                              disabled={disableFields}
                                              onChange={(value) => {
                                                calculateNetGHGEmissions(value, name);
                                                calculateTotalEmissions(
                                                  value,
                                                  'leakageEmissionReductions',
                                                  'totalLeakageEmissionReductions'
                                                );
                                              }}
                                              step="1"
                                              onKeyDown={(e) =>
                                                (e.key === '.' || e.key === ',') &&
                                                e.preventDefault()
                                              }
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
                                                    throw new Error(
                                                      `${t('monitoringReport:required')}`
                                                    );
                                                  } else if (isNaN(value)) {
                                                    return Promise.reject(
                                                      new Error('Should be a number')
                                                    );
                                                  } else if (Number(value) < 0) {
                                                    return Promise.reject(
                                                      new Error(
                                                        `${t(
                                                          'monitoringReport:ce_shouldHavePositive'
                                                        )}`
                                                      )
                                                    );
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                                          throw new Error(`${t('monitoringReport:required')}`);
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
                      </>
                      {/* need to update this */}

                      {/* <Row justify={'space-between'} gutter={[40, 16]}>
                        <Col xl={24} md={24}>
                          <div className="step-form-left-col">
                            <Form.Item
                              name="q_ghgEmission"
                              rules={[
                                {
                                  required: true,
                                  message: `${t(
                                    'monitoringReport:q_emissionRedictionAndRemovals'
                                  )} ${t('isRequired')}`,
                                },
                              ]}
                            >
                              <TextArea
                                rows={4}
                                disabled={disableFields}
                                placeholder="Quantify the net GHG emission reductions and removals, summarizing the key results using the table below. Specify breakdown of GHG emission reductions and removals by annually. 
                                For AFOLU projects, include quantification of the net change in carbon stocks. Also, state the non-permanence risk rating (as determined in the AFOLU non-permanence risk report) and calculate the total number of buffer credits that need to be deposited into the AFOLU pooled buffer account. Attach the non-permanence risk report as either an appendix or a separate document."
                              />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row> */}

                      {/* <NetEmissionReduction
                        form={form}
                        t={t}
                        projectCategory={projectCategory}
                        disableFields={FormMode.VIEW === formMode}
                      ></NetEmissionReduction> */}
                    </>

                    <>
                      <h3 className="form-section-title">
                        {`${t('monitoringReport:ce_comparisonWithPDD')}`}
                      </h3>

                      <Row justify={'space-between'} gutter={[40, 16]} className="form-section">
                        <Row className="row" gutter={[40, 16]}>
                          <Col xl={8} md={24}>
                            <div className="step-form-left-col">
                              <Form.Item
                                label={t('monitoringReport:item')}
                                name="item"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:item')} ${t('isRequired')}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>
                            </div>
                          </Col>

                          <Col xl={8} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                label={t('monitoringReport:valueApplied')}
                                name="valueApplied"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:valueApplied')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>
                            </div>
                          </Col>

                          <Col xl={8} md={24}>
                            <div className="step-form-right-col">
                              <Form.Item
                                label={t('monitoringReport:actualValues')}
                                name="actualValues"
                                rules={[
                                  {
                                    required: true,
                                    message: `${t('monitoringReport:actualValues')} ${t(
                                      'isRequired'
                                    )}`,
                                  },
                                ]}
                              >
                                <Input size="large" disabled={disableFields} />
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>
                      </Row>
                    </>
                    <Form.Item
                      label={`${t('monitoringReport:ce_remarks')}`}
                      name="ce_remarks"
                      rules={[
                        {
                          required: true,
                          message: `${t('monitoringReport:ce_remarks')} ${t('isRequired')}`,
                        },
                      ]}
                    >
                      <TextArea rows={4} disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={'end'} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
                  {t('monitoringReport:back')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('monitoringReport:next')}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={'large'}
                    htmlType={'submit'}
                    // onClick={next}
                  >
                    {t('monitoringReport:next')}
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
// };
