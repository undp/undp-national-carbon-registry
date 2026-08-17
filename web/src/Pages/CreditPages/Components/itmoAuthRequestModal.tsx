/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { Button, Col, Form, Input, InputNumber, Modal, Row, Select } from "antd";
import { CreditBalanceInterface } from "../Interfaces/creditBalance.interface";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { AuthorizationPurpose, AUTHORIZATION_PURPOSE_LABELS } from "../../../Definitions/Enums/authorizationPurpose.enum";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";

export interface ItmoAuthRequestModalFinishPayload {
  blockId: string;
  amount: number;
  cooperativeApproachId: string;
  authorizationPurpose: string;
  authorizedTimeframeStartYear: number | undefined;
  authorizedTimeframeEndYear: number | undefined;
  remarks: string | undefined;
}

interface ItmoAuthRequestModalProps {
  icon?: any;
  title?: string;
  onCancel: any;
  onFinish: (payload: ItmoAuthRequestModalFinishPayload) => void;
  loading: boolean;
  actionBtnText?: string;
  openModal: boolean;
  t: any;
  data?: CreditBalanceInterface;
}

const AUTHORIZATION_PURPOSE_OPTIONS = Object.values(AuthorizationPurpose).map((value) => ({
  value,
  label: AUTHORIZATION_PURPOSE_LABELS[value],
}));

interface CooperativeApproachRow {
  cooperativeApproachId: string;
  title: string;
  hostParty: string;
  participatingParties: string[];
  startDate?: number;
  endDate?: number;
}

export const ItmoAuthRequestModal = (props: ItmoAuthRequestModalProps) => {
  const { onFinish, onCancel, actionBtnText, openModal, title, icon, loading, t, data } =
    props;

  const { post } = useConnection();
  const [form] = Form.useForm();
  const [actionDisable, setActionDisable] = useState(true);
  const [cooperativeApproachRows, setCooperativeApproachRows] = useState<
    CooperativeApproachRow[]
  >([]);
  const [casLoading, setCasLoading] = useState(false);
  // Tracked as state (not just the ref below) so the purpose options
  // can be recomputed on render as the user changes the CA selection.
  const [selectedCaId, setSelectedCaId] = useState<string | undefined>(
    undefined
  );

  const amountRef = useRef<number | undefined>(undefined);
  const cooperativeApproachIdRef = useRef<string | undefined>(undefined);
  // Defaults to NDC — the popup should not submit with no purpose picked;
  // see createItmoAuthRequest, which used to silently default a missing
  // purpose to NDC server-side. That fallback is gone now that the field is
  // mandatory on the DTO, so the UI carries the default instead.
  const authorizationPurposeRef = useRef<string | undefined>(AuthorizationPurpose.NDC);
  const authorizedTimeframeStartYearRef = useRef<number | undefined>(undefined);
  const authorizedTimeframeEndYearRef = useRef<number | undefined>(undefined);
  const remarksRef = useRef<string>("");

  const cooperativeApproaches = cooperativeApproachRows.map((ca) => ({
    value: ca.cooperativeApproachId,
    label: `${ca.cooperativeApproachId} — ${ca.title}`,
  }));

  // A CA with no participating party besides the host has nowhere for
  // an NDC first transfer to go — mirrors the backend guard in
  // createItmoAuthRequest (itmoAuthNdcRequiresCounterparty). Defaults
  // to available before a CA is picked (nothing to restrict yet).
  const selectedCa = cooperativeApproachRows.find(
    (ca) => ca.cooperativeApproachId === selectedCaId
  );
  const ndcAvailable =
    !selectedCa ||
    selectedCa.participatingParties.some((p) => p !== selectedCa.hostParty);
  const purposeOptions = ndcAvailable
    ? AUTHORIZATION_PURPOSE_OPTIONS
    : AUTHORIZATION_PURPOSE_OPTIONS.filter(
        (o) => o.value !== AuthorizationPurpose.NDC
      );

  const loadCooperativeApproaches = async () => {
    setCasLoading(true);
    try {
      const response = await post("national/cooperativeApproach/query", {
        page: 1,
        size: 200,
        sort: { key: "createdTime", order: "DESC" },
      });
      const rows: any[] = response?.data ?? [];
      setCooperativeApproachRows(
        rows
          .filter((ca) => ca.status === "Active")
          .map((ca) => ({
            cooperativeApproachId: ca.cooperativeApproachId,
            title: ca.title,
            hostParty: ca.hostParty,
            participatingParties: ca.participatingParties ?? [],
            startDate: ca.startDate,
            endDate: ca.endDate,
          }))
      );
    } catch {
      setCooperativeApproachRows([]);
    } finally {
      setCasLoading(false);
    }
  };

  useEffect(() => {
    if (openModal) {
      form.resetFields();
      loadCooperativeApproaches();
      form.setFieldsValue({
        project: data?.projectName,
        serialNumber: data?.serialNumber,
        cooperativeApproachId: undefined,
        authorizationPurpose: AuthorizationPurpose.NDC,
        authorizedTimeframeStartYear: undefined,
        authorizedTimeframeEndYear: undefined,
        amount: undefined,
        remarks: "",
      });
      amountRef.current = undefined;
      cooperativeApproachIdRef.current = undefined;
      authorizationPurposeRef.current = AuthorizationPurpose.NDC;
      authorizedTimeframeStartYearRef.current = undefined;
      authorizedTimeframeEndYearRef.current = undefined;
      remarksRef.current = "";
      setSelectedCaId(undefined);
      setActionDisable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModal]);

  const handleValuesChange = (_: any, allValues: any) => {
    amountRef.current = allValues.amount;
    cooperativeApproachIdRef.current = allValues.cooperativeApproachId;
    authorizationPurposeRef.current = allValues.authorizationPurpose;
    authorizedTimeframeStartYearRef.current = allValues.authorizedTimeframeStartYear;
    authorizedTimeframeEndYearRef.current = allValues.authorizedTimeframeEndYear;
    remarksRef.current = allValues.remarks || "";

    if (allValues.cooperativeApproachId !== selectedCaId) {
      setSelectedCaId(allValues.cooperativeApproachId);
      const newCa = cooperativeApproachRows.find(
        (ca) => ca.cooperativeApproachId === allValues.cooperativeApproachId
      );

      // The purpose field may hold a now-invalid "Use Towards NDC" for
      // the newly-picked CA — clear it rather than let a client-side
      // choice silently fail server-side. Now that purpose is mandatory,
      // this leaves the field genuinely empty (not defaulted back to NDC),
      // forcing the PD to explicitly pick OIMP/Other rather than have one
      // silently substituted.
      const newCaNdcAvailable =
        !newCa ||
        newCa.participatingParties.some((p) => p !== newCa.hostParty);
      if (
        !newCaNdcAvailable &&
        allValues.authorizationPurpose === AuthorizationPurpose.NDC
      ) {
        form.setFieldsValue({ authorizationPurpose: undefined });
        authorizationPurposeRef.current = undefined;
      }

      // Convenience prefill of the authorized-timeframe years from the
      // newly-picked CA's own dates — still editable, matching what the
      // AEF mapper used to derive automatically before this change.
      const startYear = newCa?.startDate
        ? new Date(newCa.startDate).getUTCFullYear()
        : undefined;
      const endYear = newCa?.endDate
        ? new Date(newCa.endDate).getUTCFullYear()
        : undefined;
      form.setFieldsValue({
        authorizedTimeframeStartYear: startYear,
        authorizedTimeframeEndYear: endYear,
      });
      authorizedTimeframeStartYearRef.current = startYear;
      authorizedTimeframeEndYearRef.current = endYear;
    }

    const amountNum = Number(amountRef.current);
    let valid = true;
    if (!cooperativeApproachIdRef.current) valid = false;
    if (!authorizationPurposeRef.current) valid = false;
    if (
      !Number.isInteger(amountNum) ||
      amountNum <= 0 ||
      !data?.creditAmount ||
      amountNum > data.creditAmount
    ) {
      valid = false;
    }
    setActionDisable(!valid);
  };

  const handleSubmit = () => {
    if (!data) return;
    onFinish({
      blockId: data.id,
      amount: Number(amountRef.current),
      cooperativeApproachId: cooperativeApproachIdRef.current as string,
      authorizationPurpose: authorizationPurposeRef.current as string,
      authorizedTimeframeStartYear: authorizedTimeframeStartYearRef.current,
      authorizedTimeframeEndYear: authorizedTimeframeEndYearRef.current,
      remarks: remarksRef.current,
    });
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
            name="itmo-auth-request-form"
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={handleSubmit}
          >
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
                  rules={[{ required: true, message: t("required") }]}
                >
                  <Select
                    showSearch
                    loading={casLoading}
                    placeholder={t("selectCooperativeApproach")}
                    showArrow
                    autoClearSearchValue
                    filterOption={(input, option: any) =>
                      (option?.label ?? "")
                        .toString()
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={cooperativeApproaches}
                    notFoundContent={
                      casLoading ? undefined : t("noActiveCooperativeApproaches")
                    }
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  label={t("authorizationPurpose")}
                  name="authorizationPurpose"
                  rules={[{ required: true, message: t("required") }]}
                >
                  <Select
                    placeholder={t("selectAuthorizationPurpose")}
                    options={purposeOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item
                  label={t("authorizedTimeframeStartYear")}
                  name="authorizedTimeframeStartYear"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1900}
                    max={2100}
                    placeholder={t("authorizedTimeframeStartYear")}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={t("authorizedTimeframeEndYear")}
                  name="authorizedTimeframeEndYear"
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1900}
                    max={2100}
                    placeholder={t("authorizedTimeframeEndYear")}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8} justify="space-between">
              <Col>
                <label>
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t("creditAmount")}
                    <span
                      style={{
                        color: `${COLOR_CONFIGS.PRIMARY_RED_COLOR}`,
                        position: "relative",
                        top: "2px",
                        marginLeft: 2,
                      }}
                    >
                      *
                    </span>
                  </span>
                </label>
              </Col>
              <Col lg={12} md={10}>
                <Row justify="end">
                  <Col span={24}>
                    <Form.Item
                      name="amount"
                      rules={[
                        {
                           
                          validator: (_, value) => {
                            if (
                              value === undefined ||
                              value === null ||
                              value.toString().trim() === ""
                            ) {
                              return Promise.reject(new Error(t("required")));
                            }
                            if (value <= 0 || isNaN(value)) {
                              return Promise.reject(new Error(t("wrongInput")));
                            }
                            if (!Number.isInteger(Number(value))) {
                              return Promise.reject(
                                new Error(t("shouldBeInterger"))
                              );
                            }
                            if (Number(value) > data.creditAmount) {
                              return Promise.reject(
                                new Error(t("insufficientBalance"))
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <InputNumber
                          placeholder={
                            data?.creditAmount ? addCommSep(data.creditAmount) : ""
                          }
                          style={{ flex: 1, marginRight: 8 }}
                        />
                        <span style={{ margin: "0 8px" }}>/</span>
                        <InputNumber
                          placeholder={
                            data?.creditAmount ? addCommSep(data.creditAmount) : ""
                          }
                          disabled
                          style={{ flex: 1 }}
                          value={data?.creditAmount ?? ""}
                        />
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item className="remarks-label" label={t("remark")} name="remarks">
                  <Input.TextArea placeholder="" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item className="footer">
              <Button htmlType="button" onClick={onCancel}>
                {t("view:cancel")}
              </Button>
              <Button
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
