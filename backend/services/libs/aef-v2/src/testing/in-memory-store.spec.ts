import { InMemoryAefStore } from './in-memory-store';
import { aefStoreContract } from './store-contract';

describe('InMemoryAefStore', () => {
  aefStoreContract(async () => new InMemoryAefStore());

  it('copies records out, so a caller cannot mutate stored state', async () => {
    const store = new InMemoryAefStore();
    const created = await store.create('t2Authorizations', {
      aefT2AuthorizationsId: 'AUTH-1',
    });

    (created as { aefT2AuthorizationsId: string }).aefT2AuthorizationsId = 'TAMPERED';

    const reread = await store.findById('t2Authorizations', created.id);
    // A test that passes only because of shared references is worse than none.
    expect(reread?.aefT2AuthorizationsId).toBe('AUTH-1');
  });

  it('does not wipe a relationship on a patch that omits it', async () => {
    const store = new InMemoryAefStore();
    const created = await store.create('t3Actions', {
      projectId: '0002',
      aefT1SubmissionId: 'sub-1',
    });

    const updated = await store.update('t3Actions', created.id, { aefT3ActionsType: 'Use' });

    expect(updated.projectId).toBe('0002');
    expect(updated.aefT1SubmissionId).toBe('sub-1');
  });
});
