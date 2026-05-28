import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { Button, Row, Col, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Published: "green",
};

const InitialReportManagement = () => {
  const navigate = useNavigate();
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
    { title: "Report ID", dataIndex: "reportId", key: "reportId" },
    {
      title: "Cooperative Approach",
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created",
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
    <div style={{ padding: "0 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
          Initial Reports
        </div>
        <div style={{ fontSize: "0.875rem", color: "rgba(58,53,65,0.6)" }}>
          Article 6.2 initial reports required per Decision 2/CMA.3 para. 18
          before first ITMO authorization
        </div>
      </div>
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          boxShadow:
            "0px 2px 1px -1px rgba(0,0,0,0.2), 0px 1px 1px rgba(0,0,0,0.14), 0px 1px 3px rgba(0,0,0,0.12)",
        }}
      >
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <div style={{ fontSize: "1rem", fontWeight: 600 }}>
              All Initial Reports
            </div>
          </Col>
          <Col>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/initialReports/create")}
              >
                Generate Report
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
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
        />
      </div>
    </div>
  );
};

export default InitialReportManagement;
