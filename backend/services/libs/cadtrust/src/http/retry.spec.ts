import { resolveConfig } from '../config';
import { createFakeTransport, transportError } from '../testing/fake-transport';
import { request } from './request';
import { backoffDelay, DEFAULT_RETRY } from './retry';

const noSleep = async () => undefined;

function context(transport, retry = {}) {
  return resolveConfig({ transport, sleep: noSleep, retry: { baseDelayMs: 1, ...retry } });
}

describe('retry policy', () => {
  it('retries a network failure and succeeds on a later attempt', async () => {
    const fake = createFakeTransport([
      { throws: transportError('ECONNRESET') },
      { throws: transportError('ECONNRESET') },
      { status: 200, data: { page: 1, pageCount: 1, data: [] } },
    ]);

    const result = await request(context(fake.transport), { method: 'GET', path: '/project' });

    expect(fake.requests).toHaveLength(3);
    expect(result).toEqual({ page: 1, pageCount: 1, data: [] });
  });

  it('retries 5xx', async () => {
    const fake = createFakeTransport([{ status: 502, data: {} }, { status: 200, data: { ok: true } }]);

    await request(context(fake.transport), { method: 'GET', path: '/project' });

    expect(fake.requests).toHaveLength(2);
  });

  it('retries 429', async () => {
    const fake = createFakeTransport([{ status: 429, data: {} }, { status: 200, data: { ok: true } }]);

    await request(context(fake.transport), { method: 'GET', path: '/project' });

    expect(fake.requests).toHaveLength(2);
  });

  it.each([400, 401, 403, 404, 409])('never retries %i', async (status) => {
    const fake = createFakeTransport({ status, data: { message: 'nope' } });

    await expect(
      request(context(fake.transport), { method: 'GET', path: '/project' }),
    ).rejects.toBeDefined();
    expect(fake.requests).toHaveLength(1);
  });

  it('gives up after the configured attempt count and rethrows the last error', async () => {
    const fake = createFakeTransport({ throws: transportError('ECONNREFUSED') });

    await expect(
      request(context(fake.transport, { attempts: 4 }), { method: 'GET', path: '/project' }),
    ).rejects.toMatchObject({ name: 'CadTrustNetworkError' });
    expect(fake.requests).toHaveLength(4);
  });

  describe('per-method defaults', () => {
    it('retries GET by default', async () => {
      const fake = createFakeTransport([{ status: 500, data: {} }, { status: 200, data: {} }]);

      await request(context(fake.transport), { method: 'GET', path: '/project' });

      expect(fake.requests).toHaveLength(2);
    });

    it.each(['POST', 'PUT', 'DELETE'] as const)(
      'does NOT retry %s — a blind retry risks double-staging a record',
      async (method) => {
        const fake = createFakeTransport({ status: 500, data: {} });

        await expect(
          request(context(fake.transport), { method, path: '/project', body: {} }),
        ).rejects.toBeDefined();
        expect(fake.requests).toHaveLength(1);
      },
    );

    it('allows a mutation to opt in explicitly', async () => {
      const fake = createFakeTransport([{ status: 500, data: {} }, { status: 200, data: {} }]);

      await request(context(fake.transport), {
        method: 'POST',
        path: '/staging/commit',
        body: {},
        retryable: true,
      });

      expect(fake.requests).toHaveLength(2);
    });

    it('allows a GET to opt out explicitly', async () => {
      const fake = createFakeTransport({ status: 500, data: {} });

      await expect(
        request(context(fake.transport), { method: 'GET', path: '/project', retryable: false }),
      ).rejects.toBeDefined();
      expect(fake.requests).toHaveLength(1);
    });
  });

  describe('backoffDelay', () => {
    it('grows exponentially across attempts', () => {
      const noJitter = () => 1;

      expect(backoffDelay(1, DEFAULT_RETRY, noJitter)).toBe(300);
      expect(backoffDelay(2, DEFAULT_RETRY, noJitter)).toBe(600);
      expect(backoffDelay(3, DEFAULT_RETRY, noJitter)).toBe(1200);
    });

    it('caps at maxDelayMs', () => {
      expect(backoffDelay(20, DEFAULT_RETRY, () => 1)).toBe(DEFAULT_RETRY.maxDelayMs);
    });

    it('applies jitter of at least half the delay', () => {
      expect(backoffDelay(1, DEFAULT_RETRY, () => 0)).toBe(150);
    });
  });
});
