import { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import { useCountryOptions } from "../../Components/Common/hooks/useCountryOptions";
import {
  Button,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";
import "./cooperativeApproaches.scss";

const statusColors: Record<string, string> = {
  Draft: "default",
  Active: "green",
  Suspended: "orange",
  Completed: "blue",
  Revoked: "red",
};

const entityStatusColors: Record<string, string> = {
  Active: "green",
  Inactive: "default",
};

const CooperativeApproachDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["common"]);
  const { get, put, post } = useConnection();
  const { userInfoState } = useUserContext();
  const { byCode: countryNameByCode } = useCountryOptions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [hasSubmittedIr, setHasSubmittedIr] = useState(false);
  const [authorizedEntities, setAuthorizedEntities] = useState<any[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [addingEntity, setAddingEntity] = useState(false);
  const [entityForm] = Form.useForm();

  // Cooperative approaches are managed by government (DNA) Admin/Root
  // only — mirrors the backend service check.
  const canManage =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin ||
      userInfoState?.userRole === Role.Root);

  const fetchAuthorizedEntities = async () => {
    setEntitiesLoading(true);
    try {
      const response = await get(
        `national/cooperativeApproach/authorizedEntity/query?cooperativeApproachId=${id}`
      );
      setAuthorizedEntities(response?.data ?? []);
    } catch {
      // section is secondary — a load failure shouldn't block the page
    } finally {
      setEntitiesLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/cooperativeApproach/get?id=${id}`
      );
      if (response?.data) {
        setData(response.data);
        if (response.data.status === "Active") {
          fetchAuthorizedEntities();
        }
      }
      const check = await get(
        `national/initialReport/check?cooperativeApproachId=${id}`
      );
      setHasSubmittedIr(!!check?.data?.hasSubmittedReport);
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to load cooperative approach"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : t("common:cooperativeApproachUpdateFailed")
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddEntity = async (values: any) => {
    setAddingEntity(true);
    try {
      await post("national/cooperativeApproach/authorizedEntity/add", {
        cooperativeApproachId: id,
        entityName: values.entityName,
        entityIdentifier: values.entityIdentifier || undefined,
        countryOfIncorporation: values.countryOfIncorporation,
        authorizationDate: values.authorizationDate.valueOf(),
        authorizationReference: values.authorizationReference || undefined,
      });
      message.success("Authorized entity added");
      setAddEntityOpen(false);
      entityForm.resetFields();
      fetchAuthorizedEntities();
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to add authorized entity"
      );
    } finally {
      setAddingEntity(false);
    }
  };

  const handleRemoveEntity = async (entityId: string) => {
    try {
      await put(
        `national/cooperativeApproach/authorizedEntity/remove?id=${entityId}`,
        {}
      );
      message.success("Authorized entity removed");
      fetchAuthorizedEntities();
    } catch (error) {
      const serverMsg = (error as any)?.message;
      message.error(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to remove authorized entity"
      );
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "—";
    return new Date(Number(timestamp)).toLocaleDateString();
  };

  const countryLabel = (code?: string) =>
    code ? countryNameByCode.get(code) ?? code : "—";

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";

  const entityColumns = [
    { title: "Entity Name", dataIndex: "entityName", key: "entityName" },
    {
      title: "Identifier",
      dataIndex: "entityIdentifier",
      key: "entityIdentifier",
      render: (v: string) => v || "—",
    },
    {
      title: "Country of Incorporation",
      dataIndex: "countryOfIncorporation",
      key: "countryOfIncorporation",
      render: (v: string) => countryLabel(v),
    },
    {
      title: "Authorizing Party",
      dataIndex: "authorizingParty",
      key: "authorizingParty",
      render: (v: string) => countryLabel(v),
    },
    {
      title: "Authorization Date",
      dataIndex: "authorizationDate",
      key: "authorizationDate",
      render: (v: number) => formatDate(v),
    },
    {
      title: "Reference",
      dataIndex: "authorizationReference",
      key: "authorizationReference",
      render: (v: string) => v || "—",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={entityStatusColors[status] || "default"}>{status}</Tag>
      ),
    },
    ...(canManage
      ? [
          {
            title: "",
            key: "action",
            render: (record: any) =>
              record.status === "Active" ? (
                <Popconfirm
                  title="Remove this authorized entity? It will remain in the system as Inactive."
                  onConfirm={() => handleRemoveEntity(record.id)}
                >
                  <Button danger size="small">
                    Remove
                  </Button>
                </Popconfirm>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <div className="cooperative-approaches-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">{data.title}</div>
            <div className="body-sub-title">
              Cooperative Approach {data.cooperativeApproachId}
              {data.caReferenceNumber ? ` — ${data.caReferenceNumber}` : ""}
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
                style={{ width: 180 }}
              >
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option
                  value="Active"
                  disabled={isDraft && !hasSubmittedIr}
                >
                  <Tooltip
                    title={
                      isDraft && !hasSubmittedIr
                        ? "The initial report for this cooperative approach must be submitted before it can be activated"
                        : undefined
                    }
                  >
                    Active
                  </Tooltip>
                </Select.Option>
                <Select.Option value="Suspended">Suspended</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
            ) : (
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="CA Reference Number">
            {data.caReferenceNumber ? (
              <Tag color="green">{data.caReferenceNumber}</Tag>
            ) : (
              "Issued on activation"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Host Party">
            {countryLabel(data.hostParty)}
          </Descriptions.Item>
          <Descriptions.Item label="Participating Parties">
            {data.participatingParties?.map((p: string) => (
              <Tag key={p}>{countryLabel(p)}</Tag>
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

      {data.status === "Active" && (
        <div className="content-card" style={{ marginTop: 16 }}>
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 16 }}
          >
            <Col>
              <div className="table-title">Authorized Entities</div>
            </Col>
            <Col>
              {canManage && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddEntityOpen(true)}
                >
                  Add Authorized Entity
                </Button>
              )}
            </Col>
          </Row>
          <Table
            dataSource={authorizedEntities}
            columns={entityColumns}
            rowKey="id"
            loading={entitiesLoading}
            pagination={false}
            locale={{ emptyText: "No authorized entities" }}
          />
        </div>
      )}

      <Modal
        title="Add Authorized Entity"
        open={addEntityOpen}
        onCancel={() => {
          setAddEntityOpen(false);
          entityForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={entityForm} layout="vertical" onFinish={handleAddEntity}>
          <Form.Item
            name="entityName"
            label="Entity Name"
            rules={[{ required: true, message: "Entity name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="entityIdentifier" label="Entity Identifier">
            <Input />
          </Form.Item>
          <Form.Item label="Authorizing Party">
            <Input disabled value={countryLabel(data.hostParty)} />
          </Form.Item>
          <Form.Item
            name="countryOfIncorporation"
            label="Country of Incorporation"
            rules={[
              {
                required: true,
                message: "Country of incorporation is required",
              },
            ]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select country of incorporation"
              options={(data.participatingParties ?? []).map((p: string) => ({
                label: countryLabel(p),
                value: p,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="authorizationDate"
            label="Authorization Date"
            rules={[
              { required: true, message: "Authorization date is required" },
            ]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(currentDate: any) =>
                currentDate > moment().endOf("day")
              }
            />
          </Form.Item>
          <Form.Item
            name="authorizationReference"
            label="Authorization Reference"
          >
            <Input placeholder="Document reference or URL" />
          </Form.Item>
          <Row justify="end">
            <Button
              onClick={() => {
                setAddEntityOpen(false);
                entityForm.resetFields();
              }}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={addingEntity}>
              Add
            </Button>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CooperativeApproachDetails;
