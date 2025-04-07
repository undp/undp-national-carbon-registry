import { ValidationStepsProps } from "./StepProps";
import {
  Row,
  Button,
  Form,
  Col,
  Input,
  Checkbox,
  Table,
  TableProps,
  InputNumber,
  Radio,
  Select,
} from "antd";
import TextArea from "antd/lib/input/TextArea";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { ProcessSteps } from "./ValidationStepperComponent";
import { requiredValidationRule } from "../../Utils/validationHelper";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { useEffect, useState } from "react";
import LabelWithTooltip from "../LabelWithTooltip/LabelWithTooltip";
import { useLocation } from "react-router-dom";

const ValidationMethodology = (props: ValidationStepsProps) => {
  const countryName = import.meta.env.VITE_APP_COUNTRY_NAME || "CountryX";

  const {
    prev,
    next,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    disableFields,
    formMode,
  } = props;

  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      form.setFieldValue("validationTeamMembers", [{ role: "" }]);
      form.setFieldValue("technicalReviews", [{ role: "" }]);
    }
  }, [formMode]);

  const onFinish = async (values: any) => {
    console.log("--------values-----------", values);
    const body = { ...values };

    console.log(ProcessSteps.VR_VALIDATION_METHODOLOGY, body);
    handleValuesUpdate({
      validationMethdology: body,
    });
  };

  return (
    <>
      {current === 3 && (
        <div>
          <div className="val-report-step-form-container">
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              validateTrigger={false}
              onFinish={(values: any) => {
                onFinish(values);
                if (next) {
                  next();
                }
              }}
              // disabled={FormMode.VIEW === formMode}
            >
              {/* Validation team member table start */}
              <h4 className="form-section-heading">
                {t("validationReport:validationTeamMemberTableTitle")}
              </h4>
              <div className="validation-team-member-table">
                <Row className="header">
                  <Col xl={1} className="col-1 col">
                    No
                  </Col>
                  <Col xl={4} className="other-cols col">
                    Role
                  </Col>
                  <Col xl={3} className="other-cols col">
                    Type Of Resource
                  </Col>
                  <Col xl={3} className="other-cols col">
                    Last name
                  </Col>
                  <Col xl={3} className="other-cols col">
                    First name
                  </Col>
                  <Col xl={3} className="other-cols col">
                    Affliation
                  </Col>
                  <Col xl={4}>
                    <Row>
                      <Col className="other-cols col" xl={24}>
                        Involvement in
                      </Col>
                    </Row>
                    <Row>
                      <Col xl={6} className="vertical-col">
                        Desk/Document Review
                      </Col>
                      <Col xl={6} className="vertical-col">
                        On-site inspection
                      </Col>
                      <Col xl={6} className="vertical-col">
                        Interviews
                      </Col>
                      <Col xl={6} className="vertical-col">
                        Validation Findings
                      </Col>
                    </Row>
                  </Col>
                  <Col xl={3}></Col>
                </Row>

                <Form.List name="validationTeamMembers">
                  {(fields, { add, remove }) => (
                    <Row className="body">
                      {fields.map(({ key, name, ...restFields }) => (
                        <>
                          <Col xl={1} className="col-1 col">
                            {name + 1 < 10 && "0"}
                            {name + 1}
                          </Col>
                          <Col xl={4} className="col other-cols">
                            <Form.Item
                              name={[name, "role"]}
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
                                        `${t("validationReport:required")}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <Select disabled={disableFields}>
                                <Select.Option value={"TL"}>
                                  {t("validationReport:teamLeader")}
                                </Select.Option>
                                <Select.Option value={"TE"}>
                                  {t("validationReport:technicalExpert")}
                                </Select.Option>
                                <Select.Option value={"TM"}>
                                  {t("validationReport:teamMember")}
                                </Select.Option>
                                <Select.Option value={"ITR"}>
                                  {t(
                                    "validationReport:internalTechnicalReviewer"
                                  )}
                                </Select.Option>
                                <Select.Option value={"DR"}>
                                  {t("validationReport:documentReviewOption")}
                                </Select.Option>
                                <Select.Option value={"SV"}>
                                  {t("validationReport:siteVisit")}
                                </Select.Option>
                                <Select.Option value={"RI"}>
                                  {t("validationReport:reportIssuance")}
                                </Select.Option>
                                <Select.Option value={"TR"}>
                                  {t("validationReport:technicalReview")}
                                </Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>

                          <Col xl={3} className="other-cols col">
                            <Form.Item
                              name={[name, "typeOfResource"]}
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
                                        `${t("validationReport:required")}`
                                      );
                                    }
                                  },
                                },
                              ]}
                            >
                              <Radio.Group
                                className="radio-btn-grp"
                                disabled={disableFields}
                              >
                                <Radio value="IR">
                                  {t("validationReport:IR")}
                                </Radio>
                                <Radio value="ER">
                                  {t("validationReport:ER")}
                                </Radio>
                              </Radio.Group>
                            </Form.Item>
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
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(
                                        `${t(
                                          "validationReport:referencesToDocument"
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
                                      String(value).trim() === undefined ||
                                      value === null ||
                                      value === undefined
                                    ) {
                                      throw new Error(
                                        `${t("validationReport:provider")} ${t(
                                          "isRequired"
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
                              name={[name, "affliation"]}
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
                                        `${t("validationReport:provider")} ${t(
                                          "isRequired"
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
                          <Col xl={4}>
                            <Row>
                              <Col xl={6} className="other-cols checkbox-cols">
                                <Form.Item
                                  name={[name, "documentReview"]}
                                  valuePropName="checked"
                                >
                                  <Checkbox disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={6} className="other-cols checkbox-cols">
                                <Form.Item
                                  name={[name, "onsiteInspections"]}
                                  valuePropName="checked"
                                >
                                  <Checkbox disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={6} className="other-cols checkbox-cols">
                                <Form.Item
                                  name={[name, "interviews"]}
                                  valuePropName="checked"
                                >
                                  <Checkbox disabled={disableFields} />
                                </Form.Item>
                              </Col>
                              <Col xl={6} className="other-cols checkbox-cols">
                                <Form.Item
                                  name={[name, "validationFindings"]}
                                  valuePropName="checked"
                                >
                                  <Checkbox disabled={disableFields} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>
                          <Col xl={3} className="col action-col">
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
                    </Row>
                  )}
                </Form.List>
              </div>
              {/* Validation team member table end */}

              {/* Technical reviewer table start */}
              <h4 className="form-section-heading">
                {t("validationReport:technicalReviewerTableTitle")}
              </h4>

              <div className="technical-reviewer-table">
                <div className="header">
                  <Row>
                    <Col xl={1} className="col-1 col">
                      No
                    </Col>
                    <Col xl={4} className="other-cols col">
                      Role
                    </Col>
                    <Col xl={4} className="other-cols col">
                      Type of resource
                    </Col>
                    <Col xl={4} className="other-cols col">
                      Last name
                    </Col>
                    <Col xl={4} className="other-cols col">
                      First name
                    </Col>
                    <Col xl={4} className="other-cols col">
                      Affliation
                    </Col>
                    <Col xl={2}></Col>
                  </Row>
                </div>

                <div className="body">
                  <Form.List name="technicalReviews">
                    {(fields, { add, remove }) => (
                      <Row>
                        {fields.map(({ key, name, ...restFields }) => (
                          <>
                            <Col xl={1} className="col-1 col" key={key}>
                              {name + 1 < 10 && "0"}
                              {name + 1}
                            </Col>
                            <Col xl={4} className="other-cols col">
                              <Form.Item
                                name={[name, "role"]}
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
                                          `${t("validationReport:required")}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Select disabled={disableFields}>
                                  <Select.Option value="technicalReviewer">
                                    {t("validationReport:technicalReviewer")}
                                  </Select.Option>
                                  <Select.Option value="approver">
                                    {t("validationReport:approver")}
                                  </Select.Option>
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col xl={4} className="other-cols col">
                              <Form.Item
                                name={[name, "typeOfResource"]}
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
                                          `${t("validationReport:required")}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Radio.Group
                                  className="radio-btn-grp"
                                  disabled={disableFields}
                                >
                                  <Radio value="IR">
                                    {t("validationReport:IR")}
                                  </Radio>
                                  <Radio value="ER">
                                    {t("validationReport:ER")}
                                  </Radio>
                                </Radio.Group>
                              </Form.Item>
                            </Col>
                            <Col xl={4} className="other-cols col">
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
                                        String(value).trim() === undefined ||
                                        value === null ||
                                        value === undefined
                                      ) {
                                        throw new Error(
                                          `${t("validationReport:required")}`
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
                                        String(value).trim() === undefined ||
                                        value === null ||
                                        value === undefined
                                      ) {
                                        throw new Error(
                                          `${t("validationReport:required")}`
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
                                name={[name, "affliation"]}
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
                                          `${t("validationReport:required")}`
                                        );
                                      }
                                    },
                                  },
                                ]}
                              >
                                <Input disabled={disableFields} />
                              </Form.Item>
                            </Col>
                            <Col xl={3} className="col action-col">
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
                      </Row>
                    )}
                  </Form.List>
                </div>
              </div>
              {/* Technical reviewer table end */}

              <Row
                justify={"end"}
                className="step-actions-end mg-top-2 mg-bottom-2"
              >
                <Button danger size={"large"} disabled={false} onClick={prev}>
                  {t("validationReport:cancel")}
                </Button>
                {disableFields ? (
                  <Button
                    type="primary"
                    size={"large"}
                    disabled={false}
                    onClick={next}
                  >
                    {t("validationReport:next")}
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    size={"large"}
                    disabled={false}
                    htmlType="submit"
                  >
                    {t("validationReport:next")}
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

export default ValidationMethodology;
