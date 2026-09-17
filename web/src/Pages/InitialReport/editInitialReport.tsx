import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { NdcType, NDC_TYPE_LABELS } from "../../Definitions/Enums/ndcType.enum";
import {
  CA_METHOD_LABELS,
  getCompatibleCaMethods,
} from "../../Definitions/Enums/caMethod.enum";
import { Sector } from "../../Definitions/Enums/sector.enum";
import { statusColors } from "./initialReport.helpers";
import "./initialReports.scss";

const { TextArea } = Input;

type IrShape = {
  reportNumber: string;
  status: string;
  versionCount: number;
  ndcStartYear: number | null;
  ndcEndYear: number | null;
  ndcType: string | null;
  baseYear: number | null;
  baseYearEmission: number | null;
  ndcTarget: number | null;
  caMethod: string | null;
  caMethodDescription: string | null;
  sectors: string[] | null;
  participationDemonstration: any;
  itmoMetrics: any;
  environmentalIntegrity: any;
};

const arr = (v: any): string[] =>
  Array.isArray(v) ? v.map((x) => String(x)) : [];

// The report row is mutable in place — this always edits the live
// working document, never a version. Editing a report that has already
// been Submitted reopens it as a Draft on the server; any cooperative
// approaches already attached stay attached.
const EditInitialReport = () => {
  const navigate = useNavigate();
  const { reportNumber = "" } = useParams<{ reportNumber: string }>();
  const { get, put } = useConnection();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ir, setIr] = useState<IrShape | null>(null);

  const fetchIr = async () => {
    setLoading(true);
    try {
      const res = await get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(reportNumber)}`
      );
      const row = res?.data;
      if (!row) {
        message.error(`Initial report ${reportNumber} not found`);
        navigate("/initialReports/viewAll");
        return;
      }
      setIr(row);
      form.setFieldsValue({
        ndcStartYear: row.ndcStartYear ?? null,
        ndcEndYear: row.ndcEndYear ?? null,
        ndcType: row.ndcType ?? NdcType.SINGLE_YEAR,
        baseYear: row.baseYear ?? null,
        baseYearEmission: row.baseYearEmission ?? null,
        ndcTarget: row.ndcTarget ?? null,
        caMethod: row.caMethod ?? null,
        caMethodDescription: row.caMethodDescription ?? "",
        sectors: arr(row.sectors),
        environmentalIntegrityAssessment:
          row.environmentalIntegrity?.noNetIncrease ?? "",
      });
    } catch (e: any) {
      message.error(e?.message ?? "Failed to load initial report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportNumber) fetchIr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportNumber]);

  const buildPayload = (values: any) => ({
    reportNumber,
    ndcStartYear:
      values.ndcStartYear === null || values.ndcStartYear === undefined
        ? undefined
        : Number(values.ndcStartYear),
    ndcEndYear:
      values.ndcEndYear === null || values.ndcEndYear === undefined
        ? undefined
        : Number(values.ndcEndYear),
    ndcType: values.ndcType,
    baseYear:
      values.baseYear === null || values.baseYear === undefined
        ? undefined
        : Number(values.baseYear),
    baseYearEmission:
      values.baseYearEmission === null || values.baseYearEmission === undefined
        ? undefined
        : Number(values.baseYearEmission),
    ndcTarget:
      values.ndcTarget === null || values.ndcTarget === undefined
        ? undefined
        : Number(values.ndcTarget),
    caMethod: values.caMethod,
    caMethodDescription: values.caMethodDescription ?? "",
    sectors: arr(values.sectors),
    // Participation Demonstration and ITMO Metrics aren't collected on
    // the create form, so editing leaves them untouched (the update DTO
    // only applies a field when it's present in the payload) rather
    // than re-sending stale form state for fields this form doesn't
    // show. Environmental Integrity mirrors the create form's single
    // "assessment" field, so the other three sub-fields are preserved
    // from what was already stored rather than being edited here.
    environmentalIntegrity: {
      ...(ir?.environmentalIntegrity ?? {}),
      noNetIncrease: values.environmentalIntegrityAssessment ?? "",
    },
  });

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      await put("national/initialReport/update", buildPayload(values));
      message.success("Initial report saved");
      navigate(`/initialReports/view/${reportNumber}`);
    } catch (e: any) {
      message.error(e?.message ?? "Failed to update initial report");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !ir) return <Skeleton active />;

  // Once v1.0 has been filed, these fields feed the frozen trajectory
  // and corresponding-adjustment calculations that earlier versions
  // (and any already-submitted corresponding adjustments) were computed
  // against — changing them retroactively would invalidate history
  // rather than amend it. Sectors, the CA method description, and the
  // environmental-integrity assessment are pure narrative text with no
  // downstream calculation, so those stay editable indefinitely.
  const locked = (ir.versionCount ?? 0) > 0;
  const lockedTooltip =
    "Locked — this can no longer be changed once the initial report has been submitted";

  return (
    <div className="initial-reports-container">
      <div className="title-bar">
        <div className="body-title">
          Edit Initial Report {ir.reportNumber}{" "}
          <Tag color={statusColors[ir.status] || "default"}>{ir.status}</Tag>
        </div>
        <div className="body-sub-title">Decision 2/CMA.3 para. 18</div>
      </div>
      <div className="content-card">
        {locked && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="NDC Period, NDC Type, Base Year, Base Year Emission, NDC Target, and CA Method are locked because this report has already been submitted."
          />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <div className="section-title">NDC Information</div>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="ndcStartYear"
                label="NDC Start Year"
                rules={[{ required: true, message: "NDC start year is required" }]}
                tooltip={locked ? lockedTooltip : undefined}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  disabled={locked}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ndcEndYear"
                label="NDC End Year"
                rules={[{ required: true, message: "NDC end year is required" }]}
                tooltip={locked ? lockedTooltip : undefined}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  disabled={locked}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ndcType"
                label="NDC Type"
                rules={[{ required: true, message: "NDC type is required" }]}
                tooltip={locked ? lockedTooltip : undefined}
              >
                <Select
                  disabled={locked}
                  onChange={() => {
                    // The CA Method options depend on NDC Type; a method
                    // valid under the old type may not be valid under
                    // the new one, so clear it.
                    form.setFieldValue("caMethod", undefined);
                  }}
                >
                  <Select.Option value={NdcType.SINGLE_YEAR}>
                    {NDC_TYPE_LABELS[NdcType.SINGLE_YEAR]}
                  </Select.Option>
                  <Select.Option value={NdcType.MULTI_YEAR} disabled>
                    <Tooltip title="Multi-year NDCs are not supported yet">
                      {NDC_TYPE_LABELS[NdcType.MULTI_YEAR]}
                    </Tooltip>
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="baseYear"
                label="Base Year"
                rules={[{ required: true, message: "Base year is required" }]}
                tooltip={locked ? lockedTooltip : "The emission trajectory's origin year."}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  disabled={locked}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="baseYearEmission"
                label="Base Year Emission (tCO2eq)"
                rules={[{ required: true, message: "Base year emission is required" }]}
                tooltip={
                  locked
                    ? lockedTooltip
                    : "The country's emissions in the base year — the trajectory's starting point."
                }
              >
                <InputNumber style={{ width: "100%" }} min={0} disabled={locked} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ndcTarget"
                label="NDC Target (tCO2eq)"
                rules={[{ required: true, message: "NDC target is required" }]}
                tooltip={
                  locked
                    ? lockedTooltip
                    : "The value at the NDC end year — the trajectory interpolates a straight line to it from the base year's emissions."
                }
              >
                <InputNumber style={{ width: "100%" }} min={0} disabled={locked} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item name="sectors" label="Sectors">
                <Select
                  mode="multiple"
                  options={Object.values(Sector).map((s) => ({
                    value: s,
                    label: s,
                  }))}
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
                  placeholder="Conservative baselines; no double counting; additionality demonstrated."
                />
              </Form.Item>
            </Col>
          </Row>

          <div className="section-title">Corresponding Adjustment Method</div>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item noStyle shouldUpdate={(prev, curr) => prev.ndcType !== curr.ndcType}>
                {() => {
                  const ndcType = form.getFieldValue("ndcType");
                  const allowedMethods = getCompatibleCaMethods(ndcType);
                  return (
                    <Form.Item
                      name="caMethod"
                      label="CA Method"
                      rules={[{ required: true, message: "CA method is required" }]}
                      tooltip={
                        locked
                          ? lockedTooltip
                          : ndcType === NdcType.MULTI_YEAR
                          ? "Multi-Year NDCs require the Multi-Year method"
                          : "Trajectory and Averaging are computed identically for a Single-Year NDC target"
                      }
                    >
                      <Select
                        disabled={locked}
                        options={allowedMethods.map((value) => ({
                          value,
                          label: CA_METHOD_LABELS[value],
                        }))}
                      />
                    </Form.Item>
                  );
                }}
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
                  rows={4}
                  placeholder="Describe the chosen CA method (trajectory, averaging, or multi-year) and rationale"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button
                onClick={() =>
                  navigate(`/initialReports/view/${reportNumber}`)
                }
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
