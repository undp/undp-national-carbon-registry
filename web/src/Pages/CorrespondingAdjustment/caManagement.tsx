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
  Approved: "green",
};

const CaManagement = () => {
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
    { title: "ID", dataIndex: "caId", key: "caId" },
    { title: "Year", dataIndex: "year", key: "year", sorter: true },
    {
      title: "Cooperative Approach",
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
    },
    { title: "NDC Type", dataIndex: "ndcType", key: "ndcType" },
    { title: "CA Method", dataIndex: "caMethod", key: "caMethod" },
    {
      title: "Emissions Balance",
      dataIndex: "emissionsBalance",
      key: "emissionsBalance",
      render: (val: number) => (val ? Number(val).toFixed(2) : "0"),
    },
    {
      title: "Safeguard",
      dataIndex: "safeguardCheckPassed",
      key: "safeguardCheckPassed",
      render: (passed: boolean) => (
        <Tag color={passed ? "green" : "red"}>
          {passed ? "Passed" : "Failed"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
  ];

  const fetchData = async (page: number, size: number) => {
    setLoading(true);
    try {
      const response = await post(
        "national/correspondingAdjustment/query",
        {
          page,
          size,
          sort: { key: "createdTime", order: "DESC" },
        }
      );
      if (response?.data) {
        setData(response.data);
        setTotalRecords(response.response?.data?.total || response.data.length);
      }
    } catch (error) {
      message.error("Failed to load corresponding adjustments");
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
          Corresponding Adjustments
        </div>
        <div style={{ fontSize: "0.875rem", color: "rgba(58,53,65,0.6)" }}>
          Article 6.2 corresponding adjustment calculations per Decision
          2/CMA.3 para. 7-10
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
              All CA Records
            </div>
          </Col>
          <Col>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/correspondingAdjustments/calculate")}
              >
                Calculate CA
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
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
