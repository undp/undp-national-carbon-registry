import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Col, Row, Skeleton, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";
import InitialReportGeneralSections from "../../Components/InitialReport/initialReportGeneralSections";
import { statusColors, versionLabel } from "./initialReport.helpers";
import "./initialReports.scss";
import "../../Styles/common.table.scss";

// The report-level page: a compact summary of the live general fields,
// plus the versions table. Nothing here mutates the report — adding a
// cooperative approach, editing, and submitting all happen on the
// draft page (view/:reportNumber/draft); viewing a filed version
// happens on the version page (view/:reportNumber/version/:major/:minor).
const InitialReportDetails = () => {
  const { reportNumber = "" } = useParams<{ reportNumber: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "InitialReport"]);
  const { get } = useConnection();
  const { canManage } = useArticle6Permissions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(reportNumber)}`
      );
      const row = response?.data;
      if (!row) {
        message.error(t("InitialReport:reportNotFound", { reportNumber }));
        navigate("/initialReports/viewAll");
        return;
      }
      setData(row);
      const versionsResponse = await get(
        `national/initialReport/versions?reportNumber=${encodeURIComponent(reportNumber)}`
      );
      setVersions(versionsResponse?.data ?? []);
    } catch {
      message.error(t("InitialReport:loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportNumber) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportNumber]);

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";
  const approachCount = (data.cooperativeApproaches ?? []).length;

  // The in-progress draft isn't a filed InitialReportVersion row — it's
  // synthesized from the live report's pendingVersion (computed
  // server-side by InitialReportService.computeNextVersion, the same
  // rule submitReport itself uses) so its label can never drift from
  // what the next submit will actually mint.
  const draftRow = isDraft
    ? {
        rowKey: "draft",
        isDraft: true,
        majorVersion: data.pendingVersion?.majorVersion,
        minorVersion: data.pendingVersion?.minorVersion,
        submittedTime: null,
        submittedByName: null,
        cooperativeApproachCount: approachCount,
        cooperativeApproachIds: (data.cooperativeApproaches ?? []).map(
          (a: any) => a.cooperativeApproachId
        ),
        changedCooperativeApproachId: null,
      }
    : null;

  const versionRows = versions.map((v: any) => ({
    ...v,
    rowKey: `${v.majorVersion}.${v.minorVersion}`,
    isDraft: false,
  }));

  const tableRows = draftRow ? [draftRow, ...versionRows] : versionRows;

  const columns = [
    {
      title: t("InitialReport:columnVersion"),
      key: "version",
      render: (record: any) => (
        <span>
          {versionLabel(record.majorVersion, record.minorVersion)}
          {record.isDraft ? " (pending)" : ""}
        </span>
      ),
    },
    {
      title: t("InitialReport:columnCooperativeApproaches"),
      key: "cooperativeApproachIds",
      render: (record: any) =>
        Array.isArray(record.cooperativeApproachIds) &&
        record.cooperativeApproachIds.length
          ? record.cooperativeApproachIds.map((id: string) => (
              <Tag key={id}>{id}</Tag>
            ))
          : "—",
    },
    {
      title: t("InitialReport:columnStatus"),
      key: "status",
      render: (record: any) => {
        const rowStatus = record.isDraft ? "Draft" : "Submitted";
        return (
          <Tag color={statusColors[rowStatus] || "default"}>{rowStatus}</Tag>
        );
      },
    },
    {
      title: t("InitialReport:columnCreated"),
      key: "submittedTime",
      render: (record: any) =>
        record.submittedTime
          ? new Date(Number(record.submittedTime)).toLocaleDateString()
          : "—",
    },
  ];

  return (
    <RequireDnaAccess>
    <div className="initial-reports-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">
              {data.reportNumber}{" "}
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
              <Tag>{versionLabel(data.majorVersion, data.minorVersion)}</Tag>
            </div>
            <div className="body-sub-title">
              {t("InitialReport:initialReportForPeriod", {
                start: data.ndcStartYear ?? "—",
                end: data.ndcEndYear ?? "—",
              })}
            </div>
          </Col>
          <Col>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate(`/initialReports/view/${reportNumber}/draft`)
                }
              >
                {isDraft && approachCount > 0
                  ? t("InitialReport:continueDraft")
                  : t("InitialReport:addCooperativeApproach")}
              </Button>
            )}
          </Col>
        </Row>
      </div>
      <div className="content-card">
        <InitialReportGeneralSections general={data} report={data} variant="compact" />
      </div>
      <div className="content-card" style={{ marginTop: 16 }}>
        <div className="table-title">{t("InitialReport:versions")}</div>
        <Table
          dataSource={tableRows}
          columns={columns}
          className="common-table-class"
          rowKey="rowKey"
          pagination={false}
          rowClassName={(record: any) => (record.isDraft ? "draft-version-row" : "")}
          locale={{ emptyText: t("InitialReport:noVersionsYet") }}
          onRow={(record: any) => ({
            onClick: () =>
              record.isDraft
                ? navigate(`/initialReports/view/${reportNumber}/draft`)
                : navigate(
                    `/initialReports/view/${reportNumber}/version/${record.majorVersion}/${record.minorVersion}`
                  ),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
    </RequireDnaAccess>
  );
};

export default InitialReportDetails;
