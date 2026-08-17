import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useCountryOptions } from "../../Components/Common/hooks/useCountryOptions";
import { API_PATHS } from "../../Config/apiConfig";
import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Select,
  Tag,
  message,
} from "antd";
import "./cooperativeApproaches.scss";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";

const { TextArea } = Input;

const AddCooperativeApproach = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(["common", "coopApproach"]);
  const { get, post, put } = useConnection();
  const { options: countryOptions } = useCountryOptions();
  const [loading, setLoading] = useState(false);
  const [hostParty, setHostParty] = useState<{
    alpha2: string;
    name: string;
  } | null>(null);
  const [form] = Form.useForm();

  const existingRecord = (location.state as any)?.record;
  const isEdit = !!existingRecord;

  // Host party is derived server-side from the registry's own country
  // (systemCountry) — it isn't user-editable. Fetched for display, and
  // (in create mode) to pre-select/lock it in Participating Parties.
  useEffect(() => {
    const loadHostParty = async () => {
      const response = await get(API_PATHS.CA_HOST_PARTY);
      const host = response?.data;
      if (!host) return;
      setHostParty(host);
      if (!isEdit) {
        form.setFieldValue("participatingParties", [host.alpha2]);
      }
    };
    loadHostParty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The host party can never be removed from Participating Parties.
  const handlePartiesChange = (values: string[]) => {
    const next =
      hostParty && !values.includes(hostParty.alpha2)
        ? [...values, hostParty.alpha2]
        : values;
    form.setFieldValue("participatingParties", next);
  };

  const partiesTagRender = (props: {
    label: ReactNode;
    value: string;
    closable: boolean;
    onClose: () => void;
  }) => {
    const { label, value, closable, onClose } = props;
    const isHost = hostParty?.alpha2 === value;
    return (
      <Tag
        closable={!isHost && closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate
          ? values.startDate.valueOf()
          : undefined,
        endDate: values.endDate ? values.endDate.valueOf() : undefined,
      };

      if (isEdit) {
        payload.cooperativeApproachId =
          existingRecord.cooperativeApproachId;
        await put("national/cooperativeApproach/update", payload);
        message.success("Cooperative approach updated successfully");
      } else {
        await post("national/cooperativeApproach/create", payload);
        message.success("Cooperative approach created successfully");
      }
      navigate("/cooperativeApproaches/viewAll");
    } catch (error) {
      const fallback = t(
        isEdit
          ? "common:cooperativeApproachUpdateFailed"
          : "common:cooperativeApproachCreateFailed"
      );
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string" ? serverMsg : fallback
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={
            isEdit
              ? t("coopApproach:editCoopApproach")
              : t("coopApproach:addCoopApproach")
          }
          description={t("coopApproach:addCoopApproachDescription")}
          infoButtonLabel={t("coopApproach:showAddCoopApproachDescription")}
        />
      </div>
      <div className="content-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={
            existingRecord
              ? {
                  ...existingRecord,
                  startDate: undefined,
                  endDate: undefined,
                }
              : undefined
          }
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[
                  {
                    required: true,
                    message: "Title is required",
                  },
                ]}
              >
                <Input placeholder="e.g. Ghana-Switzerland Cooperative Approach" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Host Party">
                <Input
                  disabled
                  value={
                    hostParty
                      ? `${hostParty.name} (${hostParty.alpha2})`
                      : "Loading…"
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="participatingParties"
                label="Participating Parties"
                rules={[
                  {
                    required: true,
                    message: "At least one participating party is required",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  maxTagCount="responsive"
                  placeholder="Select participating countries"
                  options={countryOptions}
                  tagRender={partiesTagRender}
                  onChange={handlePartiesChange}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ndcLink" label="NDC Link">
                <Input placeholder="URL or reference to relevant NDC" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="description" label="Description">
                <TextArea
                  rows={4}
                  placeholder="Describe the cooperative approach, its objectives, and scope"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="expectedMitigationOutcomes"
                label="Expected Mitigation Outcomes"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe expected ITMO volumes, sectors, and timeframes"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="environmentalIntegrityAssessment"
                label="Environmental Integrity Assessment"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe how environmental integrity is maintained (per para. 18(h) of Decision 2/CMA.3)"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={() => navigate("/cooperativeApproaches/viewAll")}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default AddCooperativeApproach;
