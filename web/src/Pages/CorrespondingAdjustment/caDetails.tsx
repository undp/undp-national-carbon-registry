import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useUserContext } from "../../Context/UserInformationContext/userInformationContext";
import {
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Skeleton,
  Tag,
  message,
} from "antd";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { CompanyRole } from "../../Definitions/Enums/company.role.enum";
import { Role } from "../../Definitions/Enums/role.enum";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Approved: "green",
};

const fmt = (val: number | null | undefined) =>
  val !== undefined && val !== null ? Number(val).toFixed(2) : "N/A";

const CaDetails = () => {
  const { caId = "" } = useParams<{ caId: string }>();
  const navigate = useNavigate();
  const { get, put } = useConnection();
  const { userInfoState } = useUserContext();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Corresponding adjustments are managed by government (DNA) Admin/Root
  // only — mirrors the backend service check.
  const canManage =
    userInfoState?.companyRole ===
      CompanyRole.DESIGNATED_NATIONAL_AUTHORITY &&
    (userInfoState?.userRole === Role.Admin ||
      userInfoState?.userRole === Role.Root);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/correspondingAdjustment/get?id=${encodeURIComponent(caId)}`
      );
      if (!response?.data) {
        message.error(`Corresponding adjustment ${caId} not found`);
        navigate("/correspondingAdjustments/viewAll");
        return;
      }
      setData(response.data);
    } catch {
      message.error("Failed to load corresponding adjustment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await put(
        `national/correspondingAdjustment/submit?id=${encodeURIComponent(caId)}`,
        {}
      );
      message.success("Corresponding adjustment submitted");
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ??
          "Failed to submit corresponding adjustment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await put(
        `national/correspondingAdjustment/approve?id=${encodeURIComponent(caId)}`,
        {}
      );
      message.success("Corresponding adjustment approved");
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ??
          "Failed to approve corresponding adjustment"
      );
    } finally {
      setApproving(false);
    }
  };

  const openEdit = () => {
    form.setFieldsValue({
      caMethod: data.caMethod,
      remarks: data.remarks ?? "",
    });
    setEditOpen(true);
  };

  const handleEditSave = async (values: any) => {
    setSaving(true);
    try {
      await put("national/correspondingAdjustment/update", {
        caId,
        caMethod: values.caMethod,
        remarks: values.remarks,
      });
      message.success("Corresponding adjustment updated");
      setEditOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ??
          "Failed to update corresponding adjustment"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";
  const isSubmitted = data.status === "Submitted";
  const isMultiYear = data.ndcType === "MultiYear";

  return (
    <div style={{ padding: "0 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
              {data.caId}{" "}
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
            </div>
            <div style={{ fontSize: "0.875rem", color: "rgba(58,53,65,0.6)" }}>
              Year {data.year}
              {data.cooperativeApproachId
                ? ` — Cooperative Approach ${data.cooperativeApproachId}`
                : " — registry-wide"}
            </div>
          </Col>
          <Col>
            {canManage && isDraft && (
              <Button
                icon={<EditOutlined />}
                onClick={openEdit}
                style={{ marginRight: 8 }}
              >
                Edit
              </Button>
            )}
            {canManage && isDraft && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                style={{ marginRight: 8 }}
              >
                Submit
              </Button>
            )}
            {canManage && isSubmitted && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={approving}
              >
                Approve
              </Button>
            )}
          </Col>
        </Row>
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
        <Descriptions bordered column={2}>
          <Descriptions.Item label="NDC Type">{data.ndcType}</Descriptions.Item>
          <Descriptions.Item label="CA Method">
            {data.caMethod}
          </Descriptions.Item>
          <Descriptions.Item label="Metric">{data.metric}</Descriptions.Item>
          <Descriptions.Item label="Cooperative Approach">
            {data.cooperativeApproachId || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Authorized ITMOs">
            {fmt(data.authorizedItmos)}
          </Descriptions.Item>
          <Descriptions.Item label="First Transferred ITMOs">
            {fmt(data.firstTransferredItmos)}
          </Descriptions.Item>
          <Descriptions.Item label="Acquired ITMOs">
            {fmt(data.acquiredItmos)}
          </Descriptions.Item>
          <Descriptions.Item label="Used Towards NDC (domestic + international)">
            {fmt(data.usedTowardsNdcItmos)}
          </Descriptions.Item>
          <Descriptions.Item label="Cancelled ITMOs">
            {fmt(data.cancelledItmos)}
          </Descriptions.Item>
          <Descriptions.Item label="Emissions Balance">
            {fmt(data.emissionsBalance)}
          </Descriptions.Item>
          {isMultiYear && (
            <>
              <Descriptions.Item label="Cumulative First Transferred (period to date)">
                {fmt(data.cumulativeFirstTransferred)}
              </Descriptions.Item>
              <Descriptions.Item label="Indicative Annual Adjustment">
                {fmt(data.indicativeAnnualAdjustment)}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="Adjusted Emissions">
            {fmt(data.adjustedEmissions)}
          </Descriptions.Item>
          <Descriptions.Item label="NDC Target">
            {data.ndcTarget ?? "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Safeguard" span={2}>
            <Tag color={data.safeguardCheckPassed ? "green" : "red"}>
              {data.safeguardCheckPassed ? "Passed" : "Failed"}
            </Tag>{" "}
            {data.safeguardNotes}
          </Descriptions.Item>
          <Descriptions.Item label="Remarks" span={2}>
            {data.remarks || "—"}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Modal
        title="Edit Corresponding Adjustment"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleEditSave}>
          <Form.Item
            name="caMethod"
            label="CA Method"
            rules={[{ required: true, message: "CA method is required" }]}
            extra={
              isMultiYear
                ? "Only the Multi-Year method is compatible with a Multi-Year NDC target."
                : "Trajectory and Averaging are computed identically for a Single-Year NDC target."
            }
          >
            <Select>
              {!isMultiYear && (
                <>
                  <Select.Option value="Trajectory">
                    Trajectory (para. 7a(i))
                  </Select.Option>
                  <Select.Option value="Averaging">
                    Averaging (para. 7a(ii))
                  </Select.Option>
                </>
              )}
              {isMultiYear && (
                <Select.Option value="MultiYear">
                  Multi-Year (para. 7b)
                </Select.Option>
              )}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Row justify="end">
            <Button onClick={() => setEditOpen(false)} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save
            </Button>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default CaDetails;
