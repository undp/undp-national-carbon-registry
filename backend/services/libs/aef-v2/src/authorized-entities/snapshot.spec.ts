import { fixedClock } from '../clock';
import { toRows } from '../export/rows';
import { AefSubmissionDefaults, ensureSubmissionForYear } from '../submission/bootstrap';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { AefT5AuthorizedEntitiesCreateInput } from '../tables/aefT5AuthorizedEntities';
import { AuthorizedEntitiesProvider } from './provider';
import {
  AuthorizedEntitiesSnapshotError,
  getAuthorizedEntitiesForYear,
  getCurrentYearAuthorizedEntities,
  snapshotAuthorizedEntitiesForYear,
} from './snapshot';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));
const newStore = () => new InMemoryAefStore(undefined, clock);

function entityRow(name: string): AefT5AuthorizedEntitiesCreateInput {
  return {
    aefT5AuthorizedEntitiesAuthorizationDate: '01/03/2024',
    aefT5AuthorizedEntitiesName: name,
    aefT5AuthorizedEntitiesIncorporationCountry: 'VUT',
    aefT5AuthorizedEntitiesId: 'ENT-001',
    aefT5AuthorizedEntitiesCooperativeApproachId: 'CA0004',
  };
}

function stubProvider(rows: AefT5AuthorizedEntitiesCreateInput[] = [entityRow('Alpine Carbon Markets')]) {
  const calls: { reportedYear: number; asOf: Date }[] = [];
  let current = rows;

  const provider: AuthorizedEntitiesProvider = {
    getAuthorizedEntities: async (params) => {
      calls.push(params);
      return current;
    },
  };

  return {
    provider,
    calls,
    setRows: (next: AefT5AuthorizedEntitiesCreateInput[]) => {
      current = next;
    },
  };
}

describe('snapshotAuthorizedEntitiesForYear', () => {
  it('passes an explicit asOf straight through to the provider', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();
    const asOf = new Date('2025-12-31T23:59:59.999Z');

    await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, { asOf }, clock);

    expect(calls[0].asOf.toISOString()).toBe('2025-12-31T23:59:59.999Z');
    expect(calls[0].reportedYear).toBe(2025);
  });

  it('links every row to the year’s submission', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);
    const submission = store.all('t1Submission')[0];

    const linked = await store.find('t5AuthorizedEntities', {
      where: { aefT1SubmissionId: submission.id },
    });
    expect(linked.total).toBe(result.rows.length);
    expect(result.rows.every((row) => row.aefT1SubmissionId === submission.id)).toBe(true);
  });

  it('stamps snapshotAt', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const { rows } = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);
    expect(rows[0].snapshotAt).toBe('2026-03-01T12:00:00.000Z');
  });

  it('returns the original rows on a second run, even when the provider now disagrees', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([entityRow('Alpine Carbon Markets')]);

    const first = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);
    setRows([entityRow('Second Entity')]);
    const second = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);

    expect(second.created).toBe(false);
    expect(second.rows).toHaveLength(first.rows.length);
    expect(second.rows[0].aefT5AuthorizedEntitiesName).toBe('Alpine Carbon Markets');
  });

  it('overwrites when forced', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([entityRow('Alpine Carbon Markets')]);

    await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);
    setRows([entityRow('Second Entity')]);
    const forced = await snapshotAuthorizedEntitiesForYear(
      store,
      provider,
      defaults,
      2025,
      { force: true },
      clock,
    );

    expect(forced.created).toBe(true);
    expect(forced.rows).toHaveLength(1);
    expect(forced.rows[0].aefT5AuthorizedEntitiesName).toBe('Second Entity');
    expect(store.all('t5AuthorizedEntities')).toHaveLength(1);
  });

  it('refuses the still-open year when no asOf is given', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    await expect(
      snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2026, {}, clock),
    ).rejects.toThrow(AuthorizedEntitiesSnapshotError);
  });

  it('allows the open year when an explicit asOf is given', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await snapshotAuthorizedEntitiesForYear(
      store,
      provider,
      defaults,
      2026,
      { asOf: new Date('2026-12-31T23:59:59.999Z') },
      clock,
    );

    expect(result.created).toBe(true);
  });

  it('updates a real-time-written unfrozen row in place instead of duplicating it', async () => {
    const store = newStore();
    const { provider } = stubProvider([entityRow('Alpine Carbon Markets')]);

    // Simulate a real-time write mid-year: the same submission, the same
    // business key, no snapshotAt — exactly what an Action-triggered ensure
    // would leave behind before the year-end snapshot ever runs.
    const { record: submission } = await ensureSubmissionForYear(store, defaults, 2025, clock);
    const realTimeRow = await store.create('t5AuthorizedEntities', {
      ...entityRow('Alpine Carbon Markets'),
      aefT1SubmissionId: submission.id,
    });

    const result = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(realTimeRow.id); // same row, updated in place
    expect(result.rows[0].snapshotAt).toBe('2026-03-01T12:00:00.000Z');
    expect(store.all('t5AuthorizedEntities')).toHaveLength(1); // not duplicated
  });

  it('freezes a leftover real-time row the live query no longer returns', async () => {
    const store = newStore();
    // The live provider returns nothing for this year (e.g. the entity's
    // authorizationDate is unset, so RegistryAuthorizedEntitiesProvider's
    // own query excludes it) — but a real-time write still put a row there.
    const { provider } = stubProvider([]);

    const { record: submission } = await ensureSubmissionForYear(store, defaults, 2025, clock);
    const realTimeRow = await store.create('t5AuthorizedEntities', {
      ...entityRow('Orphaned Entity'),
      aefT1SubmissionId: submission.id,
    });

    const result = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].id).toBe(realTimeRow.id);
    expect(result.rows[0].snapshotAt).toBe('2026-03-01T12:00:00.000Z');
  });
});

describe('getCurrentYearAuthorizedEntities', () => {
  it('is live, unstored and flagged provisional', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await getCurrentYearAuthorizedEntities(provider, 2026, clock);

    expect(result.provisional).toBe(true);
    expect(result.asOf.toISOString()).toBe('2026-03-01T12:00:00.000Z');
    expect(store.all('t5AuthorizedEntities')).toHaveLength(0);
  });
});

describe('getAuthorizedEntitiesForYear', () => {
  it('returns the frozen snapshot for a closed year', async () => {
    const store = newStore();
    const { provider, setRows } = stubProvider([entityRow('Alpine Carbon Markets')]);
    await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);
    setRows([entityRow('Second Entity')]);

    const result = await getAuthorizedEntitiesForYear(store, provider, defaults, 2025, clock);

    expect(result.provisional).toBe(false);
    expect(result.snapshotAt).toBe('2026-03-01T12:00:00.000Z');
    expect(result.rows[0].aefT5AuthorizedEntitiesName).toBe('Alpine Carbon Markets');
  });

  it('computes live for a year with no snapshot', async () => {
    const store = newStore();
    const { provider } = stubProvider();

    const result = await getAuthorizedEntitiesForYear(store, provider, defaults, 2026, clock);

    expect(result.provisional).toBe(true);
    expect(result.snapshotAt).toBeUndefined();
  });

  it('returns nothing for a past year with no Submission at all, rather than falling back to live', async () => {
    const store = newStore();
    const { provider, calls } = stubProvider();

    // clock is fixed at 2026-03-01 — 2024 is a genuinely past, never-tracked
    // year (distinct from the "frozen snapshot for a closed year" case
    // above, which explicitly snapshots 2025 first).
    const result = await getAuthorizedEntitiesForYear(store, provider, defaults, 2024, clock);

    expect(result.rows).toEqual([]);
    expect(result.provisional).toBe(false);
    expect(result.snapshotAt).toBeUndefined();
    // The live provider must not be asked at all — it has no concept of
    // "as of 2024", only "as of now", so calling it here would silently
    // mislabel today's entities as 2024's.
    expect(calls).toHaveLength(0);
  });
});

describe('export exclusion', () => {
  it('never emits snapshotAt or the relationship columns', async () => {
    const store = newStore();
    const { provider } = stubProvider();
    const { rows } = await snapshotAuthorizedEntitiesForYear(store, provider, defaults, 2025, {}, clock);

    const projection = toRows('t5AuthorizedEntities', rows as unknown as Record<string, unknown>[]);

    expect(projection.headers).not.toContain('snapshotAt');
    expect(projection.headers).not.toContain('aefT1SubmissionId');
    expect(projection.headers).not.toContain('projectId');
    expect(projection.headers).toHaveLength(8);
  });
});
