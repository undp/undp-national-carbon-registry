import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import { CheckCircleOutlined, EditOutlined } from "@ant-design/icons";
import { CaMethod, CA_METHOD_LABELS } from "../../Definitions/Enums/caMethod.enum";
import { NDC_TYPE_LABELS } from "../../Definitions/Enums/ndcType.enum";
import { fmtDecimal, fmtQty } from "./caFormat";
import CaPeriodTable, { CaPeriodYearRow } from "./caPeriodTable";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";
import IrreversibleActionConfirmModal from "../../Components/Models/irreversibleActionConfirmModal";
import "./caManagement.scss";

const statusColors: Record<string, string> = {
  Draft: "default",
  Submitted: "blue",
  Approved: "green",
};

const CaDetails = () => {
  const { caId = "" } = useParams<{ caId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["correspondingAdjust"]);
  const { get, put } = useConnection();
  const { canManage } = useArticle6Permissions();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [data, setData] = useState<any>(null);
  const [periodRows, setPeriodRows] = useState<CaPeriodYearRow[]>([]);
  const [periodBounds, setPeriodBounds] = useState<{
    start: number | null;
    end: number | null;
  }>({ start: null, end: null });
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await get(
        `national/correspondingAdjustment/get?id=${encodeURIComponent(caId)}`
      );
      const row = response?.data;
      if (!row) {
        message.error(t("correspondingAdjust:notFound", { caId }));
        navigate("/correspondingAdjustments/viewAll");
        return;
      }
      setData(row);
      const periodResponse = await get(
        `national/correspondingAdjustment/periodSummary?year=${row.year}`
      );
      const period = periodResponse?.data;
      if (period?.hasNdcTarget) {
        setPeriodRows(period.years ?? []);
        setPeriodBounds({
          start: period.ndcStartYear,
          end: period.ndcEndYear,
        });
      }
    } catch {
      message.error(t("correspondingAdjust:loadDetailFailed"));
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
      message.success(t("correspondingAdjust:submitSuccess"));
      setSubmitConfirmOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? t("correspondingAdjust:submitFailed")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalizePeriod = async () => {
    setFinalizing(true);
    try {
      await put(
        `national/correspondingAdjustment/finalizePeriod?year=${data.year}`,
        {}
      );
      message.success(t("correspondingAdjust:finalizeSuccess"));
      setFinalizeConfirmOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? t("correspondingAdjust:finalizeFailed")
      );
    } finally {
      setFinalizing(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      await put(
        `national/correspondingAdjustment/approve?id=${encodeURIComponent(caId)}`,
        {}
      );
      message.success(t("correspondingAdjust:approveSuccess"));
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? t("correspondingAdjust:approveFailed")
      );
    } finally {
      setApproving(false);
    }
  };

  const openEdit = () => {
    form.setFieldsValue({ remarks: data.remarks ?? "" });
    setEditOpen(true);
  };

  const handleEditSave = async (values: any) => {
    setSaving(true);
    try {
      await put("national/correspondingAdjustment/update", {
        caId,
        remarks: values.remarks,
      });
      message.success(t("correspondingAdjust:updateSuccess"));
      setEditOpen(false);
      fetchData();
    } catch (error: any) {
      message.error(
        error?.response?.data?.message ?? t("correspondingAdjust:updateFailed")
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";
  const isSubmitted = data.status === "Submitted";
  const isAveraging = data.caMethod === CaMethod.AVERAGING;

  const gateYear = isAveraging ? periodBounds.end ?? data.year : data.year;
  const gateOpen = gateYear != null && new Date().getUTCFullYear() > gateYear;

  return (
    <RequireDnaAccess>
    <div className="corresponding-adjustment-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">
              {data.caId}{" "}
              <Tag color={statusColors[data.status] || "default"}>
                {data.status}
              </Tag>
            </div>
            <div className="body-sub-title">
              {t("correspondingAdjust:yearMethodLabel", {
                year: data.year,
                method: data.caMethod,
              })}
            </div>
          </Col>
          <Col>
            {canManage && isDraft && (
              <Button
                icon={<EditOutlined />}
                onClick={openEdit}
                style={{ marginRight: 8 }}
              >
                {t("correspondingAdjust:edit")}
              </Button>
            )}
            {canManage && isDraft && !isAveraging && (
              <Tooltip
                title={
                  gateOpen
                    ? undefined
                    : t("correspondingAdjust:submitBlockedYear", {
                        year: data.year,
                        nextYear: data.year + 1,
                      })
                }
              >
                <span>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={submitting}
                    disabled={!gateOpen}
                    style={{ marginRight: 8 }}
                    onClick={() => setSubmitConfirmOpen(true)}
                  >
                    {t("correspondingAdjust:submit")}
                  </Button>
                </span>
              </Tooltip>
            )}
            {canManage && isDraft && isAveraging && (
              <Tooltip
                title={
                  gateOpen
                    ? undefined
                    : t("correspondingAdjust:submitBlockedPeriod", {
                        nextYear: Number(periodBounds.end ?? data.year) + 1,
                      })
                }
              >
                <span>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={finalizing}
                    disabled={!gateOpen}
                    style={{ marginRight: 8 }}
                    onClick={() => setFinalizeConfirmOpen(true)}
                  >
                    {t("correspondingAdjust:finalizePeriod")}
                  </Button>
                </span>
              </Tooltip>
            )}
            {/* TEMPORARY: Approve is hidden for now — restore the
                canManage && isSubmitted condition to bring it back. */}
            {false && canManage && isSubmitted && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                loading={approving}
              >
                {t("correspondingAdjust:approve")}
              </Button>
            )}
          </Col>
        </Row>
      </div>

      <div className="content-card">
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t("correspondingAdjust:columnNdcType")}>
            {NDC_TYPE_LABELS[data.ndcType] ?? data.ndcType}
          </Descriptions.Item>
          <Descriptions.Item label={t("correspondingAdjust:columnCaMethod")}>
            {CA_METHOD_LABELS[data.caMethod] ?? data.caMethod}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:reportingYearEmission")}
          >
            {fmtQty(data.reportingYearEmission)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldAppliedAdjustment")}
          >
            {fmtDecimal(data.appliedAdjustment)}
          </Descriptions.Item>
          {isAveraging && (
            <>
              <Descriptions.Item
                label={t("correspondingAdjust:fieldCumulativeAdjustment")}
              >
                {fmtDecimal(data.cumulativeFirstTransferred)}
              </Descriptions.Item>
              <Descriptions.Item
                label={t("correspondingAdjust:fieldElapsedYears")}
              >
                {periodBounds.start != null
                  ? data.year - periodBounds.start + 1
                  : "—"}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item
            label={t("correspondingAdjust:fieldAuthorizedItmos")}
          >
            {fmtDecimal(data.authorizedItmos)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldFirstTransferredItmos")}
          >
            {fmtDecimal(data.firstTransferredItmos)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldAcquiredItmos")}
          >
            {fmtDecimal(data.acquiredItmos)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldUsedTowardsNdc")}
          >
            {fmtDecimal(data.usedTowardsNdcItmos)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldCancelledItmos")}
          >
            {fmtDecimal(data.cancelledItmos)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldEmissionsBalance")}
          >
            {fmtDecimal(data.emissionsBalance)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldAdjustedEmissions")}
          >
            {fmtDecimal(data.adjustedEmissions)}
          </Descriptions.Item>
          <Descriptions.Item label={t("correspondingAdjust:fieldNdcTarget")}>
            {fmtDecimal(data.ndcTarget)}
          </Descriptions.Item>
          <Descriptions.Item
            label={t("correspondingAdjust:fieldSafeguard")}
            span={2}
          >
            <Tag color={data.safeguardCheckPassed ? "green" : "red"}>
              {data.safeguardCheckPassed
                ? t("correspondingAdjust:safeguardPassed")
                : t("correspondingAdjust:safeguardFailed")}
            </Tag>{" "}
            {data.safeguardNotes}
          </Descriptions.Item>
          <Descriptions.Item label={t("correspondingAdjust:remarks")} span={2}>
            {data.remarks || "—"}
          </Descriptions.Item>
        </Descriptions>

        {periodRows.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div className="table-title" style={{ marginBottom: 12 }}>
              {t("correspondingAdjust:ndcPeriodLabel", {
                start: periodBounds.start,
                end: periodBounds.end,
              })}
            </div>
            <CaPeriodTable
              rows={periodRows}
              reportingYear={data.year}
              isAveraging={isAveraging}
            />
          </div>
        )}

        {isAveraging && !gateOpen && (
          <Alert
            style={{ marginTop: 16 }}
            type="info"
            showIcon
            message={t("correspondingAdjust:averagingBannerTitle")}
            description={t("correspondingAdjust:averagingBannerDescription")}
          />
        )}
      </div>

      <Modal
        title={t("correspondingAdjust:editCorrespondingAdjustment")}
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleEditSave}>
          <Form.Item name="remarks" label={t("correspondingAdjust:remarks")}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Row justify="end">
            <Button onClick={() => setEditOpen(false)} style={{ marginRight: 8 }}>
              {t("correspondingAdjust:cancel")}
            </Button>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t("correspondingAdjust:save")}
            </Button>
          </Row>
        </Form>
      </Modal>

      <IrreversibleActionConfirmModal
        open={submitConfirmOpen}
        title={t("correspondingAdjust:submitCA")}
        message={t("correspondingAdjust:submitConfirmTitle")}
        confirmText={t("correspondingAdjust:submit")}
        cancelText={t("correspondingAdjust:cancel")}
        loading={submitting}
        onConfirm={handleSubmit}
        onCancel={() => setSubmitConfirmOpen(false)}
        t={t}
      />
      <IrreversibleActionConfirmModal
        open={finalizeConfirmOpen}
        title={t("correspondingAdjust:finalizePeriod")}
        message={t("correspondingAdjust:finalizeConfirmTitle")}
        confirmText={t("correspondingAdjust:finalizePeriod")}
        cancelText={t("correspondingAdjust:cancel")}
        loading={finalizing}
        onConfirm={handleFinalizePeriod}
        onCancel={() => setFinalizeConfirmOpen(false)}
        t={t}
      />
    </div>
    </RequireDnaAccess>
  );
};

export default CaDetails;
