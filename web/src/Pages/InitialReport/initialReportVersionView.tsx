import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Skeleton, Tag, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import InitialReportGeneralSections from "../../Components/InitialReport/initialReportGeneralSections";
import InitialReportApproachesTable from "../../Components/InitialReport/initialReportApproachesTable";
import { normalizeVersionSnapshot, versionLabel } from "./initialReport.helpers";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";
import "./initialReports.scss";

// A single frozen filing — read-only throughout. Reached by clicking a
// row in the versions table on the report-level detail page.
const InitialReportVersionView = () => {
  const { reportNumber = "", major = "", minor = "" } = useParams<{
    reportNumber: string;
    major: string;
    minor: string;
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["InitialReport"]);
  const { get } = useConnection();
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState<any>(null);

  const fetchVersion = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/initialReport/version?reportNumber=${encodeURIComponent(
          reportNumber
        )}&major=${encodeURIComponent(major)}&minor=${encodeURIComponent(minor)}`
      );
      if (!response?.data) {
        message.error(t("InitialReport:versionNotFoundError"));
        navigate(`/initialReports/view/${reportNumber}`, { replace: true });
        return;
      }
      setVersion(response.data);
    } catch {
      message.error(t("InitialReport:versionNotFoundError"));
      navigate(`/initialReports/view/${reportNumber}`, { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportNumber && major !== "" && minor !== "") fetchVersion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportNumber, major, minor]);

  if (loading) return <Skeleton active />;
  if (!version) return null;

  const { general, approaches } = normalizeVersionSnapshot(version);

  return (
    <RequireDnaAccess>
    <div className="initial-reports-container">
      <div className="title-bar">
        <div className="body-title">
          {reportNumber} <Tag color="blue">{versionLabel(version.majorVersion, version.minorVersion)}</Tag>{" "}
          <Tag>{t("InitialReport:filed")}</Tag>
        </div>
        <div className="body-sub-title">
          {version.submittedTime
            ? t("InitialReport:filedBy", {
                date: new Date(Number(version.submittedTime)).toLocaleString(),
                name: version.submittedByName ?? "",
              })
            : "—"}
        </div>
        <Button
          icon={<ArrowLeftOutlined />}
          style={{ marginTop: 8 }}
          onClick={() => navigate(`/initialReports/view/${reportNumber}`)}
        >
          {t("InitialReport:backToReport")}
        </Button>
      </div>
      <div className="content-card">
        <InitialReportGeneralSections general={general} variant="full" />
      </div>
      <div className="content-card" style={{ marginTop: 16 }}>
        <div className="table-title">
          {t("InitialReport:sectionCooperativeApproaches")}
        </div>
        <InitialReportApproachesTable approaches={approaches} showAuthorizedEntities />
      </div>
    </div>
    </RequireDnaAccess>
  );
};

export default InitialReportVersionView;
