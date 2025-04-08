import { Button, Col, Form, message, Row, Upload } from "antd";
import TextArea from "antd/lib/input/TextArea";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { useState } from "react";
import { CustomStepsProps } from "./StepProps";
import { fileUploadValueExtract } from "../../Utils/utilityHelper";
import { SlcfFormActionModel } from "../Models/SlcfFormActionModel";
import ConfirmSubmitSVG from "../../Assets/DialogIcons/ConfirmSubmit.svg";
import { useLocation } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { API_PATHS } from "../../Config/apiConfig";
import { DocumentEnum } from "../../Definitions/Enums/document.enum";
import { DocumentStateEnum } from "../../Definitions/Definitions/documentState.enum";

export const AnnexureStep = (props: CustomStepsProps) => {
  const {
    t,
    current,
    form,
    formMode,
    next,
    prev,
    handleValuesUpdate,
    disableFields,
    documentId,
    handleLoading,
  } = props;

  const { post } = useConnection();

  const { state } = useLocation();

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
    const appendixFormValues: any = {
      appendix: values?.a_appendix,
      a_uploadDoc: await fileUploadValueExtract(values, "a_uploadDoc"),
    };
    handleValuesUpdate(appendixFormValues);
  };

  const [showDialog, setShowDialog] = useState<boolean>(false);

  const closeDialog = () => {
    setShowDialog(false);
  };

  const [formValues, setFormValues] = useState<any>();

  const [showVerifyDialog, setShowVerifyDialog] = useState<boolean>(false);
  const [showDeclineDialog, setShowDeclineDialog] = useState<boolean>(false);

  const closeVerifyDialogBox = () => {
    setShowVerifyDialog(false);
  };

  const closeDeclineDialogBox = () => setShowDeclineDialog(false);

  const approve = async () => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.MONITORING,
          remarks: "approved",
          action: DocumentStateEnum.IC_APPROVED,
        });

        if (res?.statusText === "SUCCESS") {
          message.open({
            type: "success",
            content: "Monitoring report was approved successfully",
            duration: 4,
            style: { textAlign: "right", marginRight: 15, marginTop: 10 },
          });

          if (next) {
            next();
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

  const reject = async (remarks?: string) => {
    if (documentId) {
      if (handleLoading) {
        handleLoading(true);
      }
      try {
        const res = await post(API_PATHS.VERIFY_DOCUMENT, {
          refId: documentId,
          documentType: DocumentEnum.MONITORING,
          remarks: remarks,
          action: DocumentStateEnum.IC_REJECTED,
        });

        if (res?.statusText === "SUCCESS") {
          message.open({
            type: "success",
            content: "Monitoring report rejected",
            duration: 4,
            style: { textAlign: "right", marginRight: 15, marginTop: 10 },
          });

          if (next) {
            next();
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
      {current === 6 && (
        <div>
          <div className="step-form-container">
            {(state?.mode === FormMode.CREATE ||
              state?.mode === FormMode.EDIT) && (
              <>
                <SlcfFormActionModel
                  icon={<ConfirmSubmitSVG />}
                  title={t("monitoringReport:confirmModalMessage")}
                  onCancel={closeDialog}
                  actionBtnText={t("common:yes")}
                  onFinish={() => {
                    onFinish(formValues);
                    closeDialog();
                  }}
                  openModal={showDialog}
                  type={"primary"}
                  remarkRequired={false}
                  t={t}
                />
              </>
            )}

            {state?.mode === FormMode.VERIFY && (
              <>
                <SlcfFormActionModel
                  actionBtnText={t("monitoringReport:reject")}
                  onCancel={closeDeclineDialogBox}
                  icon={<CloseCircleOutlined />}
                  title={t("monitoringReport:declineMessage")}
                  onFinish={(remarks: string) => {
                    console.log("-----remarks-------", remarks);
                    reject(remarks);
                  }}
                  remarkRequired
                  type="danger"
                  subText=""
                  openModal={showDeclineDialog}
                  t={t}
                />

                <SlcfFormActionModel
                  actionBtnText={t("monitoringReport:approve")}
                  onCancel={closeVerifyDialogBox}
                  icon={<CheckCircleOutlined />}
                  title={t("monitoringReport:approveMessage")}
                  onFinish={() => {
                    approve();
                  }}
                  remarkRequired={false}
                  type="primary"
                  subText=""
                  openModal={showVerifyDialog}
                  t={t}
                />
              </>
            )}
            <Form
              labelCol={{ span: 20 }}
              wrapperCol={{ span: 24 }}
              className="step-form"
              layout="vertical"
              requiredMark={true}
              form={form}
              // disabled={disableFields}
              onFinish={(values: any) => {
                setShowDialog(true);
                setFormValues(values);
              }}
            >
              <h4 className="appendix-title">
                <i>{`${t("monitoringReport:a_appendix")}`}</i>
              </h4>
              <Row className="row" gutter={[40, 16]}>
                <Col xl={24} md={24}>
                  <div className="step-form-left-col">
                    <Form.Item name="a_appendix">
                      <TextArea rows={8} disabled={disableFields} />
                    </Form.Item>

                    <Form.Item
                      label={t("monitoringReport:a_uploadDoc")}
                      name="a_uploadDoc"
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                      required={false}
                      rules={[
                        {
                          validator: async (rule, file) => {
                            if (file?.length > 0) {
                              if (file[0]?.size > maximumImageSize) {
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
                        className="design-upload-section"
                        name="design"
                        action="/upload.do"
                        listType="picture"
                        multiple={false}
                        disabled={disableFields}
                      >
                        <Button
                          className="upload-doc"
                          size="large"
                          icon={<UploadOutlined />}
                          disabled={disableFields}
                        >
                          {t("monitoringReport:upload")}
                        </Button>
                      </Upload>
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              {/* <Row className="step-actions-end"> */}
              {/* <Col>
                  <Button onClick={prev} disabled={false}>
                    {t('monitoringReport:back')}
                  </Button>
                </Col> */}
              <Row justify={"end"} className="step-actions-end">
                {(state?.mode === FormMode.CREATE ||
                  state?.mode === FormMode.EDIT) && (
                  <>
                    <Button danger size={"large"} onClick={prev}>
                      {t("monitoringReport:prev")}
                    </Button>
                    <Button type="primary" htmlType="submit">
                      {t("monitoringReport:submit")}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VIEW && (
                  <>
                    <Button danger size={"large"} onClick={prev}>
                      {t("monitoringReport:prev")}
                    </Button>
                    <Button type="primary" onClick={next}>
                      {t("monitoringReport:goBackProjectDetails")}
                    </Button>
                  </>
                )}
                {state?.mode === FormMode.VERIFY && (
                  <>
                    <Button size={"large"} onClick={prev} type={"default"}>
                      {t("monitoringReport:prev")}
                    </Button>
                    <Button
                      danger
                      size={"large"}
                      onClick={() => setShowDeclineDialog(true)}
                    >
                      {t("monitoringReport:reject")}
                    </Button>
                    <Button
                      size={"large"}
                      onClick={() => setShowVerifyDialog(true)}
                      type="primary"
                    >
                      {t("monitoringReport:approve")}
                    </Button>
                  </>
                )}
                {/* <Button danger size={'large'} onClick={prev}>
                  {t('monitoringReport:prev')}
                </Button>
                {disableFields ? (
                  <Button type="primary" onClick={next}>
                    {t('monitoringReport:goBackProjectDetails')}
                  </Button>
                ) : (
                  <Button type="primary" size={'large'} htmlType={'submit'}>
                    {t('monitoringReport:submit')}
                  </Button>
                )} */}
                {/* </Row> */}
                {/* {userInfoState?.companyRole === CompanyRole.PROGRAMME_DEVELOPER &&
                  FormMode.VIEW !== formMode && (
                    <Button type="primary" htmlType="submit" disabled={loading}>
                      <span>{t('monitoringReport:submit')}</span>
                    </Button>
                  )} */}

                {/* {userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
                  status === DocumentStatus.PENDING && (
                    <Button danger onClick={reject} disabled={false}>
                      <span>{t('monitoringReport:reject')}</span>
                    </Button>
                  )}
                {userInfoState?.companyRole === CompanyRole.CLIMATE_FUND &&
                  status === DocumentStatus.PENDING && (
                    <Button type="primary" onClick={approve} disabled={false}>
                      <span>{t('monitoringReport:approve')}</span>
                    </Button>
                  )} */}
              </Row>
            </Form>
          </div>
        </div>
      )}
    </>
  );
};
