/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Button, Checkbox, Col, Form, Input, InputNumber, Modal, Row } from "antd";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { CreditItmoAuthorizationInterface } from "../Interfaces/creditItmoAuthorization.interface";
import {
  CreditRetirementProceedAction,
  RetirementActionEnum,
} from "../Enums/creditRetirementProceedType.enum";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";

interface ItmoAuthProceedModalProps {
  icon?: any;
  title?: string;
  onCancel: any;
  onFinish: (
    transactionId: string,
    action: RetirementActionEnum,
    remark: string
  ) => void;
  loading: boolean;
  actionBtnText?: string;
  openModal: boolean;
  remarkRequired?: boolean;
  proceedAction?: CreditRetirementProceedAction;
  t: any;
  data?: CreditItmoAuthorizationInterface;
}

export const ItmoAuthProceedModal = (props: ItmoAuthProceedModalProps) => {
  const {
    onFinish,
    onCancel,
    actionBtnText,
    openModal,
    title,
    icon,
    loading,
    remarkRequired,
    proceedAction,
    t,
    data,
  } = props;

  const [form] = Form.useForm();
  const [actionDisable, setActionDisable] = useState(true);
  const remarkRef = useRef<string>("");
  const checkedRef = useRef<boolean>(false);

  useEffect(() => {
    if (openModal) {
      form.resetFields();
      form.setFieldsValue({
        project: data?.projectName,
        cooperativeApproachId: data?.cooperativeApproachId,
        comment: "",
        confirm: false,
      });
      remarkRef.current = "";
      checkedRef.current = false;
      setActionDisable(true);
    }
  }, [openModal, data, form]);

  const handleValuesChange = (_: any, allValues: any) => {
    remarkRef.current = allValues.comment || "";
    checkedRef.current = allValues.confirm || false;

    let valid = checkedRef.current;
    if (remarkRequired && !remarkRef.current.trim()) {
      valid = false;
    }
    setActionDisable(!valid);
  };

  const handleSubmit = () => {
    if (!data) return;
    onFinish(
      data.id,
      proceedAction === CreditRetirementProceedAction.ACCEPT
        ? RetirementActionEnum.ACCEPT
        : proceedAction === CreditRetirementProceedAction.REJECT
        ? RetirementActionEnum.REJECT
        : RetirementActionEnum.CANCEL,
      remarkRef.current
    );
  };

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
        </div>
      }
      className="popup-ITMO_AUTHORIZATION"
      open={openModal}
      width={Math.min(430, window.innerWidth)}
      centered
      footer={null}
      onCancel={onCancel}
      destroyOnClose
    >
      {data && (
        <div className="credit-action-model">
          <Form
            form={form}
            name="itmo-auth-proceed-form"
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={handleSubmit}
          >
            <Row>
              <Col span={24}>
                <Form.Item label={t("From")} name="From">
                  <Input placeholder={data.senderName} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item label={t("project")} name="project">
                  <Input placeholder={data.projectName} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  label={t("cooperativeApproach")}
                  name="cooperativeApproachId"
                >
                  <Input placeholder={data.cooperativeApproachId} disabled />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8} justify="space-between">
              <Col>
                <label>
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t("creditAmount")}
                  </span>
                </label>
              </Col>
              <Col lg={12} md={10}>
                <InputNumber
                  disabled
                  style={{ width: "100%" }}
                  value={data?.creditAmount ?? ""}
                  formatter={() => addCommSep(data.creditAmount)}
                />
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  className="remarks-label"
                  label={t("remark")}
                  name="comment"
                  rules={[
                    {
                      required: remarkRequired,
                      message: t("required"),
                    },
                    {
                       
                      validator: (_, val) => {
                        if (remarkRequired && val && val.trim() === "") {
                          return Promise.reject(t("required"));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input.TextArea placeholder="" />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  className="text-left"
                  name="confirm"
                  valuePropName="checked"
                >
                  <Checkbox
                    className={
                      proceedAction === CreditRetirementProceedAction.ACCEPT
                        ? "checkbox-accept"
                        : proceedAction === CreditRetirementProceedAction.REJECT
                        ? "checkbox-reject"
                        : "checkbox-process"
                    }
                  >
                    {t("checkBoxProceed")}
                  </Checkbox>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item className="footer">
              <Button htmlType="button" onClick={onCancel}>
                {t("view:cancel")}
              </Button>
              <Button
                style={
                  !actionDisable
                    ? {
                        backgroundColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? COLOR_CONFIGS.PRIMARY_THEME_COLOR
                            : COLOR_CONFIGS.FAILED_RESPONSE_COLOR,
                        borderColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? COLOR_CONFIGS.PRIMARY_THEME_COLOR
                            : COLOR_CONFIGS.FAILED_RESPONSE_COLOR,
                      }
                    : {}
                }
                className="mg-left-2"
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={actionDisable}
              >
                {actionBtnText}
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </Modal>
  );
};
