import { Button, Col, DatePicker, Form, Input, Row, Select } from "antd";
import { CustomStepsProps } from "./StepProps";
import { t } from "i18next";
import TextArea from "antd/lib/input/TextArea";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import LabelWithTooltip, {
  TooltipPostion,
} from "../LabelWithTooltip/LabelWithTooltip";
import NetEmissionReduction from "../Common/NetEmissonReduction";
import moment from "moment";
import { formatNumberWithDecimalPlaces } from "../../Utils/utilityHelper";
import { toMoment } from "../../Utils/convertTime";

const EMISSION_CATEGORY_AVG_MAP: { [key: string]: string } = {
  baselineEmissionReductions: "avgBaselineEmissionReductions",
  projectEmissionReductions: "avgProjectEmissionReductions",
  leakageEmissionReductions: "avgLeakageEmissionReductions",
  netEmissionReductions: "avgNetEmissionReductions",
};

const ApplicationOfMethodology = (props: CustomStepsProps) => {
  const { next, prev, form, current, handleValuesUpdate, disableFields } =
    props;

  const calculateNetGHGEmissions = (value?: any, index?: number) => {
    let baselineEmissionReductionsVal = 0;
    let projectEmissionReductionsVal = 0;
    let leakageEmissionReductionsVal = 0;

    if (index === undefined) {
      baselineEmissionReductionsVal = Number(
        form.getFieldValue("baselineEmissionReductions") || 0
      );
      projectEmissionReductionsVal = Number(
        form.getFieldValue("projectEmissionReductions") || 0
      );
      leakageEmissionReductionsVal = Number(
        form.getFieldValue("leakageEmissionReductions") || 0
      );
      const netGHGEmissions =
        baselineEmissionReductionsVal -
        projectEmissionReductionsVal -
        leakageEmissionReductionsVal;

      if (netGHGEmissions <= 0) {
        form.setFields([
          {
            name: "netEmissionReductions",
            errors: [`${t("PDD:shouldHavePositive")}`],
          },
        ]);
      } else {
        form.setFields([
          {
            name: "netEmissionReductions",
            errors: [],
          },
        ]);
      }
      form.setFieldValue("netEmissionReductions", String(netGHGEmissions));
    } else {
      const listVals = form.getFieldValue("extraEmissionReductions");

      if (listVals[index] !== undefined) {
        baselineEmissionReductionsVal = Number(
          listVals[index].baselineEmissionReductions || 0
        );
        projectEmissionReductionsVal = Number(
          listVals[index].projectEmissionReductions || 0
        );
        leakageEmissionReductionsVal = Number(
          listVals[index].leakageEmissionReductions || 0
        );

        const netGHGEmissions =
          baselineEmissionReductionsVal -
          projectEmissionReductionsVal -
          leakageEmissionReductionsVal;

        listVals[index].netEmissionReductions = netGHGEmissions;

        if (netGHGEmissions <= 0) {
          form.setFields([
            {
              name: ["extraEmissionReductions", index, "netEmissionReductions"],
              errors: [`${t("PDD:shouldHavePositive")}`],
            },
          ]);
        } else {
          form.setFields([
            {
              name: ["extraEmissionReductions", index, "netEmissionReductions"],
              errors: [],
            },
          ]);
        }

        form.setFieldValue("extraEmissionReductions", listVals);
      }
    }
  };

  const CalculateNetTotalEmissions = () => {
    const category = "netEmissionReductions";
    const categoryToAdd = "totalNetEmissionReductions";
    let tempTotal = Number(form.getFieldValue(category) || 0);
    const listVals = form.getFieldValue("extraEmissionReductions");
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        if (item[category]) {
          tempTotal += Number(item[category]);
        }
      });
    }
    const creditingYears = Number(
      form.getFieldValue("totalCreditingYears") || 0
    );
    form.setFieldValue(categoryToAdd, String(tempTotal));
    const avgTempTotal =
      creditingYears > 0
        ? formatNumberWithDecimalPlaces(tempTotal / creditingYears)
        : 0;
    form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], avgTempTotal);
  };

  const calculateTotalEmissions = (
    value: any,
    category: string,
    categoryToAdd: string
  ) => {
    let tempTotal = Number(form.getFieldValue(category) || 0);
    const listVals = form.getFieldValue("extraEmissionReductions");
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        if (item[category]) {
          tempTotal += Number(item[category]);
        }
      });
    }
    const creditingYears = Number(
      form.getFieldValue("totalCreditingYears") || 0
    );
    form.setFieldValue(categoryToAdd, String(tempTotal));
    const total =
      creditingYears > 0
        ? formatNumberWithDecimalPlaces(tempTotal / creditingYears)
        : 0;
    form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], total);

    CalculateNetTotalEmissions();
  };

  const onPeriodChange = (value: any, fieldCounts: number) => {
    const reductions = form.getFieldValue("extraEmissionReductions");
    let totalCreditingYears = 0;

    const firstReductionStartDate = toMoment(
      form.getFieldValue("emissionsPeriodStart")
    )?.startOf("month");
    const firstReductionEndDate = toMoment(
      form.getFieldValue("emissionsPeriodEnd")
    )?.endOf("month");

    if (firstReductionStartDate && firstReductionEndDate) {
      const diff = moment.duration(
        firstReductionEndDate.diff(firstReductionStartDate)
      );
      totalCreditingYears += Math.floor(diff.asMonths() + 1) / 12;
    }

    reductions?.forEach((reduction: any) => {
      const start = toMoment(reduction?.emissionsPeriodStart)?.startOf("month");
      const end = toMoment(reduction?.emissionsPeriodEnd)?.endOf("month");

      if (start && end) {
        const diff = moment.duration(end.diff(start));
        totalCreditingYears += Math.floor(diff.asMonths() + 1) / 12;
      }
    });

    console.log(
      "--------totalYears------",
      Number(totalCreditingYears).toFixed(2)
    );

    form.setFieldValue(
      "totalCreditingYears",
      Number(totalCreditingYears).toFixed(2)
    );
    calculateNetGHGEmissions(value);
    calculateTotalEmissions(
      value,
      "baselineEmissionReductions",
      "totalBaselineEmissionReductions"
    );
    calculateTotalEmissions(
      value,
      "projectEmissionReductions",
      "totalProjectEmissionReductions"
    );
    calculateTotalEmissions(
      value,
      "leakageEmissionReductions",
      "totalLeakageEmissionReductions"
    );
  };

  const onFinish = (values: any) => {
    const tempValues: any = {
      titleAndReference: values?.titleAndReferenceOfMethodology,
      applicability: values?.applicabilityOfMethodology,
      // baselineScenario: values?.baselineScenario,
      // additionality: values?.additionality,
      descriptionOfBaselineScenario: values?.descriptionOfBaselineScenario,
      demonstrationOfAdditionality: values?.demonstrationOfAdditionality,
      exAnteCalculationOfEmissionReduction:
        values?.exAnteCalculationOfEmissionReduction,
      emissionReductionEstimation: values?.emissionReductionEstimation,
      monitoringPlan: values?.monitoringPlan,
      dataAndParametersExAnte: {
        parameter: values?.parameter,
        unit: values?.unit,
        description: values?.description,
        source: values?.source,
        descriptionOfMeasurementMethods:
          values?.descriptionOfMeasurementMethods,
        purpose: values?.purpose,
        valueApplied: values?.valueApplied,
        comments: values?.comments,
      },
      dataAndParametersMonitored: {
        monitoringParameter: values?.monitoringParameter,
        monitoringUnit: values?.monitoringUnit,
        monitoringDescription: values?.monitoringDescription,
        data_parameterDescription: values?.data_parameterDescription,
        monitoringSource: values?.monitoringSource,
        monitoringMeasurementMethods: values?.monitoringMeasurementMethods,
        monitoringFrequency: values?.monitoringFrequency,
        monitoringValueApplied: values?.monitoringValueApplied,
        monitoringEquipment: values?.monitoringEquipment,
        monitoringQAProcedures: values?.monitoringQAProcedures,
        monitoringPurpose: values?.monitoringPurpose,
        monitoringCalculation: values?.monitoringCalculation,
        monitoringComments: values?.monitoringComments,
      },
      samplingPlan: values?.samplingPlan,
      otherElementsOfMonitoringPlan: values?.otherElementsOfMonitoringPlan,
      methodologyDeviations: values?.methodologyDeviations,
      explanationOfEmissionMethodologicalChoices:
        values?.explanationOfEmissionMethodologicalChoices,
      projectBoundary: (function () {
        const tempVal: any = {};

        const tempbaseline = [];
        const firstBaseline = {
          source: values?.baselineSource,
          isCO2Included: values?.baselineIsCO2Included,
          co2Justification: values?.baselineco2Justification,
          isCH4Included: values?.baselineIsCH4Included,
          ch4Justification: values?.baselinech4Justification,
          isN2OIncluded: values?.baselineIsN2OIncluded,
          n2oJustification: values?.baselinen2oJustification,
          isOtherIncluded: values?.baselineIsOtherIncluded,
          otherJustification: values?.baselineotherJustification,
        };

        tempbaseline.push(firstBaseline);

        if (values?.extraBaseline) {
          values.extraBaseline.forEach((item: any) => {
            const tempObj: any = {
              source: item?.source,
              isCO2Included: item?.isCO2Included,
              co2Justification: item?.co2Justification,
              isCH4Included: item?.isCH4Included,
              ch4Justification: item?.ch4Justification,
              isN2OIncluded: item?.isN2OIncluded,
              n2oJustification: item?.n2oJustification,
              isOtherIncluded: item?.isOtherIncluded,
              otherJustification: item?.otherJustification,
            };
            tempbaseline.push(tempObj);
          });
        }

        const tempProject: any = [];
        const firstProject = {
          source: values?.projectSource,
          isCO2Included: values?.projectIsCO2Included,
          co2Justification: values?.projectco2Justification,
          isCH4Included: values?.projectIsCH4Included,
          ch4Justification: values?.projectch4Justification,
          isN2OIncluded: values?.projectIsN2OIncluded,
          n2oJustification: values?.projectn2oJustification,
          isOtherIncluded: values?.projectIsOtherIncluded,
          otherJustification: values?.projectotherJustification,
        };
        tempProject.push(firstProject);
        if (values.extraProject) {
          values.extraProject.forEach((item: any) => {
            const tempObj: any = {
              source: item?.source,
              isCO2Included: item?.isCO2Included,
              co2Justification: item?.co2Justification,
              isCH4Included: item?.isCH4Included,
              ch4Justification: item?.ch4Justification,
              isN2OIncluded: item?.isN2OIncluded,
              n2oJustification: item?.n2oJustification,
              isOtherIncluded: item?.isOtherIncluded,
              otherJustification: item?.otherJustification,
            };
            tempProject.push(tempObj);
          });
        }

        tempVal.baseline = tempbaseline;
        tempVal.project = tempProject;

        return tempVal;
      })(),
      netGHGEmissionReductions: (function () {
        const tempGHG: any = {
          description: values?.netGHGEmissionReductionsAndRemovals,
        };

        const tempYearlyReductions: any = [];

        const firstReduction = {
          startDate: moment(values?.emissionsPeriodStart)
            .startOf("month")
            .unix(),
          endDate: moment(values?.emissionsPeriodEnd).endOf("month").unix(),
          baselineEmissionReductions: Number(
            values?.baselineEmissionReductions
          ),
          projectEmissionReductions: Number(values?.projectEmissionReductions),
          leakageEmissionReductions: Number(values?.leakageEmissionReductions),
          netEmissionReductions: Number(values?.netEmissionReductions),
        };

        tempYearlyReductions.push(firstReduction);

        if (values?.extraEmissionReductions) {
          values.extraEmissionReductions.forEach((item: any) => {
            const tempObj = {
              startDate: moment(item?.emissionsPeriodStart)
                .startOf("month")
                .unix(),
              endDate: moment(item?.emissionsPeriodEnd).endOf("month").unix(),
              baselineEmissionReductions: Number(
                item?.baselineEmissionReductions
              ),
              projectEmissionReductions: Number(
                item?.projectEmissionReductions
              ),
              leakageEmissionReductions: Number(
                item?.leakageEmissionReductions
              ),
              netEmissionReductions: Number(item?.netEmissionReductions),
            };

            tempYearlyReductions.push(tempObj);
          });
        }
        tempGHG.yearlyGHGEmissionReductions = tempYearlyReductions;
        tempGHG.totalBaselineEmissionReductions = Number(
          values?.totalBaselineEmissionReductions
        );
        tempGHG.totalProjectEmissionReductions = Number(
          values?.totalProjectEmissionReductions
        );
        tempGHG.totalLeakageEmissionReductions = Number(
          values?.totalLeakageEmissionReductions
        );
        tempGHG.totalNetEmissionReductions = Number(
          values?.totalNetEmissionReductions
        );
        tempGHG.totalNumberOfCredingYears = Number(values?.totalCreditingYears);
        tempGHG.avgBaselineEmissionReductions = Number(
          values?.avgBaselineEmissionReductions
        );
        tempGHG.avgProjectEmissionReductions = Number(
          values?.avgProjectEmissionReductions
        );
        tempGHG.avgLeakageEmissionReductions = Number(
          values?.avgLeakageEmissionReductions
        );
        tempGHG.avgNetEmissionReductions = Number(
          values?.avgNetEmissionReductions
        );

        return tempGHG;
      })(),
    };

    handleValuesUpdate({ applicationOfMethodology: tempValues });
  };
  return (
    <>
      {current === 2 && (
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
                label={`${t("PDD:titleAndReferenceOfMethodology")}`}
                name="titleAndReferenceOfMethodology"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:titleAndReferenceOfMethodology")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  // placeholder={`${t('PDD:titleAndReferenceOfMethodologyPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>
              <Form.Item
                className='className="full-width-form-item'
                label={`${t("PDD:applicabilityOfMethodology")}`}
                name="applicabilityOfMethodology"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:applicabilityOfMethodology")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea
                  rows={4}
                  // placeholder={`${t('PDD:applicabilityOfMethodologyPlaceholder')}`}
                  disabled={disableFields}
                />
              </Form.Item>
              {/* Gases Included Start */}
              {/* <h4 className='form-section-heading'>${t('PDD:gasEmissionsTable')}</h4> */}
              <LabelWithTooltip
                label={`${t("PDD:gasEmissionsTable")}`}
                required={true}
                labelStyles={{ fontSize: "16px", fontWeight: "500" }}
              />
              <div className="gases-included-container">
                <div className="table">
                  <div className="sidebar-header">Baseline Emission</div>
                  <div className="data-side">
                    <div className="header-row">
                      <div className="col1">Source</div>
                      <div className="col2">GHG</div>
                      <div className="col3">Included?</div>
                      <div className="col4">Justification/Explanation</div>
                    </div>
                    <div className="data-row-wrapper">
                      <div className="data-row">
                        <div className="col1 data-col">
                          <Form.Item
                            name="baselineSource"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <TextArea rows={9} disabled={disableFields} />
                          </Form.Item>
                        </div>
                        <div className="col2 data-col">
                          <div>
                            CO<sub>2</sub>
                          </div>
                          <div className="add-margin">
                            CH<sub>4</sub>
                          </div>
                          <div className="add-margin">
                            N<sub>2</sub>0
                          </div>
                          <div className="add-margin">Other</div>
                        </div>
                        <div className="col3 data-col">
                          <Form.Item
                            name="baselineIsCO2Included"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsCH4Included"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsN2OIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="baselineIsOtherIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                        <div className="col4 data-col">
                          <Form.Item
                            name="baselineco2Justification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselinech4Justification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselinen2oJustification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="baselineotherJustification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className="data-row-wrapper">
                      <Form.List name="extraBaseline">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div>
                                  <div className="data-row">
                                    <div className="col1 data-col">
                                      <Form.Item
                                        name={[name, "source"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <TextArea
                                          rows={9}
                                          disabled={disableFields}
                                        />
                                      </Form.Item>
                                    </div>
                                    <div className="col2 data-col">
                                      <div>
                                        CO<sub>2</sub>
                                      </div>
                                      <div className="add-margin">
                                        CH<sub>4</sub>
                                      </div>
                                      <div className="add-margin">
                                        N<sub>2</sub>0
                                      </div>
                                      <div className="add-margin">Other</div>
                                    </div>
                                    <div className="col3 data-col">
                                      <Form.Item
                                        name={[name, "isCO2Included"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isCH4Included"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isN2OIncluded"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isOtherIncluded"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                    </div>
                                    <div className="col4 data-col">
                                      <Form.Item
                                        name={[name, "co2Justification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "ch4Justification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "n2oJustification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "otherJustification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                    </div>
                                    <div className="col5 data-col">
                                      <Form.Item>
                                        <Button
                                          onClick={() => {
                                            remove(name);
                                          }}
                                          size="middle"
                                          className="addMinusBtn"
                                          icon={<MinusOutlined />}
                                          disabled={disableFields}
                                        >
                                          {/* Add Entity */}
                                        </Button>
                                      </Form.Item>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ))}

                            <Form.Item>
                              <Button
                                onClick={() => {
                                  add();
                                }}
                                size="middle"
                                className="addMinusBtn"
                                disabled={disableFields}
                                // block
                                icon={<PlusOutlined />}
                                style={{ marginLeft: "10px" }}
                              >
                                {/* Add Entity */}
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  </div>

                  <div className="sidebar-header">Project Emission</div>
                  <div className="data-side">
                    <div className="data-row-wrapper add-padding-top">
                      <div className="data-row">
                        <div className="col1 data-col">
                          <Form.Item
                            name="projectSource"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <TextArea rows={9} disabled={disableFields} />
                          </Form.Item>
                        </div>
                        <div className="col2 data-col">
                          <div>
                            CO<sub>2</sub>
                          </div>
                          <div className="add-margin">
                            CH<sub>4</sub>
                          </div>
                          <div className="add-margin">
                            N<sub>2</sub>0
                          </div>
                          <div className="add-margin">Other</div>
                        </div>
                        <div className="col3 data-col">
                          <Form.Item
                            name="projectIsCO2Included"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsCH4Included"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsN2OIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                          <Form.Item
                            name="projectIsOtherIncluded"
                            rules={[
                              {
                                required: true,
                                message: `${t("PDD:required")}`,
                              },
                            ]}
                          >
                            <Select
                              disabled={disableFields}
                              placeholder="Select"
                            >
                              <Select.Option value={true}>Yes</Select.Option>
                              <Select.Option value={false}>No</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                        <div className="col4 data-col">
                          <Form.Item
                            name="projectco2Justification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectch4Justification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectn2oJustification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                          <Form.Item
                            name="projectotherJustification"
                            rules={[
                              {
                                required: true,
                                message: ``,
                              },
                              {
                                validator: async (rule, value) => {
                                  if (
                                    String(value).trim() === "" ||
                                    String(value).trim() === undefined ||
                                    value === null ||
                                    value === undefined
                                  ) {
                                    throw new Error(`${t("PDD:required")}`);
                                  }
                                },
                              },
                            ]}
                          >
                            <Input disabled={disableFields}></Input>
                          </Form.Item>
                        </div>
                      </div>
                    </div>

                    <div className="data-row-wrapper">
                      <Form.List name="extraProject">
                        {(fields, { add, remove }) => (
                          <>
                            {fields.map(({ key, name, ...restField }) => (
                              <>
                                <div>
                                  <div className="data-row">
                                    <div className="col1 data-col">
                                      <Form.Item
                                        name={[name, "source"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <TextArea
                                          rows={9}
                                          disabled={disableFields}
                                        />
                                      </Form.Item>
                                    </div>
                                    <div className="col2 data-col">
                                      <div>
                                        CO<sub>2</sub>
                                      </div>
                                      <div className="add-margin">
                                        CH<sub>4</sub>
                                      </div>
                                      <div className="add-margin">
                                        N<sub>2</sub>0
                                      </div>
                                      <div className="add-margin">Other</div>
                                    </div>
                                    <div className="col3 data-col">
                                      <Form.Item
                                        name={[name, "isCO2Included"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isCH4Included"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isN2OIncluded"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          // placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "isOtherIncluded"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: `${t("PDD:required")}`,
                                          },
                                        ]}
                                      >
                                        <Select
                                          disabled={disableFields}
                                          // placeholder="Select"
                                        >
                                          <Select.Option value={true}>
                                            Yes
                                          </Select.Option>
                                          <Select.Option value={false}>
                                            No
                                          </Select.Option>
                                        </Select>
                                      </Form.Item>
                                    </div>
                                    <div className="col4 data-col">
                                      <Form.Item
                                        name={[name, "co2Justification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "ch4Justification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "n2oJustification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                      <Form.Item
                                        name={[name, "otherJustification"]}
                                        rules={[
                                          {
                                            required: true,
                                            message: ``,
                                          },
                                          {
                                            validator: async (rule, value) => {
                                              if (
                                                String(value).trim() === "" ||
                                                String(value).trim() ===
                                                  undefined ||
                                                value === null ||
                                                value === undefined
                                              ) {
                                                throw new Error(
                                                  `${t("PDD:required")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields}></Input>
                                      </Form.Item>
                                    </div>
                                    <div className="col5 data-col">
                                      <Form.Item>
                                        <Button
                                          // type="dashed"
                                          onClick={() => {
                                            // reduceTotalCreditingYears()
                                            remove(name);
                                          }}
                                          size="middle"
                                          className="addMinusBtn"
                                          disabled={disableFields}
                                          // block
                                          icon={<MinusOutlined />}
                                        >
                                          {/* Add Entity */}
                                        </Button>
                                      </Form.Item>
                                    </div>
                                  </div>
                                </div>
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
                                disabled={disableFields}
                                style={{ marginLeft: "10px" }}
                                // block
                                icon={<PlusOutlined />}
                              >
                                {/* Add Entity */}
                              </Button>
                            </Form.Item>
                          </>
                        )}
                      </Form.List>
                    </div>
                  </div>
                </div>
              </div>
              {/* Gases Included End */}
              <br />
              <Row gutter={[40, 16]}>
                <Col xl={12} md={24}>
                  <Form.Item
                    // className='className="full-width-form-item'
                    label={`${t("PDD:descriptionOfBaselineScenario")}`}
                    name="descriptionOfBaselineScenario"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === "" ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(
                              `${t("PDD:descriptionOfBaselineScenario")} ${t(
                                "isRequired"
                              )}`
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <Input
                      // rows={4}
                      // placeholder={`${t('PDD:applicabilityOfMethodologyPlaceholder')}`}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>

                <Col xl={12} md={24}>
                  <Form.Item
                    // className='className="full-width-form-item'
                    label={`${t("PDD:demonstrationOfAdditionality")}`}
                    name="demonstrationOfAdditionality"
                    rules={[
                      {
                        required: true,
                        message: ``,
                      },
                      {
                        validator: async (rule, value) => {
                          if (
                            String(value).trim() === "" ||
                            String(value).trim() === undefined ||
                            value === null ||
                            value === undefined
                          ) {
                            throw new Error(
                              `${t("PDD:demonstrationOfAdditionality")} ${t(
                                "isRequired"
                              )}`
                            );
                          }
                        },
                      },
                    ]}
                  >
                    <Input
                      // rows={4}
                      // placeholder={`${t('PDD:applicabilityOfMethodologyPlaceholder')}`}
                      disabled={disableFields}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                className='className="full-width-form-item'
                label={`${t("PDD:emissionReductionEstimation")}`}
                name="emissionReductionEstimation"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:emissionReductionEstimation")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              <Form.Item
                className='className="full-width-form-item'
                label={`${t("PDD:explanationOfEmissionMethodologicalChoices")}`}
                name="explanationOfEmissionMethodologicalChoices"
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t(
                            "PDD:explanationOfEmissionMethodologicalChoices"
                          )} ${t("isRequired")}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              {/* Data and parameters fixed ex ante start */}
              <br />
              <>
                <LabelWithTooltip
                  label="Data and parameters fixed ex ante"
                  required={true}
                  labelStyles={{ fontSize: "16px", fontWeight: "500" }}
                />
                <div className="form-section">
                  <Row justify={"space-between"} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t("PDD:data_parameter")}
                        name="parameter"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:data_parameter")} ${t(
                                    "isRequired"
                                  )}`
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
                        label={t("PDD:unit")}
                        name="unit"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:unit")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          // placeholder={`${t('PDD:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:description")}
                        name="description"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:description")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:dataSource")}
                        name="source"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:dataSource")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:descriptionOfMeasurementMethods")}
                        name="descriptionOfMeasurementMethods"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t(
                                    "PDD:descriptionOfMeasurementMethods"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:justificationOfChoicePlaceholder')}`}
                          rows={5}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:valueApplied")}
                        name="valueApplied"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:valueApplied")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          // placeholder={`${t('PDD:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <div className="step-form-right-col">
                        <Form.Item
                          label={t("PDD:purpose")}
                          name="purpose"
                          rules={[
                            {
                              required: true,
                              message: ``,
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t("PDD:purpose")} ${t("isRequired")}`
                                  );
                                }
                              },
                            },
                          ]}
                        >
                          <Input size="large" disabled={disableFields} />
                        </Form.Item>
                      </div>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:comments")}
                        name="comments"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:comments")} ${t("isRequired")}`
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
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>
              {/* Data and parameters fixed ex ante end */}
              <Form.Item
                className="full-width-form-item"
                name="exAnteCalculationOfEmissionReduction"
                label={`${t("PDD:exAnteCalculationOfEmissionReduction")}`}
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:exAnteCalculationOfEmissionReduction")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>

              {/* need to update this */}
              <>
                <LabelWithTooltip
                  label={t("PDD:netEmmissionsTitle")}
                  required={false}
                  labelStyles={{
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                />
                <>
                  <div className="estimated-emmissions-table-form">
                    <Row className="header" justify={"space-between"}>
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
                        Estimated Net GHG Emission Reductions Or Removals
                        (tCO₂e)
                      </Col>
                      <Col md={2} xl={2}>
                        {" "}
                      </Col>
                    </Row>

                    <Row justify={"space-between"} align={"middle"}>
                      <Col md={6} xl={6} className="col1">
                        <Form.Item
                          label={``}
                          name="emissionsPeriodStart"
                          className="datepicker"
                          rules={[
                            {
                              required: true,
                              message: "",
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
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
                              message: "",
                            },
                            {
                              validator: async (rule, value) => {
                                if (
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                const startDate = moment(
                                  form.getFieldValue("emissionsPeriodStart")
                                ).startOf("month");
                                const selectedDate =
                                  moment(value).endOf("month");

                                if (selectedDate.year() !== startDate.year()) {
                                  throw new Error(
                                    "End date also should be in the same year!"
                                  );
                                }
                                const duration = moment.duration(
                                  selectedDate.diff(startDate)
                                );

                                if (duration.asDays() < 0) {
                                  throw new Error(
                                    "End date cannot be before Start date!"
                                  );
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
                            onChange={(value) => onPeriodChange(value, 1)}
                            disabled={disableFields}
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                } else if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
                                  );
                                } else if (Number(value) < 0) {
                                  return Promise.reject(
                                    new Error(`${t("PDD:shouldHavePositive")}`)
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
                                "baselineEmissionReductions",
                                "totalBaselineEmissionReductions"
                              );
                            }}
                            step="1"
                            onKeyDown={(e) =>
                              (e.key === "." || e.key === ",") &&
                              e.preventDefault()
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                } else if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
                                  );
                                } else if (Number(value) < 0) {
                                  return Promise.reject(
                                    new Error(`${t("PDD:shouldHavePositive")}`)
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
                                "projectEmissionReductions",
                                "totalProjectEmissionReductions"
                              );
                            }}
                            step="1"
                            onKeyDown={(e) =>
                              (e.key === "." || e.key === ",") &&
                              e.preventDefault()
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                } else if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
                                  );
                                } else if (Number(value) < 0) {
                                  return Promise.reject(
                                    new Error(`${t("PDD:shouldHavePositive")}`)
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
                                "leakageEmissionReductions",
                                "totalLeakageEmissionReductions"
                              );
                            }}
                            step="1"
                            onKeyDown={(e) =>
                              (e.key === "." || e.key === ",") &&
                              e.preventDefault()
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                } else if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
                                  );
                                } else if (Number(value) < 0) {
                                  return Promise.reject(
                                    new Error(`${t("PDD:shouldHavePositive")}`)
                                  );
                                }

                                return Promise.resolve();
                              },
                            },
                          ]}
                        >
                          <Input
                            type="number"
                            onChange={(value) =>
                              calculateNetGHGEmissions(value)
                            }
                            disabled
                          />
                        </Form.Item>
                      </Col>
                      <Col md={2} xl={2}>
                        {" "}
                      </Col>
                    </Row>

                    <Form.List name="extraEmissionReductions">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...restField }) => (
                            <>
                              <Row justify={"space-between"} align={"middle"}>
                                <Col md={6} xl={6} className="col1">
                                  <Form.Item
                                    label={``}
                                    name={[name, "emissionsPeriodStart"]}
                                    className="datepicker"
                                    rules={[
                                      {
                                        required: true,
                                        message: "",
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
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
                                    name={[name, "emissionsPeriodEnd"]}
                                    className="datepicker"
                                    rules={[
                                      {
                                        required: true,
                                        message: "",
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
                                            );
                                          }

                                          const startDate = moment(
                                            form.getFieldValue(
                                              "extraEmissionReductions"
                                            )[name].emissionsPeriodStart
                                          ).startOf("month");
                                          const selectedDate =
                                            moment(value).endOf("month");

                                          if (
                                            selectedDate.year() !==
                                            startDate.year()
                                          ) {
                                            throw new Error(
                                              "End date also should be in the same year!"
                                            );
                                          }
                                          const duration = moment.duration(
                                            selectedDate.diff(startDate)
                                          );

                                          if (duration.asDays() < 0) {
                                            throw new Error(
                                              "End date cannot be before Start date!"
                                            );
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
                                        onPeriodChange(value, fields.length + 1)
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                                <Col md={3} xl={3}>
                                  <Form.Item
                                    name={[name, "baselineEmissionReductions"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: ``,
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
                                            );
                                          } else if (isNaN(value)) {
                                            return Promise.reject(
                                              new Error("Should be a number")
                                            );
                                          } else if (Number(value) < 0) {
                                            return Promise.reject(
                                              new Error(
                                                `${t("PDD:shouldHavePositive")}`
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
                                          "baselineEmissionReductions",
                                          "totalBaselineEmissionReductions"
                                        );
                                      }}
                                      step="1"
                                      onKeyDown={(e) =>
                                        (e.key === "." || e.key === ",") &&
                                        e.preventDefault()
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                                <Col md={3} xl={3}>
                                  <Form.Item
                                    name={[name, "projectEmissionReductions"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: ``,
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
                                            );
                                          } else if (isNaN(value)) {
                                            return Promise.reject(
                                              new Error("Should be a number")
                                            );
                                          } else if (Number(value) < 0) {
                                            return Promise.reject(
                                              new Error(
                                                `${t("PDD:shouldHavePositive")}`
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
                                          "projectEmissionReductions",
                                          "totalProjectEmissionReductions"
                                        );
                                      }}
                                      step="1"
                                      onKeyDown={(e) =>
                                        (e.key === "." || e.key === ",") &&
                                        e.preventDefault()
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                                <Col md={3} xl={3}>
                                  <Form.Item
                                    name={[name, "leakageEmissionReductions"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: ``,
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
                                            );
                                          } else if (isNaN(value)) {
                                            return Promise.reject(
                                              new Error("Should be a number")
                                            );
                                          } else if (Number(value) < 0) {
                                            return Promise.reject(
                                              new Error(
                                                `${t("PDD:shouldHavePositive")}`
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
                                          "leakageEmissionReductions",
                                          "totalLeakageEmissionReductions"
                                        );
                                      }}
                                      step="1"
                                      onKeyDown={(e) =>
                                        (e.key === "." || e.key === ",") &&
                                        e.preventDefault()
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                                <Col md={3} xl={3}>
                                  <Form.Item
                                    name={[name, "netEmissionReductions"]}
                                    rules={[
                                      {
                                        required: true,
                                        message: ``,
                                      },
                                      {
                                        validator: async (rule, value) => {
                                          if (
                                            String(value).trim() === "" ||
                                            String(value).trim() ===
                                              undefined ||
                                            value === null ||
                                            value === undefined
                                          ) {
                                            throw new Error(
                                              `${t("PDD:required")}`
                                            );
                                          } else if (isNaN(value)) {
                                            return Promise.reject(
                                              new Error("Should be a number")
                                            );
                                          } else if (Number(value) < 0) {
                                            return Promise.reject(
                                              new Error(
                                                `${t("PDD:shouldHavePositive")}`
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
                                        onPeriodChange(null, fields.length + 1);
                                        calculateTotalEmissions(
                                          null,
                                          "projectEmissionReductions",
                                          "totalProjectEmissionReductions"
                                        );
                                        calculateTotalEmissions(
                                          null,
                                          "baselineEmissionReductions",
                                          "totalBaselineEmissionReductions"
                                        );
                                        calculateTotalEmissions(
                                          null,
                                          "leakageEmissionReductions",
                                          "totalLeakageEmissionReductions"
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
                    <Row justify={"space-between"} align={"top"}>
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                        {" "}
                      </Col>
                    </Row>
                    {/* calc Row 1 end */}

                    {/* calc row 2 start */}
                    <Row justify={"space-between"} align={"top"}>
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                      <Col md={3} xl={3}>
                        {" "}
                      </Col>
                      <Col md={3} xl={3}>
                        {" "}
                      </Col>
                      <Col md={3} xl={3}>
                        {" "}
                      </Col>
                      <Col md={2} xl={2}>
                        {" "}
                      </Col>
                    </Row>
                    {/* calc row 2 end */}

                    {/* calc row 3 start */}
                    <Row justify={"space-between"} align={"top"}>
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(`${t("PDD:required")}`);
                                }

                                // eslint-disable-next-line no-restricted-globals
                                if (isNaN(value)) {
                                  return Promise.reject(
                                    new Error("Should be a number")
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
                      <Col md={2} xl={2} className="total-cols">
                        {" "}
                      </Col>
                    </Row>
                    {/* calc row 3 end */}
                  </div>
                </>
              </>
              {/* need to update this */}
              <Form.Item
                className="full-width-form-item"
                name="monitoringPlan"
                label={`${t("PDD:monitoringPlan")}`}
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:monitoringPlan")} ${t("isRequired")}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              {/* data and parameters monitored start */}
              <>
                <h4 className="form-section-heading">{`${t(
                  "PDD:dataAndParametersMonitored"
                )}`}</h4>
                <div className="form-section">
                  <Row justify={"space-between"} gutter={[40, 16]}>
                    <Col xl={12} md={24}>
                      <Form.Item
                        label={t("PDD:data_parameter")}
                        name="monitoringParameter"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:data_parameter")} ${t(
                                    "isRequired"
                                  )}`
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
                        label={t("PDD:unit")}
                        name="monitoringUnit"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:unit")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input
                          // placeholder={`${t('PDD:unitPlaceholder')}`}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:description")}
                        name="monitoringDescription"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:description")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:data_parameterDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:dataSource")}
                        name="monitoringSource"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:dataSource")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:dataSourcePlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={t("PDD:measurementMethodDescription")}
                        name="monitoringMeasurementMethods"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:measurementMethodDescription")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:measuremenMethodDescriptionPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={t("PDD:monitoringFrequency")}
                        name="monitoringFrequency"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:monitoringFrequency")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          // placeholder={`${t('PDD:monitoringFrequencyPlaceholder')}`}
                          rows={2}
                          size="large"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:valueApplied")}
                        name="monitoringValueApplied"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:valueApplied")} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          // placeholder={`${t('PDD:valueAppliedPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:monitoringEquipment")}
                        name="monitoringEquipment"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:monitoringEquipment")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          // placeholder={`${t('PDD:monitoringEquipmentPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:monitoringQAProcedures")}
                        name="monitoringQAProcedures"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:monitoringQAProcedures")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          // placeholder={`${t('PDD:monitoringQAProceduresPlaceholder')}`}
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <>
                        <LabelWithTooltip
                          label={t("PDD:purpose")}
                          required={true}
                          // tooltipContent={
                          //   <div className="tooltip">
                          //     <p>Indicate one of the following:</p>
                          //     <ul>
                          //       <li>Calculation of baseline emissions. </li>
                          //       <li>Calculation of project emissions</li>
                          //       <li>Calculation of leakage </li>
                          //     </ul>
                          //   </div>
                          // }
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
                                  String(value).trim() === "" ||
                                  String(value).trim() === undefined ||
                                  value === null ||
                                  value === undefined
                                ) {
                                  throw new Error(
                                    `${t("PDD:purpose")} ${t("isRequired")}`
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
                          />
                        </Form.Item>
                      </>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:calculationMethod")}
                        name="monitoringCalculation"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:calculationMethod")} ${t(
                                    "isRequired"
                                  )}`
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
                          // placeholder="Where relevant, provide the calculation method, including  any equations, used to establish the data/parameter."
                        />
                      </Form.Item>
                    </Col>

                    <Col xl={24} md={24}>
                      <Form.Item
                        label={t("PDD:monitoringComments")}
                        name="monitoringComments"
                        rules={[
                          {
                            required: true,
                            message: ``,
                          },
                          {
                            validator: async (rule, value) => {
                              if (
                                String(value).trim() === "" ||
                                String(value).trim() === undefined ||
                                value === null ||
                                value === undefined
                              ) {
                                throw new Error(
                                  `${t("PDD:monitoringComments")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea
                          rows={4}
                          size="large"
                          // placeholder="Provide any comments"
                          disabled={disableFields}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </>
              {/* data and parameters monitored end */}

              <Form.Item
                className="full-width-form-item"
                name="samplingPlan"
                label={`${t("PDD:samplingPlan")}`}
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:samplingPlan")} ${t("isRequired")}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              <Form.Item
                className="full-width-form-item"
                name="otherElementsOfMonitoringPlan"
                label={`${t("PDD:otherElementsOfMonitoringPlan")}`}
                rules={[
                  {
                    required: true,
                    message: ``,
                  },
                  {
                    validator: async (rule, value) => {
                      if (
                        String(value).trim() === "" ||
                        String(value).trim() === undefined ||
                        value === null ||
                        value === undefined
                      ) {
                        throw new Error(
                          `${t("PDD:otherElementsOfMonitoringPlan")} ${t(
                            "isRequired"
                          )}`
                        );
                      }
                    },
                  },
                ]}
              >
                <TextArea rows={4} disabled={disableFields} />
              </Form.Item>
              <Row justify={"end"} className="step-actions-end">
                <Button danger size={"large"} onClick={prev}>
                  {t("PDD:prev")}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t("PDD:next")}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={"large"}
                    htmlType={"submit"}
                    // onClick={next}
                  >
                    {t("PDD:next")}
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

export default ApplicationOfMethodology;
