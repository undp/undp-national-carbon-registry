import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { Button, Row, Col, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import "./initialReports.scss";
import "../../Styles/common.table.scss";
import { useTranslation } from "react-i18next";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";
import { statusColors } from "./initialReport.helpers";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";

const InitialReportManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common","InitialReport"]);
  const { post } = useConnection();
  const { canManage: canCreate } = useArticle6Permissions();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns = [
    {
      title: t("InitialReport:columnReportId"),
      dataIndex: "reportNumber",
      key: "reportNumber",
    },
    {
      title: "NDC Period",
      key: "ndcPeriod",
      render: (record: any) =>
        record.ndcStartYear || record.ndcEndYear
          ? `${record.ndcStartYear ?? "—"}–${record.ndcEndYear ?? "—"}`
          : "—",
    },
    {
      title: t("InitialReport:columnVersion"),
      key: "version",
      render: (record: any) => (
        <span>
          v{record.majorVersion ?? 0}.{record.minorVersion ?? 0}
        </span>
      ),
    },
    {
      title: t("InitialReport:columnStatus"),
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: t("InitialReport:columnCreated"),
      dataIndex: "createdTime",
      key: "createdTime",
      render: (ts: string) =>
        ts ? new Date(Number(ts)).toLocaleDateString() : "—",
    },
  ];

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await post("national/initialReport/query", {
        page,
        size,
        sort: { key: "createdTime", order: "DESC" },
      });
      if (response?.data) {
        setData(response.data);
        setTotalRecords(response.response?.data?.total || response.data.length);
      }
    } catch {
      message.error("Failed to load initial reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  return (
    <RequireDnaAccess>
    <div className="initial-reports-container">
      <div className="title-bar">
        <TimedPageInfoTitle
          title={t('InitialReport:initialReports')}
          description={t('InitialReport:initialReportDescription', {
            defaultValue:
              'Article 6.2 initial reports required per Decision 2/CMA.3 para. 18 before first ITMO authorization',
          })}
          infoButtonLabel={t('InitialReport:showInitialReportDescription', {
            defaultValue: 'Show information about Initial Reports',
          })}
        />
      </div>
      <div className="content-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/initialReports/create")}
              >
              {t('InitialReport:generateReport')}
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          className="common-table-class"
          rowKey="reportNumber"
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
              navigate(`/initialReports/view/${record.reportNumber}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
    </RequireDnaAccess>
  );
};

export default InitialReportManagement;
