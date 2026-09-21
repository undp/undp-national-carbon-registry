import { AuthorizedEntitiesProvider } from '../authorized-entities/provider';
import { fixedClock } from '../clock';
import { HoldingsProvider } from '../holdings/snapshot';
import { InMemoryAefStore } from '../testing/in-memory-store';
import { AefSubmissionStatus } from '../tables/aefT1Submission';
import { AefSubmissionDefaults, ensureSubmissionForYear } from './bootstrap';
import { AefBundleDeps } from './bundle';
import { recordAction } from '../records/write';
import {
  CarpPopulatedPatchError,
  NoSubmissionForYearError,
  SubmissionYearNotClosedError,
  submitAefReport,
} from './submit';

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

describe('submitAefReport', () => {
  it('refuses a year that has not ended, without force', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await expect(submitAefReport(deps(store), defaults, 2026, {}, clock)).rejects.toThrow(
      SubmissionYearNotClosedError,
    );
  });

  it('allows the open year when forced', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2026, clock);

    const result = await submitAefReport(
      deps(store),
      defaults,
      2026,
      { force: true, skipValidation: true },
      clock,
    );

    expect(result.submitted).toBe(true);
  });

  it('throws when no submission exists for the year', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await expect(submitAefReport(deps(store), defaults, 2020, {}, clock)).rejects.toThrow(
      NoSubmissionForYearError,
    );
  });

  /**
   * Not testing `validateSubmission`'s correctness here — that has its own
   * spec. This just proves `submitAefReport` wires the incomplete result
   * through without mutating anything. A bare Submission with no Actions is
   * itself a *valid* (if unusual) filing per the README, so the bundle needs
   * an actually incomplete row — an Action missing a required field — to
   * produce issues.
   */
  it('returns validation issues without mutating when the bundle is incomplete', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { record: submission } = await ensureSubmissionForYear(store, defaults, 2020, clock);
    await recordAction(store, defaults, {
      aefT3ActionsDate: '2020-06-01T00:00:00.000Z',
      // aefT3ActionsType and every other required field left unset on purpose.
    });

    const result = await submitAefReport(deps(store), defaults, 2020, {}, clock);

    expect(result.submitted).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    const stored = await store.findById('t1Submission', submission.id);
    expect(stored?.status).toBe(AefSubmissionStatus.DRAFT);
    expect(stored?.aefT1SubmissionSubmissionDate).toBeUndefined();
  });

  it('stamps the submission date and flips status to SUBMITTED', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    const result = await submitAefReport(deps(store), defaults, 2020, { skipValidation: true }, clock);

    expect(result.submitted).toBe(true);
    expect(result.issues).toEqual([]);
    expect(result.record.status).toBe(AefSubmissionStatus.SUBMITTED);
    expect(result.record.aefT1SubmissionSubmissionDate).toBe('01/03/2026');
  });

  it('applies an additional registry-writable patch', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    const result = await submitAefReport(
      deps(store),
      defaults,
      2020,
      { skipValidation: true, patch: { aefT1SubmissionNdcFirstYear: 2022 } },
      clock,
    );

    expect(result.record.aefT1SubmissionNdcFirstYear).toBe(2022);
  });

  it('rejects a patch touching a CARP-populated field, before touching the store', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    const { record: submission } = await ensureSubmissionForYear(store, defaults, 2020, clock);

    await expect(
      submitAefReport(
        deps(store),
        defaults,
        2020,
        { skipValidation: true, patch: { aefT1SubmissionReviewStatus: 'Reviewed' } },
        clock,
      ),
    ).rejects.toThrow(CarpPopulatedPatchError);

    const stored = await store.findById('t1Submission', submission.id);
    expect(stored?.status).toBe(AefSubmissionStatus.DRAFT);
  });

  it('hands a rendered export to the transport, and returns its reference', async () => {
    const store = new InMemoryAefStore(undefined, clock);
    await ensureSubmissionForYear(store, defaults, 2020, clock);

    const submitted: { fileName: string; contentType: string }[] = [];
    const result = await submitAefReport(
      deps(store),
      defaults,
      2020,
      {
        skipValidation: true,
        transport: {
          submit: async ({ file }) => {
            submitted.push({ fileName: file.fileName, contentType: file.contentType });
            return { reference: 'carp-ref-123' };
          },
        },
      },
      clock,
    );

    expect(result.transportReference).toBe('carp-ref-123');
    expect(submitted).toHaveLength(1);
    expect(submitted[0].fileName).toBe('aef-report-VUT-2020.csv');
  });
});
