import { Table } from "antd";
import { useTranslation } from "react-i18next";
import { fmtQty } from "./caFormat";

export interface CaPeriodYearRow {
  year: number;
  ndcTarget: number | null;
  annualEmission: number | null;
  appliedAdjustment: number | null;
  adjustedBalance: number | null;
  caId?: string | null;
  status?: string | null;
  isPreview?: boolean;
}

interface Props {
  rows: CaPeriodYearRow[];
  // Highlights the column being calculated, if any.
  reportingYear?: number;
  loading?: boolean;
  // Averaging compares cumulative activity against the cumulative
  // budget across the whole NDC period, not year by year — so these
  // two running-total rows only make sense (and only render) for it.
  isAveraging?: boolean;
}

// Years across the top, metrics down the side — the layout Article 6.2
// reporting uses, so a reader can follow the adjusted balance against
// the indicative trajectory year by year.
//
// Every year of the NDC period gets a column. The trajectory row is
// always populated (it's interpolated, not recorded); the other three
// stay blank until that year has a saved adjustment.
const CaPeriodTable: React.FC<Props> = ({
  rows,
  reportingYear,
  loading,
  isAveraging,
}) => {
  const { t } = useTranslation(["correspondingAdjust"]);
  const byYear = (field: keyof CaPeriodYearRow) =>
    Object.fromEntries(rows.map((r) => [String(r.year), r[field]]));

  // Running total across the period, in year order. A year with no
  // saved figure yet contributes 0 rather than breaking the total, so
  // the cumulative row still reads as "everything filed so far" even
  // with holes later in the period.
  const cumulativeByYear = (field: keyof CaPeriodYearRow) => {
    let running = 0;
    return Object.fromEntries(
      rows.map((r) => {
        running += Number(r[field] ?? 0);
        return [String(r.year), running];
      })
    );
  };

  const columns = [
    {
      title: "",
      dataIndex: "metric",
      key: "metric",
      fixed: "left" as const,
      width: 220,
      render: (v: string) => <strong>{v}</strong>,
    },
    ...rows.map((r) => ({
      title: String(r.year),
      dataIndex: String(r.year),
      key: String(r.year),
      align: "right" as const,
      width: 110,
      className: r.year === reportingYear ? "ca-reporting-year-col" : undefined,
      render: (v: number | null) => fmtQty(v),
    })),
  ];

  const dataSource = [
    {
      key: "annualEmission",
      metric: t("correspondingAdjust:rowAnnualEmissions"),
      ...byYear("annualEmission"),
    },
    {
      key: "appliedAdjustment",
      metric: t("correspondingAdjust:rowCorrespondingAdjustment"),
      ...byYear("appliedAdjustment"),
    },
    {
      key: "adjustedBalance",
      metric: t("correspondingAdjust:rowAdjustedBalance"),
      ...byYear("adjustedBalance"),
    },
    {
      key: "ndcTarget",
      metric: t("correspondingAdjust:rowIndicativeTrajectory"),
      ...byYear("ndcTarget"),
    },
    ...(isAveraging
      ? [
          {
            key: "cumulativeAdjustedBalance",
            metric: t("correspondingAdjust:rowCumulativeAdjustedBalance"),
            ...cumulativeByYear("adjustedBalance"),
          },
          {
            key: "cumulativeYearlyBudget",
            metric: t("correspondingAdjust:rowCumulativeYearlyBudget"),
            ...cumulativeByYear("ndcTarget"),
          },
        ]
      : []),
  ];

  return (
    <Table
      className="ca-period-table"
      columns={columns}
      dataSource={dataSource}
      rowKey="key"
      loading={loading}
      pagination={false}
      bordered
      size="small"
      scroll={{ x: "max-content" }}
    />
  );
};

export default CaPeriodTable;
