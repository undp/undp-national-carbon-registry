import { createCadTrustClient } from '../client';
import { createFakeTransport, FakeScript } from '../testing/fake-transport';
import { RESOURCES, ResourceName } from './registry';

const noSleep = async () => undefined;

function client(script: FakeScript = { data: {} }) {
  const fake = createFakeTransport(script);
  return {
    fake,
    client: createCadTrustClient({ transport: fake.transport, sleep: noSleep }),
  };
}

const RESOURCE_NAMES = Object.keys(RESOURCES) as ResourceName[];

describe('generic CRUD', () => {
  it('exposes every documented resource on the client', () => {
    const { client: cadtrust } = client();

    for (const name of RESOURCE_NAMES) {
      expect(cadtrust[name]).toBeDefined();
      expect(cadtrust[name].path).toBe(RESOURCES[name].path);
      expect(cadtrust[name].primaryKey).toBe(RESOURCES[name].primaryKey);
    }
    expect(RESOURCE_NAMES).toHaveLength(21);
  });

  describe.each(RESOURCE_NAMES)('%s', (name) => {
    const { path } = RESOURCES[name];

    it(`POSTs to ${path} on stageCreate`, async () => {
      const { fake, client: cadtrust } = client({ data: { message: 'ok', uuid: 'u-1', success: true } });

      await cadtrust[name].stageCreate({} as never);

      expect(fake.lastRequest()).toMatchObject({
        method: 'POST',
        url: `http://localhost:31310/v2${path}`,
      });
    });

    it(`PUTs to ${path}/{id} on stageUpdate`, async () => {
      const { fake, client: cadtrust } = client({ data: { message: 'ok', success: true } });

      await cadtrust[name].stageUpdate('abc-123', {} as never);

      expect(fake.lastRequest()).toMatchObject({
        method: 'PUT',
        url: `http://localhost:31310/v2${path}/abc-123`,
      });
    });

    it(`DELETEs ${path}/{id} on stageDelete`, async () => {
      const { fake, client: cadtrust } = client({ data: { message: 'ok', success: true } });

      await cadtrust[name].stageDelete('abc-123');

      expect(fake.lastRequest()).toMatchObject({
        method: 'DELETE',
        url: `http://localhost:31310/v2${path}/abc-123`,
      });
    });

    it(`GETs ${path}/{id}`, async () => {
      const { fake, client: cadtrust } = client({ data: {} });

      await cadtrust[name].get('abc-123');

      expect(fake.lastRequest()).toMatchObject({
        method: 'GET',
        url: `http://localhost:31310/v2${path}/abc-123`,
      });
    });
  });

  describe('staging semantics', () => {
    it('marks every mutation as staged, not published', async () => {
      const { client: cadtrust } = client({ data: { message: 'Project staged', uuid: 'u-1', success: true } });

      const created = await cadtrust.project.stageCreate({} as never);
      const updated = await cadtrust.project.stageUpdate('p-1', {} as never);
      const deleted = await cadtrust.project.stageDelete('p-1');

      expect(created.staged).toBe(true);
      expect(updated.staged).toBe(true);
      expect(deleted.staged).toBe(true);
      expect(created.response).toEqual({ message: 'Project staged', uuid: 'u-1', success: true });
    });

    it('never issues a commit as a side effect of a CRUD call', async () => {
      const { fake, client: cadtrust } = client({ data: { success: true } });

      await cadtrust.project.stageCreate({} as never);
      await cadtrust.unit.stageUpdate('u-1', {} as never);
      await cadtrust.methodology.stageDelete('m-1');

      expect(fake.requests.some((r) => r.url.includes('/staging'))).toBe(false);
    });

    it('URL-encodes ids so a malformed id cannot escape the path', async () => {
      const { fake, client: cadtrust } = client({ data: {} });

      await cadtrust.project.get('a/b?c');

      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project/a%2Fb%3Fc');
    });
  });

  describe('pagination', () => {
    it('sends page and limit through to the node', async () => {
      const { fake, client: cadtrust } = client({ data: { page: 1, pageCount: 1, data: [] } });

      await cadtrust.project.list({ page: 2, limit: 50 });

      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project?page=2&limit=50');
    });

    it.each([
      [{ limit: 10 } as never, 'missing page'],
      [{ page: 0, limit: 10 } as never, 'page below 1'],
      [{ page: 1 } as never, 'missing limit'],
      [{ page: 1, limit: 0 } as never, 'limit below 1'],
      [{ page: 1, limit: 1001 } as never, 'limit above the documented maximum'],
    ])('rejects %#: %s before issuing a request', async (query) => {
      const { fake, client: cadtrust } = client();

      await expect(cadtrust.project.list(query)).rejects.toBeInstanceOf(TypeError);
      expect(fake.requests).toHaveLength(0);
    });

    it('walks every page in listAll and stops at pageCount', async () => {
      const { fake, client: cadtrust } = client([
        { data: { page: 1, pageCount: 3, data: [{ cadTrustProjectId: 'a' }] } },
        { data: { page: 2, pageCount: 3, data: [{ cadTrustProjectId: 'b' }] } },
        { data: { page: 3, pageCount: 3, data: [{ cadTrustProjectId: 'c' }] } },
      ]);

      const ids: string[] = [];
      for await (const project of cadtrust.project.listAll({ limit: 1 })) {
        ids.push(project.cadTrustProjectId);
      }

      expect(ids).toEqual(['a', 'b', 'c']);
      expect(fake.requests).toHaveLength(3);
      expect(fake.requests.map((r) => new URL(r.url).searchParams.get('page'))).toEqual(['1', '2', '3']);
    });

    it('stops early on an empty page rather than looping forever', async () => {
      const { fake, client: cadtrust } = client([
        { data: { page: 1, pageCount: 99, data: [{ cadTrustProjectId: 'a' }] } },
        { data: { page: 2, pageCount: 99, data: [] } },
      ]);

      const ids: string[] = [];
      for await (const project of cadtrust.project.listAll({ limit: 1 })) {
        ids.push(project.cadTrustProjectId);
      }

      expect(ids).toEqual(['a']);
      expect(fake.requests).toHaveLength(2);
    });
  });
});
