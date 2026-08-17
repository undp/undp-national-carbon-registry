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
import { AuthorizationPurpose } from "../../../Definitions/Enums/authorizationPurpose.enum";
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

// Local presentation enum for the retirement-subtype radio group.
// Values are the hand-rolled i18n keys used by Credit Actions strings;
// the members mirror CreditRetirementTypeEmnum.
enum RetirementType {
  VOLUNTARY_CANCELLATION = "voluntaryCancellations",
  USE_TOWARDS_NDC = "useTowardsNDC",
  FIRST_TRANSFER_TOWARDS_NDC = "firstTransferTowardsNDC",
  FIRST_TRANSFER_FOR_OIMP = "firstTransferForOIMP",
  OMGE_CANCELLATION = "omgeCancellation",
}

const RETIREMENT_TYPE_TO_ENUM: Record<RetirementType, CreditRetirementTypeEmnum> = {
  [RetirementType.VOLUNTARY_CANCELLATION]: CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS,
  [RetirementType.USE_TOWARDS_NDC]: CreditRetirementTypeEmnum.USE_TOWARDS_NDC,
  [RetirementType.FIRST_TRANSFER_TOWARDS_NDC]: CreditRetirementTypeEmnum.FIRST_TRANSFER_TOWARDS_NDC,
  [RetirementType.FIRST_TRANSFER_FOR_OIMP]: CreditRetirementTypeEmnum.FIRST_TRANSFER_FOR_OIMP,
  [RetirementType.OMGE_CANCELLATION]: CreditRetirementTypeEmnum.OMGE_CANCELLATION,
};

const ENUM_TO_RETIREMENT_TYPE: Record<string, RetirementType> = {
  [CreditRetirementTypeEmnum.VOLUNTARY_CANCELLATIONS]: RetirementType.VOLUNTARY_CANCELLATION,
  [CreditRetirementTypeEmnum.USE_TOWARDS_NDC]: RetirementType.USE_TOWARDS_NDC,
  [CreditRetirementTypeEmnum.FIRST_TRANSFER_TOWARDS_NDC]: RetirementType.FIRST_TRANSFER_TOWARDS_NDC,
  [CreditRetirementTypeEmnum.FIRST_TRANSFER_FOR_OIMP]: RetirementType.FIRST_TRANSFER_FOR_OIMP,
  [CreditRetirementTypeEmnum.OMGE_CANCELLATION]: RetirementType.OMGE_CANCELLATION,
};

// MO blocks may retire Voluntary/OMGE (never gated) and Use-Towards-NDC
// (domestic — never gated by purpose); the two first-transfer subtypes
// are never available on an MO block. ITMO blocks may retire
// Voluntary/OMGE always; Use-Towards-NDC is never available (domestic
// only applies to MO); First-Transfer-Towards-NDC only when the
// block's authorization purpose is NDC AND the CA still has a
// counterparty right now (it may have been edited down to host-only
// since authorization — ndcHasCounterparty is a live re-check, see the
// caInfo effect below); First-Transfer-For-OIMP only when the purpose
// is OIMP or Other. Missing purpose is treated as NDC (the backend
// default for legacy/OTHER-less blocks).
const isSubTypeAvailable = (
  retirementType: RetirementType,
  isItmo: boolean,
  purpose: string | null | undefined,
  ndcHasCounterparty: boolean
): boolean => {
  if (
    retirementType === RetirementType.VOLUNTARY_CANCELLATION ||
    retirementType === RetirementType.OMGE_CANCELLATION
  ) {
    return true;
  }
  if (retirementType === RetirementType.USE_TOWARDS_NDC) {
    return !isItmo;
  }
  if (retirementType === RetirementType.FIRST_TRANSFER_TOWARDS_NDC) {
    if (!isItmo) return false;
    return (
      (purpose ?? AuthorizationPurpose.NDC) === AuthorizationPurpose.NDC &&
      ndcHasCounterparty
    );
  }
  // FIRST_TRANSFER_FOR_OIMP
  if (!isItmo) return false;
  return (purpose ?? AuthorizationPurpose.NDC) !== AuthorizationPurpose.NDC;
};

// Which subtypes are even offered as radio options, before
// isSubTypeAvailable further gates them by authorization purpose.
// MO blocks never see the two first-transfer (cross-border) subtypes;
// ITMO blocks never see the domestic Use-Towards-NDC subtype.
const MO_SUBTYPES: RetirementType[] = [
  RetirementType.VOLUNTARY_CANCELLATION,
  RetirementType.USE_TOWARDS_NDC,
  RetirementType.OMGE_CANCELLATION,
];

const ITMO_SUBTYPES: RetirementType[] = [
  RetirementType.VOLUNTARY_CANCELLATION,
  RetirementType.FIRST_TRANSFER_TOWARDS_NDC,
  RetirementType.OMGE_CANCELLATION,
  RetirementType.FIRST_TRANSFER_FOR_OIMP,
];

// Proceed mode (DNA accept/reject/cancel of an already-submitted
// retirement) only has CreditRetirementInterface to work with, which
// carries no itmoAuthorizationRecord — isItmoBlock always resolves to
// false there. The radio group itself is disabled in proceed mode
// (Radio.Group disabled={isProceed}), so nothing is selectable; render
// the union of both lists so whichever subtype the pending request
// actually used still has a radio to display as selected.
const ALL_SUBTYPES: RetirementType[] = [
  RetirementType.VOLUNTARY_CANCELLATION,
  RetirementType.USE_TOWARDS_NDC,
  RetirementType.FIRST_TRANSFER_TOWARDS_NDC,
  RetirementType.FIRST_TRANSFER_FOR_OIMP,
  RetirementType.OMGE_CANCELLATION,
];

interface CounterpartyOption {
  value: string;
  label: string;
}

interface AuthorizedEntityOption {
  value: string;
  label: string;
}

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

  const { get, post } = useConnection();
  const { userInfoState } = useUserContext();
  const [form] = Form.useForm();
  const [retirementType, setRetirementType] = useState<RetirementType>(
    RetirementType.VOLUNTARY_CANCELLATION
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

  const isItmoBlock =
    !isProceed && !!data && "itmoAuthorizationRecord" in data
      ? !!(data as CreditBalanceInterface).itmoAuthorizationRecord
      : false;
  const itmoPurpose =
    !isProceed && data && "itmoAuthorizationPurpose" in data
      ? (data as CreditBalanceInterface).itmoAuthorizationPurpose
      : undefined;
  const cooperativeApproachId =
    !isProceed && data && "itmoCooperativeApproachId" in data
      ? (data as CreditBalanceInterface).itmoCooperativeApproachId
      : undefined;

  const isFirstTransferSubType =
    retirementType === RetirementType.FIRST_TRANSFER_TOWARDS_NDC ||
    retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP;

  const [counterparties, setCounterparties] = useState<CounterpartyOption[]>(
    []
  );
  const [counterpartiesLoading, setCounterpartiesLoading] = useState(false);
  const [authorizedEntities, setAuthorizedEntities] = useState<
    AuthorizedEntityOption[]
  >([]);
  const [authorizedEntitiesLoading, setAuthorizedEntitiesLoading] =
    useState(false);

  // The block's ITMO-authorized cooperative approach's live
  // hostParty/participatingParties — fetched once per modal open
  // (independent of which retirement subtype is picked), so the
  // "First Transfer Towards NDC" radio can be gated on whether the CA
  // *currently* has a counterparty, not just on the block's cached
  // authorization purpose (the CA may have been edited down to
  // host-only after the ITMO was authorized for NDC).
  const [caInfo, setCaInfo] = useState<{
    hostParty: string;
    participatingParties: string[];
  } | null>(null);
  const [countryNameByCode, setCountryNameByCode] = useState<
    Map<string, string>
  >(new Map());

  // Optimistic default (true) before caInfo loads, so the common case
  // — the CA still has its counterparty, which is nearly always true —
  // never shows a disabled-then-enabled flicker on open. Once caInfo
  // loads it reflects the real, current state.
  const ndcHasCounterparty =
    !caInfo ||
    caInfo.participatingParties.some((p) => p !== caInfo.hostParty);

  const getDropDownList = async () => {
    setListLoading(true);
    try {
      setDropDownList([]);
      const response = await post(API_PATHS.TRANSFER_ORGANIZATIONS, {
        type: userInfoState?.companyRole,
        filterOwn: true,
      });

      if (response && response.data && response.data.length > 0) {
        const filteredData = response.data.filter(
          (item: any) => item.state === "1"
        );

        setDropDownList(
          filteredData.map((item: any) => ({
            value: item.id,
            label: item.name,
          }))
        );
      }
    } catch (error: any) {
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

  // Fetches the block's ITMO-authorized cooperative approach's
  // hostParty/participatingParties and the country-name lookup, once
  // per modal open — independent of which retirement subtype is
  // selected, so the live NDC-counterparty check (ndcHasCounterparty)
  // is available before the user even picks a subtype. The
  // acquiring-country dropdown options are derived from this (plus the
  // selected subtype) in the effect below, not re-fetched here.
  const loadCaInfo = async () => {
    if (!cooperativeApproachId) return;
    setCounterpartiesLoading(true);
    try {
      const [caResponse, countriesResponse] = await Promise.all([
        get(`national/cooperativeApproach/get?id=${cooperativeApproachId}`),
        get(API_PATHS.CB_RETIRE_COINTRY_QUERY),
      ]);
      const ca = caResponse?.data;
      const countries: { alpha2: string; name: string }[] =
        countriesResponse?.data ?? [];
      setCountryNameByCode(new Map(countries.map((c) => [c.alpha2, c.name])));
      setCaInfo({
        hostParty: ca?.hostParty,
        participatingParties: ca?.participatingParties ?? [],
      });
    } catch (error: any) {
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setCounterpartiesLoading(false);
    }
  };

  // Loads the CA's Active authorized entities incorporated in
  // `country` — called once the acquiring country is resolved, either
  // automatically (single-option case) or via the country Select's
  // onChange (multi-option case).
  const loadAuthorizedEntities = async (country: string) => {
    if (!cooperativeApproachId || !country) return;
    setAuthorizedEntitiesLoading(true);
    try {
      const response = await get(
        `national/cooperativeApproach/authorizedEntity/query?cooperativeApproachId=${cooperativeApproachId}`
      );
      const entities: any[] = response?.data ?? [];
      setAuthorizedEntities(
        entities
          .filter(
            (e) => e.status === "Active" && e.countryOfIncorporation === country
          )
          .map((e) => ({ value: e.id, label: e.entityName }))
      );
    } catch (error: any) {
      message.open({
        type: "error",
        content: error.message,
        duration: 3,
        style: { textAlign: "right", marginRight: 15, marginTop: 10 },
      });
    } finally {
      setAuthorizedEntitiesLoading(false);
    }
  };

  // Country changed via the (multi-option) dropdown — reload the
  // authorized-entities list scoped to the newly picked country.
  const handleCountryChange = (value: string) => {
    setAuthorizedEntities([]);
    form.setFieldsValue({ authorizedEntityId: undefined });
    if (retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP && value) {
      loadAuthorizedEntities(value);
    }
  };

  // Fetch the CA's live participatingParties/hostParty once per block
  // (not per subtype) so the NDC radio can be gated before the user
  // picks a subtype at all.
  useEffect(() => {
    setCaInfo(null);
    if (isProceed || type !== CreditActionType.RETIREMENT || !isItmoBlock) {
      return;
    }
    if (cooperativeApproachId) {
      loadCaInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooperativeApproachId, isItmoBlock]);

  // Once caInfo resolves, if First Transfer Towards NDC is currently
  // selected but the CA turns out to no longer have a counterparty
  // (edited down to host-only since authorization), fall back to a
  // valid subtype rather than leave an unsubmittable selection.
  useEffect(() => {
    if (
      caInfo &&
      retirementType === RetirementType.FIRST_TRANSFER_TOWARDS_NDC &&
      !ndcHasCounterparty
    ) {
      setRetirementType(RetirementType.VOLUNTARY_CANCELLATION);
      form.setFieldValue("retirementType", RetirementType.VOLUNTARY_CANCELLATION);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caInfo]);

  // Derives the acquiring-country dropdown options from the
  // already-loaded caInfo (no re-fetch) whenever the subtype changes.
  // First Transfer Towards NDC's pool excludes the host (it always
  // requires a real counterparty); First Transfer For OIMP's pool is
  // the full participatingParties list including the host (OIMP never
  // requires crossing a border).
  useEffect(() => {
    if (isProceed || type !== CreditActionType.RETIREMENT) return;
    setCounterparties([]);
    setAuthorizedEntities([]);
    form.setFieldsValue({ toCountry: undefined, authorizedEntityId: undefined });
    if (isItmoBlock && isFirstTransferSubType && caInfo) {
      const pool =
        retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP
          ? caInfo.participatingParties
          : caInfo.participatingParties.filter((p) => p !== caInfo.hostParty);
      const options: CounterpartyOption[] = pool.map((code) => ({
        value: code,
        label: countryNameByCode.get(code) ?? code,
      }));
      setCounterparties(options);
      if (options.length === 1) {
        form.setFieldsValue({ toCountry: options[0].value });
        if (retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP) {
          loadAuthorizedEntities(options[0].value);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retirementType, caInfo]);

  // eslint-disable-next-line no-unused-vars
  const handleValuesChange = (_: any, allValues: any) => {
    creditAmountRef.current = allValues.creditAmount;
    recivePartyRef.current =
      type === CreditActionType.TRANSFER
        ? allValues.toCompanyId
        : type === CreditActionType.RETIREMENT
        ? {
            country: allValues.toCountry,
            authorizedEntityId: allValues.authorizedEntityId,
          }
        : undefined;

    remarkRef.current = allValues.comment || "";
    checkedRef.current = allValues.confirm || false;

    let valid = true;
    if (allValues.retirementType) {
      if (
        type === CreditActionType.RETIREMENT &&
        allValues.retirementType !== retirementType
      ) {
        form.setFieldValue("confirm", false);
        valid = false;
      }
      setRetirementType(allValues.retirementType);
    }

    if (type !== CreditActionType.TRANSFER && !checkedRef.current) {
      valid = false;
    }
    if (isProceed) {
      if (remarkRequired && !remarkRef.current.trim()) {
        valid = false;
      }
    } else {
      if (type === CreditActionType.TRANSFER && !recivePartyRef.current) {
        valid = false;
      }
      if (
        type === CreditActionType.RETIREMENT &&
        isItmoBlock &&
        isFirstTransferSubType
      ) {
        if (!allValues.toCountry) {
          valid = false;
        }
        if (
          retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP &&
          !allValues.authorizedEntityId
        ) {
          valid = false;
        }
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

    if (type === CreditActionType.RETIREMENT) {
      if (isProceed) {
        if (
          ["cancel", "reject"].includes(proceedAction) &&
          !allValues["comment"]
        ) {
          valid = false;
        }
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

    if (type === CreditActionType.TRANSFER) {
      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        undefined
      );
    } else if (type === CreditActionType.RETIREMENT) {
      const retType = RETIREMENT_TYPE_TO_ENUM[retirementType];

      onFinish(
        recivePartyRef.current,
        data?.id,
        creditAmountRef.current,
        remarkRef.current,
        retType
      );
    }
  };

  useEffect(() => {
    if (openModal) {
      form.resetFields();
      let retirementTypeRef: RetirementType;
      if (isProceed && data && "subType" in data) {
        retirementTypeRef =
          ENUM_TO_RETIREMENT_TYPE[data.subType.trim()] ??
          RetirementType.VOLUNTARY_CANCELLATION;
      } else {
        retirementTypeRef = RetirementType.VOLUNTARY_CANCELLATION;
      }

      if (type === CreditActionType.TRANSFER && !isProceed) {
        getDropDownList();
      }

      form.setFieldsValue({
        owner: data?.senderName,
        project: data?.projectName,
        retirementType: retirementTypeRef,
        toCountry: isProceed && data && "country" in data ? data.country : undefined,
        authorizedEntityId: undefined,
        comment: "",
        confirm: type === CreditActionType.TRANSFER,
      });

      remarkRef.current = "";
      creditAmountRef.current = undefined;
      recivePartyRef.current = undefined;
      checkedRef.current = type === CreditActionType.TRANSFER ? true : false;

      setRetirementType(retirementTypeRef);
      setCounterparties([]);
      setAuthorizedEntities([]);
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

            {type === CreditActionType.TRANSFER && (
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

            {type === CreditActionType.RETIREMENT && (
              <Form.Item
                label={
                  <span
                    style={{ color: `${COLOR_CONFIGS.PRIMARY_FONT_COLOR}` }}
                  >
                    {t("retirementType")}
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
                <Radio.Group disabled={isProceed}>
                  {(isProceed
                    ? ALL_SUBTYPES
                    : isItmoBlock
                    ? ITMO_SUBTYPES
                    : MO_SUBTYPES
                  ).map((subType) => (
                    <Radio
                      key={subType}
                      value={subType}
                      disabled={
                        !isProceed &&
                        !isSubTypeAvailable(
                          subType,
                          isItmoBlock,
                          itmoPurpose,
                          ndcHasCounterparty
                        )
                      }
                    >
                      {t(subType)}
                    </Radio>
                  ))}
                </Radio.Group>
              </Form.Item>
            )}

            {type === CreditActionType.RETIREMENT &&
              isItmoBlock &&
              isFirstTransferSubType && (
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
                      <Select
                        showSearch
                        placeholder={t("selectCountry")}
                        showArrow
                        autoClearSearchValue
                        loading={counterpartiesLoading}
                        options={counterparties}
                        disabled={isProceed || counterparties.length <= 1}
                        onChange={handleCountryChange}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

            {type === CreditActionType.RETIREMENT &&
              isItmoBlock &&
              retirementType === RetirementType.FIRST_TRANSFER_FOR_OIMP && (
                <Row>
                  <Col span={24}>
                    <Form.Item
                      className="credit-action-entity-select"
                      label={t("authorizedEntity")}
                      name="authorizedEntityId"
                      rules={[
                        {
                          required: !isProceed,
                          message: t("required"),
                        },
                      ]}
                    >
                      <Select
                        showSearch
                        placeholder={t("selectAuthorizedEntity")}
                        showArrow
                        autoClearSearchValue
                        loading={authorizedEntitiesLoading}
                        options={authorizedEntities}
                        disabled={isProceed}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              )}

            {isProceed &&
              type === CreditActionType.RETIREMENT &&
              "country" in data &&
              (data.country || data.entityName) && (
                <Row>
                  <Col span={24}>
                    {data.country && (
                      <Form.Item label={t("country")}>
                        <Input value={data.country} disabled />
                      </Form.Item>
                    )}
                    {data.entityName && (
                      <Form.Item label={t("authorizedEntity")}>
                        <Input value={data.entityName} disabled />
                      </Form.Item>
                    )}
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

            {type === CreditActionType.RETIREMENT && (
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
