import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Switch,
  Tag,
  message,
} from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import "./initialReports.scss";

const { TextArea } = Input;

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Published: "green",
};

type IrShape = {
  reportId: string;
  status: string;
  cooperativeApproachId: string;
  caMethodDescription: string | null;
  participationDemonstration: any;
  itmoMetrics: any;
  ndcQuantification: any;
  cooperativeApproachDetails: any;
  environmentalIntegrity: any;
};

const arr = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : [];

const EditInitialReport = () => {
  const navigate = useNavigate();
  const { reportId = "" } = useParams<{ reportId: string }>();
  const { get, put } = useConnection();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ir, setIr] = useState<IrShape | null>(null);

  const fetchIr = async () => {
    setLoading(true);
    try {
      const res = await get(
        `national/initialReport/get?id=${encodeURIComponent(reportId)}`
      );
      const row = res?.data;
      if (!row) {
        message.error(`Initial report ${reportId} not found`);
        navigate("/initialReports/viewAll");
        return;
      }
      if (row.status !== "Draft") {
        message.warning(
          "Only the latest Draft version of an initial report can be edited"
        );
        navigate(`/initialReports/view/${reportId}`);
        return;
      }
      setIr(row);
      form.setFieldsValue({
        caMethodDescription: row.caMethodDescription ?? "",
        participation_isPartyToParisAgreement:
          row.participationDemonstration?.isPartyToParisAgreement ?? true,
        participation_hasNDC: row.participationDemonstration?.hasNDC ?? true,
        participation_hasTrackingArrangements:
          row.participationDemonstration?.hasTrackingArrangements ?? true,
        participation_hasAuthorizationArrangements:
          row.participationDemonstration?.hasAuthorizationArrangements ?? true,
        participation_countryCode:
          row.participationDemonstration?.countryCode ?? "",
        itmo_primaryMetric: row.itmoMetrics?.primaryMetric ?? "tCO2e",
        itmo_nonGhgMetrics: arr(row.itmoMetrics?.nonGhgMetrics),
        ndc_target: row.ndcQuantification?.ndcTarget ?? null,
        ndc_baseYear: row.ndcQuantification?.baseYear ?? null,
        ndc_targetYear: row.ndcQuantification?.targetYear ?? null,
        ndc_sectors: arr(row.ndcQuantification?.sectors),
        ndc_ghgs: arr(row.ndcQuantification?.ghgs),
        ca_title: row.cooperativeApproachDetails?.title ?? "",
        ca_participatingParties: arr(
          row.cooperativeApproachDetails?.participatingParties
        ),
        ca_description: row.cooperativeApproachDetails?.description ?? "",
        ca_expectedMitigation:
          row.cooperativeApproachDetails?.expectedMitigation ?? "",
        env_noNetIncrease:
          row.environmentalIntegrity?.noNetIncrease ?? "",
        env_conservativeBaselines:
          row.environmentalIntegrity?.conservativeBaselines ?? "",
        env_nonPermanenceRisk:
          row.environmentalIntegrity?.nonPermanenceRisk ?? "",
        env_leakageRisk: row.environmentalIntegrity?.leakageRisk ?? "",
      });
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ?? "Failed to load initial report"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) fetchIr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const buildPayload = (values: any) => ({
    reportId,
    caMethodDescription: values.caMethodDescription ?? "",
    participationDemonstration: {
      isPartyToParisAgreement: !!values.participation_isPartyToParisAgreement,
      hasNDC: !!values.participation_hasNDC,
      hasTrackingArrangements: !!values.participation_hasTrackingArrangements,
      hasAuthorizationArrangements:
        !!values.participation_hasAuthorizationArrangements,
      countryCode: values.participation_countryCode || "",
    },
    itmoMetrics: {
      primaryMetric: values.itmo_primaryMetric || "tCO2e",
      nonGhgMetrics: arr(values.itmo_nonGhgMetrics),
    },
    ndcQuantification: {
      ndcTarget:
        values.ndc_target === null || values.ndc_target === undefined
          ? null
          : Number(values.ndc_target),
      baseYear:
        values.ndc_baseYear === null || values.ndc_baseYear === undefined
          ? null
          : Number(values.ndc_baseYear),
      targetYear:
        values.ndc_targetYear === null || values.ndc_targetYear === undefined
          ? null
          : Number(values.ndc_targetYear),
      sectors: arr(values.ndc_sectors),
      ghgs: arr(values.ndc_ghgs),
    },
    cooperativeApproachDetails: {
      title: values.ca_title || "",
      participatingParties: arr(values.ca_participatingParties),
      description: values.ca_description || "",
      expectedMitigation: values.ca_expectedMitigation || "",
    },
    environmentalIntegrity: {
      noNetIncrease: values.env_noNetIncrease || "",
      conservativeBaselines: values.env_conservativeBaselines || "",
      nonPermanenceRisk: values.env_nonPermanenceRisk || "",
      leakageRisk: values.env_leakageRisk || "",
    },
  });

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      // Edits are append-only: the backend saves the changes as a new
      // version row and returns it.
      const res = await put(
        "national/initialReport/update",
        buildPayload(values)
      );
      const newReportId = res?.data?.reportId ?? reportId;
      message.success("Initial report saved as a new version");
      navigate(`/initialReports/view/${newReportId}`);
    } catch (e: any) {
      message.error(
        e?.response?.data?.message ?? "Failed to update initial report"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ir) return <Skeleton active />;

  return (
    <div className="initial-reports-container">
      <div className="title-bar">
        <div className="body-title">
          Edit Initial Report {ir.reportId}{" "}
          <Tag color={statusColors[ir.status] || "default"}>{ir.status}</Tag>
        </div>
        <div className="body-sub-title">
          Cooperative Approach: {ir.cooperativeApproachId} — Decision 2/CMA.3
          para. 18
        </div>
      </div>
      <div className="content-card">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="section-title">Cooperative Approach Details</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ca_title" label="Title">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="ca_participatingParties"
                label="Participating Parties (Country Codes)"
              >
                <Select
                  mode="tags"
                  placeholder="Enter country codes (e.g. NG, CH)"
                  tokenSeparators={[",", " "]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name="ca_description" label="Description">
                <TextArea
                  rows={3}
                  placeholder="Describe the cooperative approach"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="ca_expectedMitigation"
                label="Expected Mitigation Outcomes"
              >
                <Input placeholder="e.g. 250000" />
              </Form.Item>
            </Col>
          </Row>

          <div className="section-title">Participation Demonstration</div>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item
                name="participation_isPartyToParisAgreement"
                label="Party to Paris Agreement"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="participation_hasNDC"
                label="Has NDC"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="participation_hasTrackingArrangements"
                label="Tracking Arrangements"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="participation_hasAuthorizationArrangements"
                label="Authorization Arrangements"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="participation_countryCode"
                label="Country Code"
              >
                <Input placeholder="e.g. NG" />
              </Form.Item>
            </Col>
          </Row>

          <div className="section-title">ITMO Metrics</div>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="itmo_primaryMetric" label="Primary Metric">
                <Input placeholder="tCO2e" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="itmo_nonGhgMetrics"
                label="Non-GHG Metrics"
              >
                <Select
                  mode="tags"
                  placeholder="e.g. resilience-units"
                  tokenSeparators={[",", " "]}
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="section-title">NDC Quantification</div>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name="ndc_target" label="NDC Target (tCO2eq)">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ndc_baseYear" label="Base Year">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ndc_targetYear" label="Target Year">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="ndc_sectors" label="Sectors">
                <Select
                  mode="tags"
                  placeholder="e.g. Energy, Forestry"
                  tokenSeparators={[",", " "]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="ndc_ghgs" label="GHGs">
                <Select
                  mode="tags"
                  placeholder="e.g. CO2"
                  tokenSeparators={[",", " "]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="caMethodDescription"
                label="Corresponding Adjustment Method Description"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe the chosen CA method (trajectory, averaging, or multi-year) and rationale"
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="section-title">Environmental Integrity</div>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="env_noNetIncrease"
                label="No Net Increase in Emissions"
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="env_conservativeBaselines"
                label="Conservative Baselines"
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="env_nonPermanenceRisk"
                label="Non-Permanence Risk"
              >
                <TextArea rows={2} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="env_leakageRisk" label="Leakage Risk">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button
                onClick={() => navigate(`/initialReports/view/${reportId}`)}
              >
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={saving}>
                Update
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default EditInitialReport;
