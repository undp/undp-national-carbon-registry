import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import { fixedClock } from '../clock';
import { HoldingsProvider } from '../holdings/snapshot';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { AefSubmissionStatus } from '../tables/aefT1Submission';
import { AefSubmissionDefaults } from './bootstrap';
import { openReportingYear } from './rollover';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));
const newStore = () => new InMemoryAefStore(undefined, clock);

function deps(store: InMemoryAefStore) {
  const holdingsCalls: { reportedYear: number; asOf: Date }[] = [];
  const entitiesCalls: { reportedYear: number; asOf: Date }[] = [];

  const holdings: HoldingsProvider = {
    getHoldings: async (params) => {
      holdingsCalls.push(params);
      return [
        {
          aefT4HoldingsCooperativeApproachId: 'CA0004',
          aefT4HoldingsAuthorizationId: 'VUT0001',
          aefT4HoldingsFirstTransferringPartyId: 'VUT',
          aefT4HoldingsPartyItmoRegistryId: 'VUT01',
          aefT4HoldingsItmoFirstId: 1,
          aefT4HoldingsItmoLastId: 100,
          aefT4HoldingsMetric: 'GHG',
          aefT4HoldingsQuantityTCo2: 100,
          aefT4HoldingsMitigationType: 'Emission reductions',
          aefT4HoldingsVintageYear: 2024,
        },
      ];
    },
  };

  const authorizedEntities: AuthorizedEntitiesProvider = {
    getAuthorizedEntities: async (params) => {
      entitiesCalls.push(params);
      return [
        {
          aefT5AuthorizedEntitiesAuthorizationDate: '01/03/2024',
          aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets',
          aefT5AuthorizedEntitiesIncorporationCountry: 'VUT',
          aefT5AuthorizedEntitiesId: 'ENT-001',
          aefT5AuthorizedEntitiesCooperativeApproachId: 'CA0004',
        },
      ];
    },
  };

  return { store, holdings, authorizedEntities, holdingsCalls, entitiesCalls };
}

describe('openReportingYear', () => {
  it('opens a draft submission for the current year and freezes the previous one', async () => {
    const store = newStore();
    const result = await openReportingYear(deps(store), defaults, {}, clock);

    expect(result.openedYear).toBe(2026);
    expect(result.closedYear).toBe(2025);
    expect(result.submission.aefT1SubmissionReportYear).toBe(2026);
    expect(result.submission.status).toBe(AefSubmissionStatus.DRAFT);
    expect(result.submissionCreated).toBe(true);
    expect(result.holdings.created).toBe(true);
    expect(result.authorizedEntities.created).toBe(true);
    expect(result.holdings.rows).toHaveLength(1);
    expect(result.authorizedEntities.rows).toHaveLength(1);
  });

  /** The operation's whole meaning is "close last year" — it must not defer to `clock.now()`. */
  it('defaults the closed year’s asOf to the UTC year-end boundary, not now', async () => {
    const store = newStore();
    const bag = deps(store);

    await openReportingYear(bag, defaults, {}, clock);

    expect(bag.holdingsCalls[0].asOf.toISOString()).toBe('2025-12-31T23:59:59.999Z');
    expect(bag.entitiesCalls[0].asOf.toISOString()).toBe('2025-12-31T23:59:59.999Z');
  });

  it('is idempotent end to end', async () => {
    const store = newStore();
    const bag = deps(store);

    const first = await openReportingYear(bag, defaults, {}, clock);
    const second = await openReportingYear(bag, defaults, {}, clock);

    expect(second.submissionCreated).toBe(false);
    expect(second.holdings.created).toBe(false);
    expect(second.authorizedEntities.created).toBe(false);
    expect(store.all('t1Submission')).toHaveLength(2); // opened year + closed year
    expect(store.all('t4Holdings')).toHaveLength(first.holdings.rows.length);
    expect(store.all('t5AuthorizedEntities')).toHaveLength(first.authorizedEntities.rows.length);
  });

  it('honours an explicit asOf and openYear', async () => {
    const store = newStore();
    const bag = deps(store);
    const asOf = new Date('2024-06-30T00:00:00.000Z');

    const result = await openReportingYear(bag, defaults, { openYear: 2025, asOf }, clock);

    expect(result.openedYear).toBe(2025);
    expect(result.closedYear).toBe(2024);
    expect(bag.holdingsCalls[0].asOf).toEqual(asOf);
    expect(bag.entitiesCalls[0].asOf).toEqual(asOf);
  });
});
