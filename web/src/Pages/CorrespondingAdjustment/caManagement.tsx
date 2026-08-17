import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
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
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import "./caManagement.scss";
import "../../Styles/common.table.scss";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";

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
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reconciliation, setReconciliation] =
    useState<ReconciliationSummary | null>(null);
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Corresponding adjustments are managed by government (DNA) Admin/Root
  // only — mirrors the backend service check.
  const canManage = useMemo(
    () =>
      userInfoState?.companyRole ===
        CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
      (userInfoState?.userRole === Role.Admin ||
        userInfoState?.userRole === Role.Root),
    [userInfoState]
  );

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

  const fmt = (val: number | undefined) =>
    val !== undefined && val !== null ? Number(val).toFixed(2) : "0.00";

  const columns = [
    { title: t("correspondingAdjust:columnId"), dataIndex: "caId", key: "caId" },
    {
      title: t("correspondingAdjust:columnYear"),
      dataIndex: "year",
      key: "year",
      sorter: true,
    },
    {
      title: t("correspondingAdjust:columnCooperativeApproach"),
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
      render: (v: string) => v || "—",
    },
    {
      title: t("correspondingAdjust:columnNdcType"),
      dataIndex: "ndcType",
      key: "ndcType",
    },
    {
      title: t("correspondingAdjust:columnCaMethod"),
      dataIndex: "caMethod",
      key: "caMethod",
    },
    {
      title: t("correspondingAdjust:columnEmissionsBalance"),
      dataIndex: "emissionsBalance",
      key: "emissionsBalance",
      render: (val: number) => fmt(val),
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
    ...(canManage
      ? [
          {
            title: "",
            key: "action",
            render: (record: any) =>
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
              value={fmt(reconciliation?.totalFirstTransferredItmos)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:acquiredITMOs")}
              value={fmt(reconciliation?.totalAcquiredItmos)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:recordedCorrespondingAdjust")}
              value={fmt(reconciliation?.totalRecordedCAdj)}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={t("correspondingAdjust:outstandingGap")}
              value={fmt(gap)}
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
                ? `${fmt(gap)} ${t(
                    "correspondingAdjust:stillNeedCorrespondingAdjust"
                  )}`
                : `${fmt(Math.abs(gap))} ${t(
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
  );
};

export default CaManagement;
