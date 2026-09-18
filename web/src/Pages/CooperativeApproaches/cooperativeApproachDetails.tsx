import { useEffect, useState } from "react";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useCountryOptions } from "../../Components/Common/hooks/useCountryOptions";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";
import {
  Button,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Table,
  Tag,
  message,
} from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Trash } from "react-bootstrap-icons";
import {
  CA_ALLOWED_TRANSITIONS,
  CA_STATUS_COLORS,
  CooperativeApproachStatus,
} from "../../Definitions/Enums/cooperativeApproachStatus.enum";
import UserActionConfirmationModel from "../../Components/Models/userActionConfirmationModel";
import "./cooperativeApproaches.scss";

const entityStatusColors: Record<string, string> = {
  Active: "green",
  Inactive: "default",
};

const CooperativeApproachDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["common"]);
  const { get, put, post } = useConnection();
  const { canManage } = useArticle6Permissions();
  const { byCode: countryNameByCode } = useCountryOptions();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [authorizedEntities, setAuthorizedEntities] = useState<any[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [addEntityOpen, setAddEntityOpen] = useState(false);
  const [addingEntity, setAddingEntity] = useState(false);
  const [entityForm] = Form.useForm();
  const [removeEntityTarget, setRemoveEntityTarget] = useState<any>(null);
  const [removeEntityModalOpen, setRemoveEntityModalOpen] = useState(false);
  const [removingEntity, setRemovingEntity] = useState(false);
  const [removeEntityErrorMsg, setRemoveEntityErrorMsg] = useState("");


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
        // Entities are attached while the approach is still a Draft, so
        // the section is relevant at every status, not just Active.
        fetchAuthorizedEntities();
      }
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

  const openRemoveEntityModal = (record: any) => {
    setRemoveEntityTarget(record);
    setRemoveEntityErrorMsg("");
    setRemoveEntityModalOpen(true);
  };

  const handleRemoveEntityCanceled = () => {
    setRemoveEntityModalOpen(false);
  };

  const handleRemoveEntityConfirmed = async () => {
    if (!removeEntityTarget) return;
    setRemovingEntity(true);
    try {
      await put(
        `national/cooperativeApproach/authorizedEntity/remove?id=${removeEntityTarget.id}`,
        {}
      );
      message.success("Authorized entity removed");
      setRemoveEntityModalOpen(false);
      fetchAuthorizedEntities();
    } catch (error) {
      const serverMsg = (error as any)?.message;
      setRemoveEntityErrorMsg(
        serverMsg && typeof serverMsg === "string"
          ? serverMsg
          : "Failed to remove authorized entity"
      );
    } finally {
      setRemovingEntity(false);
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

  const isDraft = data.status === CooperativeApproachStatus.DRAFT;
  // Entities can be added while Draft (the normal case), or once
  // Submitted or Active (an amendment — mirrors the backend's relaxed
  // gate on addAuthorizedEntity). Submitted is short-lived since an
  // approach gets activated right after, so Active is the realistic
  // case. Beyond that the set stays fixed.
  const canAddEntities =
    canManage &&
    (isDraft ||
      data.status === CooperativeApproachStatus.SUBMITTED ||
      data.status === CooperativeApproachStatus.ACTIVE);
  const nextStatuses = CA_ALLOWED_TRANSITIONS[data.status] ?? [];

  // Copy differs by CA status: on a Draft nothing has been submitted yet
  // so removal deletes the row outright; afterwards it only soft-flips
  // to Inactive, preserving the authorization history.
  const removeEntityActionInfo = {
    action: "Remove",
    headerText: "Remove Authorized Entity",
    text: isDraft
      ? "Remove this authorized entity? Nothing has been submitted yet, so it will be deleted outright."
      : "Remove this authorized entity? It will remain in the system as Inactive.",
    type: "danger",
    icon: <Trash />,
    hideRemarks: true,
  };

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
    {
      title: "Submission",
      dataIndex: "submissionStatus",
      key: "submissionStatus",
      render: (submissionStatus: string) => (
        <Tag
          color={
            submissionStatus === CooperativeApproachStatus.SUBMITTED
              ? "geekblue"
              : "default"
          }
        >
          {submissionStatus || CooperativeApproachStatus.DRAFT}
        </Tag>
      ),
    },
    ...(canManage
      ? [
          {
            title: "",
            key: "action",
            render: (record: any) =>
              record.status === "Active" ? (
                <Button
                  danger
                  size="small"
                  onClick={() => openRemoveEntityModal(record)}
                >
                  Remove
                </Button>
              ) : null,
          },
        ]
      : []),
  ];

  return (
    <RequireDnaAccess>
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
            {/* The dropdown offers only the transitions the server will
                accept. A Draft has none — submitting its initial report
                is what advances it, so it renders as a plain tag. */}
            {canManage && nextStatuses.length > 0 ? (
              <Select
                value={data.status}
                onChange={handleStatusChange}
                loading={updatingStatus}
                style={{ width: 180 }}
              >
                <Select.Option value={data.status} disabled>
                  {data.status}
                </Select.Option>
                {nextStatuses.map((status) => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <>
                <Tag color={CA_STATUS_COLORS[data.status] || "default"}>
                  {data.status}
                </Tag>
                {canManage && isDraft && (
                  <span className="status-hint">
                    Submit this approach&apos;s initial report to move it to
                    Submitted.
                  </span>
                )}
              </>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="CA Reference Number">
            {data.caReferenceNumber ? (
              <Tag color="green">{data.caReferenceNumber}</Tag>
            ) : (
              "Issued on initial report submission"
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
            {canAddEntities && (
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
          locale={{
            emptyText: isDraft
              ? "No authorized entities — add them before submitting the initial report"
              : "No authorized entities",
          }}
        />
      </div>

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

      <UserActionConfirmationModel
        t={t}
        actionInfo={removeEntityActionInfo}
        onActionConfirmed={handleRemoveEntityConfirmed}
        onActionCanceled={handleRemoveEntityCanceled}
        openModal={removeEntityModalOpen}
        errorMsg={removeEntityErrorMsg}
        loading={removingEntity}
      />
    </div>
    </RequireDnaAccess>
  );
};

export default CooperativeApproachDetails;
