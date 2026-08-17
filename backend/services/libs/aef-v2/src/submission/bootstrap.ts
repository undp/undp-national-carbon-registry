import { Clock, currentYear, systemClock } from '../clock';
import { SUBMISSION_VERSION_PATTERN } from '../controlled-values/nomenclature';
import { AefStore } from '../store/aef-store.port';
import {
  AefSubmissionStatus,
  AefT1SubmissionCreateInput,
  AefT1SubmissionRecord,
} from '../tables/aefT1Submission';

/**
 * Per-registry configuration. Stable across reporting years.
 *
 * The Party code is the same value a UI needs for the report header, so define
 * it once and pass it in rather than duplicating it.
 */
export interface AefSubmissionDefaults {
  /** ISO 3166-1 alpha-3, e.g. `VUT`. */
  aefT1SubmissionParty: string;
  aefT1SubmissionNdcFirstYear: number;
  aefT1SubmissionNdcLastYear: number;
}

/** Common Nomenclature Table 2: the first version is always `1.0`. */
export const INITIAL_SUBMISSION_VERSION = '1.0';

/** Bound CAD Trust places on `aefT1SubmissionReportYear`. */
const MIN_REPORT_YEAR = 1900;
const MAX_REPORT_YEAR = 2100;

export class InvalidSubmissionYearError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSubmissionYearError';
  }
}

export class InvalidSubmissionDefaultsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSubmissionDefaultsError';
  }
}

function assertDefaults(defaults: AefSubmissionDefaults): void {
  if (defaults.aefT1SubmissionNdcFirstYear > defaults.aefT1SubmissionNdcLastYear) {
    throw new InvalidSubmissionDefaultsError(
      `NDC period is inverted: first year ${defaults.aefT1SubmissionNdcFirstYear} is after last ` +
        `year ${defaults.aefT1SubmissionNdcLastYear}`,
    );
  }
}

function assertReportYear(year: number, clock: Clock): void {
  if (!Number.isInteger(year)) {
    throw new InvalidSubmissionYearError(`Reported year must be an integer, got ${year}`);
  }
  if (year < MIN_REPORT_YEAR || year > MAX_REPORT_YEAR) {
    throw new InvalidSubmissionYearError(
      `Reported year ${year} is outside the permitted range ${MIN_REPORT_YEAR}–${MAX_REPORT_YEAR}`,
    );
  }
  if (year > currentYear(clock)) {
    throw new InvalidSubmissionYearError(
      `Reported year ${year} is in the future; annual information covers a completed calendar year`,
    );
  }
}

/**
 * The reporting year a bootstrap defaults to.
 *
 * Annual information is due by 15 April for the **prior** calendar year, so a
 * job firing in Q1 wants last year. Callers can always pass a year explicitly.
 */
export function defaultReportedYear(clock: Clock = systemClock): number {
  return currentYear(clock) - 1;
}

/**
 * Builds the Submission row. Pure — no I/O, no store.
 *
 * Populates the five fields that are knowable up front and leaves everything
 * else unset, including:
 *
 *  - `aefT1SubmissionSubmissionDate`, which is not known until the AEF is
 *    actually filed. {@link markSubmitted} sets it.
 *  - the three CARP-populated fields, which the registry must never write.
 */
export function buildSubmission(
  defaults: AefSubmissionDefaults,
  reportedYear: number,
  version: string = INITIAL_SUBMISSION_VERSION,
): AefT1SubmissionCreateInput {
  assertDefaults(defaults);
  if (!SUBMISSION_VERSION_PATTERN.test(version)) {
    throw new InvalidSubmissionDefaultsError(
      `Submission version "${version}" must match X.Y with a non-zero major`,
    );
  }

  return {
    aefT1SubmissionParty: defaults.aefT1SubmissionParty,
    aefT1SubmissionVersion: version,
    aefT1SubmissionReportYear: reportedYear,
    aefT1SubmissionNdcFirstYear: defaults.aefT1SubmissionNdcFirstYear,
    aefT1SubmissionNdcLastYear: defaults.aefT1SubmissionNdcLastYear,
  };
}

export interface EnsureSubmissionResult {
  record: AefT1SubmissionRecord;
  /** False when an existing row was returned untouched. */
  created: boolean;
}

/**
 * Returns the current Submission for a year, creating it if there is none.
 *
 * **Idempotent by design.** A cron retries and a button gets double-clicked;
 * both land here. Backed by a unique constraint on
 * `(party, reportYear, version)` so a race between the two cannot produce a
 * duplicate.
 *
 * "Current" means the latest row for that year that is not `SUPERSEDED` — a
 * revision creates a new version rather than editing in place, so this must not
 * treat a superseded row as the live one, nor create a third row alongside a
 * revision.
 *
 * The trigger is deliberately not here: whether this is called by a scheduled
 * job or an operator button is the registry's decision.
 */
export async function ensureSubmissionForYear(
  store: AefStore,
  defaults: AefSubmissionDefaults,
  reportedYear?: number,
  clock: Clock = systemClock,
): Promise<EnsureSubmissionResult> {
  assertDefaults(defaults);
  const year = reportedYear ?? defaultReportedYear(clock);
  assertReportYear(year, clock);

  const existing = await findCurrentSubmission(store, defaults.aefT1SubmissionParty, year);
  if (existing) {
    return { record: existing, created: false };
  }

  const record = await store.create('t1Submission', buildSubmission(defaults, year));
  return { record, created: true };
}

/** Latest non-superseded Submission for a party and year, if any. */
export async function findCurrentSubmission(
  store: AefStore,
  party: string,
  reportedYear: number,
): Promise<AefT1SubmissionRecord | undefined> {
  const page = await store.find('t1Submission', {
    where: {
      aefT1SubmissionParty: party,
      aefT1SubmissionReportYear: reportedYear,
    },
    pageSize: 1000,
  });

  const live = page.data.filter((record) => record.status !== AefSubmissionStatus.SUPERSEDED);
  if (live.length === 0) {
    return undefined;
  }

  return live.sort((a, b) => compareVersions(b.aefT1SubmissionVersion, a.aefT1SubmissionVersion))[0];
}

/** All Submissions for a party and year, newest version first. */
export async function findSubmissionVersions(
  store: AefStore,
  party: string,
  reportedYear: number,
): Promise<AefT1SubmissionRecord[]> {
  const page = await store.find('t1Submission', {
    where: {
      aefT1SubmissionParty: party,
      aefT1SubmissionReportYear: reportedYear,
    },
    pageSize: 1000,
  });

  return [...page.data].sort((a, b) =>
    compareVersions(b.aefT1SubmissionVersion, a.aefT1SubmissionVersion),
  );
}

/**
 * `1.0` → `1.1` or `2.0`, per Common Nomenclature Table 2.
 *
 * The minor part is an integer, not a decimal digit: `1.9` bumps to `1.10`.
 */
export function nextSubmissionVersion(current: string, bump: 'major' | 'minor'): string {
  if (!SUBMISSION_VERSION_PATTERN.test(current)) {
    throw new InvalidSubmissionDefaultsError(
      `Submission version "${current}" must match X.Y with a non-zero major`,
    );
  }
  const [major, minor] = current.split('.').map((part) => Number.parseInt(part, 10));
  return bump === 'major' ? `${major + 1}.0` : `${major}.${minor + 1}`;
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor] = a.split('.').map((part) => Number.parseInt(part, 10) || 0);
  const [bMajor, bMinor] = b.split('.').map((part) => Number.parseInt(part, 10) || 0);
  return aMajor === bMajor ? aMinor - bMinor : aMajor - bMajor;
}

/**
 * Records that the AEF has been filed, setting the submission date at the same
 * time — that date is not knowable before this point, which is why the bootstrap
 * leaves it empty.
 *
 * Status is **advisory**: nothing downstream refuses to edit a submitted year.
 * That keeps corrections unconstrained, at the cost that a filed year can drift
 * from what CARP holds.
 */
export async function markSubmitted(
  store: AefStore,
  id: string,
  submissionDate: Date,
): Promise<AefT1SubmissionRecord> {
  return store.update('t1Submission', id, {
    aefT1SubmissionSubmissionDate: formatSubmissionDate(submissionDate),
    status: AefSubmissionStatus.SUBMITTED,
  });
}

export async function markUnderReview(store: AefStore, id: string): Promise<AefT1SubmissionRecord> {
  return store.update('t1Submission', id, {
    status: AefSubmissionStatus.UNDER_REVIEW,
  });
}

export interface ReviseSubmissionResult {
  superseded: AefT1SubmissionRecord;
  draft: AefT1SubmissionRecord;
}

/**
 * Opens a revision: the existing row becomes `SUPERSEDED` and a new `DRAFT` is
 * created at the next version.
 *
 * Records filed under the earlier version keep pointing at it, so a reader must
 * resolve holdings across every version for the year rather than only the
 * newest. {@link findSubmissionVersions} is there for that.
 */
export async function reviseSubmission(
  store: AefStore,
  id: string,
  bump: 'major' | 'minor' = 'minor',
): Promise<ReviseSubmissionResult> {
  const current = await store.findById('t1Submission', id);
  if (!current) {
    throw new InvalidSubmissionDefaultsError(`No submission with id "${id}"`);
  }

  const draft = await store.create('t1Submission', {
    aefT1SubmissionParty: current.aefT1SubmissionParty,
    aefT1SubmissionVersion: nextSubmissionVersion(current.aefT1SubmissionVersion, bump),
    aefT1SubmissionReportYear: current.aefT1SubmissionReportYear,
    aefT1SubmissionNdcFirstYear: current.aefT1SubmissionNdcFirstYear,
    aefT1SubmissionNdcLastYear: current.aefT1SubmissionNdcLastYear,
  });

  const superseded = await store.update('t1Submission', id, {
    status: AefSubmissionStatus.SUPERSEDED,
  });

  return { superseded, draft };
}

/** `dd/mm/yyyy`, per Common Nomenclature Table 4. UTC, like every other date here. */
export function formatSubmissionDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}
