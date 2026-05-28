import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { Button, Row, Col, Table, Tag, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import "./cooperativeApproaches.scss";

const statusColors: Record<string, string> = {
  Draft: "default",
  Active: "green",
  Suspended: "orange",
  Completed: "blue",
};

const CooperativeApproaches = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(["common"]);
  const { post } = useConnection();
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canCreate =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const columns = [
    {
      title: "ID",
      dataIndex: "cooperativeApproachId",
      key: "cooperativeApproachId",
      sorter: true,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: true,
    },
    {
      title: "Host Party",
      dataIndex: "hostParty",
      key: "hostParty",
    },
    {
      title: "Participating Parties",
      dataIndex: "participatingParties",
      key: "participatingParties",
      render: (parties: string[]) => (
        <>
          {parties?.map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </>
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
      const response = await post("national/cooperativeApproach/query", {
        page,
        size,
        sort: { key: "createdTime", order: "DESC" },
      });
      if (response?.data) {
        setData(response.data);
        setTotalRecords(response.response?.data?.total || response.data.length);
      }
    } catch (error) {
      message.error("Failed to load cooperative approaches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <div className="body-title">Cooperative Approaches</div>
        <div className="body-sub-title">
          Article 6.2 bilateral and multilateral cooperative approaches
        </div>
      </div>
      <div className="content-card">
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <div className="table-title">All Cooperative Approaches</div>
          </Col>
          <Col>
            {canCreate && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() =>
                  navigate("/cooperativeApproaches/add")
                }
              >
                Add New
              </Button>
            )}
          </Col>
        </Row>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="cooperativeApproachId"
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
              navigate(`/cooperativeApproaches/view/${record.cooperativeApproachId}`),
            style: { cursor: "pointer" },
          })}
        />
      </div>
    </div>
  );
};

export default CooperativeApproaches;
