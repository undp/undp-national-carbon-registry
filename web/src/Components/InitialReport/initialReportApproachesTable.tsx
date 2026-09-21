import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Table, Tag } from "antd";
import { statusColors } from "../../Pages/InitialReport/initialReport.helpers";

// Mirrors cooperativeApproachDetails.tsx's entityStatusColors — whether
// the authorization is currently in force.
const entityStatusColors: Record<string, string> = {
  Active: "green",
  Inactive: "default",
};

interface InitialReportApproachesTableProps {
  approaches: any[];
  // Present => an action column with a Remove button renders. Absent
  // (version page, read-only draft view) => no action column at all.
  onRemove?: (record: any) => void;
  // Frozen versions carry each approach's authorized-entity set in the
  // snapshot (fixed at filing time); the draft page instead gets the
  // live current set from InitialReportService.getById, so an entity
  // added after the approach was already filed (an amendment) shows up
  // there even though it can't appear in any past version.
  showAuthorizedEntities?: boolean;
  loading?: boolean;
  emptyText?: string;
}

// Shared by the draft page (editable) and the version-view page
// (read-only, expandable) — same columns, different trailing bits.
const InitialReportApproachesTable: React.FC<InitialReportApproachesTableProps> = ({
  approaches,
  onRemove,
  showAuthorizedEntities,
  loading,
  emptyText,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation(["InitialReport"]);

  const columns = [
    {
      title: t("InitialReport:columnCooperativeApproachId"),
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
    },
    {
      title: t("InitialReport:columnTitle"),
      key: "title",
      render: (record: any) => record.cooperativeApproachDetails?.title || "—",
    },
    {
      title: t("InitialReport:columnParticipatingParties"),
      key: "participatingParties",
      render: (record: any) =>
        (record.cooperativeApproachDetails?.participatingParties || []).map(
          (p: string) => <Tag key={p}>{p}</Tag>
        ),
    },
    {
      title: t("InitialReport:columnAddedIn"),
      key: "addedInMajor",
      render: (record: any) =>
        record.addedInMajor != null ? (
          `v${record.addedInMajor}.0`
        ) : (
          <Tag color="orange">{t("InitialReport:pending")}</Tag>
        ),
    },
    ...(onRemove
      ? [
          {
            title: "",
            key: "action",
            render: (record: any) =>
              // Only an approach still pending its first filing
              // (addedInMajor null — the "Pending" row above) can
              // actually be removed. One already filed in a previous
              // version has flipped to CA-status Submitted, and the
              // backend rejects removing it (approachNotRemovable) —
              // don't offer a button that can only ever 400.
              record.addedInMajor == null ? (
                <Button
                  danger
                  size="small"
                  onClick={(e: React.MouseEvent) => {
                    // Rows navigate on click (see onRow below) — stop
                    // that from also firing when Remove is the actual
                    // target.
                    e.stopPropagation();
                    onRemove(record);
                  }}
                >
                  {t("InitialReport:remove")}
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <Table
      dataSource={approaches}
      columns={columns}
      rowKey="cooperativeApproachId"
      loading={loading}
      pagination={false}
      locale={{ emptyText: emptyText ?? t("InitialReport:noApproachesAttached") }}
      onRow={(record: any) => ({
        onClick: () =>
          navigate(`/cooperativeApproaches/view/${record.cooperativeApproachId}`),
        style: { cursor: "pointer" },
      })}
      expandable={
        showAuthorizedEntities
          ? {
              rowExpandable: (record: any) =>
                (record.authorizedEntities ?? []).length > 0,
              expandedRowRender: (record: any) => (
                <Table
                  dataSource={record.authorizedEntities ?? []}
                  rowKey="id"
                  pagination={false}
                  bordered={false}
                  size="small"
                  columns={[
                    {
                      title: t("InitialReport:columnEntityName"),
                      dataIndex: "entityName",
                      key: "entityName",
                    },
                    {
                      title: t("InitialReport:columnIdentifier"),
                      dataIndex: "entityIdentifier",
                      key: "entityIdentifier",
                      render: (v: string) => v || "—",
                    },
                    {
                      title: t("InitialReport:columnCountryOfIncorporation"),
                      dataIndex: "countryOfIncorporation",
                      key: "countryOfIncorporation",
                    },
                    {
                      title: t("InitialReport:columnAuthorizationDate"),
                      dataIndex: "authorizationDate",
                      key: "authorizationDate",
                      // Backend column is bigint (epoch millis), which
                      // comes back as a numeric STRING — new Date() on a
                      // plain numeric string is "Invalid Date"; it needs
                      // Number() first to be treated as an epoch value.
                      render: (v: string | number) =>
                        v ? new Date(Number(v)).toLocaleDateString() : "—",
                    },
                    {
                      title: t("InitialReport:columnStatus"),
                      dataIndex: "status",
                      key: "status",
                      render: (status: string) => (
                        <Tag color={entityStatusColors[status] || "default"}>
                          {status}
                        </Tag>
                      ),
                    },
                    {
                      title: t("InitialReport:columnSubmissionStatus"),
                      dataIndex: "submissionStatus",
                      key: "submissionStatus",
                      render: (submissionStatus: string) => (
                        <Tag color={statusColors[submissionStatus] || "default"}>
                          {submissionStatus}
                        </Tag>
                      ),
                    },
                  ]}
                />
              ),
            }
          : undefined
      }
    />
  );
};

export default InitialReportApproachesTable;
