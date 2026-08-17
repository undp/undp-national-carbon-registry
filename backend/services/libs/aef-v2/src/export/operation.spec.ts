import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import { fixedClock } from '../clock';
import { HoldingsProvider } from '../holdings/snapshot';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { AefBundleDeps } from '../submission/bundle';
import { AefSubmissionDefaults, ensureSubmissionForYear } from '../submission/bootstrap';
import { MissingExportRendererError, exportSubmission } from './operation';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));

function deps(store: InMemoryAefStore): AefBundleDeps {
  const holdings: HoldingsProvider = { getHoldings: async () => [] };
  const authorizedEntities: AuthorizedEntitiesProvider = { getAuthorizedEntities: async () => [] };
  return { store, holdings, authorizedEntities };
}

describe('exportSubmission', () => {
  it('renders the whole submission as CSV with no renderer required', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    const result = await exportSubmission(deps(store), defaults, 2020, { format: 'csv' }, {}, clock);

    expect(result.fileName).toBe('aef-report-VUT-2020.csv');
    expect(result.contentType).toBe('text/csv');
    expect(typeof result.content).toBe('string');
    expect(result.content as string).toContain('Table 1: Submission');
  });

  it('renders a single table as CSV', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    const result = await exportSubmission(
      deps(store),
      defaults,
      2020,
      { format: 'csv', table: 't1Submission' },
      {},
      clock,
    );

    expect(result.fileName).toBe('aef-v2-t1Submission-2020.csv');
  });

  it('throws rather than silently falling back to CSV when xlsx has no renderer', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    await expect(
      exportSubmission(deps(store), defaults, 2020, { format: 'xlsx' }, {}, clock),
    ).rejects.toThrow(MissingExportRendererError);
  });

  it('uses the injected xlsx renderer when supplied', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);
    const fakeBuffer = Buffer.from('fake-workbook');

    const result = await exportSubmission(
      deps(store),
      defaults,
      2020,
      { format: 'xlsx' },
      { xlsxSubmission: async () => fakeBuffer },
      clock,
    );

    expect(result.content).toBe(fakeBuffer);
    expect(result.fileName).toBe('aef-report-VUT-2020.xlsx');
    expect(result.contentType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });
});
