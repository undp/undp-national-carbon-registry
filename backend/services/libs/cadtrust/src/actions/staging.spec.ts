import { createCadTrustClient } from '../client';
import { createFakeTransport, FakeScript } from '../testing/fake-transport';

const noSleep = async () => undefined;

function client(script: FakeScript = { data: { success: true } }) {
  const fake = createFakeTransport(script);
  return { fake, client: createCadTrustClient({ transport: fake.transport, sleep: noSleep }) };
}

describe('staging', () => {
  it('lists staged records with type and table filters', async () => {
    const { fake, client: cadtrust } = client({ data: { page: 1, pageCount: 1, data: [] } });

    await cadtrust.staging.list({ page: 1, limit: 10, type: 'failed', table: 'project' });

    expect(fake.lastRequest()).toMatchObject({
      method: 'GET',
      url: 'http://localhost:31310/v2/staging?page=1&limit=10&type=failed&table=project',
    });
  });

  it('enforces the pagination contract on the staging list too', async () => {
    const { fake, client: cadtrust } = client();

    await expect(cadtrust.staging.list({ page: 1 } as never)).rejects.toBeInstanceOf(TypeError);
    expect(fake.requests).toHaveLength(0);
  });

  it('walks every page in listAll', async () => {
    const { fake, client: cadtrust } = client([
      { data: { page: 1, pageCount: 2, data: [{ uuid: 'a' }] } },
      { data: { page: 2, pageCount: 2, data: [{ uuid: 'b' }] } },
    ]);

    const uuids: string[] = [];
    for await (const record of cadtrust.staging.listAll({ limit: 1, type: 'staged' })) {
      uuids.push(record.uuid);
    }

    expect(uuids).toEqual(['a', 'b']);
    expect(fake.requests).toHaveLength(2);
  });

  it('checks for pending commits', async () => {
    const { fake, client: cadtrust } = client({
      data: { confirmed: false, message: 'There are currently pending commits', success: true },
    });

    const result = await cadtrust.staging.hasPendingCommits();

    expect(fake.lastRequest()).toMatchObject({
      method: 'GET',
      url: 'http://localhost:31310/v2/staging/pending',
    });
    expect(result.confirmed).toBe(false);
  });

  it('reports uncommitted staged rows by inverting the v2 confirmed reading', async () => {
    const { fake, client: cadtrust } = client({
      data: { confirmed: false, message: 'There are currently pending commits', success: true },
    });

    const result = await cadtrust.staging.hasUncommittedStagedRows();

    expect(fake.lastRequest()).toMatchObject({
      method: 'GET',
      url: 'http://localhost:31310/v2/staging/pending',
    });
    expect(result).toBe(true);
  });

  it('reports no uncommitted staged rows when confirmed is true', async () => {
    const { client: cadtrust } = client({
      data: { confirmed: true, message: 'There are no pending commits', success: true },
    });

    await expect(cadtrust.staging.hasUncommittedStagedRows()).resolves.toBe(false);
  });

  it('commits with author, comment and a subset of ids', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.commit({
      author: 'undp-registry',
      comment: 'nightly sync',
      ids: ['9b9bb857-c71b-4649-b805-a289db27dc1c'],
    });

    expect(fake.lastRequest()).toMatchObject({
      method: 'POST',
      url: 'http://localhost:31310/v2/staging/commit',
      body: {
        author: 'undp-registry',
        comment: 'nightly sync',
        ids: ['9b9bb857-c71b-4649-b805-a289db27dc1c'],
      },
    });
  });

  it('commits everything staged when called with no arguments', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.commit();

    expect(fake.lastRequest().body).toEqual({});
  });

  it('retries a single failed commit by uuid', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.retry({ uuid: 'abc' });

    expect(fake.lastRequest()).toMatchObject({
      method: 'POST',
      url: 'http://localhost:31310/v2/staging/retry',
      body: { uuid: 'abc' },
    });
  });

  it('resets stuck committed records without a body', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'Reset 2 committed staging record(s).', affectedRows: 2, success: true },
    });

    const result = await cadtrust.staging.resetCommitted();

    expect(fake.lastRequest()).toMatchObject({
      method: 'POST',
      url: 'http://localhost:31310/v2/staging/reset-committed',
    });
    expect(fake.lastRequest().body).toBeUndefined();
    expect(result.affectedRows).toBe(2);
  });

  it('edits a staged record', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.edit({ uuid: 'abc', data: { methodologyCode: 'ACR-001' } });

    expect(fake.lastRequest()).toMatchObject({
      method: 'PUT',
      url: 'http://localhost:31310/v2/staging',
      body: { uuid: 'abc', data: { methodologyCode: 'ACR-001' } },
    });
  });

  it('deletes one staged record with the uuid in the BODY, not the path', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.remove({ uuid: 'abc' });

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/staging');
    expect(fake.lastRequest().body).toEqual({ uuid: 'abc' });
  });

  it('cleans all staged records', async () => {
    const { fake, client: cadtrust } = client();

    await cadtrust.staging.clean();

    expect(fake.lastRequest()).toMatchObject({
      method: 'DELETE',
      url: 'http://localhost:31310/v2/staging/clean',
    });
  });
});
