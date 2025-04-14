import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Col, DatePicker, Form, Input, InputNumber, Row } from "antd";
import moment from "moment";
import { formatNumberWithDecimalPlaces } from "../../Utils/utilityHelper";
import { useState } from "react";
import { ProjectCategory } from "../../Definitions/Enums/slRegistryEnum";
import { toMoment } from "../../Utils/convertTime";

const EMISSION_CATEGORY_AVG_MAP: { [key: string]: string } = {
  baselineEmissionReductions: "avgBaselineEmissionReductions",
  projectEmissionReductions: "avgProjectEmissionReductions",
  leakageEmissionReductions: "avgLeakageEmissionReductions",
  netEmissionReductions: "avgNetEmissionReductions",
  bufferPoolAllocation: "avgBufferPoolAllocations",
};

const NetEmissionReduction = (props: any) => {
  const { form, t, existingEmission, projectCategory, disabled } = props;

  console.log("--------disabled-----------", disabled);

  const calculateNetGHGEmissions = (value: any, index?: number) => {
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

      if (netGHGEmissions < 0) {
        form.setFields([
          {
            name: "netEmissionReductions",
            errors: [
              `${t("common:estimatedNetGHGEmissionShouldHavePositive")}`,
            ],
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
      const listVals = form.getFieldValue("estimatedNetEmissionReductions");

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

        if (netGHGEmissions < 0) {
          form.setFields([
            {
              name: [
                "estimatedNetEmissionReductions",
                index,
                "netEmissionReductions",
              ],
              errors: [
                `${t("common:estimatedNetGHGEmissionShouldHavePositive")}`,
              ],
            },
          ]);
        } else {
          form.setFields([
            {
              name: [
                "estimatedNetEmissionReductions",
                index,
                "netEmissionReductions",
              ],
              errors: [],
            },
          ]);
        }

        form.setFieldValue("estimatedNetEmissionReductions", listVals);
      }
    }
  };

  const CalculateNetTotalEmissions = () => {
    const category = "netEmissionReductions";
    const categoryToAdd = "totalNetEmissionReductions";
    let tempTotal = Number(form.getFieldValue(category) || 0);
    const listVals = form.getFieldValue("estimatedNetEmissionReductions");
    if (listVals !== undefined && listVals[0] !== undefined) {
      listVals.forEach((item: any) => {
        if (item && item[category]) {
          tempTotal += Number(item[category]);
        }
      });
    }

    const creditingYears = Number(
      form.getFieldValue("totalNumberOfCreditingYears") || 0
    );
    if (creditingYears > 0) {
      form.setFieldValue(categoryToAdd, String(tempTotal));
      form.setFieldValue(
        EMISSION_CATEGORY_AVG_MAP[category],
        formatNumberWithDecimalPlaces(tempTotal / creditingYears)
      );
    } else {
      form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], 0);
    }
  };

  const calculateTotalEmissions = (
    value: any,
    category: string,
    categoryToAdd: string
  ) => {
    const listVals = form.getFieldValue("estimatedNetEmissionReductions");
    if (typeof listVals === "undefined" || typeof listVals[0] === "undefined") {
      return;
    }

    const tempTotal = listVals?.reduce((total: number, currentVal: any) => {
      if (!currentVal) {
        return total;
      }
      return total + (currentVal[category] || 0);
    }, 0);

    const creditingYears = Number(
      form.getFieldValue("totalNumberOfCreditingYears") || 0
    );
    if (creditingYears > 0) {
      form.setFieldValue(categoryToAdd, String(tempTotal));
      form.setFieldValue(
        EMISSION_CATEGORY_AVG_MAP[category],
        formatNumberWithDecimalPlaces(tempTotal / creditingYears)
      );
    } else {
      form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], 0);
    }

    CalculateNetTotalEmissions();
  };

  const calculateBufferPool = (
    value: any,
    category: string,
    categoryToAdd: string
  ) => {
    const listVals = form.getFieldValue("estimatedNetEmissionReductions");
    const bufferPool = listVals?.reduce((total: number, currentVal: any) => {
      return total + currentVal.bufferPoolAllocation;
    }, 0);

    const tempTotal = bufferPool;
    const creditingYears = Number(
      form.getFieldValue("totalNumberOfCreditingYears") || 0
    );
    form.setFieldValue(categoryToAdd, bufferPool);
    if (creditingYears > 0) {
      form.setFieldValue(
        EMISSION_CATEGORY_AVG_MAP[category],
        formatNumberWithDecimalPlaces(tempTotal / creditingYears)
      );
    } else {
      form.setFieldValue(EMISSION_CATEGORY_AVG_MAP[category], 0);
    }
  };

  const onPeriodChange = () => {
    const reductions = form.getFieldValue("estimatedNetEmissionReductions");
    let totalCreditingYears = 0;

    reductions.forEach((reduction: any) => {
      const start = toMoment(reduction.startDate)?.startOf("month");
      const end = toMoment(reduction.endDate)?.endOf("month");

      if (start && end) {
        const diff = moment.duration(end.diff(start));
        totalCreditingYears += Math.floor(diff.asMonths() + 1) / 12;
      }
    });
    form.setFieldValue(
      "totalNumberOfCreditingYears",
      Number(totalCreditingYears).toFixed(2)
    );
  };

  return (
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
            Estimated Net GHG Emission Reductions Or Removals (tCO₂e)
          </Col>
          {projectCategory === ProjectCategory.AFOLU && (
            <Col md={3} xl={3}>
              Buffer Pool Allocation
            </Col>
          )}
          <Col md={3} xl={3}>
            {" "}
          </Col>
        </Row>

        <Form.List name="estimatedNetEmissionReductions">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index: number) => (
                <>
                  <Row
                    justify={"space-between"}
                    align={"middle"}
                    className="mg-top-1"
                  >
                    <Col md={6} xl={6} className="col1">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <Form.Item
                          label={``}
                          name={[name, "startDate"]}
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
                                  throw new Error(`${t("common:required")}`);
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
                            disabled={disabled}
                            onChange={(_value) => onPeriodChange()}
                          />
                        </Form.Item>
                        <span style={{ marginBottom: 23 }}>to</span>
                        <Form.Item
                          label={``}
                          name={[name, "endDate"]}
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
                                  throw new Error(`${t("common:required")}`);
                                }

                                const startDate = moment(
                                  form.getFieldValue(
                                    "estimatedNetEmissionReductions"
                                  )[name].startDate
                                ).startOf("month");
                                const selectedDate =
                                  moment(value).startOf("month");

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
                                // const isOneYear = Math.round(duration.asMonths()) === 12;

                                // if (!isOneYear) {
                                //   throw new Error('Duration should be a year');
                                // }
                              },
                            },
                          ]}
                        >
                          <DatePicker
                            size="large"
                            placeholder="End Date"
                            picker="month"
                            format="YYYY MMM"
                            onChange={(_value) => onPeriodChange()}
                            disabled={disabled}
                          />
                        </Form.Item>
                      </div>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name={[name, "baselineEmissionReductions"]}
                        className="full-width-form-item"
                        rules={[
                          {
                            required: true,
                            message: `${t("common:required")}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
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
                        <InputNumber
                          size="large"
                          className="full-width-form-item"
                          onChange={(value) => {
                            calculateNetGHGEmissions(value, name);
                            calculateTotalEmissions(
                              value,
                              "baselineEmissionReductions",
                              "totalBaselineEmissionReductions"
                            );
                          }}
                          disabled={disabled}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name={[name, "projectEmissionReductions"]}
                        rules={[
                          {
                            required: true,
                            message: `${t("common:required")}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
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
                        <InputNumber
                          size="large"
                          className="full-width-form-item"
                          onChange={(value) => {
                            calculateNetGHGEmissions(value, name);
                            calculateTotalEmissions(
                              value,
                              "projectEmissionReductions",
                              "totalProjectEmissionReductions"
                            );
                          }}
                          disabled={disabled}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name={[name, "leakageEmissionReductions"]}
                        rules={[
                          {
                            required: true,
                            message: `${t("common:required")}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
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
                        <InputNumber
                          size="large"
                          className="full-width-form-item"
                          onChange={(value) => {
                            calculateNetGHGEmissions(value, name);
                            calculateTotalEmissions(
                              value,
                              "leakageEmissionReductions",
                              "totalLeakageEmissionReductions"
                            );
                          }}
                          disabled={disabled}
                        />
                      </Form.Item>
                    </Col>
                    <Col md={3} xl={3}>
                      <Form.Item
                        name={[name, "netEmissionReductions"]}
                        rules={[
                          {
                            required: true,
                            message: `${t("common:required")}`,
                          },
                          {
                            validator(rule, value) {
                              if (!value) {
                                return Promise.resolve();
                              } else if (isNaN(value)) {
                                return Promise.reject(
                                  new Error("Should be a number")
                                );
                              } else if (Number(value) < 0) {
                                return Promise.reject(
                                  new Error(
                                    `${t(
                                      "common:estimatedNetGHGEmissionShouldHavePositive"
                                    )}`
                                  )
                                );
                              }

                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <InputNumber
                          size="large"
                          disabled
                          className="full-width-form-item"
                        />
                      </Form.Item>
                    </Col>
                    {projectCategory === ProjectCategory.AFOLU && (
                      <Col md={3} xl={3}>
                        <Form.Item
                          name={[name, "bufferPoolAllocation"]}
                          rules={[
                            {
                              required: true,
                              message: `${t("common:required")}`,
                            },
                            {
                              validator(rule, value) {
                                if (!value) {
                                  return Promise.resolve();
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
                          <InputNumber
                            className="full-width-form-item"
                            size="large"
                            onChange={(value) => {
                              calculateBufferPool(
                                value,
                                "bufferPoolAllocation",
                                "totalBufferPoolAllocations"
                              );
                              calculateTotalEmissions(
                                value,
                                "bufferPoolAllocation",
                                "totalBufferPoolAllocations"
                              );
                            }}
                            disabled={disabled}
                          />
                        </Form.Item>
                      </Col>
                    )}
                    <Col md={3} xl={3} style={{ verticalAlign: "top" }}>
                      <Form.Item>
                        {fields.length > 1 && (
                          <Button
                            // type="dashed"
                            style={{ marginRight: 5 }}
                            onClick={() => {
                              // reduceTotalCreditingYears()
                              remove(name);
                              onPeriodChange(null, fields.length - 1);
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
                              calculateTotalEmissions(
                                null,
                                "bufferPoolAllocation",
                                "totalBufferPoolAllocations"
                              );
                            }}
                            size="small"
                            className="addMinusBtn"
                            // block
                            icon={<MinusOutlined />}
                            disabled={disabled}
                          >
                            {/* Add Entity */}
                          </Button>
                        )}
                        {index === fields.length - 1 && (
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
                            disabled={disabled}
                          >
                            {/* Add Entity */}
                          </Button>
                        )}
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ))}
            </>
          )}
        </Form.List>
        {/* Emmissions calculations */}
        {/* calc Row 1 start */}
        <Row justify={"space-between"} align={"top"}>
          <Col md={6} xl={6}>
            {t("common:total")}
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="totalBaselineEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="totalProjectEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="totalLeakageEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="totalNetEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>

          {projectCategory === ProjectCategory.AFOLU && (
            <Col md={3} xl={3} className="total-cols">
              <Form.Item
                name="totalBufferPoolAllocations"
                rules={[
                  {
                    required: true,
                    message: `${t("common:required")}`,
                  },
                  {
                    validator(rule, value) {
                      if (!value) {
                        return Promise.resolve();
                      }

                      // eslint-disable-next-line no-restricted-globals
                      if (isNaN(value)) {
                        return Promise.reject(new Error("Should be a number"));
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  className="full-width-form-item"
                  disabled
                />
              </Form.Item>
            </Col>
          )}
          <Col md={3} xl={3}>
            {" "}
          </Col>
        </Row>
        {/* calc Row 1 end */}
        {/* calc row 2 start */}
        <Row justify={"space-between"} align={"top"}>
          <Col md={6} xl={6}>
            {t("common:totalCreditingYears")}
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="totalNumberOfCreditingYears"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
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
          {projectCategory === ProjectCategory.AFOLU && (
            <Col md={3} xl={3}>
              {" "}
            </Col>
          )}
          <Col md={3} xl={3}>
            {" "}
          </Col>
        </Row>
        {/* calc row 2 end */}
        {/* calc row 3 start */}
        <Row justify={"space-between"} align={"top"}>
          <Col md={6} xl={6}>
            {t("common:averageCreditingPeriod")}
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="avgBaselineEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="avgProjectEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                className="full-width-form-item"
                disabled
              />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="avgLeakageEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input size="large" className="full-width-form-item" disabled />
            </Form.Item>
          </Col>
          <Col md={3} xl={3} className="total-cols">
            <Form.Item
              name="avgNetEmissionReductions"
              rules={[
                {
                  required: true,
                  message: `${t("common:required")}`,
                },
                {
                  validator(rule, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    // eslint-disable-next-line no-restricted-globals
                    if (isNaN(value)) {
                      return Promise.reject(new Error("Should be a number"));
                    }

                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input size="large" className="full-width-form-item" disabled />
            </Form.Item>
          </Col>
          {projectCategory === ProjectCategory.AFOLU && (
            <Col md={3} xl={3} className="total-cols">
              <Form.Item
                name="avgBufferPoolAllocations"
                rules={[
                  {
                    required: true,
                    message: `${t("common:required")}`,
                  },
                  {
                    validator(rule, value) {
                      if (!value) {
                        return Promise.resolve();
                      }

                      // eslint-disable-next-line no-restricted-globals
                      if (isNaN(value)) {
                        return Promise.reject(new Error("Should be a number"));
                      }

                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  className="full-width-form-item"
                  disabled
                />
              </Form.Item>
            </Col>
          )}
          <Col md={3} xl={3} className="total-cols">
            {" "}
          </Col>
        </Row>
        {/* calc row 3 end */}
      </div>
    </>
  );
};

export default NetEmissionReduction;
