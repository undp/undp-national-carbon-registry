import { Clock, currentYear, systemClock } from '../clock';
import {
  AefExportFormat,
  AefExportRenderers,
  AefExportResult,
  renderWholeSubmissionExport,
} from '../export/operation';
import { carpPopulatedFields } from '../spec/field-spec';
import { AefT1SubmissionData, AefT1SubmissionRecord, AefSubmissionStatus } from '../tables/aefT1Submission';
import { AefValidationIssue } from '../validation/issues';
import { validateSubmission } from '../validation/validate';
import { AefSubmissionDefaults, formatSubmissionDate } from './bootstrap';
import {
  AefBundleDeps,
  AefLoadedBundle,
  loadSubmissionBundle,
  toAefSubmissionExport,
  toValidationBundle,
} from './bundle';

export class NoSubmissionForYearError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoSubmissionForYearError';
  }
}

export class SubmissionYearNotClosedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionYearNotClosedError';
  }
}

/** A `patch` tried to write a field CARP is the only legitimate source for. */
export class CarpPopulatedPatchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarpPopulatedPatchError';
  }
}

/**
 * Delivers a rendered export to CARP, or wherever a deployment files its AEF.
 *
 * Optional, exactly like `RefResolver` — a submission with no transport
 * configured is filed locally only, and `submitAefReport` still completes.
 * The library performs no HTTP itself, consistent with the four-port rule.
 */
export interface AefSubmissionTransport {
  submit(payload: { bundle: AefLoadedBundle; file: AefExportResult }): Promise<{ reference?: string }>;
}

export interface SubmitFileOptions extends AefExportRenderers {
  /** Format handed to the transport. Defaults to `csv`, which needs no renderer. */
  format?: AefExportFormat;
}

export interface SubmitOptions {
  /** When the AEF was filed. Defaults to now. */
  submissionDate?: Date;
  /**
   * Additional registry-writable Table 1 fields to set at the same time.
   *
   * Never the three CARP-populated fields
   * (`aefT1SubmissionReviewStatus`/`ResultCheck`/`ReferenceReviewReport`) —
   * including one of those throws {@link CarpPopulatedPatchError} rather than
   * silently dropping it.
   */
  patch?: Partial<AefT1SubmissionData>;
  transport?: AefSubmissionTransport;
  /** Format/renderers for the file handed to `transport`. Ignored without one. */
  file?: SubmitFileOptions;
  /** Skips `validateSubmission`. For tooling and tests, not routine use. */
  skipValidation?: boolean;
  /** Waives the "year is not over" guard — see `SnapshotOptions.force`. */
  force?: boolean;
}

export interface SubmitResult {
  record: AefT1SubmissionRecord;
  issues: AefValidationIssue[];
  /** False whenever `issues` is non-empty — nothing was mutated. */
  submitted: boolean;
  transportReference?: string;
}

/**
 * Requirement 5: files a completed year's AEF.
 *
 * 1. Refuses a year that has not ended, unless `force` — the same reasoning
 *    as `snapshotHoldingsForYear`'s open-year guard: filing a partial year as
 *    though it were final is the failure mode worth blocking by default.
 * 2. Loads the bundle and validates it. On any issue, returns them **without
 *    mutating anything** — the caller gets the full list, exactly as
 *    `validateSubmission` always returns everything rather than the first
 *    problem.
 * 3. Validation is run against a *candidate* record with `submissionDate` and
 *    `patch` already applied, not the stored one — `aefT1SubmissionSubmissionDate`
 *    is spec-required but is never set before this point, so validating the
 *    stored record would always fail on the one field this function exists to
 *    fill in.
 * 4. Sets the submission date, applies `patch`, and flips status to
 *    `SUBMITTED` in one update.
 * 5. If `transport` is supplied, renders the export and hands it off. Local-
 *    only filing (no transport) is the default.
 */
export async function submitAefReport(
  deps: AefBundleDeps,
  defaults: AefSubmissionDefaults,
  year: number,
  options: SubmitOptions = {},
  clock: Clock = systemClock,
): Promise<SubmitResult> {
  if (year >= currentYear(clock) && !options.force) {
    throw new SubmissionYearNotClosedError(
      `Refusing to submit ${year}: the year is not over, so this would file a partial year as ` +
        `though it were final. Pass force to override.`,
    );
  }

  if (options.patch) {
    const carpKeys = new Set(carpPopulatedFields('t1Submission').map((spec) => spec.key));
    for (const key of Object.keys(options.patch)) {
      if (carpKeys.has(key)) {
        throw new CarpPopulatedPatchError(
          `"${key}" is populated by CARP and must not be written by the registry`,
        );
      }
    }
  }

  const bundle = await loadSubmissionBundle(deps, defaults, year, clock);
  if (!bundle.submission) {
    throw new NoSubmissionForYearError(
      `No Submission exists for ${defaults.aefT1SubmissionParty} ${year}; nothing to submit`,
    );
  }

  const submissionDate = options.submissionDate ?? clock.now();
  const candidate: AefT1SubmissionRecord = {
    ...bundle.submission,
    ...options.patch,
    aefT1SubmissionSubmissionDate: formatSubmissionDate(submissionDate),
  };

  if (!options.skipValidation) {
    const issues = validateSubmission(toValidationBundle({ ...bundle, submission: candidate }));
    if (issues.length > 0) {
      return { record: bundle.submission, issues, submitted: false };
    }
  }

  const record = await deps.store.update('t1Submission', bundle.submission.id, {
    ...options.patch,
    aefT1SubmissionSubmissionDate: candidate.aefT1SubmissionSubmissionDate,
    status: AefSubmissionStatus.SUBMITTED,
  });

  let transportReference: string | undefined;
  if (options.transport) {
    const submittedBundle: AefLoadedBundle = { ...bundle, submission: record };
    const format = options.file?.format ?? 'csv';
    const exportData = toAefSubmissionExport(submittedBundle);
    const file = await renderWholeSubmissionExport(exportData, year, format, options.file);
    const result = await options.transport.submit({ bundle: submittedBundle, file });
    transportReference = result.reference;
  }

  return { record, issues: [], submitted: true, transportReference };
}
