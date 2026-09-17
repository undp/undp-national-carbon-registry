import { Descriptions, Tag } from "antd";
import { useTranslation } from "react-i18next";
import { statusColors } from "../../Pages/InitialReport/initialReport.helpers";

// Two decimal places with thousands separators, matching the
// Corresponding Adjustment pages' fmtDecimal — Base Year Emission and
// NDC Target are large tonnage figures that are unreadable unseparated.
const fmt = (val: number | string | null | undefined) =>
  val !== undefined && val !== null && val !== ""
    ? Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "—";

// A long value ("CA Method Description", the environmental-integrity
// free text) otherwise wraps to several narrow lines because antd
// shrinks the content column to fit the label column. Giving it a
// minimum width instead lets it use the row's actual space.
const contentStyle: React.CSSProperties = { minWidth: 300 };

interface InitialReportGeneralSectionsProps {
  // The general fields — either the live report row itself, or a frozen
  // version's snapshot.general.
  general: any;
  // Identity fields that live only on the report row, not in a
  // snapshot (reportNumber/status/createdTime). Pass the live row when
  // rendering the draft; omit when rendering a version (the version
  // page shows its own filed-date header instead of "Created").
  report?: any;
  // "full" renders every section (used on the draft and version
  // pages). "compact" renders one condensed block (used on the
  // report-level detail/versions page, which just needs enough context
  // to orient the versions table below it).
  variant?: "full" | "compact";
}

// Shared between the draft page and the version-view page — both render
// the same general-info shape, just sourced from a different place (the
// live row vs. a frozen snapshot).
const InitialReportGeneralSections: React.FC<InitialReportGeneralSectionsProps> = ({
  general,
  report,
  variant = "full",
}) => {
  const { t } = useTranslation(["InitialReport"]);
  const yesNo = (v: any) =>
    v ? t("InitialReport:yes") : t("InitialReport:no");

  if (variant === "compact") {
    return (
      <Descriptions bordered column={3} size="small" contentStyle={contentStyle}>
        <Descriptions.Item label={t("InitialReport:fieldNdcPeriod")}>
          {general.ndcStartYear ?? "—"}–{general.ndcEndYear ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNdcType")}>
          {general.ndcType ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldStatus")}>
          {report ? (
            <Tag color={statusColors[report.status] || "default"}>
              {report.status}
            </Tag>
          ) : (
            "—"
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldCurrentVersion")}>
          {report ? `v${report.majorVersion ?? 0}.${report.minorVersion ?? 0}` : "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldBaseYear")}>
          {general.baseYear ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldBaseYearEmission")}>
          {fmt(general.baseYearEmission)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNdcTarget")}>
          {fmt(general.ndcTarget)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldCaMethod")}>
          {general.caMethod ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldSectors")} span={2}>
          {Array.isArray(general.sectors) && general.sectors.length
            ? general.sectors.map((s: string) => <Tag key={s}>{s}</Tag>)
            : "—"}
        </Descriptions.Item>
      </Descriptions>
    );
  }

  return (
    <>
      <div className="section-title">{t("InitialReport:sectionReport")}</div>
      <Descriptions bordered column={2} contentStyle={contentStyle}>
        {report && (
          <>
            <Descriptions.Item label={t("InitialReport:fieldReportNumber")}>
              {report.reportNumber}
            </Descriptions.Item>
            <Descriptions.Item label={t("InitialReport:fieldStatus")}>
              <Tag color={statusColors[report.status] || "default"}>
                {report.status}
              </Tag>
            </Descriptions.Item>
          </>
        )}
        <Descriptions.Item label={t("InitialReport:fieldNdcPeriod")}>
          {general.ndcStartYear ?? "—"}–{general.ndcEndYear ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNdcType")}>
          {general.ndcType ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldBaseYear")}>
          {general.baseYear ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldBaseYearEmission")}>
          {fmt(general.baseYearEmission)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNdcTarget")}>
          {fmt(general.ndcTarget)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldCaMethod")}>
          {general.caMethod ?? "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldSectors")}>
          {Array.isArray(general.sectors) && general.sectors.length
            ? general.sectors.map((s: string) => <Tag key={s}>{s}</Tag>)
            : "—"}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("InitialReport:fieldCaMethodDescription")}
          span={2}
        >
          {general.caMethodDescription || "—"}
        </Descriptions.Item>
        {report && (
          <Descriptions.Item label={t("InitialReport:fieldCreated")}>
            {report.createdTime
              ? new Date(Number(report.createdTime)).toLocaleString()
              : "—"}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div className="section-title" style={{ marginTop: 16 }}>
        {t("InitialReport:sectionParticipationDemonstration")}
      </div>
      <Descriptions bordered column={2} contentStyle={contentStyle}>
        <Descriptions.Item label={t("InitialReport:fieldPartyToParisAgreement")}>
          {yesNo(general.participationDemonstration?.isPartyToParisAgreement)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldHasNdc")}>
          {yesNo(general.participationDemonstration?.hasNDC)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldTrackingArrangements")}>
          {yesNo(general.participationDemonstration?.hasTrackingArrangements)}
        </Descriptions.Item>
        <Descriptions.Item
          label={t("InitialReport:fieldAuthorizationArrangements")}
        >
          {yesNo(general.participationDemonstration?.hasAuthorizationArrangements)}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldCountryCode")} span={2}>
          {general.participationDemonstration?.countryCode || "—"}
        </Descriptions.Item>
      </Descriptions>

      <div className="section-title" style={{ marginTop: 16 }}>
        {t("InitialReport:sectionItmoMetrics")}
      </div>
      <Descriptions bordered column={2} contentStyle={contentStyle}>
        <Descriptions.Item label={t("InitialReport:fieldPrimaryMetric")}>
          {general.itmoMetrics?.primaryMetric || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNonGhgMetrics")}>
          {Array.isArray(general.itmoMetrics?.nonGhgMetrics) &&
          general.itmoMetrics.nonGhgMetrics.length
            ? general.itmoMetrics.nonGhgMetrics.map((m: string) => (
                <Tag key={m}>{m}</Tag>
              ))
            : "—"}
        </Descriptions.Item>
      </Descriptions>

      <div className="section-title" style={{ marginTop: 16 }}>
        {t("InitialReport:sectionEnvironmentalIntegrity")}
      </div>
      <Descriptions bordered column={1} contentStyle={contentStyle}>
        <Descriptions.Item label={t("InitialReport:fieldNoNetIncrease")}>
          {general.environmentalIntegrity?.noNetIncrease || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldConservativeBaselines")}>
          {general.environmentalIntegrity?.conservativeBaselines || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldNonPermanenceRisk")}>
          {general.environmentalIntegrity?.nonPermanenceRisk || "—"}
        </Descriptions.Item>
        <Descriptions.Item label={t("InitialReport:fieldLeakageRisk")}>
          {general.environmentalIntegrity?.leakageRisk || "—"}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default InitialReportGeneralSections;
