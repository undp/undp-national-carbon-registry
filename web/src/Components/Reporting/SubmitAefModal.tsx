import { Alert, DatePicker, Descriptions, Form, Modal } from "antd";
import { TFunction } from "i18next";
import moment, { Moment } from "moment";
import { useEffect } from "react";

import "./ReportingComponent.scss";

/**
 * Files the AEF for a reporting year.
 *
 * Two things this modal exists to get right:
 *
 * 1. **It captures the submission date.** `aefT1SubmissionSubmissionDate` is
 *    required by the Common Nomenclature but is deliberately empty until this
 *    point — it is the date the AEF is actually filed, which is not knowable
 *    when the row is bootstrapped. Submitting is where it gets set.
 *
 * 2. **It states the consequence before the click.** Submission status is
 *    advisory: nothing downstream refuses to edit a filed year, so a later edit
 *    can silently diverge from what CARP holds. Saying so here is cheaper than
 *    discovering it during a technical expert review.
 */

interface ISubmitAefModal {
  t: TFunction<string[], undefined, string[]>;
  open: boolean;
  submission?: Record<string, unknown>;
  onCancel: () => void;
  onConfirm: (submissionDate: Moment) => void;
  confirming?: boolean;
  /**
   * `submitAefReport` refuses to file a year with outstanding
   * `validateSubmission` issues — it returns them rather than mutating
   * anything. Surfaced here so a blocked submission is legible rather than
   * silently doing nothing.
   */
  issues?: string[];
}

const SubmitAefModal = ({
  t,
  open,
  submission,
  onCancel,
  onConfirm,
  confirming,
  issues,
}: ISubmitAefModal) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue({ submissionDate: moment() });
    }
  }, [open, form]);

  if (!submission) {
    return null;
  }

  const reportedYear = Number(submission.aefT1SubmissionReportYear);

  /**
   * Annual information is due by 15 April for the prior calendar year. Shown
   * rather than enforced — a late submission is still a submission, and
   * blocking it here would only push the problem somewhere less visible.
   */
  const deadline = moment(`${reportedYear + 1}-04-15`, "YYYY-MM-DD");
  const isLate = moment().isAfter(deadline, "day");

  return (
    <Modal
      open={open}
      title={t("reporting:submitAefTitle")}
      okText={t("reporting:submitAefConfirm")}
      cancelText={t("reporting:cancel")}
      confirmLoading={confirming}
      onCancel={onCancel}
      onOk={() => {
        form.validateFields().then(({ submissionDate }) => onConfirm(submissionDate));
      }}
      destroyOnClose
    >
      <Descriptions column={1} size="small" bordered className="submit-modal-summary">
        <Descriptions.Item label={t("reporting:party")}>
          {String(submission.aefT1SubmissionParty ?? "-")}
        </Descriptions.Item>
        <Descriptions.Item label={t("reporting:reportedYear")}>{reportedYear}</Descriptions.Item>
        <Descriptions.Item label={t("reporting:submissionVersion")}>
          {String(submission.aefT1SubmissionVersion ?? "-")}
        </Descriptions.Item>
      </Descriptions>

      {isLate && (
        <Alert
          type="warning"
          showIcon
          className="submit-modal-alert"
          message={t("reporting:submitAefLate", { date: deadline.format("D MMMM YYYY") })}
        />
      )}

      {issues && issues.length > 0 && (
        <Alert
          type="error"
          showIcon
          className="submit-modal-alert"
          message={t("reporting:submitAefBlocked")}
          description={
            <ul className="submit-modal-issues">
              {issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          }
        />
      )}

      <Form form={form} layout="vertical" className="submit-modal-form">
        <Form.Item
          name="submissionDate"
          label={t("reporting:dateOfSubmission")}
          rules={[{ required: true, message: t("reporting:dateOfSubmissionRequired") }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            // A submission cannot be filed in the future.
            disabledDate={(current) => current && current.isAfter(moment(), "day")}
          />
        </Form.Item>
      </Form>

      <Alert type="info" showIcon message={t("reporting:submitAefAdvisory")} />
    </Modal>
  );
};

export default SubmitAefModal;
