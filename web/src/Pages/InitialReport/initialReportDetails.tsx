import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import {
  Button,
  Col,
  Descriptions,
  Row,
  Select,
  Skeleton,
  Tag,
  message,
} from "antd";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import "./initialReports.scss";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Published: "green",
};

const yesNo = (v: any) => (v ? "Yes" : "No");

const InitialReportDetails = () => {
  const { reportId = "" } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { get, put } = useConnection();
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);

  // Initial reports are managed by government (DNA) Admin/Root only.
  const canManage =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin ||
      userInfoState?.userRole === Role.Root);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/initialReport/get?id=${encodeURIComponent(reportId)}`
      );
      const row = response?.data;
      if (!row) {
        message.error(`Initial report ${reportId} not found`);
        navigate("/initialReports/viewAll");
        return;
      }
      setData(row);
      const versionsResponse = await get(
        `national/initialReport/versions?cooperativeApproachId=${encodeURIComponent(
          row.cooperativeApproachId
        )}`
      );
      setVersions(versionsResponse?.data ?? []);
    } catch (error) {
      message.error("Failed to load initial report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await put(
        `national/initialReport/submit?id=${encodeURIComponent(reportId)}`,
        {}
      );
      message.success("Initial report submitted");
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? "Failed to submit initial report"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";
  // Versions come back newest-first; edits/submission only apply to
  // the latest version — older versions are read-only history.
  const isLatestVersion =
    versions.length === 0 || versions[0]?.reportId === data.reportId;

  const pd = data.participationDemonstration ?? {};
  const itmo = data.itmoMetrics ?? {};
  const ndc = data.ndcQuantification ?? {};
  const ca = data.cooperativeApproachDetails ?? {};
  const env = data.environmentalIntegrity ?? {};

  return (
    <div className="initial-reports-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">
              {data.reportId}{" "}
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
            </div>
            <div className="body-sub-title">
              Initial Report for {data.cooperativeApproachId} — Decision
              2/CMA.3 para. 18
            </div>
          </Col>
          <Col>
            {versions.length > 0 && (
              <Select
                value={data.reportId}
                onChange={(rid) => navigate(`/initialReports/view/${rid}`)}
                style={{ width: 220, marginRight: 8 }}
                options={versions.map((v) => ({
                  value: v.reportId,
                  label: `Version ${v.version} — ${v.status}`,
                }))}
              />
            )}
            {canManage && isDraft && isLatestVersion && (
              <Button
                icon={<EditOutlined />}
                onClick={() =>
                  navigate(`/initialReports/edit/${data.reportId}`)
                }
                style={{ marginRight: 8 }}
              >
                Edit
              </Button>
            )}
            {canManage && isDraft && isLatestVersion && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit
              </Button>
            )}
          </Col>
        </Row>
      </div>
      <div className="content-card">
        <div className="section-title">Report</div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Report ID">
            {data.reportId}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={statusColors[data.status] || "default"}>
              {data.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Cooperative Approach">
            {data.cooperativeApproachId}
          </Descriptions.Item>
          <Descriptions.Item label="Version">
            v{data.version ?? 1}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {data.createdTime
              ? new Date(Number(data.createdTime)).toLocaleString()
              : "—"}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-title">Cooperative Approach Details</div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Title">
            {ca.title || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Participating Parties">
            {Array.isArray(ca.participatingParties) &&
            ca.participatingParties.length
              ? ca.participatingParties.map((p: string) => (
                  <Tag key={p}>{p}</Tag>
                ))
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {ca.description || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Mitigation" span={2}>
            {ca.expectedMitigation || "—"}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-title">Participation Demonstration</div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Party to Paris Agreement">
            {yesNo(pd.isPartyToParisAgreement)}
          </Descriptions.Item>
          <Descriptions.Item label="Has NDC">
            {yesNo(pd.hasNDC)}
          </Descriptions.Item>
          <Descriptions.Item label="Tracking Arrangements">
            {yesNo(pd.hasTrackingArrangements)}
          </Descriptions.Item>
          <Descriptions.Item label="Authorization Arrangements">
            {yesNo(pd.hasAuthorizationArrangements)}
          </Descriptions.Item>
          <Descriptions.Item label="Country Code" span={2}>
            {pd.countryCode || "—"}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-title">ITMO Metrics</div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Primary Metric">
            {itmo.primaryMetric || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Non-GHG Metrics">
            {Array.isArray(itmo.nonGhgMetrics) && itmo.nonGhgMetrics.length
              ? itmo.nonGhgMetrics.map((m: string) => <Tag key={m}>{m}</Tag>)
              : "—"}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-title">NDC Quantification</div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="NDC Target (tCO2eq)">
            {ndc.ndcTarget ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Base Year">
            {ndc.baseYear ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Target Year">
            {ndc.targetYear ?? "—"}
          </Descriptions.Item>
          <Descriptions.Item label="GHGs">
            {Array.isArray(ndc.ghgs) && ndc.ghgs.length
              ? ndc.ghgs.map((g: string) => <Tag key={g}>{g}</Tag>)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Sectors" span={2}>
            {Array.isArray(ndc.sectors) && ndc.sectors.length
              ? ndc.sectors.map((s: string) => <Tag key={s}>{s}</Tag>)
              : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="CA Method Description" span={2}>
            {data.caMethodDescription || "—"}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-title">Environmental Integrity</div>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="No Net Increase in Emissions">
            {env.noNetIncrease || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Conservative Baselines">
            {env.conservativeBaselines || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Non-Permanence Risk">
            {env.nonPermanenceRisk || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Leakage Risk">
            {env.leakageRisk || "—"}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
};

export default InitialReportDetails;
