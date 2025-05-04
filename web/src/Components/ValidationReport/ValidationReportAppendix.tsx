import {
  Row,
  Button,
  Form,
  Upload,
  Col,
  Input,
  DatePicker,
  message,
} from "antd";
import TextArea from "antd/lib/input/TextArea";
import { CustomStepsProps } from "../PDD/StepProps";
import { RcFile } from "antd/lib/upload";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { ProcessSteps } from "./ValidationStepperComponent";
import { fileUploadValueExtract } from "../../Utils/utilityHelper";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import moment from "moment";
import { useEffect, useState } from "react";
import ConfirmSubmitSVG from "../../Assets/DialogIcons/ConfirmSubmit.svg";
import ConfirmDialog from "../ConfirmDialog/ConfirmDialog";
import { SlcfFormActionModel } from "../Models/SlcfFormActionModel";
import { useLocation } from "react-router-dom";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
import { API_PATHS } from "../../Config/apiConfig";
import { DocumentStateEnum } from "../../Definitions/Definitions/documentState.enum";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { ValidationStepsProps } from "./StepProps";
import { defaultTimeout } from "../../Definitions/Constants/defaultTimeout";

const ValidationReportAppendix = (props: ValidationStepsProps) => {
  const {
    next,
    prev,
    form,
    current,
    handleValuesUpdate,
    submitForm,
    t,
    handleLoading,
    documentId,
    disableFields,
    formMode,
  } = props;

  const { post } = useConnection();

  const { state } = useLocation();
  // const [disableFields, setDisableFields] = useState<boolean>(false);

  useEffect(() => {
    if (formMode === FormMode.CREATE) {
      form.setFieldValue("documentsReviewed", [{ author: "" }]);
    }
  }, []);

  const maximumImageSize = import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    const tempVals: any = {
      ...values,
      documentsReviewed: values?.documentsReviewed,
      appendix1Documents: await fileUploadValueExtract(
        values,
        "appendix1Documents"
      ),
      cl_date: moment(values?.cl_date).startOf("day").unix(),
      cl_projectParticipantResponseDate: moment(
        values?.cl_projectParticipantResponseDate
      )
        .startOf("day")
        .unix(),
      cl_doeAssesmentDate: moment(values?.cl_doeAssesmentDate)
        .startOf("day")
        .unix(),
      car_date: moment(values?.car_date).startOf("day").unix(),
      car_projectParticipantResponseDate: moment(
        values?.car_projectParticipantResponseDate
      )
        .startOf("day")
        .unix(),
      car_doeAssesmentDate: moment(values?.car_doeAssesmentDate)
        .startOf("day")
        .unix(),
      far_date: moment(values?.far_date).startOf("day").unix(),
      far_projectParticipantResponseDate: moment(
        values?.far_projectParticipantResponseDate
      )
        .startOf("day")
        .unix(),
      far_doeAssesmentDate: moment(values?.far_doeAssesmentDate)
        .startOf("day")
        .unix(),
    };

    console.log("---------temVals-------------", tempVals);
    handleValuesUpdate(tempVals);
  };

  const [showDialog, setShowDialog] = useState<boolean>(false);

  const [formValues, setFormValues] = useState<any>();

  const closeDialog = () => {
    setShowDialog(false);
  };

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState<boolean>(false);

  const closeVerifyDialogBox = () => {
    setShowVerifyDialog(false);
  };
  const closeDeclineDialogBox = () => setShowDeclineDialog(false);

  const approveValidationReport = async () => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.VALIDATION,
          remarks: "approved",
          action: DocumentStateEnum.DNA_APPROVED,
        });

        if (res?.statusText === "SUCCESS") {
          message.open({
            type: "success",
            content: "Validation report approved successfully",
            duration: 4,
            style: { textAlign: "right", marginRight: 15, marginTop: 10 },
          });

          if (next) {
            setTimeout(() => {
              next();
            }, defaultTimeout);
          }
        }
      } catch (error) {
        message.open({
          type: "error",
          content: t("common:somethingWentWrong"),
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
      } finally {
        if (handleLoading) {
          handleLoading(false);
        }
      }
    }
  };

  const rejectValidationReport = async (remarks?: string) => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.VALIDATION,
          remarks: remarks,
          action: DocumentStateEnum.DNA_REJECTED,
        });

        if (res?.statusText === "SUCCESS") {
          message.open({
            type: "success",
            content: "Validation report rejected",
            duration: 4,
            style: { textAlign: "right", marginRight: 15, marginTop: 10 },
          });

          if (next) {
            setTimeout(() => {
              next();
            }, defaultTimeout)
          }
        }
      } catch (error) {
        message.open({
          type: "error",
          content: t("common:somethingWentWrong"),
          duration: 4,
          style: { textAlign: "right", marginRight: 15, marginTop: 10 },
        });
      } finally {
        if (handleLoading) {
          handleLoading(false);
        }
      }
    }
  };

  return (
    <>
      {current === 8 && (
        <div>
          <div className="val-report-step-form-container">
            {state?.mode === FormMode.VERIFY && (
              <>
                <SlcfFormActionModel
                  actionBtnText={t("validationReport:approve")}
                  onCancel={closeVerifyDialogBox}
                  icon={<CheckCircleOutlined />}
                  title={t("validationReport:approveMessage")}
                  onFinish={() => {
                    approveValidationReport();
                  }}
                  remarkRequired={false}
                  type="primary"
                  subText=""
                  openModal={showVerifyDialog}
                  t={t}
                />

                <SlcfFormActionModel
                  actionBtnText={t("validationReport:reject")}
                  onCancel={closeDeclineDialogBox}
                  icon={<CloseCircleOutlined />}
                  title={t("validationReport:declineMessage")}
                  onFinish={(remarks: string) => {
                    rejectValidationReport(remarks);
                  }}
                  remarkRequired
                  type="danger"
                  subText=""
                  openModal={showDeclineDialog}
                  t={t}
                />
              </>
            )}

            {(state?.mode === FormMode.CREATE ||
              state?.mode === FormMode.EDIT) && (
              <SlcfFormActionModel
                icon={<ConfirmSubmitSVG />}
                title={t("validationReport:confirmModalMessage")}
                onCancel={closeDialog}
                actionBtnText={t("common:yes")}
                onFinish={() => {
                  closeDialog();
                  onFinish(formValues);
                }}
                openModal={showDialog}
                type={"primary"}
                remarkRequired={false}
                t={t}
              />
            )}
            {/* <ConfirmDialog
              showDialog={showDialog}
              Icon={ConfirmSubmitSVG}
              message={t('validationReport:confirmModalMessage')}
              subMessage={`${t('validationReport:confirmModalSubMessage')}`}
              okText={t('common:yes')}
              cancelText={t('common:no')}
              okAction={() => {
                closeDialog();
                onFinish(formValues);
              }}
              closeDialog={closeDialog}
              isReject={false}
            /> */}
            {/* <SlcfFormActionModel 
              actionBtnText={t('common:yes')}
              onCancel={closeDialog}
              icon={ConfirmSubmitSVG}
              title={t('validationReport:confirmModalMessage')} 
              remarkRequired={false}
              type="primary"
              subText=""
              onFinish={() => {
                closeDialog();
                onFinish(formValues);
              }}
              openModal={showDialog}
              t={t}
            /> */}
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              disabled={disableFields}
              onFinish={(values: any) => {
                setFormValues(values);
                setShowDialog(true);
              }}
              // disabled={FormMode.VIEW === formMode}
            >
              {/* appendix 1 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t("validationReport:appendix")} 1</i>:{" "}
                  {t("validationReport:appendix1Title")}
                </h4>
                <Form.Item
                  // label={`${t('PDD:additionalComments')}`}
                  name="appendix1Comments"
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
                            `${t("validationReport:additionalComments")} ${t(
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

                <div className="custom-label-validation">
                  {t("validationReport:uploadDocs")}
                </div>
                <Form.Item
                  // label={t('validationReport:uploadDocs')}
                  name="appendix1Documents"
                  valuePropName="fileList"
                  getValueFromEvent={normFile}
                  required={false}
                  rules={[
                    {
                      validator: async (rule, file) => {
                        // if (disableFields) return;
                        for (let i = 0; i < file?.length; i++) {
                          if (file[i]?.size > maximumImageSize) {
                            // default size format of files would be in bytes -> 1MB = 1000000bytes
                            throw new Error(`${t("common:maxSizeVal")}`);
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
                    className="design-upload-section-validation"
                    name="design"
                    action="/upload.do"
                    listType="picture"
                    multiple={true}
                    disabled={disableFields}
                    // maxCount={1}
                  >
                    <Button
                      className="upload-doc"
                      size="large"
                      icon={<UploadOutlined />}
                      disabled={disableFields}
                    >
                      {t("validationReport:upload")}
                    </Button>
                  </Upload>
                </Form.Item>
              </>
              {/* appendix 1 end */}

              {/* appendix 2 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t("validationReport:appendix")} 2 </i>:{" "}
                  {t("validationReport:appendix2Title")}
                </h4>

                {/* //////////// need to add table */}
                <div className="appendix-documents-reviewed-table">
                  <div className="header">
                    <Row>
                      <Col xl={1} className="col-1 col">
                        No
                      </Col>
                      <Col xl={5} className="col-2 col">
                        Author
                      </Col>
                      <Col xl={5} className="col-3 col">
                        Title
                      </Col>
                      <Col xl={5} className="col-4 col">
                        References to the document
                      </Col>
                      <Col xl={5} className="col-5 col">
                        Provider
                      </Col>
                      <Col xl={2}></Col>
                    </Row>
                  </div>

                  <div className="body">
                    <Form.List name="documentsReviewed">
                      {(fields, { add, remove }) => (
                        <Row>
                          {fields.map(({ key, name, ...restFields }) => (
                            <>
                              <Col xl={1} className="col-1 col" key={key}>
                                {name + 1 < 10 && "0"}
                                {name + 1}
                              </Col>
                              <Col xl={5} className="col-2 col">
                                <Form.Item
                                  name={[name, "author"]}
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
                              <Col xl={5} className="col-3 col">
                                <Form.Item
                                  name={[name, "title"]}
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
                              <Col xl={5} className="col-4 col">
                                <Form.Item
                                  name={[name, "referencesToDocument"]}
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
                              <Col xl={5} className="col-5 col">
                                <Form.Item
                                  name={[name, "provider"]}
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
                                <Form.Item>
                                  <Button
                                    onClick={add}
                                    size="small"
                                    className="addMinusBtn"
                                    icon={<PlusOutlined />}
                                    disabled={disableFields}
                                  ></Button>
                                </Form.Item>
                              </Col>
                            </>
                          ))}
                        </Row>
                      )}
                    </Form.List>
                  </div>
                </div>
              </>
              {/* appendix 2 end */}

              {/* appendix 3 start */}
              <>
                <h4 className="appendix-title">
                  <i>{t("validationReport:appendix")} 3 </i>:{" "}
                  {t("validationReport:appendix3Title")}
                </h4>

                {/* table 1 start */}
                <h4 className="appendix-title">
                  {t("validationReport:appendixTable1Title")}
                </h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:cl_id")}`}
                        name="cl_id"
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
                                  `${t("validationReport:cl_id")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large"/>
                      </Form.Item>

                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="cl_date"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:section")}`}
                        name="cl_section"
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
                                  `${t("validationReport:section")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large" />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t("validationReport:description")}`}
                        name="cl_description"
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
                                  `${t("validationReport:description")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t(
                          "validationReport:projectParticipantResponse"
                        )}`}
                        name="cl_projectParticipantResponse"
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
                                    "validationReport:projectParticipantResponse"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="cl_projectParticipantResponseDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t(
                          "validationReport:documentationProvidedByProjectParticipant"
                        )}`}
                        name="cl_documentationProvidedByProjectParticipant"
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
                                    "validationReport:documentationProvidedByProjectParticipant"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:doeAssesment")}`}
                        name="cl_doeAssesment"
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
                                  `${t("validationReport:doeAssesment")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="cl_doeAssesmentDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                {/* table 1 end */}

                {/* table 2 start */}
                <h4 className="appendix-title">
                  {t("validationReport:appendixTable2Title")}
                </h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:car_id")}`}
                        name="car_id"
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
                                  `${t("validationReport:car_id")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large"/>
                      </Form.Item>

                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="car_date"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:section")}`}
                        name="car_section"
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
                                  `${t("validationReport:section")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large"/>
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t("validationReport:description")}`}
                        name="car_description"
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
                                  `${t("validationReport:description")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t(
                          "validationReport:projectParticipantResponse"
                        )}`}
                        name="car_projectParticipantResponse"
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
                                    "validationReport:projectParticipantResponse"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="car_projectParticipantResponseDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t(
                          "validationReport:documentationProvidedByProjectParticipant"
                        )}`}
                        name="car_documentationByProjectParticipant"
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
                                    "validationReport:documentationProvidedByProjectParticipant"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:doeAssesment")}`}
                        name="car_doeAssesment"
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
                                  `${t("validationReport:doeAssesment")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="car_doeAssesmentDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                {/* table 2 end */}

                {/* table 3 start */}
                <h4 className="appendix-title">
                  {t("validationReport:appendixTable3Title")}
                </h4>
                <div className="appendix-table-section">
                  <Row gutter={[40, 16]}>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:far_id")}`}
                        name="far_id"
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
                                  `${t("validationReport:far_id")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large"/>
                      </Form.Item>

                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="far_date"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:section")}`}
                        name="far_section"
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
                                  `${t("validationReport:section")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <Input disabled={disableFields} size="large"/>
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t("validationReport:description")}`}
                        name="far_description"
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
                                  `${t("validationReport:description")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t(
                          "validationReport:projectParticipantResponse"
                        )}`}
                        name="far_projectParticipantResponse"
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
                                    "validationReport:projectParticipantResponse"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>
                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="far_projectParticipantResponseDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={24}>
                      <Form.Item
                        label={`${t(
                          "validationReport:documentationProvidedByProjectParticipant"
                        )}`}
                        name="far_documentationByProjectParticipant"
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
                                    "validationReport:documentationProvidedByProjectParticipant"
                                  )} ${t("isRequired")}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <TextArea rows={4} disabled={disableFields} />
                      </Form.Item>
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:doeAssesment")}`}
                        name="far_doeAssesment"
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
                                  `${t("validationReport:doeAssesment")} ${t(
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
                    </Col>

                    <Col md={24} xl={12}>
                      <Form.Item
                        label={`${t("validationReport:date")}`}
                        name="far_doeAssesmentDate"
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
                                  `${t("validationReport:date")} ${t(
                                    "isRequired"
                                  )}`
                                );
                              }
                            },
                          },
                        ]}
                      >
                        <DatePicker
                          size="large"
                          disabled={disableFields}
                          disabledDate={(currentDate: any) =>
                            currentDate < moment().startOf("day")
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
                {/* table 3 end */}
              </>
              {/* appendix 3 end */}

              <Row justify={"end"} className="step-actions-end mg-top-2">
                {/* <Button danger size={'large'} onClick={prev} disabled={false}>
                  {t('validationReport:prev')}
                </Button>
                {FormMode.VIEW !== formMode && (
                  <Button type="primary" size={'large'} htmlType="submit" disabled={false}>
                    {t('validationReport:submit')}
                  </Button>
                )}
                {FormMode.VIEW === formMode && (
                  <Button type="primary" size={'large'} disabled={false} onClick={next}>
                    {t('validationReport:backtoProjectDetails')}
                  </Button>
                )} */}

                {(state?.mode === FormMode.CREATE ||
                  state?.mode === FormMode.EDIT) && (
                  <>
                    <Button
                      danger
                      size={"large"}
                      onClick={prev}
                      disabled={false}
                    >
                      {t("validationReport:prev")}
                    </Button>
                    <Button type="primary" htmlType="submit" disabled={false}>
                      {t("validationReport:submit")}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VIEW && (
                  <>
                    <Button
                      danger
                      size={"large"}
                      onClick={prev}
                      disabled={false}
                    >
                      {t("validationReport:prev")}
                    </Button>
                    <Button type="primary" onClick={next} disabled={false}>
                      {t("validationReport:backtoProjectDetails")}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VERIFY && (
                  <>
                    <Button
                      size={"large"}
                      onClick={prev}
                      disabled={false}
                      type={"default"}
                    >
                      {t("validationReport:prev")}
                    </Button>
                    <Button
                      danger
                      size={"large"}
                      onClick={() => setShowDeclineDialog(true)}
                      disabled={false}
                    >
                      {t("validationReport:reject")}
                    </Button>
                    <Button
                      size={"large"}
                      onClick={() => setShowVerifyDialog(true)}
                      type="primary"
                      disabled={false}
                    >
                      {t("validationReport:approve")}
                    </Button>
                  </>
                )}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};

export default ValidationReportAppendix;
