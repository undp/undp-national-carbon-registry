/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { CreditActionType } from "../Enums/creditActionType.enum";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Row,
  Select,
  Tag,
} from "antd";
import { CreditBalanceInterface } from "../Interfaces/creditBalance.interface";
import { addCommSep } from "../../../Definitions/Definitions/programme.definitions";
import { API_PATHS } from "../../../Config/apiConfig";
import { useConnection } from "../../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../../Context/UserInformationContext/userInformationContext";
import { CreditRetirementInterface } from "../Interfaces/creditRetirement.interface";
import {
  CreditRetirementProceedAction,
  RetirementActionEnum,
} from "../Enums/creditRetirementProceedType.enum";
import { CreditRetirementTypeEmnum } from "../Enums/creditRetirementType.enum";
import { COLOR_CONFIGS } from "../../../Config/colorConfigs";
import { CreditEventStatusEnum } from "../Enums/creditEventEnum";

interface CreditActionModalProps {
  icon?: any;
  title?: string;
  type?: CreditActionType;
  onCancel: any;
  onFinish: any;
  loading: boolean;
  isProceed: boolean;
  proceedAction?: CreditRetirementProceedAction;
  actionBtnText?: string;
  openModal: boolean;
  remarkRequired?: boolean;
  t: any;
  data?: CreditBalanceInterface | CreditRetirementInterface;
}

// Local presentation enum for the retirement-type radio group. Values
// are the hand-rolled i18n keys used by Credit Actions strings; the
// six members mirror CreditRetirementTypeEmnum. The four Article 6.2
// types (Use Towards NDC, Use For OIMP, OMGE Cancellation, SOP
// Adaptation) are added per Decision 2/CMA.3 Annex para 29 (account
// types) + Draft -/CMA.5 para 80 (action subtypes).
enum RetirementType {
  CROSS_BORDER = "crossBoarderTransaction",
  VOLUNTARY_CANCELLATION = "voluntaryCancellations",
  USE_TOWARDS_NDC = "useTowardsNDC",
  USE_FOR_OIMP = "useForOIMP",
  OMGE_CANCELLATION = "omgeCancellation",
  SOP_ADAPTATION = "sopAdaptation",
}

const RETIREMENT_TYPE_TO_ENUM = {
  [RetirementType.CROSS_BORDER]: "Cross-Border Transactions",
  [RetirementType.VOLUNTARY_CANCELLATION]: "Voluntary Cancellations",
  [RetirementType.USE_TOWARDS_NDC]: "Use Towards NDC",
  [RetirementType.USE_FOR_OIMP]: "Use For OIMP",
  [RetirementType.OMGE_CANCELLATION]: "OMGE Cancellation",
  [RetirementType.SOP_ADAPTATION]: "SOP Adaptation",
} as const;

// Inverse of RETIREMENT_TYPE_TO_ENUM: maps a stored backend string back to the
// presentation enum, so the pending-request (proceed) modal can show the true
// type of any of the six stored actions as a read-only selection.
const STORED_TO_RETIREMENT_TYPE: Record<string, RetirementType> = {
  "Cross-Border Transactions": RetirementType.CROSS_BORDER,
  "Voluntary Cancellations": RetirementType.VOLUNTARY_CANCELLATION,
  "Use Towards NDC": RetirementType.USE_TOWARDS_NDC,
  "Use For OIMP": RetirementType.USE_FOR_OIMP,
  "OMGE Cancellation": RetirementType.OMGE_CANCELLATION,
  "SOP Adaptation": RetirementType.SOP_ADAPTATION,
};

export const CreditActionModal = (props: CreditActionModalProps) => {
  const {
    onFinish,
    onCancel,
    actionBtnText,
    openModal,
    title,
    icon,
    isProceed,
    loading,
    type,
    remarkRequired,
    proceedAction,
    t,
    data,
  } = props;
  console.log("-------------proceeed action----------", proceedAction);

  const { get, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [form] = Form.useForm();
  const [retirementType, setRetirementType] = useState<RetirementType>(
    RetirementType.CROSS_BORDER
  );
  const creditAmountRef = useRef<number | undefined>(undefined);
  const recivePartyRef = useRef<any>(undefined);
  const remarkRef = useRef<string>("");
  const checkedRef = useRef<boolean>(type === CreditActionType.TRANSFER);
  const [actionDisable, setActionDisable] = useState<boolean>(true);
  const [listLoading, setListLoading] = useState<boolean>(true);
  const [dropDownList, setDropDownList] = useState<
    { value: string; label: string }[]
  >([]);

  // --- Article 6.2 action model -------------------------------------------
  // The single legacy "Retire" flow is split into distinct Transfer / Use /
  // Cancel actions. RETIREMENT is retained only for the pending-request
  // (proceed) workflow, which still reads stored "retirement" transactions.
  const isTransfer = type === CreditActionType.TRANSFER;
  const isUse = type === CreditActionType.USE;
  const isCancel = type === CreditActionType.CANCEL;
  const isRetirement = type === CreditActionType.RETIREMENT;

  // Transfer can be organization-to-organization or cross-border (a first
  // transfer / transfer under A6.2). Cross-border posts through the same
  // endpoint as use/cancel, carrying retirementType="Cross-Border Transactions".
  const [transferMode, setTransferMode] = useState<
    "organization" | "crossBorder"
  >("organization");
  const isCrossBorder =
    (isTransfer && transferMode === "crossBorder") ||
    (isRetirement && retirementType === RetirementType.CROSS_BORDER);
  // Actions that submit through the retire endpoint (carry a retirementType).
  const usesRetireEndpoint = isUse || isCancel || isCrossBorder;

  // Subtype radios offered per action (values map to backend strings via
  // RETIREMENT_TYPE_TO_ENUM). Proceed mode lists all six for read-only display.
  const subtypeOptions: RetirementType[] = isUse
    ? [RetirementType.USE_TOWARDS_NDC, RetirementType.USE_FOR_OIMP]
    : isCancel
    ? [
        RetirementType.VOLUNTARY_CANCELLATION,
        RetirementType.OMGE_CANCELLATION,
        RetirementType.SOP_ADAPTATION,
      ]
    : isRetirement
    ? [
        RetirementType.CROSS_BORDER,
        RetirementType.VOLUNTARY_CANCELLATION,
        RetirementType.USE_TOWARDS_NDC,
        RetirementType.USE_FOR_OIMP,
        RetirementType.OMGE_CANCELLATION,
        RetirementType.SOP_ADAPTATION,
      ]
    : [];
  const showSubtypeRadios = isUse || isCancel || isRetirement;
  const subtypeLabel = isUse
    ? t("useType")
    : isCancel
    ? t("cancellationType")
    : t("creditActionType");
  const defaultSubtype = isUse
    ? RetirementType.USE_TOWARDS_NDC
    : isCancel
    ? RetirementType.VOLUNTARY_CANCELLATION
    : RetirementType.CROSS_BORDER;

  const getDropDownList = async (source: "org" | "country") => {
    setListLoading(true);
    try {
      setDropDownList([]);
      const response =
        source === "org"
          ? await post(API_PATHS.TRANSFER_ORGANIZATIONS, {
              type: userInfoState?.companyRole,
              filterOwn: true,
            })
          : await get(API_PATHS.CB_RETIRE_COINTRY_QUERY);

      if (response && response.data && response.data.length > 0) {
        const filteredData =
          source === "org"
            ? response.data.filter((item: any) => item.state === "1")
            : response.data;

        setDropDownList(
          filteredData.map((item: any) => ({
            value: source === "org" ? item.id : item.alpha2,
            label: item.name,
          }))
        );
      }
    } catch (error: any) {
      console.log("Error in getting List for the Action", error);
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setListLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleValuesChange = (_: any, allValues: any) => {
    creditAmountRef.current = allValues.creditAmount;

    // When the transfer mode toggles, re-fetch the right dropdown (orgs vs
    // countries) and force re-confirmation, since cross-border is irreversible.
    if (
      isTransfer &&
      allValues.transferMode &&
      allValues.transferMode !== transferMode
    ) {
      setTransferMode(allValues.transferMode);
      form.setFieldValue("confirm", false);
      checkedRef.current = false;
      getDropDownList(
        allValues.transferMode === "crossBorder" ? "country" : "org"
      );
    }

    const crossBorderNow =
      (isTransfer && allValues.transferMode === "crossBorder") ||
      (isRetirement &&
        allValues.retirementType === RetirementType.CROSS_BORDER);

    recivePartyRef.current = crossBorderNow
      ? {
          country: allValues.toCountry,
          organization: allValues.toOrganization,
        }
      : isTransfer
      ? allValues.toCompanyId
      : undefined;

    remarkRef.current = allValues.comment || "";
    checkedRef.current = allValues.confirm || false;

    let valid = true;

    // Reset the confirm checkbox when the subtype changes so the user must
    // re-acknowledge the (irreversible) action against the new selection.
    if (allValues.retirementType) {
      if (
        showSubtypeRadios &&
        allValues.retirementType !== retirementType
      ) {
        form.setFieldValue("confirm", false);
        valid = false;
      }
      setRetirementType(allValues.retirementType);
    }

    // Use / cancel / cross-border are irreversible and require confirmation;
    // a plain organization transfer does not.
    const requiresConfirm = isUse || isCancel || crossBorderNow;
    if (requiresConfirm && !checkedRef.current) {
      valid = false;
    }

    if (isProceed) {
      if (remarkRequired && !remarkRef.current.trim()) {
        valid = false;
      }
      if (["cancel", "reject"].includes(proceedAction) && !allValues.comment) {
        valid = false;
      }
    } else {
      // Receiving party: org transfer needs an organization; cross-border
      // needs both a country and an organization name.
      if (isTransfer && !crossBorderNow && !recivePartyRef.current) {
        valid = false;
      }
      if (
        crossBorderNow &&
        (!recivePartyRef.current?.country ||
          !recivePartyRef.current?.organization)
      ) {
        valid = false;
      }

      const amountNum = Number(creditAmountRef.current);
      if (
        !Number.isInteger(amountNum) ||
        amountNum <= 0 ||
        !data?.creditAmount
      ) {
        valid = false;
      } else if (amountNum > data.creditAmount) {
        valid = false;
      }
      if (remarkRequired && !remarkRef.current.trim()) {
        valid = false;
      }
    }

    setActionDisable(!valid);
  };

  // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
  const handleSubmit = (_: any) => {
    if (isProceed) {
      onFinish(
        data?.id,
        proceedAction === CreditRetirementProceedAction.ACCEPT
          ? RetirementActionEnum.ACCEPT
          : proceedAction === CreditRetirementProceedAction.REJECT
          ? RetirementActionEnum.REJECT
          : RetirementActionEnum.CANCEL,
        remarkRef.current
      );
      return;
    }

    // Plain organization transfer: no retirementType → parent posts to the
    // transfer endpoint.
    if (isTransfer && transferMode === "organization") {
      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        undefined
      );
      return;
    }

    // Cross-border transfer: carries the Cross-Border Transactions type +
    // country/org, posted through the retire endpoint by the parent.
    if (isCrossBorder) {
      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        CreditRetirementTypeEmnum.CROSS_BORDER_TRANSACTIONS
      );
      return;
    }

    // Use / Cancel: carries the chosen subtype, no receiving party.
    const retType = RETIREMENT_TYPE_TO_ENUM[retirementType] as CreditRetirementTypeEmnum;
    onFinish(
      undefined,
      data?.id,
      creditAmountRef.current,
      remarkRef.current,
      retType
    );
  };

  useEffect(() => {
    if (openModal) {
      form.resetFields();

      // Initial subtype: in proceed mode reflect the stored type (any of six);
      // otherwise use the per-action default.
      let retirementTypeRef: RetirementType;
      if (isProceed && data && "retirementType" in data) {
        retirementTypeRef =
          STORED_TO_RETIREMENT_TYPE[data.retirementType.trim()] ??
          RetirementType.CROSS_BORDER;
      } else {
        retirementTypeRef = defaultSubtype;
      }

      // Fetch the right dropdown: orgs for organization transfer, countries for
      // cross-border (transfer or legacy retirement). Use/cancel need neither.
      if (!isProceed) {
        if (isTransfer) {
          getDropDownList("org");
        } else if (
          isRetirement &&
          retirementTypeRef === RetirementType.CROSS_BORDER
        ) {
          getDropDownList("country");
        }
      }

      form.setFieldsValue({
        owner: data?.senderName,
        project: data?.projectName,
        retirementType: retirementTypeRef,
        transferMode: "organization",
        comment: "",
        // Organization transfer needs no confirmation; use/cancel/cross-border do.
        confirm: isTransfer,
      });

      remarkRef.current = "";
      creditAmountRef.current = undefined;
      recivePartyRef.current = undefined;
      checkedRef.current = isTransfer ? true : false;

      setTransferMode("organization");
      setRetirementType(retirementTypeRef);
      setActionDisable(true);
    }
  }, [openModal]);

  return (
    <Modal
      title={
        <div className="popup-header">
          <div className="icon">{icon}</div>
          <div>{title}</div>
        </div>
      }
      className={`popup-${type}`}
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
            name="credit-action-model-form"
            layout="vertical"
            onValuesChange={handleValuesChange}
            onFinish={handleSubmit}
          >
            <Row>
              <Col span={24}>
                {type === CreditActionType.RETIREMENT &&
                  "status" in data &&
                  data.status === CreditEventStatusEnum.PENDING && (
                    <Form.Item
                      className="credit-action-project-name"
                      label={t("From")}
                      name="From"
                    >
                      <Input placeholder={data.senderName} disabled />
                    </Form.Item>
                  )}
              </Col>
            </Row>
            <Row>
              <Col span={24}>
                <Form.Item
                  className="credit-action-project-name"
                  label={t("project")}
                  name="project"
                >
                  <Input placeholder={data.projectName} disabled />
                </Form.Item>
              </Col>
            </Row>

            {isTransfer && (
              <Form.Item
                label={
                  <span style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}>
                    {t("transferType")}
                  </span>
                }
                name="transferMode"
              >
                <Radio.Group disabled={isProceed}>
                  <Radio value="organization">{t("organizationTransfer")}</Radio>
                  <Radio value="crossBorder">{t("crossBorderTransfer")}</Radio>
                </Radio.Group>
              </Form.Item>
            )}

            {isTransfer && transferMode === "organization" && (
              <Row>
                <Col span={24}>
                  <Form.Item
                    className="credit-action-company-select"
                    label={t("to")}
                    name="toCompanyId"
                    rules={[
                      {
                        required: !isProceed,
                        message: t("required"),
                      },
                    ]}
                  >
                    <Select
                      showSearch
                      loading={listLoading}
                      placeholder={t("searchOrganizationByName")}
                      showArrow
                      autoClearSearchValue
                      filterOption={(input, option: any) => {
                        const optionLabel =
                          option?.label?.props?.children || "";
                        const optionValue = option?.label ? option?.label : "";
                        const label =
                          typeof optionLabel === "string"
                            ? optionLabel
                            : optionLabel.join("");
                        const value = optionValue.toString().toLowerCase();

                        return (
                          label.toLowerCase().includes(input.toLowerCase()) ||
                          value.includes(input.toLowerCase())
                        );
                      }}
                      options={dropDownList?.map((item) => ({
                        label: item.label,
                        value: item.value,
                      }))}
                      disabled={isProceed}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {showSubtypeRadios && (
              <Form.Item
                label={
                  <span
                    style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}
                  >
                    {subtypeLabel}
                  </span>
                }
                name="retirementType"
                rules={[
                  {
                    required: !isProceed,
                    message: t("required"),
                  },
                ]}
              >
                <Radio.Group disabled={isProceed} style={{ width: "100%" }}>
                  {/* Grid lives on a plain wrapper div: antd v4's
                     Radio.Group does not forward `style` to its DOM
                     node, but the Radios still join the group via
                     RadioGroupContext regardless of DOM nesting. The
                     2-column layout keeps the options inside the 430px
                     modal instead of overflowing horizontally. The radio
                     set is scoped to the current action (Use / Cancel),
                     or all six in the read-only proceed view. */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      rowGap: 8,
                      columnGap: 8,
                      width: "100%",
                    }}
                  >
                    {subtypeOptions.map((option) => (
                      <Radio key={option} value={option}>
                        {t(option)}
                        {option === RetirementType.SOP_ADAPTATION && (
                          // TODO(A6.2-SME): SOP Adaptation (share of proceeds
                          // for adaptation) is an Article 6.4 mechanism levy,
                          // not a defined A6.2 ITMO action. Flagged pending
                          // subject-matter-expert confirmation.
                          <Tag
                            color="warning"
                            style={{ marginLeft: 6, fontSize: "0.65rem" }}
                          >
                            {t("sopReviewFlag")}
                          </Tag>
                        )}
                      </Radio>
                    ))}
                  </div>
                </Radio.Group>
              </Form.Item>
            )}

            {isCrossBorder && (
                <Row>
                  <Col span={24}>
                    <Form.Item
                      className="credit-action-country-select"
                      label={t("country")}
                      name="toCountry"
                      rules={[
                        {
                          required: !isProceed,
                          message: t("required"),
                        },
                      ]}
                    >
                      {!isProceed ? (
                        <Select
                          showSearch
                          placeholder={t("selectCountry")}
                          showArrow
                          autoClearSearchValue
                          loading={listLoading}
                          filterOption={(input, option: any) => {
                            const optionLabel =
                              option?.label?.props?.children || "";
                            const optionValue = option?.label
                              ? option?.label
                              : "";
                            const label =
                              typeof optionLabel === "string"
                                ? optionLabel
                                : optionLabel.join("");
                            const value = optionValue.toString().toLowerCase();

                            return (
                              label
                                .toLowerCase()
                                .includes(input.toLowerCase()) ||
                              value.includes(input.toLowerCase())
                            );
                          }}
                          options={dropDownList?.map((item) => ({
                            label: item.label,
                            value: item.value,
                          }))}
                          disabled={isProceed}
                        />
                      ) : (
                        <Input
                          placeholder={"country" in data ? data.country : "N/A"}
                          disabled
                        />
                      )}
                    </Form.Item>
                    <Form.Item
                      className="credit-action-organization-name"
                      label={t("organizationName")}
                      name="toOrganization"
                      rules={[
                        {
                          required: !isProceed,
                          message: t("invalidOrganizationName"),
                        },
                        {
                          validator: (_, value) => {
                            if (value && value.trim() === "") {
                              return Promise.reject(
                                new Error(t("invalidOrganizationName"))
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <Input
                        disabled={isProceed}
                        placeholder={
                          "organizationName" in data
                            ? data.organizationName
                            : ""
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

            <Row gutter={8} justify="space-between">
              <Col>
                <label>
                  <span
                    style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}
                  >
                    {t("creditAmount")}
                    {!isProceed && (
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
                    )}
                  </span>
                </label>
              </Col>

              <Col lg={12} md={10}>
                <Row justify="end">
                  <Col span={isProceed ? 12 : 24}>
                    <Form.Item
                      className="credit-action-credit-input"
                      name="creditAmount"
                      rules={[
                        {
                          // eslint-disable-next-line no-unused-vars
                          validator: (_, value) => {
                            if (isProceed) return Promise.resolve();
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
                        {!isProceed && (
                          <>
                            <InputNumber
                              placeholder={
                                data?.creditAmount
                                  ? addCommSep(data.creditAmount)
                                  : ""
                              }
                              style={{ flex: 1, marginRight: 8 }}
                              disabled={isProceed}
                              // onChange={(value) => {
                              //   form.setFieldsValue({ creditAmount: value });
                              // }}
                            />
                            <span style={{ margin: "0 8px" }}>/</span>
                          </>
                        )}

                        <InputNumber
                          placeholder={
                            data?.creditAmount
                              ? addCommSep(data.creditAmount)
                              : ""
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
                      // eslint-disable-next-line no-unused-vars
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

            {(usesRetireEndpoint || (isRetirement && isProceed)) && (
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
                          : proceedAction ===
                            CreditRetirementProceedAction.REJECT
                          ? "checkbox-reject"
                          : "checkbox-process"
                      }
                    >
                      {t(!isProceed ? "checkBoxCreate" : "checkBoxProceed")}
                    </Checkbox>
                  </Form.Item>
                </Col>
              </Row>
            )}

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
                            : proceedAction ===
                              CreditRetirementProceedAction.REJECT
                            ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
                            : COLOR_CONFIGS.FAILED_RESPONSE_COLOR,
                        borderColor:
                          proceedAction === CreditRetirementProceedAction.ACCEPT
                            ? COLOR_CONFIGS.PRIMARY_THEME_COLOR
                            : proceedAction ===
                              CreditRetirementProceedAction.REJECT
                            ? COLOR_CONFIGS.FAILED_RESPONSE_COLOR
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
