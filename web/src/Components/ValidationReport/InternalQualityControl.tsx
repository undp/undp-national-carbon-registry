import { ValidationStepsProps } from "./StepProps";
import { Row, Button, Form, Input, Col, Upload, DatePicker } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import TextArea from "antd/lib/input/TextArea";
import { ProcessSteps } from "./ValidationStepperComponent";
import moment from "moment";
import { fileUploadValueExtract } from "../../Utils/utilityHelper";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const ExecutiveSummary = (props: ValidationStepsProps) => {
  const {
    prev,
    next,
    form,
    current,
    t,
    countries,
    handleValuesUpdate,
    disableFields,
  } = props;

  const maximumImageSize = import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.REACT_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = async (values: any) => {
    // const sig1 = (await fileUploadValueExtract(values, 'validator1Signature'))[0];
    // const sig2 = (await fileUploadValueExtract(values, 'validator2Signature'))[0];

    const body: any = {
      internalQualityControl: values?.internalQualityControl,
      //   opinion: values?.opinion,
      //   validator1Signature: sig1,
      //   validator1Designation: values?.validator1Designation,
      //   validator1Name: values?.validator1Name,
      //   validator1DateOfSign: moment(values?.validator1DateOfSign).valueOf(),
      //   validator2Designation: values?.validator2Designation,
      //   validator2Name: values?.validator2Name,
      //   validator2Signature: sig2,
      //   validator2DateOfSign: moment(values?.validator2DateOfSign).valueOf(),
    };

    // console.log(ProcessSteps.VR_VALIDATION_OPINION, body);
    handleValuesUpdate({ internalQualityControl: body });
  };

  return (
    <>
      {current === 6 && (
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
              // disabled={FormMode.VIEW === formMode}
            >
              <Form.Item
                className="full-width-form-item"
                label={`${t("validationReport:internalQualityControl")}`}
                name="internalQualityControl"
                rules={[
                  {
                    required: true,
                    message: `${t(
                      "validationReport:internalQualityControl"
                    )} ${t("isRequired")}`,
                  },
                ]}
              >
                <TextArea disabled={disableFields} rows={4} />
              </Form.Item>

              <Row justify={"end"} className="step-actions-end">
                <Button danger size={"large"} onClick={prev} disabled={false}>
                  {t("validationReport:prev")}
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

export default ExecutiveSummary;
