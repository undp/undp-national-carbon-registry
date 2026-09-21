import { fixedClock } from '../clock';
import { AEF_FIELD_SPECS } from '../spec/field-spec';
import { AefSubmissionStatus } from '../tables/aefT1Submission';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { toRows } from '../export/rows';
import {
  AefSubmissionDefaults,
  InvalidSubmissionDefaultsError,
  InvalidSubmissionYearError,
  buildSubmission,
  defaultReportedYear,
  ensureSubmissionForYear,
  formatSubmissionDate,
  markSubmitted,
  nextSubmissionVersion,
  reviseSubmission,
} from './bootstrap';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

/** Fixed so "previous calendar year" and the future-year guard are deterministic. */
const clock = fixedClock(new Date('2026-03-01T00:00:00.000Z'));

const newStore = () => new InMemoryAefStore(undefined, clock);

describe('buildSubmission', () => {
  it('populates exactly the five knowable fields', () => {
    expect(buildSubmission(defaults, 2025)).toEqual({
      aefT1SubmissionParty: 'VUT',
      aefT1SubmissionVersion: '1.0',
      aefT1SubmissionReportYear: 2025,
      aefT1SubmissionNdcFirstYear: 2021,
      aefT1SubmissionNdcLastYear: 2030,
    });
  });

  /**
   * Required by the nomenclature, but not knowable until the AEF is filed.
   * `markSubmitted` sets it; `validateSubmission` raises it at filing time.
   */
  it('leaves the submission date unset', () => {
    expect(buildSubmission(defaults, 2025).aefT1SubmissionSubmissionDate).toBeUndefined();
  });

  it('leaves every CARP-populated field unset', () => {
    const built = buildSubmission(defaults, 2025) as Record<string, unknown>;
    for (const spec of AEF_FIELD_SPECS.t1Submission.filter((s) => s.carpPopulated)) {
      expect(built[spec.key]).toBeUndefined();
    }
  });

  it('rejects an inverted NDC period', () => {
    expect(() =>
      buildSubmission(
        { ...defaults, aefT1SubmissionNdcFirstYear: 2030, aefT1SubmissionNdcLastYear: 2021 },
        2025,
      ),
    ).toThrow(InvalidSubmissionDefaultsError);
  });

  it('rejects a malformed version', () => {
    expect(() => buildSubmission(defaults, 2025, '0.1')).toThrow(InvalidSubmissionDefaultsError);
  });
});

describe('defaultReportedYear', () => {
  /** Annual information is due 15 April for the prior year. */
  it('is the previous calendar year', () => {
    expect(defaultReportedYear(clock)).toBe(2025);
  });
});

describe('ensureSubmissionForYear', () => {
  it('creates on first call and returns the same row on the second', async () => {
    const store = newStore();

    const first = await ensureSubmissionForYear(store, defaults, 2025, clock);
    const second = await ensureSubmissionForYear(store, defaults, 2025, clock);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.record.id).toBe(first.record.id);
    expect(store.all('t1Submission')).toHaveLength(1);
  });

  it('defaults to the previous calendar year', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, undefined, clock);
    expect(record.aefT1SubmissionReportYear).toBe(2025);
  });

  it('starts life as a draft', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, 2025, clock);
    expect(record.status).toBe(AefSubmissionStatus.DRAFT);
  });

  it('refuses a future year', async () => {
    const store = newStore();
    await expect(ensureSubmissionForYear(store, defaults, 2027, clock)).rejects.toThrow(
      InvalidSubmissionYearError,
    );
  });

  it('refuses a year outside 1900-2100', async () => {
    const store = newStore();
    await expect(ensureSubmissionForYear(store, defaults, 1899, clock)).rejects.toThrow(
      InvalidSubmissionYearError,
    );
  });

  it('keeps parties separate', async () => {
    const store = newStore();
    await ensureSubmissionForYear(store, defaults, 2025, clock);
    const other = await ensureSubmissionForYear(
      store,
      { ...defaults, aefT1SubmissionParty: 'CHE' },
      2025,
      clock,
    );
    expect(other.created).toBe(true);
    expect(store.all('t1Submission')).toHaveLength(2);
  });
});

describe('nextSubmissionVersion', () => {
  it('bumps the minor part', () => {
    expect(nextSubmissionVersion('1.0', 'minor')).toBe('1.1');
  });

  /** The minor part is an integer, not a decimal digit. */
  it('bumps 1.9 to 1.10, not 2.0', () => {
    expect(nextSubmissionVersion('1.9', 'minor')).toBe('1.10');
  });

  it('bumps the major part and resets the minor', () => {
    expect(nextSubmissionVersion('1.7', 'major')).toBe('2.0');
  });

  it('rejects a malformed version', () => {
    expect(() => nextSubmissionVersion('1', 'minor')).toThrow(InvalidSubmissionDefaultsError);
  });
});

describe('status transitions', () => {
  it('markSubmitted sets both the status and the submission date', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, 2025, clock);

    const submitted = await markSubmitted(store, record.id, new Date('2026-04-14T09:00:00.000Z'));

    expect(submitted.status).toBe(AefSubmissionStatus.SUBMITTED);
    expect(submitted.aefT1SubmissionSubmissionDate).toBe('14/04/2026');
  });

  it('formats the submission date as dd/mm/yyyy in UTC', () => {
    expect(formatSubmissionDate(new Date('2026-04-05T23:30:00.000Z'))).toBe('05/04/2026');
  });

  it('reviseSubmission supersedes the old row and drafts the next version', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, 2025, clock);
    await markSubmitted(store, record.id, new Date('2026-04-14T09:00:00.000Z'));

    const { superseded, draft } = await reviseSubmission(store, record.id, 'minor');

    expect(superseded.status).toBe(AefSubmissionStatus.SUPERSEDED);
    expect(draft.status).toBe(AefSubmissionStatus.DRAFT);
    expect(draft.aefT1SubmissionVersion).toBe('1.1');
  });

  /**
   * The interaction most likely to go wrong: a revision must not make the
   * bootstrap create a third row, nor resurrect the superseded one.
   */
  it('ensureSubmissionForYear after a revision returns the new draft', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, 2025, clock);
    const { draft } = await reviseSubmission(store, record.id, 'minor');

    const again = await ensureSubmissionForYear(store, defaults, 2025, clock);

    expect(again.created).toBe(false);
    expect(again.record.id).toBe(draft.id);
    expect(store.all('t1Submission')).toHaveLength(2);
  });
});

describe('export exclusion', () => {
  it('never emits status in a CSV/XLSX projection', async () => {
    const store = newStore();
    const { record } = await ensureSubmissionForYear(store, defaults, 2025, clock);

    const { headers, rows } = toRows('t1Submission', [record as unknown as Record<string, unknown>]);

    // Library metadata is excluded because export is driven by the field spec,
    // which contains only AEF fields — no filter to remember.
    expect(headers).not.toContain('status');
    expect(headers).toHaveLength(AEF_FIELD_SPECS.t1Submission.length);
    expect(rows[0]).toHaveLength(AEF_FIELD_SPECS.t1Submission.length);
  });
});
