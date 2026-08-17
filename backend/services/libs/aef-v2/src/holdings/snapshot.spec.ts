import { fixedClock } from '../clock';
import { toRows } from '../export/rows';
import { AefSubmissionDefaults } from '../submission/bootstrap';
import { AefT4HoldingsCreateInput } from '../tables/aefT4Holdings';
import { InMemoryAefStore } from '../testing/in-memory-store';
import {
  HoldingsProvider,
  HoldingsSnapshotError,
  getCurrentYearHoldings,
  getHoldingsForYear,
  snapshotHoldingsForYear,
} from './snapshot';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));
const newStore = () => new InMemoryAefStore(undefined, clock);

function holdingRow(first: number, last: number): AefT4HoldingsCreateInput {
  return {
    aefT4HoldingsCooperativeApproachId: 'CA0004',
    aefT4HoldingsAuthorizationId: 'VUT0001',
    aefT4HoldingsFirstTransferringPartyId: 'VUT',
    aefT4HoldingsPartyItmoRegistryId: 'VUT01',
    aefT4HoldingsItmoFirstId: first,
    aefT4HoldingsItmoLastId: last,
    aefT4HoldingsMetric: 'GHG',
    aefT4HoldingsQuantityTCo2: last - first + 1,
    aefT4HoldingsMitigationType: 'Emission reductions',
    aefT4HoldingsVintageYear: 2024,
  };
}

/** Records the `asOf` it was asked for, and can be told to change its answer. */
function stubProvider(rows: AefT4HoldingsCreateInput[] = [holdingRow(401, 600)]) {
  const calls: { reportedYear: number; asOf: Date }[] = [];
  let current = rows;

  const provider: HoldingsProvider = {
    getHoldings: async (params) => {
      calls.push(params);
      return current;
    },
  };

  return {
    provider,
    calls,
    setRows: (next: AefT4HoldingsCreateInput[]) => {
      current = next;
    },
  };
}

describe('snapshotHoldingsForYear', () => {
  /** Timing is the registry's: the library takes the instant it is given. */
  it('passes an explicit asOf straight through to the provider', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();
    const asOf = new Date('2025-12-31T23:59:59.999Z');

    await snapshotHoldingsForYear(store, provider, defaults, 2025, { asOf }, clock);

    expect(calls[0].asOf.toISOString()).toBe('2025-12-31T23:59:59.999Z');
    expect(calls[0].reportedYear).toBe(2025);
  });

  it('defaults asOf to now when the caller gives none', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();

    await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);

    expect(calls[0].asOf.toISOString()).toBe('2026-03-01T12:00:00.000Z');
  });

  /**
   * `endOfYearUtc` is a helper for callers, not something the library applies —
   * a registry wanting the year-end boundary asks for it.
   */
  it('does not impose a year-end boundary of its own', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();

    await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);

    expect(calls[0].asOf.toISOString()).not.toBe('2025-12-31T23:59:59.999Z');
  });

  it('links every row to the year’s submission', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);
    const submission = store.all('t1Submission')[0];

    const linked = await store.find('t4Holdings', {
      where: { aefT1SubmissionId: submission.id },
    });
    expect(linked.total).toBe(result.rows.length);
    expect(result.rows.every((row) => row.aefT1SubmissionId === submission.id)).toBe(true);
  });

  it('stamps snapshotAt', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const { rows } = await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);
    expect(rows[0].snapshotAt).toBe('2026-03-01T12:00:00.000Z');
  });

  /**
   * The regression that matters most here. Recomputing after credits have moved
   * would silently rewrite a figure that may already have been filed with CARP,
   * and nothing would look broken.
   */
  it('returns the original rows on a second run, even when the provider now disagrees', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([holdingRow(401, 600)]);

    const first = await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);
    setRows([holdingRow(1, 50)]);
    const second = await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);

    expect(second.created).toBe(false);
    expect(second.rows).toHaveLength(first.rows.length);
    expect(second.rows[0].aefT4HoldingsItmoFirstId).toBe(401);
  });

  it('overwrites when forced', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([holdingRow(401, 600)]);

    await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);
    setRows([holdingRow(1, 50)]);
    const forced = await snapshotHoldingsForYear(
      store,
      provider,
      defaults,
      2025,
      { force: true },
      clock,
    );

    expect(forced.created).toBe(true);
    expect(forced.rows).toHaveLength(1);
    expect(forced.rows[0].aefT4HoldingsItmoFirstId).toBe(1);
    expect(store.all('t4Holdings')).toHaveLength(1);
  });

  /**
   * The careless path: a mid-year run that never said which instant it wanted,
   * freezing a half-year balance as though it were the year-end position.
   */
  it('refuses the still-open year when no asOf is given', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    await expect(
      snapshotHoldingsForYear(store, provider, defaults, 2026, {}, clock),
    ).rejects.toThrow(HoldingsSnapshotError);
  });

  /**
   * Without this exemption a 31 December cron could never snapshot its own
   * year — passing an instant is a statement of intent.
   */
  it('allows the open year when an explicit asOf is given', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await snapshotHoldingsForYear(
      store,
      provider,
      defaults,
      2026,
      { asOf: new Date('2026-12-31T23:59:59.999Z') },
      clock,
    );

    expect(result.created).toBe(true);
  });

  it('allows the open year when forced', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await snapshotHoldingsForYear(
      store,
      provider,
      defaults,
      2026,
      { force: true },
      clock,
    );
    expect(result.created).toBe(true);
  });
});

describe('getCurrentYearHoldings', () => {
  it('is live, unstored and flagged provisional', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await getCurrentYearHoldings(provider, 2026, clock);

    expect(result.provisional).toBe(true);
    expect(result.asOf.toISOString()).toBe('2026-03-01T12:00:00.000Z');
    expect(store.all('t4Holdings')).toHaveLength(0);
  });
});

describe('getHoldingsForYear', () => {
  it('returns the frozen snapshot for a closed year', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([holdingRow(401, 600)]);
    await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);
    setRows([holdingRow(1, 50)]);

    const result = await getHoldingsForYear(store, provider, defaults, 2025, clock);

    expect(result.provisional).toBe(false);
    expect(result.snapshotAt).toBe('2026-03-01T12:00:00.000Z');
    expect(result.rows[0].aefT4HoldingsItmoFirstId).toBe(401);
  });

  it('computes live for a year with no snapshot', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await getHoldingsForYear(store, provider, defaults, 2026, clock);

    expect(result.provisional).toBe(true);
    expect(result.snapshotAt).toBeUndefined();
  });

  it('returns nothing for a past year with no Submission at all, rather than falling back to live', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();

    // clock is fixed at 2026-03-01 — 2024 is a genuinely past, never-tracked
    // year (distinct from the "frozen snapshot for a closed year" case
    // above, which explicitly snapshots 2025 first).
    const result = await getHoldingsForYear(store, provider, defaults, 2024, clock);

    expect(result.rows).toEqual([]);
    expect(result.provisional).toBe(false);
    expect(result.snapshotAt).toBeUndefined();
    // The live provider must not be asked at all — it has no concept of
    // "as of 2024", only "as of now", so calling it here would silently
    // mislabel today's figures as 2024's.
    expect(calls).toHaveLength(0);
  });
});

describe('export exclusion', () => {
  it('never emits snapshotAt or the relationship columns', async () => {
    const store = newStore();
    const { provider } = stubProvider();
    const { rows } = await snapshotHoldingsForYear(store, provider, defaults, 2025, {}, clock);

    const projection = toRows('t4Holdings', rows as unknown as Record<string, unknown>[]);

    // Library metadata and relationships are excluded because export is driven
    // by AEF_FIELD_SPECS, which holds only CMA.6 fields — no filter to remember.
    expect(projection.headers).not.toContain('snapshotAt');
    expect(projection.headers).not.toContain('aefT1SubmissionId');
    expect(projection.headers).not.toContain('projectId');
    expect(projection.headers).toHaveLength(16);
  });
});
