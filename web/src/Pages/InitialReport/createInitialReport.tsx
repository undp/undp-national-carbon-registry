import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Tooltip,
  message,
} from "antd";
import { NdcType, NDC_TYPE_LABELS } from "../../Definitions/Enums/ndcType.enum";
import {
  CA_METHOD_LABELS,
  getCompatibleCaMethods,
} from "../../Definitions/Enums/caMethod.enum";
import { Sector } from "../../Definitions/Enums/sector.enum";
import { RequireDnaManage } from "../../Components/Common/AccessControl/RequireDnaAccess";
import "./initialReports.scss";

const { TextArea } = Input;

// Just the fields the overlap preflight names in its message.
type ConflictingReport = {
  reportNumber: string;
  ndcStartYear: number;
  ndcEndYear: number;
};

// The initial report is filed for an NDC implementation period, not for
// a single cooperative approach — approaches are attached afterwards
// from the report's detail page (Add Cooperative Approach), the same
// way authorized entities are attached to a cooperative approach. A
// draft with no approach cannot be submitted, but it can be created and
// saved with just the general fields below.
const CreateInitialReport = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "InitialReport"]);
  const { post } = useConnection();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const isBlank = (v: unknown) => v === undefined || v === null || v === "";

  // Preflight for the "no two reports may cover overlapping NDC periods"
  // guarantee — the backend enforces this for real (a partial GIST
  // exclusion constraint, checked from generate onwards, not just at
  // submit), this just surfaces the conflict before the user finishes
  // the form.
  //
  // The check runs per field so the message lands under the field that
  // actually conflicts: an existing report's period [a,b] contains the
  // year being validated iff a <= year AND b >= year.
  const findReportContainingYear = async (
    year: number
  ): Promise<ConflictingReport | undefined> => {
    const existing = await post("national/initialReport/query", {
      page: 1,
      size: 1,
      filterAnd: [
        { key: "ndcStartYear", operation: "<=", value: year },
        { key: "ndcEndYear", operation: ">=", value: year },
      ],
    });
    return (existing?.data ?? [])[0];
  };

  // The one overlap neither endpoint can detect on its own: a period
  // that swallows an existing report whole (start before its start, end
  // after its end). Neither year falls inside it, but the ranges still
  // overlap — so both fields are equally at fault and both report it.
  const findReportEnclosedBy = async (
    start: number,
    end: number
  ): Promise<ConflictingReport | undefined> => {
    const existing = await post("national/initialReport/query", {
      page: 1,
      size: 1,
      filterAnd: [
        { key: "ndcStartYear", operation: ">=", value: start },
        { key: "ndcEndYear", operation: "<=", value: end },
      ],
    });
    return (existing?.data ?? [])[0];
  };

  const period = (row: ConflictingReport) =>
    `${row.ndcStartYear}–${row.ndcEndYear}`;

  // Shared by both year fields. `label` names the field being validated
  // so the message reads as being about that year specifically.
  const validateNoOverlap = (field: "ndcStartYear" | "ndcEndYear") =>
    async (_r: unknown, v: unknown) => {
      if (isBlank(v)) return;
      const year = Number(v);
      const other = form.getFieldValue(
        field === "ndcStartYear" ? "ndcEndYear" : "ndcStartYear"
      );
      const label = field === "ndcStartYear" ? "start year" : "end year";
      try {
        const conflict = await findReportContainingYear(year);
        if (conflict) {
          throw new Error(
            `NDC ${label} ${year} falls inside initial report ${conflict.reportNumber}'s period (${period(conflict)}).`
          );
        }
        if (isBlank(other)) return;
        const start = field === "ndcStartYear" ? year : Number(other);
        const end = field === "ndcStartYear" ? Number(other) : year;
        if (start > end) return; // the start/end ordering rule reports this
        const enclosed = await findReportEnclosedBy(start, end);
        if (enclosed) {
          throw new Error(
            `NDC period ${start}–${end} fully covers initial report ${enclosed.reportNumber}'s period (${period(enclosed)}).`
          );
        }
      } catch (err) {
        if (err instanceof Error) throw err;
        // network/auth issues surface via the submit-time error path;
        // don't block validation because the preflight itself failed.
      }
    };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const sectors: string[] = (values.sectors ?? []).filter(
        (s: string) => s && s.trim().length > 0
      );
      const response = await post("national/initialReport/generate", {
        ndcStartYear: values.ndcStartYear,
        ndcEndYear: values.ndcEndYear,
        ndcType: values.ndcType,
        baseYear: values.baseYear,
        baseYearEmission:
          values.baseYearEmission !== undefined && values.baseYearEmission !== null
            ? Number(values.baseYearEmission)
            : undefined,
        ndcTarget:
          values.ndcTarget !== undefined && values.ndcTarget !== null
            ? Number(values.ndcTarget)
            : undefined,
        caMethod: values.caMethod,
        caMethodDescription: values.caMethodDescription || "",
        sectors,
        environmentalIntegrity: {
          noNetIncrease: values.environmentalIntegrityAssessment ?? "",
          conservativeBaselines: "",
          nonPermanenceRisk: "",
          leakageRisk: "",
        },
      });
      message.success("Initial report draft generated");
      const reportNumber = response?.data?.reportNumber;
      // Land on the detail page so the user can attach cooperative
      // approaches straight away — that's the very next step and the
      // report cannot be submitted without at least one.
      navigate(
        reportNumber
          ? `/initialReports/view/${reportNumber}`
          : "/initialReports/viewAll"
      );
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
    <RequireDnaManage>
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
          <div className="section-title">NDC Information</div>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="ndcStartYear"
                label="NDC Start Year"
                dependencies={["ndcEndYear"]}
                rules={[
                  { required: true, message: "NDC start year is required" },
                  { validator: validateNoOverlap("ndcStartYear") },
                ]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1900}
                  max={2100}
                  placeholder="e.g. 2021"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ndcEndYear"
                label="NDC End Year"
                dependencies={["ndcStartYear"]}
                rules={[
                  { required: true, message: "NDC end year is required" },
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const start = form.getFieldValue("ndcStartYear");
                      if (
                        start !== undefined &&
                        start !== null &&
                        start !== "" &&
                        Number(start) > Number(v)
                      )
                        return Promise.reject(
                          "NDC end year must be on or after the start year"
                        );
                      return Promise.resolve();
                    },
                  },
                  { validator: validateNoOverlap("ndcEndYear") },
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
            <Col span={8}>
              <Form.Item
                name="ndcType"
                label="NDC Type"
                rules={[{ required: true, message: "NDC type is required" }]}
                initialValue={NdcType.SINGLE_YEAR}
              >
                {/* MultiYear NDCs are not supported yet — kept
                    selectable-but-disabled rather than hidden so the
                    option's existence (and why it can't be picked) is
                    visible. The backend rejects it at submit too. */}
                <Select
                  onChange={() => {
                    // The CA Method options depend on NDC Type
                    // (SingleYear -> Trajectory/Averaging, MultiYear ->
                    // MultiYear); a method valid under the old type may
                    // not be valid under the new one, so clear it.
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
                dependencies={["ndcStartYear", "ndcEndYear"]}
                rules={[
                  { required: true, message: "Base year is required" },
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (!Number.isInteger(n) || n < 1900 || n > 2100)
                        return Promise.reject(
                          "Base year must be between 1900 and 2100"
                        );
                      const end = form.getFieldValue("ndcEndYear");
                      if (end !== undefined && end !== null && end !== "" && n >= Number(end))
                        return Promise.reject(
                          "Base year must be before the NDC end year"
                        );
                      // The trajectory's origin must sit strictly before
                      // the period it feeds — a base year inside the
                      // period extrapolates its early years backwards
                      // past that origin, and a base year equal to the
                      // start year leaves the period no span to begin
                      // from. Stricter than the backend's
                      // PERIOD_BEFORE_BASE_YEAR check, which only
                      // rejects a base year past the start year.
                      const start = form.getFieldValue("ndcStartYear");
                      if (
                        start !== undefined &&
                        start !== null &&
                        start !== "" &&
                        n >= Number(start)
                      )
                        return Promise.reject(
                          "Base year must be before the NDC start year"
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="The emission trajectory's origin year."
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
                name="baseYearEmission"
                label="Base Year Emission (tCO2eq)"
                dependencies={["ndcTarget"]}
                rules={[
                  { required: true, message: "Base year emission is required" },
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0)
                        return Promise.reject(
                          "Base year emission must be a non-negative number"
                        );
                      const target = form.getFieldValue("ndcTarget");
                      if (
                        target !== undefined &&
                        target !== null &&
                        target !== "" &&
                        n <= Number(target)
                      )
                        return Promise.reject(
                          "Base year emission must be greater than the NDC target"
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="The country's emissions in the base year — the trajectory's starting point."
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="e.g. 100000"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="ndcTarget"
                label="NDC Target (tCO2eq)"
                dependencies={["baseYearEmission"]}
                rules={[
                  { required: true, message: "NDC target is required" },
                  {
                    validator: (_r, v) => {
                      if (v === undefined || v === null || v === "")
                        return Promise.resolve();
                      const n = Number(v);
                      if (Number.isNaN(n) || n < 0)
                        return Promise.reject(
                          "NDC target must be a non-negative number"
                        );
                      const emission = form.getFieldValue("baseYearEmission");
                      if (
                        emission !== undefined &&
                        emission !== null &&
                        emission !== "" &&
                        Number(emission) <= n
                      )
                        return Promise.reject(
                          "NDC target must be less than the base year emission"
                        );
                      return Promise.resolve();
                    },
                  },
                ]}
                tooltip="The value at the NDC end year — the trajectory interpolates a straight line to it from the base year's emissions."
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="e.g. 500000"
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
                    required: true,
                    type: "array",
                    min: 1,
                    message: "Add at least one sector",
                  },
                ]}
              >
                <Select
                  mode="multiple"
                  placeholder="Select sectors"
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
                      // SingleYear -> Trajectory/Averaging, MultiYear ->
                      // MultiYear (isNdcMethodCompatible, mirrored in
                      // caMethod.enum.ts's getCompatibleCaMethods).
                      tooltip={
                        ndcType === NdcType.MULTI_YEAR
                          ? "Multi-Year NDCs require the Multi-Year method"
                          : "Trajectory and Averaging are computed identically for a Single-Year NDC target"
                      }
                    >
                      <Select
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
              <Button onClick={() => navigate("/initialReports/viewAll")}>
                Cancel
              </Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Draft
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
    </RequireDnaManage>
  );
};

export default CreateInitialReport;
