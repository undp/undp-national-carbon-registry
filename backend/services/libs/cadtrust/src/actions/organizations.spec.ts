import { createCadTrustClient } from '../client';
import { CadTrustOrgCreationFailedError, CadTrustOrgOperationInProgressError, CadTrustTimeoutError } from '../http/errors';
import { createFakeTransport, FakeScript } from '../testing/fake-transport';

const noSleep = async () => undefined;

function client(script: FakeScript = { data: { success: true } }) {
  const fake = createFakeTransport(script);
  return { fake, client: createCadTrustClient({ transport: fake.transport, sleep: noSleep }) };
}

const inProgress = (state: string, progress = 12) => ({
  data: {
    inProgress: true,
    state,
    message: `state=${state}`,
    progress,
    retryCount: 0,
    maxRetries: 3,
    startedAt: '2026-01-26T12:00:00.000Z',
    updatedAt: '2026-01-26T12:01:30.000Z',
    stores: {},
    error: null,
    success: true,
  },
});

describe('organizations', () => {
  describe('endpoint mapping', () => {
    it.each([
      ['list', [], 'GET', '/organizations'],
      ['getCreationStatus', [], 'GET', '/organizations/creation-status'],
      ['sync', [], 'POST', '/organizations/sync'],
      ['upgrade', [], 'POST', '/organizations/upgrade'],
      ['create', [{ name: 'Org' }], 'POST', '/organizations'],
      ['addMetadata', [{ orgUid: 'a', metadata: {} }], 'POST', '/organizations/metadata'],
      ['addMirror', [{ storeId: 's', coinId: 'c' }], 'POST', '/organizations/mirror'],
      ['removeMirror', [{ storeId: 's', coinId: 'c' }], 'POST', '/organizations/remove-mirror'],
      ['reclaimHome', [{ orgUid: 'a' }], 'POST', '/organizations/reclaim-home'],
      ['edit', [{ name: 'New' }], 'PUT', '/organizations/edit'],
      ['importOrganization', [{ orgUid: 'a' }], 'PUT', '/organizations'],
      ['subscribe', [{ orgUid: 'a' }], 'PUT', '/organizations/subscribe'],
      ['unsubscribe', [{ orgUid: 'a' }], 'PUT', '/organizations/unsubscribe'],
      ['resync', [{ orgUid: 'a' }], 'PUT', '/organizations/resync'],
    ])('%s -> %s %s', async (method, args, httpMethod, path) => {
      const { fake, client: cadtrust } = client({ data: { success: true } });

      await cadtrust.organizations[method as string](...(args as unknown[]));

      expect(fake.lastRequest()).toMatchObject({
        method: httpMethod,
        url: `http://localhost:31310/v2${path}`,
      });
    });

    it('passes orgUid as a query parameter on status and metadata reads', async () => {
      const { fake, client: cadtrust } = client({ data: {} });

      await cadtrust.organizations.getStatus('org-1');
      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/organizations/status?orgUid=org-1');

      await cadtrust.organizations.getMetadata('org-1');
      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/organizations/metadata?orgUid=org-1');
    });

    it('puts orgUid in the path on delete', async () => {
      const { fake, client: cadtrust } = client({ data: { success: true, message: 'removed' } });

      await cadtrust.organizations.remove('org-1');

      expect(fake.lastRequest()).toMatchObject({
        method: 'DELETE',
        url: 'http://localhost:31310/v2/organizations/org-1',
      });
    });

    it('uploads the file-upload variants under the field name "file"', async () => {
      const { fake, client: cadtrust } = client({ data: { success: true } });
      const file = { filename: 'organization.json', content: Buffer.from('{}') };

      await cadtrust.organizations.createFromFile(file);
      expect(fake.lastRequest().body).toBeInstanceOf(FormData);
      expect((fake.lastRequest().body as FormData).has('file')).toBe(true);

      await cadtrust.organizations.editFromFile(file);
      expect((fake.lastRequest().body as FormData).has('file')).toBe(true);
    });
  });

  describe('one-operation-at-a-time 409', () => {
    it('surfaces the in-progress operation status rather than a bare conflict', async () => {
      const operationStatus = {
        operation: 'V2 organization creation',
        status: 'Waiting for stores to confirm on blockchain (2/4 confirmed)',
        startedAt: '2026-01-26T12:00:00.000Z',
        elapsedSeconds: 195,
      };
      const { client: cadtrust } = client({
        status: 409,
        data: { message: 'A home organization operation is already in progress', operationStatus, success: false },
      });

      const error = await cadtrust.organizations
        .create({ name: 'Org' })
        .catch((e) => e);

      expect(error).toBeInstanceOf(CadTrustOrgOperationInProgressError);
      expect(error.operationStatus.elapsedSeconds).toBe(195);
    });
  });

  describe('waitForCreation', () => {
    it('polls until COMPLETE and returns the final status', async () => {
      const { fake, client: cadtrust } = client([
        inProgress('STORES_CREATING'),
        inProgress('DATA_PUSHING', 60),
        inProgress('COMPLETE', 100),
      ]);

      const result = await cadtrust.organizations.waitForCreation({ pollIntervalMs: 1 });

      expect(result.state).toBe('COMPLETE');
      expect(fake.requests).toHaveLength(3);
    });

    it('reports progress on every poll', async () => {
      const { client: cadtrust } = client([inProgress('STORES_CREATING'), inProgress('COMPLETE', 100)]);
      const seen: string[] = [];

      await cadtrust.organizations.waitForCreation({
        pollIntervalMs: 1,
        onProgress: (status) => seen.push(String(status.state)),
      });

      expect(seen).toEqual(['STORES_CREATING', 'COMPLETE']);
    });

    it('rejects when creation reaches FAILED', async () => {
      const { client: cadtrust } = client([inProgress('STORES_CREATING'), inProgress('FAILED')]);

      await expect(
        cadtrust.organizations.waitForCreation({ pollIntervalMs: 1 }),
      ).rejects.toBeInstanceOf(CadTrustOrgCreationFailedError);
    });

    it('resolves once an observed operation stops being reported', async () => {
      const { client: cadtrust } = client([
        inProgress('STORES_CREATING'),
        { data: { inProgress: false, state: null, message: 'No organization creation in progress', success: true } },
      ]);

      const result = await cadtrust.organizations.waitForCreation({ pollIntervalMs: 1 });

      expect(result.inProgress).toBe(false);
    });

    it('keeps polling past an idle first reading, so a race at startup is not mistaken for completion', async () => {
      const { fake, client: cadtrust } = client([
        { data: { inProgress: false, state: null, message: 'No organization creation in progress', success: true } },
        inProgress('STORES_CREATING'),
        inProgress('COMPLETE', 100),
      ]);

      const result = await cadtrust.organizations.waitForCreation({ pollIntervalMs: 1 });

      expect(result.state).toBe('COMPLETE');
      expect(fake.requests).toHaveLength(3);
    });

    it('times out rather than polling forever', async () => {
      const { client: cadtrust } = client(inProgress('STORES_CREATING'));

      await expect(
        cadtrust.organizations.waitForCreation({ pollIntervalMs: 1000, timeoutMs: 1 }),
      ).rejects.toBeInstanceOf(CadTrustTimeoutError);
    });

    it('honours an AbortSignal', async () => {
      const { fake, client: cadtrust } = client(inProgress('STORES_CREATING'));
      const controller = new AbortController();
      controller.abort();

      await expect(
        cadtrust.organizations.waitForCreation({ signal: controller.signal }),
      ).rejects.toBeInstanceOf(CadTrustTimeoutError);
      expect(fake.requests).toHaveLength(0);
    });

    it('handles the upgrade shape, which reports through liveStatus with a null state', async () => {
      const { client: cadtrust } = client([
        {
          data: {
            inProgress: true,
            state: null,
            message: 'V1 to V2 upgrade: Waiting for V2 registry store to confirm',
            operation: 'V1 to V2 upgrade',
            status: 'Waiting for V2 registry store to confirm',
            startedAt: '2026-01-26T12:00:00.000Z',
            elapsedSeconds: 195,
            liveStatus: {
              operation: 'V1 to V2 upgrade',
              status: 'Waiting for V2 registry store to confirm',
              startedAt: '2026-01-26T12:00:00.000Z',
              elapsedSeconds: 195,
            },
            success: true,
          },
        },
        { data: { inProgress: false, state: null, message: 'No organization creation in progress', success: true } },
      ]);

      const result = await cadtrust.organizations.waitForCreation({ pollIntervalMs: 1 });

      expect(result.inProgress).toBe(false);
    });
  });
});
