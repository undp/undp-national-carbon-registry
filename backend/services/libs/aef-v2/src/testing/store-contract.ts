import { AefStore } from '../store/aef-store.port';

/**
 * Behaviour every {@link AefStore} implementation must satisfy.
 *
 * Exported so a new adapter — or a consuming registry's own — can be held to the
 * same contract as the two shipped here, rather than each re-deriving what the
 * port means.
 *
 * ```ts
 * describe('InMemoryAefStore', () => aefStoreContract(async () => new InMemoryAefStore()));
 * ```
 */
export function aefStoreContract(makeStore: () => Promise<AefStore>): void {
  /** This registry identifies a project by refId, not a UUID. */
  const PROJECT_ID = '0002';

  it('round-trips a created record', async () => {
    const store = await makeStore();
    const created = await store.create('t2Authorizations', {
      aefT2AuthorizationsId: 'AUTH-1',
      aefT2AuthorizationsCooperativeApproachId: 'CA0004',
    });

    expect(created.id).toBeTruthy();
    const found = await store.findById('t2Authorizations', created.id);
    expect(found?.aefT2AuthorizationsId).toBe('AUTH-1');
  });

  it('stores partial records — a draft is legitimate', async () => {
    const store = await makeStore();
    const created = await store.create('t3Actions', { aefT3ActionsType: 'Use' });
    expect(created.id).toBeTruthy();
    expect(created.aefT3ActionsQuantityTCo2).toBeUndefined();
  });

  it('merges on update without dropping untouched fields', async () => {
    const store = await makeStore();
    const created = await store.create('t2Authorizations', {
      aefT2AuthorizationsId: 'AUTH-1',
      aefT2AuthorizationsSector: 'Energy generation',
    });

    const updated = await store.update('t2Authorizations', created.id, {
      aefT2AuthorizationsSector: 'Agriculture',
    });

    expect(updated.aefT2AuthorizationsSector).toBe('Agriculture');
    expect(updated.aefT2AuthorizationsId).toBe('AUTH-1');
  });

  it('filters by an internal link column', async () => {
    const store = await makeStore();
    const submission = await store.create('t1Submission', {
      aefT1SubmissionParty: 'VUT',
      aefT1SubmissionReportYear: 2025,
      aefT1SubmissionVersion: '1.0',
    });

    await store.create('t4Holdings', {
      aefT1SubmissionId: submission.id,
      aefT4HoldingsQuantityTCo2: 200,
    });
    await store.create('t4Holdings', { aefT4HoldingsQuantityTCo2: 50 });

    const page = await store.find('t4Holdings', {
      where: { aefT1SubmissionId: submission.id },
    });

    expect(page.total).toBe(1);
    expect(page.data[0].aefT4HoldingsQuantityTCo2).toBe(200);
  });

  it('filters by a host-registry reference', async () => {
    const store = await makeStore();
    await store.create('t3Actions', { aefT3ActionsType: 'Use', projectId: PROJECT_ID });
    await store.create('t3Actions', { aefT3ActionsType: 'Transfer', projectId: 'OTHER' });

    const page = await store.find('t3Actions', { where: { projectId: PROJECT_ID } });

    expect(page.total).toBe(1);
    expect(page.data[0].aefT3ActionsType).toBe('Use');
  });

  it('does not match a foreign id', async () => {
    const store = await makeStore();
    await store.create('t3Actions', { projectId: PROJECT_ID });

    const page = await store.find('t3Actions', { where: { projectId: 'not-this-one' } });
    expect(page.total).toBe(0);
  });

  it('resolves several ids in one query with whereIn', async () => {
    const store = await makeStore();
    const a = await store.create('t1Submission', { aefT1SubmissionVersion: '1.0' });
    const b = await store.create('t1Submission', { aefT1SubmissionVersion: '1.1' });

    await store.create('t4Holdings', { aefT1SubmissionId: a.id });
    await store.create('t4Holdings', { aefT1SubmissionId: b.id });
    await store.create('t4Holdings', {});

    const page = await store.find('t4Holdings', {
      whereIn: { aefT1SubmissionId: [a.id, b.id] },
    });

    expect(page.total).toBe(2);
  });

  /** `IN ()` is a syntax error in SQL, and an empty set should match nothing. */
  it('matches nothing for an empty whereIn set', async () => {
    const store = await makeStore();
    await store.create('t4Holdings', { aefT1SubmissionId: 'anything' });

    const page = await store.find('t4Holdings', { whereIn: { aefT1SubmissionId: [] } });
    expect(page.total).toBe(0);
  });

  it('paginates', async () => {
    const store = await makeStore();
    for (let i = 0; i < 5; i += 1) {
      await store.create('t4Holdings', {
        aefT4HoldingsAuthorizationId: i < 3 ? 'AUTH-1' : 'AUTH-2',
        aefT4HoldingsVintageYear: 2024,
      });
    }

    const page = await store.find('t4Holdings', {
      where: { aefT4HoldingsAuthorizationId: 'AUTH-1' },
      page: 1,
      pageSize: 2,
    });

    expect(page.total).toBe(3);
    expect(page.data).toHaveLength(2);
  });

  it('deletes', async () => {
    const store = await makeStore();
    const created = await store.create('t5AuthorizedEntities', {
      aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets AG',
    });

    await store.delete('t5AuthorizedEntities', created.id);
    expect(await store.findById('t5AuthorizedEntities', created.id)).toBeUndefined();
  });
}
