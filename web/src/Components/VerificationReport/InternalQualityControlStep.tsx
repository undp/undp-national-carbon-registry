import { Button, Col, Form, Row } from "antd";
import TextArea from "antd/lib/input/TextArea";
import { FormMode } from "../../Definitions/Enums/formMode.enum";
import { VerificationStepProps } from "./StepProps";

export const InternalQualityControlStep = (props: VerificationStepProps) => {
  const {
    t,
    current,
    form,
    formMode,
    next,
    prev,
    handleValuesUpdate,
    disableFields,
  } = props;
  const maximumImageSize = import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE
    ? parseInt(import.meta.env.VITE_APP_MAXIMUM_FILE_SIZE)
    : 5000000;

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };

  const onFinish = (values: any) => {
    // console.log('--------values-----------', values);
    const body = { ...values };
    handleValuesUpdate({
      internalQualityControl: body,
    });
  };

  return (
    <>
      {current === 7 && (
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
                      label={`${t("verificationReport:iq_internalQuality")}`}
                      name="iq_internalQuality"
                      rules={[
                        {
                          required: true,
                          message: `${t(
                            "verificationReport:iq_internalQuality"
                          )} ${t("isRequired")}`,
                        },
                      ]}
                    >
                      <TextArea rows={8} disabled={disableFields} />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
              <Row justify={"end"} className="step-actions-end">
                <Button danger onClick={prev} disabled={false}>
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
