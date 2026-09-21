import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import {
  Button,
  Row,
  Col,
  Table,
  Tag,
  message,
  Card,
  Statistic,
  Alert,
  Popconfirm,
} from "antd";
import { PlusOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { fmtDecimal, fmtQty } from "./caFormat";
import { NDC_TYPE_LABELS } from "../../Definitions/Enums/ndcType.enum";
import { CA_METHOD_LABELS } from "../../Definitions/Enums/caMethod.enum";
import "./caManagement.scss";
import "../../Styles/common.table.scss";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Approved: "green",
};

interface ReconciliationSummary {
  totalFirstTransferredItmos: number;
  totalAcquiredItmos: number;
  totalRecordedCAdj: number;
  outstandingGap: number;
}

const CaManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "correspondingAdjust"]);
  const { post, get, put } = useConnection();
  const { canManage } = useArticle6Permissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reconciliation, setReconciliation] =
    useState<ReconciliationSummary | null>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchReconciliation = async () => {
    setReconciliationLoading(true);
    try {
      const response = await get("national/correspondingAdjustment/reconciliation");
      if (response?.data) {
        setReconciliation(response.data);
      }
    } catch {
      // secondary information panel — a load failure shouldn't block the page
    } finally {
      setReconciliationLoading(false);
    }
  };

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await post("national/correspondingAdjustment/query", {
        page,
        size,
        sort: { key: "createdTime", order: "DESC" },
      });
      if (response?.data) {
        setData(response.data);
        setTotalRecords(response.response?.data?.total || response.data.length);
      }
    } catch {
      message.error(t("correspondingAdjust:loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
    fetchReconciliation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  const handleApprove = async (caId: string) => {
    setApprovingId(caId);
    try {
      await put(`national/correspondingAdjustment/approve?id=${caId}`, {});
      message.success(t("correspondingAdjust:approveSuccess"));
      fetchData(currentPage, pageSize);
      fetchReconciliation();
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : t("correspondingAdjust:approveFailed")
      );
    } finally {
      setApprovingId(null);
    }
  };

  const columns = [
    { title: t("correspondingAdjust:columnId"), dataIndex: "caId", key: "caId" },
    {
      title: t("correspondingAdjust:columnYear"),
      dataIndex: "year",
      key: "year",
      sorter: true,
    },
    {
      title: t("correspondingAdjust:columnNdcType"),
      dataIndex: "ndcType",
      key: "ndcType",
      render: (val: string) => NDC_TYPE_LABELS[val] ?? val,
    },
    {
      title: t("correspondingAdjust:columnCaMethod"),
      dataIndex: "caMethod",
      key: "caMethod",
      render: (val: string) => CA_METHOD_LABELS[val] ?? val,
    },
    {
      title: t("correspondingAdjust:columnCorrespondingAdjustment"),
      dataIndex: "appliedAdjustment",
      key: "appliedAdjustment",
      render: (val: number) => fmtDecimal(val),
    },
    {
      title: t("correspondingAdjust:columnActualEmission"),
      dataIndex: "reportingYearEmission",
      key: "reportingYearEmission",
      render: (val: number) => fmtQty(val),
    },
    {
      title: t("correspondingAdjust:columnTrajectory"),
      dataIndex: "ndcTarget",
      key: "ndcTarget",
      render: (val: number) => fmtQty(val),
    },
    {
      title: t("correspondingAdjust:columnSafeguard"),
      dataIndex: "safeguardCheckPassed",
      key: "safeguardCheckPassed",
      render: (passed: boolean) => (
        <Tag color={passed ? "green" : "red"}>
          {passed
            ? t("correspondingAdjust:safeguardPassed")
            : t("correspondingAdjust:safeguardFailed")}
        </Tag>
      ),
    },
    {
      title: t("correspondingAdjust:columnStatus"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    // TEMPORARY: Approve is hidden for now — flip back to `canManage` to
    // restore it.
    ...(canManage && false
      ? [
          {
            title: "",
            key: "action",
            // (value, record, index) — the column has no dataIndex, so
            // the first argument is the (undefined) cell value, not the
            // row. Reading `record.status` off it made the Approve
            // button never render.
            render: (_: any, record: any) =>
              record.status === "Submitted" ? (
                <Popconfirm
                  title={t("correspondingAdjust:approveConfirmTitle")}
                  onConfirm={(e) => {
                    e?.stopPropagation();
                    handleApprove(record.caId);
                  }}
                  onCancel={(e) => e?.stopPropagation()}
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    loading={approvingId === record.caId}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t("correspondingAdjust:approve")}
                  </Button>
                </Popconfirm>
              ) : null,
          },
        ]
      : []),
  ];

  const gap = reconciliation?.outstandingGap ?? 0;

  return (
    <RequireDnaAccess>
    <div className="corresponding-adjustment-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={t("correspondingAdjust:correspondingAdjustments")}
          description={t("correspondingAdjust:correspondingAdjustmentsDesc", {
            defaultValue:
              "Article 6.2 corresponding adjustment calculations per Decision 2/CMA.3 para. 7-10",
          })}
          infoButtonLabel={t(
            "correspondingAdjust:showCorrespondingAdjustmentsDesc",
            {
              defaultValue:
                "Show information about Corresponding Adjustments",
            }
          )}
        />
      </div>

      <Card style={{ marginBottom: 24 }} loading={reconciliationLoading}>
        <Row gutter={24}>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:firstTransfITMOs")}
              value={fmtDecimal(reconciliation?.totalFirstTransferredItmos)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:acquiredITMOs")}
              value={fmtDecimal(reconciliation?.totalAcquiredItmos)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:recordedCorrespondingAdjust")}
              value={fmtDecimal(reconciliation?.totalRecordedCAdj)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:outstandingGap")}
              value={fmtDecimal(gap)}
              valueStyle={{ color: gap === 0 ? "#3f8600" : "#cf1322" }}
            />
          </Col>
        </Row>
        {reconciliation && gap !== 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type={gap > 0 ? "warning" : "error"}
            showIcon
            message={
              gap > 0
                ? `${fmtDecimal(gap)} ${t(
                    "correspondingAdjust:stillNeedCorrespondingAdjust"
                  )}`
                : `${fmtDecimal(Math.abs(gap))} ${t(
                    "correspondingAdjust:overloadedDescription"
                  )}`
            }
          />
        )}
        {reconciliation && gap === 0 && (
          <Alert
            style={{ marginTop: 16 }}
            type="success"
            showIcon
            message={t("correspondingAdjust:fullyReconciled")}
          />
        )}
      </Card>

      <div className="content-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/correspondingAdjustments/calculate")}
              >
                {t("correspondingAdjust:calculateCA")}
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          className="common-table-class"
          rowKey="caId"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize,
            total: totalRecords,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
          }}
          onRow={(record) => ({
            onClick: () =>
              navigate(
                `/correspondingAdjustments/view/${record.caId}`
              ),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
    </RequireDnaAccess>
  );
};

export default CaManagement;
