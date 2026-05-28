import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import {
  Button,
  Col,
  Descriptions,
  Row,
  Select,
  Skeleton,
  Tag,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import "./cooperativeApproaches.scss";

const statusColors: Record<string, string> = {
  Draft: "default",
  Active: "green",
  Suspended: "orange",
  Completed: "blue",
};

const CooperativeApproachDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { get, put } = useConnection();
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const canManage =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY ||
    userInfoState?.companyRole === CompanyRole.MINISTRY;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/cooperativeApproach/get?id=${id}`
      );
      if (response?.data) {
        setData(response.data);
      }
    } catch (error) {
      message.error("Failed to load cooperative approach");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await put("national/cooperativeApproach/update", {
        cooperativeApproachId: id,
        status: newStatus,
      });
      message.success("Status updated");
      fetchData();
    } catch (error) {
      message.error("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "—";
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">{data.title}</div>
            <div className="body-sub-title">
              Cooperative Approach {data.cooperativeApproachId}
            </div>
          </Col>
          <Col>
            {canManage && (
              <Button
                icon={<EditOutlined />}
                onClick={() =>
                  navigate("/cooperativeApproaches/add", {
                    state: { record: data },
                  })
                }
              >
                Edit
              </Button>
            )}
          </Col>
        </Row>
      </div>
      <div className="content-card">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">
            {data.cooperativeApproachId}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {canManage ? (
              <Select
                value={data.status}
                onChange={handleStatusChange}
                loading={updatingStatus}
                style={{ width: 150 }}
              >
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="Suspended">Suspended</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
            ) : (
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Host Party">
            {data.hostParty}
          </Descriptions.Item>
          <Descriptions.Item label="Participating Parties">
            {data.participatingParties?.map((p: string) => (
              <Tag key={p}>{p}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Start Date">
            {formatDate(data.startDate)}
          </Descriptions.Item>
          <Descriptions.Item label="End Date">
            {formatDate(data.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="NDC Link" span={2}>
            {data.ndcLink || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {data.description || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Expected Mitigation Outcomes" span={2}>
            {data.expectedMitigationOutcomes || "—"}
          </Descriptions.Item>
          <Descriptions.Item
            label="Environmental Integrity Assessment"
            span={2}
          >
            {data.environmentalIntegrityAssessment || "—"}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>
  );
};

export default CooperativeApproachDetails;
