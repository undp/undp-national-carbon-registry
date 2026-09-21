import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Col,
  Form,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Tag,
  Tooltip,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useConnection } from "../../Context/ConnectionContext/connectionContext";
import { useArticle6Permissions } from "../../Components/Common/hooks/useArticle6Permissions";
import RequireDnaAccess from "../../Components/Common/AccessControl/RequireDnaAccess";
import { CooperativeApproachStatus } from "../../Definitions/Enums/cooperativeApproachStatus.enum";
import UserActionConfirmationModel from "../../Components/Models/userActionConfirmationModel";
import InitialReportGeneralSections from "../../Components/InitialReport/initialReportGeneralSections";
import InitialReportApproachesTable from "../../Components/InitialReport/initialReportApproachesTable";
import { statusColors, versionLabel } from "./initialReport.helpers";
import { Trash } from "react-bootstrap-icons";
import "./initialReports.scss";

// The working draft: add/remove cooperative approaches, edit general
// fields, and submit. Reached from the "Add Cooperative Approach" /
// "Continue Draft" button on the report-level detail page, and from
// the draft row in its versions table. Can load a report whose status
// is still "Submitted" — the flip to Draft only happens server-side
// once a cooperative approach is actually added (see the info banner
// below) — so every mutation here must degrade gracefully for that case.
const InitialReportDraft = () => {
  const { reportNumber = "" } = useParams<{ reportNumber: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "InitialReport"]);
  const { get, put, post } = useConnection();
  const { canManage } = useArticle6Permissions();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [data, setData] = useState<any>(null);

  const [addApproachOptions, setAddApproachOptions] = useState<any[]>([]);
  const [addingApproach, setAddingApproach] = useState(false);
  const [addApproachForm] = Form.useForm();

  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeErrorMsg, setRemoveErrorMsg] = useState("");

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitErrorMsg, setSubmitErrorMsg] = useState("");

  const loadAddApproachOptions = async () => {
    try {
      const response = await post("national/cooperativeApproach/query", {
        page: 1,
        size: 200,
        sort: { key: "createdTime", order: "DESC" },
        filterAnd: [
          { key: "status", operation: "=", value: CooperativeApproachStatus.DRAFT },
        ],
      });
      setAddApproachOptions(response?.data ?? []);
    } catch {
      setAddApproachOptions([]);
    }
  };

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await get(
        `national/initialReport/get?reportNumber=${encodeURIComponent(reportNumber)}`
      );
      const row = response?.data;
      if (!row) {
        message.error(t("InitialReport:reportNotFound", { reportNumber }));
        navigate("/initialReports/viewAll");
        return;
      }
      setData(row);
      if (canManage) await loadAddApproachOptions();
    } catch {
      message.error(t("InitialReport:loadFailed"));
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (reportNumber) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportNumber]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await put(
        `national/initialReport/submit?reportNumber=${encodeURIComponent(reportNumber)}`,
        {}
      );
      message.success(t("InitialReport:submitSuccess"));
      setSubmitModalOpen(false);
      navigate(`/initialReports/view/${reportNumber}`);
    } catch (error: any) {
      setSubmitErrorMsg(error?.message ?? t("InitialReport:submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      const response = await put(
        `national/initialReport/discardDraft?reportNumber=${encodeURIComponent(reportNumber)}`,
        {}
      );
      if (response?.data?.deleted) {
        message.success(t("InitialReport:discardSuccessDeleted"));
        navigate("/initialReports/viewAll");
      } else {
        message.success(t("InitialReport:discardSuccessReverted"));
        navigate(`/initialReports/view/${reportNumber}`);
      }
    } catch (error: any) {
      message.error(error?.message ?? t("InitialReport:discardFailed"));
    } finally {
      setDiscarding(false);
    }
  };

  const handleAddApproach = async (values: any) => {
    setAddingApproach(true);
    try {
      await post("national/initialReport/cooperativeApproach/add", {
        reportNumber,
        cooperativeApproachId: values.cooperativeApproachId,
      });
      message.success(t("InitialReport:approachAddedSuccess"));
      addApproachForm.resetFields();
      fetchData(true);
    } catch (error: any) {
      message.error(error?.message ?? t("InitialReport:addApproachFailed"));
    } finally {
      setAddingApproach(false);
    }
  };

  const openRemoveModal = (approach: any) => {
    setRemoveTarget(approach);
    setRemoveErrorMsg("");
    setRemoveModalOpen(true);
  };

  const handleRemoveConfirmed = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await put("national/initialReport/cooperativeApproach/remove", {
        reportNumber,
        cooperativeApproachId: removeTarget.cooperativeApproachId,
      });
      message.success(t("InitialReport:approachRemovedSuccess"));
      setRemoveModalOpen(false);
      fetchData(true);
    } catch (error: any) {
      setRemoveErrorMsg(
        error?.message ?? t("InitialReport:removeApproachFailed")
      );
    } finally {
      setRemoving(false);
    }
  };

  if (loading) return <Skeleton active />;
  if (!data) return <div>Not found</div>;

  const isDraft = data.status === "Draft";
  const isSubmitted = data.status === "Submitted";
  const approaches: any[] = data.cooperativeApproaches ?? [];
  const pending = data.pendingVersion;

  // submitReport has no guard against resubmitting an untouched
  // Submitted report (it would mint a duplicate, byte-identical minor
  // version) — disable Submit outright here rather than rely on the
  // backend. A Draft with no pending approach change (reachable by
  // adding then removing a CA, since removal doesn't restore
  // Submitted) is a softer case: the frontend can't tell that apart
  // from "reopened by editing general fields", which is a legitimate
  // minor bump, so that's still submittable, just called out below.
  const nothingPendingWarning =
    isDraft && data.versionCount > 0 && !data.hasPendingApproachChange;

  // A report stays Submitted when only an authorized entity (not a
  // whole new cooperative approach) was added to an already-linked
  // approach — see CooperativeApproachService.addAuthorizedEntity,
  // which has no reason to reopen the report itself. submitReport
  // doesn't require Draft status to run (it files whatever's pending
  // regardless), so gate this on hasPendingApproachChange instead of
  // hard-blocking on isSubmitted.
  const canSubmitAmendment = isSubmitted && data.hasPendingApproachChange;

  // Every submit — first filing, minor bump, or an amendment reopening
  // a Submitted report — goes through the same confirmation modal
  // (see UserActionConfirmationModel below); only the message text
  // varies by case.
  const submitActionInfo = {
    action: t("InitialReport:submit"),
    headerText: t("InitialReport:submitConfirmHeader"),
    text: canSubmitAmendment
      ? t("InitialReport:submitAmendmentConfirm", {
          major: pending?.majorVersion,
          minor: pending?.minorVersion,
        })
      : nothingPendingWarning
      ? t("InitialReport:submitMinorBumpConfirm", {
          major: pending?.majorVersion,
          minor: pending?.minorVersion,
        })
      : t("InitialReport:submitConfirmText", {
          major: pending?.majorVersion,
          minor: pending?.minorVersion,
        }),
    type: "success",
    icon: <CheckCircleOutlined />,
    hideRemarks: true,
  };

  // What adding a CA to this Submitted report would produce — NOT the
  // same thing as data.pendingVersion, which (while still Submitted,
  // before anything has actually been added) describes "submit again
  // right now with no changes" i.e. a minor bump. Adding any approach
  // always sets addedInMajor = null on a fresh link, so it
  // deterministically forces a major bump regardless of that current
  // pending state — computable client-side without waiting on a
  // refetch.
  const reopenedVersion = { majorVersion: (data.majorVersion ?? 0) + 1, minorVersion: 0 };

  const removeActionInfo = {
    action: t("InitialReport:remove"),
    headerText: t("InitialReport:removeApproachConfirmHeader"),
    text: t("InitialReport:removeApproachConfirmText"),
    type: "danger",
    icon: <Trash />,
    hideRemarks: true,
  };

  const submitButton = (
    <Button
      type="primary"
      icon={<CheckCircleOutlined />}
      disabled={(isSubmitted && !canSubmitAmendment) || approaches.length === 0}
      onClick={() => {
        setSubmitErrorMsg("");
        setSubmitModalOpen(true);
      }}
    >
      {t("InitialReport:submit")}
    </Button>
  );

  return (
    <RequireDnaAccess>
    <div className="initial-reports-container">
      <div className="title-bar">
        <Row justify="space-between" align="middle">
          <Col>
            <div className="body-title">
              {data.reportNumber}{" "}
              <Tag color={statusColors[data.status] || "default"}>{data.status}</Tag>
              {pending && (
                <Tag color="orange">
                  {t("InitialReport:draftPendingLabel", {
                    version: versionLabel(
                      pending.majorVersion,
                      pending.minorVersion
                    ),
                  })}
                </Tag>
              )}
            </div>
            <div className="body-sub-title">
              {t("InitialReport:initialReportForPeriod", {
                start: data.ndcStartYear ?? "—",
                end: data.ndcEndYear ?? "—",
              })}
            </div>
          </Col>
          <Col>
            {canManage && isDraft && (
              <Popconfirm
                title={
                  data.versionCount > 0
                    ? t("InitialReport:discardConfirmReopened")
                    : t("InitialReport:discardConfirmNew")
                }
                onConfirm={handleDiscard}
                okText={t("InitialReport:discard")}
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={discarding}
                  style={{ marginRight: 8 }}
                >
                  {t("InitialReport:discardDraft")}
                </Button>
              </Popconfirm>
            )}
            {canManage && (
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/initialReports/edit/${data.reportNumber}`)}
                style={{ marginRight: 8 }}
              >
                {t("InitialReport:edit")}
              </Button>
            )}
            {canManage && (
              <Tooltip
                title={
                  isSubmitted && !canSubmitAmendment
                    ? t("InitialReport:nothingToSubmitTooltip")
                    : approaches.length === 0
                    ? t("InitialReport:addApproachBeforeSubmitTooltip")
                    : undefined
                }
              >
                {submitButton}
              </Tooltip>
            )}
          </Col>
        </Row>
      </div>

      {!canManage && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t("InitialReport:readOnlyNotice")}
        />
      )}

      {canManage && isSubmitted && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t("InitialReport:submittedReportNotice", {
            major: data.majorVersion,
            minor: data.minorVersion,
            nextMajor: reopenedVersion.majorVersion,
            nextMinor: reopenedVersion.minorVersion,
          })}
        />
      )}

      <div className="content-card">
        <InitialReportGeneralSections general={data} report={data} variant="full" />
      </div>

      <div className="content-card" style={{ marginTop: 16 }}>
        <div className="table-title">
          {t("InitialReport:sectionCooperativeApproaches")}
        </div>
        {canManage && (
          <Form
            form={addApproachForm}
            layout="inline"
            onFinish={handleAddApproach}
            style={{ margin: "16px 0" }}
          >
            <Form.Item
              name="cooperativeApproachId"
              rules={[
                { required: true, message: t("InitialReport:pickApproach") },
              ]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder={t(
                  "InitialReport:selectDraftApproachPlaceholder"
                )}
                style={{ width: 320 }}
                options={addApproachOptions.map((ca) => ({
                  value: ca.cooperativeApproachId,
                  label: `${ca.cooperativeApproachId} — ${ca.title}`,
                }))}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                htmlType="submit"
                loading={addingApproach}
              >
                {t("InitialReport:add")}
              </Button>
            </Form.Item>
          </Form>
        )}
        <InitialReportApproachesTable
          approaches={approaches}
          onRemove={canManage && isDraft ? openRemoveModal : undefined}
          showAuthorizedEntities
        />
      </div>

      <UserActionConfirmationModel
        t={t}
        actionInfo={removeActionInfo}
        onActionConfirmed={handleRemoveConfirmed}
        onActionCanceled={() => setRemoveModalOpen(false)}
        openModal={removeModalOpen}
        errorMsg={removeErrorMsg}
        loading={removing}
      />

      <UserActionConfirmationModel
        t={t}
        actionInfo={submitActionInfo}
        onActionConfirmed={handleSubmit}
        onActionCanceled={() => setSubmitModalOpen(false)}
        openModal={submitModalOpen}
        errorMsg={submitErrorMsg}
        loading={submitting}
      />
    </div>
    </RequireDnaAccess>
  );
};

export default InitialReportDraft;
