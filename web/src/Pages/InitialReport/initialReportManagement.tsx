import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { Button, Row, Col, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import "./initialReports.scss";
import "../../Styles/common.table.scss";
import { useTranslation } from "react-i18next";
import { TimedPageInfoTitle } from "../../Components/Common/TimedPageInfoTitle/TimedPageInfoTitle";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Published: "green",
};

const InitialReportManagement = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common","InitialReport"]);
  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canCreate =
    userInfoState?.companyRole === CompanyRole.DESIGNATED_NATIONAL_AUTHORITY;

  const columns = [
    { title: t("InitialReport:columnReportId"), dataIndex: "reportId", key: "reportId" },
    {
      title: t("InitialReport:columnCooperativeApproach"),
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
    },
    {
      title: t("InitialReport:columnVersion"),
      dataIndex: "version",
      key: "version",
      render: (version: number) => <span>v{version ?? 1}</span>,
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
    } catch (error) {
      message.error("Failed to load initial reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  return (
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
          rowKey="reportId"
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
              navigate(`/initialReports/view/${record.reportId}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
  );
};

export default InitialReportManagement;
