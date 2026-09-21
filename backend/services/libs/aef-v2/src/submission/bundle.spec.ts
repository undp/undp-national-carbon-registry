import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import { fixedClock } from '../clock';
import { HoldingsProvider } from '../holdings/snapshot';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { validateSubmission } from '../validation/validate';
import { AefSubmissionDefaults, ensureSubmissionForYear } from './bootstrap';
import { AefBundleDeps, loadSubmissionBundle, toAefSubmissionExport, toValidationBundle } from './bundle';
import { recordAction, recordAuthorization } from '../records/write';

const defaults: AefSubmissionDefaults = {
  aefT1SubmissionParty: 'VUT',
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
};

const clock = fixedClock(new Date('2026-03-01T12:00:00.000Z'));

function deps(store: InMemoryAefStore): AefBundleDeps {
  const holdings: HoldingsProvider = {
    getHoldings: async () => [
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
    ],
  };
  const authorizedEntities: AuthorizedEntitiesProvider = {
    getAuthorizedEntities: async () => [
      {
        aefT5AuthorizedEntitiesAuthorizationDate: '01/03/2024',
        aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets',
        aefT5AuthorizedEntitiesIncorporationCountry: 'VUT',
        aefT5AuthorizedEntitiesId: 'ENT-001',
        aefT5AuthorizedEntitiesCooperativeApproachId: 'CA0004',
      },
    ],
  };
  return { store, holdings, authorizedEntities };
}

describe('loadSubmissionBundle', () => {
  it('reads T1-T3 from the store and marks the open year’s T4/T5 provisional', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const bag = deps(store);

    await ensureSubmissionForYear(store, defaults, 2026, clock);
    await recordAction(store, defaults, {
      aefT3ActionsDate: '2026-02-01T00:00:00.000Z',
      aefT3ActionsType: 'Authorization',
      aefT3ActionsCooperativeApproachId: 'CA0004',
      aefT3ActionsAuthorizationId: 'VUT0001',
      aefT3ActionsFirstTransferringPartyId: 'VUT',
      aefT3ActionsPartyItmoRegistryId: 'VUT01',
      aefT3ActionsItmoFirstId: 1,
      aefT3ActionsItmoLastId: 100,
      aefT3ActionsMetric: 'GHG',
      aefT3ActionsQuantityTCo2: 100,
      aefT3ActionsMitigationType: 'Emission reductions',
      aefT3ActionsVintageYear: 2024,
    });
    await recordAuthorization(store, defaults, {
      aefT2AuthorizationsId: 'VUT0001',
      aefT2AuthorizationsDate: '01/02/2026',
      aefT2AuthorizationsCooperativeApproachId: 'CA0004',
      aefT2AuthorizationsVersion: 1,
      aefT2AuthorizationsMetric: 'GHG',
      aefT2AuthorizationsSector: 'Energy generation',
      aefT2AuthorizationsPurposesForAuthorization: 'NDC',
    });

    const bundle = await loadSubmissionBundle(bag, defaults, 2026, clock);

    expect(bundle.submission?.aefT1SubmissionReportYear).toBe(2026);
    expect(bundle.actions).toHaveLength(1);
    expect(bundle.authorizations).toHaveLength(1);
    expect(bundle.provisional.holdings).toBe(true);
    expect(bundle.provisional.authorizedEntities).toBe(true);
    expect(bundle.holdings).toHaveLength(1);
    expect(bundle.authorizedEntities).toHaveLength(1);
  });

  it('returns an empty T2/T3 for a year with no submission at all', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const bag = deps(store);

    const bundle = await loadSubmissionBundle(bag, defaults, 2020, clock);

    expect(bundle.submission).toBeUndefined();
    expect(bundle.authorizations).toEqual([]);
    expect(bundle.actions).toEqual([]);
  });
});

describe('toAefSubmissionExport / toValidationBundle', () => {
  it('reshape a loaded bundle so it can feed export and validation without further work', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const bag = deps(store);
    // Must be the clock's current year (2026), not a past one — a past year
    // with no frozen T4/T5 snapshot correctly returns nothing (see
    // getHoldingsForYear/getAuthorizedEntitiesForYear's "only the open year
    // falls back to live" behaviour), so this reshape test needs the live
    // path to actually have holdings/entities to reshape.
    await ensureSubmissionForYear(store, defaults, 2026, clock);

    const bundle = await loadSubmissionBundle(bag, defaults, 2026, clock);

    const exportData = toAefSubmissionExport(bundle);
    expect(exportData.t1Submission).toHaveLength(1);
    expect(exportData.t4Holdings).toHaveLength(1);

    const validationBundle = toValidationBundle(bundle);
    // Runs without throwing — the reshaped bundle is well-formed input for validateSubmission.
    expect(() => validateSubmission(validationBundle)).not.toThrow();
  });
});
