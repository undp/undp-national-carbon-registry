import { Button, Col, Form, Row, Input, DatePicker } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import TextArea from "antd/lib/input/TextArea";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { DocumentStatus } from "../../Definitions/Enums/document.status";
import i18n from "../Internationalization/i18n";
import { VerificationStepProps } from "./StepProps";
import moment from "moment";

const clCols = [
  "finding-cl-1",
  "finding-cl-2",
  "finding-cl-3",
  "finding-cl-4",
  "finding-cl-5",
  "finding-cl-6",
  "finding-cl-7",
  "finding-cl-8",
  "finding-cl-9",
  "finding-cl-10",
  "finding-cl-11",
  "finding-cl-12",
  "finding-cl-13",
  "finding-cl-14",
  "finding-cl-15",
  "finding-cl-16",
  "finding-cl-17",
  "finding-cl-18",
  "finding-cl-19",
  "finding-cl-20",
];

const carCols = [
  "finding-car-1",
  "finding-car-2",
  "finding-car-3",
  "finding-car-4",
  "finding-car-5",
  "finding-car-6",
  "finding-car-7",
  "finding-car-8",
  "finding-car-9",
  "finding-car-10",
  "finding-car-11",
  "finding-car-12",
  "finding-car-13",
  "finding-car-14",
  "finding-car-15",
  "finding-car-16",
  "finding-car-17",
  "finding-car-18",
  "finding-car-19",
  "finding-car-20",
];

const farCols = [
  "finding-far-1",
  "finding-far-2",
  "finding-far-3",
  "finding-far-4",
  "finding-far-5",
  "finding-far-6",
  "finding-far-7",
  "finding-far-8",
  "finding-far-9",
  "finding-far-10",
  "finding-far-11",
  "finding-far-12",
  "finding-far-13",
  "finding-far-14",
  "finding-far-15",
  "finding-far-16",
  "finding-far-17",
  "finding-far-18",
  "finding-far-19",
  "finding-far-20",
];

export const MeansOfVerificationStep = (props: VerificationStepProps) => {
  const {
    current,
    form,
    formMode,
    prev,
    handleValuesUpdate,
    next,
    disableFields,
  } = props;
  const { userInfoState } = useUserContext();
  const t = i18n.t;
  const maximumImageSize = import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  // useEffect(() => {
  //   if (formMode === FormMode.CREATE) {
  //     form.setFieldValue('onSiteInspection', [{ activity: '' }]);
  //     form.setFieldValue('interviewees', [{ lastName: '' }]);
  //   }
  // }, []);

  const calculateTotalCL = (value: number) => {
    let total = 0;
    clCols.forEach((colKey: string) => {
      total += Number(form.getFieldValue(colKey)) || 0;
    });

    form.setFieldValue("cl-total", total);
  };

  const calculateTotalCar = (value: number) => {
    let total = 0;
    carCols.forEach((colKey: string) => {
      total += Number(form.getFieldValue(colKey)) || 0;
    });

    form.setFieldValue("car-total", total);
  };

  const calculateTotalFar = (value: number) => {
    let total = 0;
    farCols.forEach((colKey: string) => {
      total += Number(form.getFieldValue(colKey)) || 0;
    });

    form.setFieldValue("far-total", total);
  };

  const onFinish = (values: any) => {
    console.log("--------values-----------", values);
    const body = {
      ...values,
      siteInspectionDurationStart: moment(values?.siteInspectionDurationStart)
        .startOf("day")
        .unix(),
      siteInspectionDurationEnd: moment(values?.siteInspectionDurationEnd)
        .startOf("day")
        .unix(),
      onSiteInspection: values?.onSiteInspection.map((item: any) => {
        return {
          ...item,
          activityPerformedDate: moment(item?.activityPerformedDate)
            .startOf("day")
            .unix(),
        };
      }),
      interviewees: values?.interviewees.map((item: any) => {
        return {
          ...item,
          date: moment.unix(item?.date).startOf("day").unix(),
        };
      }),
    };
    handleValuesUpdate({
      meansOfVerification: body,
    });
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
                      label={t("verificationReport:meansOfVerification")}
                      name="m_meansOfVerification"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            "verificationReport:meansOfVerification"
                          )} ${t("isRequired")}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>

                    {/* On-site inspection table start */}
                    <>
                      <h4 className="form-section-heading">
                        {t("verificationReport:onSiteInspection")}
                      </h4>
                      <div className="onSiteInspection-table mg-bottom-2">
                        <Row>
                          <Col xl={21} className="duration-header">
                            <p>Duration of on-site inspection:</p>
                            <Form.Item
                              name="siteInspectionDurationStart"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="small"
                                disabledDate={(currentDate: any) =>
                                  currentDate < moment().startOf("day")
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                            <p>to</p>
                            <Form.Item
                              name="siteInspectionDurationEnd"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <DatePicker
                                size="small"
                                disabledDate={(currentDate: any) =>
                                  currentDate < moment().startOf("day")
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3}></Col>
                        </Row>
                        <Row className="header">
                          <Col xl={1} className="col col-1">
                            No
                          </Col>
                          <Col xl={6} className="col other-cols">
                            Activity performed on-site
                          </Col>
                          <Col xl={5} className="col other-cols">
                            Site location
                          </Col>
                          <Col xl={5} className="col other-cols">
                            Date
                          </Col>
                          <Col xl={4} className="col other-cols">
                            Team member
                          </Col>
                          <Col xl={3}></Col>
                        </Row>
                        <Row className="body">
                          <Form.List name="onSiteInspection">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restFields }) => (
                                  <>
                                    <Col xl={1} className="col-1 col" key={key}>
                                      {name + 1 < 10 && "0"}
                                      {name + 1}
                                    </Col>
                                    <Col xl={6} className="other-cols col">
                                      <Form.Item
                                        name={[name, "activity"]}
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
                                                  `${t(
                                                    "verificationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={5} className="other-cols col">
                                      <Form.Item
                                        name={[name, "siteLocation"]}
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
                                                  `${t(
                                                    "verificationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={5} className="other-cols col">
                                      <Form.Item
                                        name={[name, "activityPerformedDate"]}
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
                                                  `${t(
                                                    "verificationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <DatePicker
                                          size="small"
                                          disabledDate={(currentDate: any) =>
                                            currentDate <
                                            moment().startOf("day")
                                          }
                                          disabled={disableFields}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={4} className="other-cols col">
                                      <Form.Item
                                        name={[name, "teamMember"]}
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
                                                  `${t(
                                                    "verificationReport:provider"
                                                  )} ${t("isRequired")}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="action-col">
                                      <Form.Item>
                                        <Button
                                          onClick={add}
                                          size="small"
                                          className="addMinusBtn"
                                          disabled={disableFields}
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
                    </>
                    {/* On-site inspection table end */}

                    {/* Interviews table start */}
                    <>
                      <h4 className="form-section-heading">
                        {t("verificationReport:interviews")}
                      </h4>
                      <div className="interviews-table">
                        <Row className="header">
                          <Col xl={1} className="col-1 col">
                            No
                          </Col>
                          <Col xl={9} className="interviewee-col">
                            <Row>
                              <Col xl={24} className="other-cols col">
                                Interviewee
                              </Col>
                            </Row>
                            <Row>
                              <Col
                                xl={8}
                                className="interviewee-col-subCols-first"
                              >
                                Last name
                              </Col>
                              <Col xl={8} className="interviewee-col-subCols">
                                First name
                              </Col>
                              <Col
                                xl={8}
                                className="interviewee-col-subCols-last"
                              >
                                Affliation
                              </Col>
                            </Row>
                          </Col>
                          <Col xl={3} className="other-cols col">
                            Date
                          </Col>
                          <Col xl={3} className="other-cols col">
                            Subject
                          </Col>
                          <Col xl={4} className="other-cols col">
                            Team Member
                          </Col>
                          <Col xl={3}></Col>
                        </Row>
                        <Row className="body mg-bottom-2">
                          <Form.List name="interviewees">
                            {(fields, { add, remove }) => (
                              <>
                                {fields.map(({ key, name, ...restFields }) => (
                                  <>
                                    <Col xl={1} className="col-1 col">
                                      {name + 1 < 10 && "0"}
                                      {name + 1}
                                    </Col>
                                    <Col xl={3} className="other-cols col">
                                      <Form.Item
                                        name={[name, "lastName"]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="other-cols col">
                                      <Form.Item
                                        name={[name, "firstName"]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="other-cols col">
                                      <Form.Item
                                        name={[name, "affliationName"]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="other-cols col">
                                      <Form.Item
                                        name={[name, "date"]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <DatePicker
                                          size="small"
                                          disabledDate={(currentDate: any) =>
                                            currentDate <
                                            moment().startOf("day")
                                          }
                                          disabled={disableFields}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={3} className="other-cols col">
                                      <Form.Item
                                        name={[name, "subject "]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={4} className="other-cols col">
                                      <Form.Item
                                        name={[name, "teamMember"]}
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
                                                  `${t(
                                                    "validationReport:required"
                                                  )}`
                                                );
                                              }
                                            },
                                          },
                                        ]}
                                      >
                                        <Input disabled={disableFields} />
                                      </Form.Item>
                                    </Col>
                                    <Col xl={4} className="action-col">
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
                    </>
                    {/* Interviews table end */}

                    <Form.Item
                      label={t("verificationReport:samplingApproach")}
                      name="samplingApproach"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            "verificationReport:samplingApproach"
                          )} ${t("isRequired")}`,
                        },
                      ]}
                    >
                      <TextArea rows={6} disabled={disableFields} />
                    </Form.Item>

                    {/* Clarification Table start */}
                    <h4 className="form-section-heading">
                      {t("verificationReport:clarificationRequestsTableTitle")}
                    </h4>
                    <div className="clarification-requests-table mg-bottom-2">
                      <Row className="header">
                        <Col xl={15} className="col col-1">
                          Areas of validation findings
                        </Col>
                        <Col xl={3} className="col other-cols">
                          No. of CL
                        </Col>
                        <Col xl={3} className="col other-cols">
                          No. of CAR
                        </Col>
                        <Col xl={3} className="col other-cols">
                          No. of FAR
                        </Col>
                      </Row>
                      <div className="body">
                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:demonstrationPriorCDM")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-1"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-1"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-1"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t(
                              "verificationReport:identificationOfProjectType"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-2"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-2"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-2"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t(
                              "verificationReport:descriptionOfProjectActivity"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-3"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-3"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-3"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t(
                              "verificationReport:applicationMethodologiesSectionHeading"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols"></Col>
                          <Col xl={3} className="col other-cols"></Col>
                          <Col xl={3} className="col other-cols"></Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t(
                              "verificationReport:applicationMethodologiesBaselines"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-4"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-4"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-4"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t("verificationReport:deviationMethodology")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-5"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-5"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-5"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t("verificationReport:clarificationOnMethodology")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-6"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-6"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-6"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t("verificationReport:projectBoundarySources")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-7"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-7"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-7"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t("verificationReport:baselineScenario")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-8"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-8"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-8"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t(
                              "verificationReport:demonstrationOfAdditionality"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-9"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-9"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-9"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t(
                              "verificationReport:estimationOfEmissionReduction"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-10"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-10"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-10"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 pd-left">
                            {t("verificationReport:monitoringPlan")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-11"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-11"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-11"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:startDateCreditingPeriod")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-12"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-12"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-12"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:environmentImpacts")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-13"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-13"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-13"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t(
                              "verificationReport:localStakeholderConsultation"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-14"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-14"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-14"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:sustainableDevelopment")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-15"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-15"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-15"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:approval")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-16"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-16"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-16"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:authorization")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-17"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-17"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-17"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t("verificationReport:modalitiesOfCommunication")}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-18"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-18"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-18"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            {t(
                              "verificationReport:globalStakeholderConsultation"
                            )}
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-19"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-19"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-19"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1">
                            <Form.Item
                              name="clarificationOthers"
                              //   rules={[
                              //     {
                              //       required: true,
                              //       message: '',
                              //     },
                              //     {
                              //       validator: async (rule, value) => {
                              //         if (
                              //           String(value).trim() === '' ||
                              //           String(value).trim() === undefined ||
                              //           value === null ||
                              //           value === undefined
                              //         ) {
                              //           throw new Error(`${t('verificationReport:required')}`);
                              //         }
                              //       },
                              //     },
                              //   ]}
                            >
                              <Input
                                placeholder={`${t(
                                  "verificationReport:others"
                                )}`}
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-cl-20"
                              //   rules={[
                              //     {
                              //       required: true,
                              //       message: '',
                              //     },
                              //     {
                              //       validator: async (rule, value) => {
                              //         if (
                              //           String(value).trim() === '' ||
                              //           String(value).trim() === undefined ||
                              //           value === null ||
                              //           value === undefined
                              //         ) {
                              //           throw new Error(`${t('verificationReport:required')}`);
                              //         }

                              //         if (isNaN(value)) {
                              //           return Promise.reject(new Error('Should be a number'));
                              //         }

                              //         return Promise.resolve();
                              //       },
                              //     },
                              //   ]}
                            >
                              <Input
                                onChange={(e) =>
                                  calculateTotalCL(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-car-20"
                              //   rules={[
                              //     {
                              //       required: true,
                              //       message: '',
                              //     },
                              //     {
                              //       validator: async (rule, value) => {
                              //         if (
                              //           String(value).trim() === '' ||
                              //           String(value).trim() === undefined ||
                              //           value === null ||
                              //           value === undefined
                              //         ) {
                              //           throw new Error(`${t('verificationReport:required')}`);
                              //         }

                              //         if (isNaN(value)) {
                              //           return Promise.reject(new Error('Should be a number'));
                              //         }

                              //         return Promise.resolve();
                              //       },
                              //     },
                              //   ]}
                            >
                              <Input
                                onChange={(e) =>
                                  calculateTotalCar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="finding-far-20"
                              //   rules={[
                              //     {
                              //       required: true,
                              //       message: '',
                              //     },
                              //     {
                              //       validator: async (rule, value) => {
                              //         if (
                              //           String(value).trim() === '' ||
                              //           String(value).trim() === undefined ||
                              //           value === null ||
                              //           value === undefined
                              //         ) {
                              //           throw new Error(`${t('verificationReport:required')}`);
                              //         }

                              //         if (isNaN(value)) {
                              //           return Promise.reject(new Error('Should be a number'));
                              //         }

                              //         return Promise.resolve();
                              //       },
                              //     },
                              //   ]}
                            >
                              <Input
                                onChange={(e) =>
                                  calculateTotalFar(Number(e.target.value))
                                }
                                disabled={disableFields}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Row>
                          <Col xl={15} className="col col-1 text-bold">
                            Total
                          </Col>
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="cl-total"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="car-total"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                          <Col xl={3} className="col other-cols">
                            <Form.Item
                              name="far-total"
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
                                      throw new Error(
                                        `${t("verificationReport:required")}`
                                      );
                                    }

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
                        </Row>
                      </div>
                    </div>
                    {/* Clarification Table end */}
                  </div>
                </Col>
              </Row>
              <Row justify={"end"} className="step-actions-end">
                <Button danger size={"large"} onClick={prev} disabled={false}>
                  {t("verificationReport:back")}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t("verificationReport:next")}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={"large"}
                    htmlType={"submit"}
                    // onClick={next}
                  >
                    {t("verificationReport:next")}
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
