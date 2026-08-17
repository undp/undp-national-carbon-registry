import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Tag,
  message,
} from "antd";
import "./initialReports.scss";

const { TextArea } = Input;

type CooperativeApproach = {
  cooperativeApproachId: string;
  title: string;
  hostParty: string;
  participatingParties: string[];
  description?: string;
  startDate?: number | null;
  endDate?: number | null;
  expectedMitigationOutcomes?: string;
  environmentalIntegrityAssessment?: string;
  ndcLink?: string;
  status: "Draft" | "Active" | "Suspended" | "Completed" | "Revoked" | string;
};

const CA_STATUS_TAG_COLORS: Record<string, string> = {
  Draft: "default",
  Active: "green",
  Suspended: "orange",
  Completed: "blue",
  Revoked: "red",
};

const formatDate = (timestamp?: number | null) => {
  if (!timestamp) return "—";
  return new Date(Number(timestamp)).toLocaleDateString();
};

const CreateInitialReport = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "InitialReport"]);
  const { post, get } = useConnection();
  const [loading, setLoading] = useState(false);
  const [casLoading, setCasLoading] = useState(true);
  const [cas, setCas] = useState<CooperativeApproach[]>([]);
  const [selectedCa, setSelectedCa] = useState<CooperativeApproach | null>(
    null
  );
  const [form] = Form.useForm();

  useEffect(() => {
    const loadCas = async () => {
      setCasLoading(true);
      try {
        // Initial reports can only be created for Draft cooperative
        // approaches.
        const response = await post("national/cooperativeApproach/query", {
          page: 1,
          size: 200,
          sort: { key: "createdTime", order: "DESC" },
          filterAnd: [{ key: "status", operation: "=", value: "Draft" }],
        });
        const rows: CooperativeApproach[] = response?.data ?? [];
        setCas(rows);
      } catch (error: any) {
        message.error(
          error?.message || "Failed to load cooperative approaches"
        );
      } finally {
        setCasLoading(false);
      }
    };
    loadCas();
  }, [post]);

  const caById = useMemo(() => {
    const map: Record<string, CooperativeApproach> = {};
    for (const ca of cas) {
      map[ca.cooperativeApproachId] = ca;
    }
    return map;
  }, [cas]);

  const handleCaChange = async (cooperativeApproachId: string) => {
    if (!cooperativeApproachId) {
      setSelectedCa(null);
      return;
    }
    const cached = caById[cooperativeApproachId];
    if (cached) {
      setSelectedCa(cached);
      // Pre-fill the editable env-integrity textarea so the user can see
      // what the backend would persist if left untouched.
      form.setFieldsValue({
        environmentalIntegrityAssessment:
          cached.environmentalIntegrityAssessment ?? "",
      });
    }
    try {
      const fresh = await get(
        `national/cooperativeApproach/get?id=${cooperativeApproachId}`
      );
      if (fresh?.data) {
        setSelectedCa(fresh.data);
        form.setFieldsValue({
          environmentalIntegrityAssessment:
            fresh.data.environmentalIntegrityAssessment ?? "",
        });
      }
    } catch {
      // best-effort refresh — fall back to the cached row
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const sectors: string[] = (values.sectors ?? []).filter(
        (s: string) => s && s.trim().length > 0
      );
      await post("national/initialReport/generate", {
        cooperativeApproachId: values.cooperativeApproachId,
        caMethodDescription: values.caMethodDescription || "",
        ndcQuantification: {
          ndcTarget:
            values.ndcTarget !== undefined && values.ndcTarget !== null
              ? Number(values.ndcTarget)
              : null,
          baseYear:
            values.baseYear !== undefined && values.baseYear !== null
              ? Number(values.baseYear)
              : null,
          targetYear:
            values.targetYear !== undefined && values.targetYear !== null
              ? Number(values.targetYear)
              : null,
          sectors,
          ghgs: ["CO2"],
        },
        environmentalIntegrity: {
          noNetIncrease: values.environmentalIntegrityAssessment ?? "",
          conservativeBaselines: "",
          nonPermanenceRisk: "",
          leakageRisk: "",
        },
      });
      message.success("Initial report draft generated");
      navigate("/initialReports/viewAll");
    } catch (error: any) {
      const serverMsg = error?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to generate initial report"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="initial-reports-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={t("InitialReport:generateReport")}
          description={t("InitialReport:generateInitialReportDescription")}
          infoButtonLabel={t(
            "InitialReport:showGenerateInitialReportDescription"
          )}
        />
      </div>
      <div className="content-card">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="cooperativeApproachId"
                label="Cooperative Approach"
                rules={[
                  {
                    required: true,
                    message: "Pick a cooperative approach",
                  },
                  {
                    validator: async (_rule, value) => {
                      if (!value) return;
                      const ca = caById[value];
                      if (!ca) {
                        throw new Error(
                          "Cooperative approach not found in the loaded list — refresh and try again."
                        );
                      }
                      if (ca.status !== "Draft") {
                        throw new Error(
                          `Cooperative approach ${value} is ${ca.status}; only Draft cooperative approaches accept a new initial report.`
                        );
                      }
                      // Preflight: an IR (Draft or Submitted) for this CA
                      // would 409 on the server. Catch it client-side so
                      // the user sees the conflict before submit.
                      try {
                        const existing = await post(
                          "national/initialReport/query",
                          {
                            page: 1,
                            size: 1,
                            filterAnd: [
                              {
                                key: "cooperativeApproachId",
                                operation: "=",
                                value,
                              },
                            ],
                          }
                        );
                        if ((existing?.data ?? []).length > 0) {
                          throw new Error(
                            `An initial report already exists for ${value}. Edit that report instead.`
                          );
                        }
                      } catch (err: any) {
                        if (err instanceof Error) throw err;
                        // network/auth issues are surfaced via the
                        // submit-time error path; don't block validation
                        // because the preflight itself failed.
                      }
                    },
                  },
                ]}
              >
                <Select
                  showSearch
                  loading={casLoading}
                  placeholder="Select a cooperative approach"
                  optionFilterProp="label"
                  onChange={handleCaChange}
                  options={cas.map((ca) => ({
                    value: ca.cooperativeApproachId,
                    label: `${ca.cooperativeApproachId} — ${ca.title} (${ca.status})`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          {selectedCa && (
            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={24}>
                {selectedCa.status !== "Draft" && (
                  <Alert
                    type="error"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`Cooperative approach ${selectedCa.cooperativeApproachId} is ${selectedCa.status}.`}
                    description="An initial report can only be generated for a Draft cooperative approach. Pick a different one, or submit its existing initial report to move it toward Active."
                  />
                )}
                <Descriptions
                  bordered
                  size="small"
                  column={2}
                  title={
                    <span>
                      {selectedCa.title}{" "}
                      <Tag
                        color={
                          CA_STATUS_TAG_COLORS[selectedCa.status] ?? "default"
                        }
                      >
                        {selectedCa.status}
                      </Tag>
                    </span>
                  }
                >
                  <Descriptions.Item label="Host Party">
                    {selectedCa.hostParty || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Participating Parties">
                    {(selectedCa.participatingParties || []).join(", ") || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Start Date">
                    {formatDate(selectedCa.startDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="End Date">
                    {formatDate(selectedCa.endDate)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Expected Mitigation" span={2}>
                    {selectedCa.expectedMitigationOutcomes || "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="NDC Link" span={2}>
                    {selectedCa.ndcLink || "—"}
                  </Descriptions.Item>
                </Descriptions>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    color: "rgba(0,0,0,0.55)",
                  }}
                >
                  These fields are pre-filled from the selected cooperative
                  approach and persisted on the initial report's
                  <code> cooperativeApproachDetails</code> block at submit.
                </div>
              </Col>
            </Row>
          )}

          {casLoading && !selectedCa && (
            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={24}>
                <Spin /> Loading cooperative approaches…
              </Col>
            </Row>
          )}

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="ndcTarget"
                label="NDC Target (tCO2eq)"
                rules={[
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0)
                        return Promise.reject(
                          "NDC target must be a non-negative number"
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="e.g. 500000"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="baseYear"
                label="Base Year"
                rules={[
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (
                        !Number.isInteger(n) ||
                        n < 1900 ||
                        n > 2100
                      )
                        return Promise.reject(
                          "Base year must be between 1900 and 2100"
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  placeholder="e.g. 2015"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetYear"
                label="Target Year"
                dependencies={["baseYear"]}
                rules={[
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (
                        !Number.isInteger(n) ||
                        n < 1900 ||
                        n > 2100
                      )
                        return Promise.reject(
                          "Target year must be between 1900 and 2100"
                        );
                      const base = form.getFieldValue("baseYear");
                      if (base !== undefined && base !== null && base !== "") {
                        if (Number(base) >= n)
                          return Promise.reject(
                            "Target year must be greater than base year"
                          );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  placeholder="e.g. 2030"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="sectors"
                label="Sectors"
                rules={[
                  {
                    validator: (_r, v) => {
                      const arr: string[] = Array.isArray(v) ? v : [];
                      const cleaned = arr.filter(
                        (s) => s && s.trim().length > 0
                      );
                      if (cleaned.length === 0)
                        return Promise.reject("Add at least one sector");
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select
                  mode="tags"
                  placeholder="Energy, Forestry, Waste …"
                  tokenSeparators={[","]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="environmentalIntegrityAssessment"
                label="Environmental Integrity Assessment (pre-filled from CA)"
                tooltip="Populated from the cooperative approach. Edit if the IR needs a different statement."
              >
                <TextArea
                  rows={3}
                  placeholder="Conservative baselines; no double counting; additionality demonstrated."
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
                  rows={4}
                  placeholder="Describe the chosen CA method (trajectory, averaging, or multi-year) and rationale"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end" gutter={16} style={{ marginTop: 16 }}>
            <Col>
              <Button onClick={() => navigate("/initialReports/viewAll")}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={
                  !!selectedCa && selectedCa.status !== "Draft"
                }
              >
                Generate Draft
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default CreateInitialReport;
