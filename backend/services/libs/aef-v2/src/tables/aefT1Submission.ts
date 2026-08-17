import { AefCreateInput, AefRecordMeta } from './common';

/**
 * Table 1 has no outbound links. It is the root: every other table references
 * *it*, and the reporting year a Holdings or Actions row belongs to is carried
 * by its `aefT1SubmissionId`.
 */

/**
 * AEF Table 1 — Submission.
 *
 * One record per reporting year, identifying the submitting Party and the period
 * being reported. Every other table hangs off it: because CMA.6 gives Holdings
 * and Actions no reported-year column of their own, the year association runs
 * through this record via each row's `aefT1SubmissionId`.
 *
 * Field order follows `AEF_CMA6_second_iteration.csv` and is significant — it
 * drives the export column layout.
 */
export interface AefT1SubmissionData {
  /** Reporting Party. ISO 3166-1 alpha-3, plus reserved codes such as `EUE`. */
  aefT1SubmissionParty: string;
  /** `X.Y`, X a non-zero integer. The first version is always `1.0`. */
  aefT1SubmissionVersion: string;
  /** Calendar year (1 Jan – 31 Dec) during which the reported actions occurred. */
  aefT1SubmissionReportYear: number;
  /**
   * Date the AEF is submitted, `dd/mm/yyyy`.
   *
   * Required by the nomenclature but **absent until the submission is actually
   * filed** — it is not knowable when the row is bootstrapped. `markSubmitted`
   * sets it; `validateSubmission` raises it at filing time.
   */
  aefT1SubmissionSubmissionDate?: string;
  /** CARP-populated. Review status of the *initial report* — never written here. */
  aefT1SubmissionReviewStatus?: string;
  /** CARP-populated. Result of the consistency check on this AEF submission. */
  aefT1SubmissionResultCheck?: string;
  /** First year of the NDC implementation period containing the reported year. */
  aefT1SubmissionNdcFirstYear: number;
  /** Last year of the NDC implementation period containing the reported year. */
  aefT1SubmissionNdcLastYear: number;
  /** CARP-populated. Hyperlink to the Article 6 TER report of the initial report. */
  aefT1SubmissionReferenceReviewReport?: string;
}

/**
 * Local workflow state. **Not an AEF field** — neither CMA.6 nor CAD Trust has
 * one — so it is stored as library metadata and never exported.
 *
 * Do not confuse with `aefT1SubmissionReviewStatus`, which is CARP's verdict on
 * the initial report. The names are close; the meanings are unrelated.
 */
export enum AefSubmissionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SUPERSEDED = 'SUPERSEDED',
}

export type AefT1SubmissionCreateInput = AefCreateInput<AefT1SubmissionData> & {
  /** Library metadata. Defaults to {@link AefSubmissionStatus.DRAFT} on create. */
  status?: AefSubmissionStatus;
};

export interface AefT1SubmissionRecord extends AefT1SubmissionData, AefRecordMeta {
  /** Library metadata, excluded from export. */
  status: AefSubmissionStatus;
}
