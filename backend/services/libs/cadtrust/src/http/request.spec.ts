import { resolveConfig } from '../config';
import { createFakeTransport } from '../testing/fake-transport';
import { request, requestBinary } from './request';

const noSleep = async () => undefined;

function context(overrides: Parameters<typeof resolveConfig>[0] = {}) {
  return resolveConfig({ sleep: noSleep, ...overrides });
}

describe('request', () => {
  describe('URL construction', () => {
    it('defaults to the documented CADT base URL', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport }), { method: 'GET', path: '/project' });

      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project');
    });

    it('tolerates a trailing slash on the configured base URL', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(
        context({ transport: fake.transport, baseUrl: 'https://cadt.example.org/v2/' }),
        { method: 'GET', path: '/unit' },
      );

      expect(fake.lastRequest().url).toBe('https://cadt.example.org/v2/unit');
    });

    it('accepts a per-request base URL override for the root-mounted system endpoints', async () => {
      const fake = createFakeTransport({ data: {} });
      const ctx = context({ transport: fake.transport });

      await request(ctx, { method: 'GET', path: '/diagnostics', baseUrl: ctx.rootUrl });

      expect(fake.lastRequest().url).toBe('http://localhost:31310/diagnostics');
    });

    it('serializes query parameters, repeating array keys and dropping undefined', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport }), {
        method: 'GET',
        path: '/project',
        query: { page: 1, limit: 10, columns: ['projectName', 'projectId'], orgUid: undefined, xls: true },
      });

      expect(fake.lastRequest().url).toBe(
        'http://localhost:31310/v2/project?page=1&limit=10&columns=projectName&columns=projectId&xls=true',
      );
    });
  });

  describe('headers', () => {
    it('omits x-api-key when no key is configured', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport }), { method: 'GET', path: '/project' });

      expect(fake.lastRequest().headers['x-api-key']).toBeUndefined();
    });

    it('sends x-api-key on every request when a key is configured', async () => {
      const fake = createFakeTransport({ data: {} });
      const ctx = context({ transport: fake.transport, apiKey: 'secret-key' });

      await request(ctx, { method: 'GET', path: '/project' });
      await request(ctx, { method: 'POST', path: '/staging/commit', body: {} });

      expect(fake.requests.map((r) => r.headers['x-api-key'])).toEqual(['secret-key', 'secret-key']);
    });

    it('sets a JSON content type for a JSON body', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport }), {
        method: 'POST',
        path: '/project',
        body: { projectName: 'x' },
      });

      expect(fake.lastRequest().headers['Content-Type']).toBe('application/json');
    });

    it('does NOT set a content type for multipart, so FormData can supply its own boundary', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport }), {
        method: 'POST',
        path: '/project/batch',
        multipart: { field: 'csv', file: { filename: 'p.csv', content: Buffer.from('a,b') } },
      });

      expect(fake.lastRequest().headers['Content-Type']).toBeUndefined();
      expect(fake.lastRequest().body).toBeInstanceOf(FormData);
    });
  });

  describe('timeouts', () => {
    it('applies the client-wide timeout', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport, timeoutMs: 1234 }), {
        method: 'GET',
        path: '/project',
      });

      expect(fake.lastRequest().timeoutMs).toBe(1234);
    });

    it('lets a single call raise the timeout', async () => {
      const fake = createFakeTransport({ data: {} });
      await request(context({ transport: fake.transport, timeoutMs: 1000 }), {
        method: 'GET',
        path: '/diagnostics',
        timeoutMs: 45_000,
      });

      expect(fake.lastRequest().timeoutMs).toBe(45_000);
    });
  });

  describe('requestBinary', () => {
    it('asks the transport for bytes and returns the server-suggested filename', async () => {
      const fake = createFakeTransport({
        data: Buffer.from('xlsx-bytes'),
        headers: {
          'content-disposition': 'attachment; filename="projects.xlsx"',
          'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      const result = await requestBinary(context({ transport: fake.transport }), {
        method: 'GET',
        path: '/project',
        query: { xls: true },
      });

      expect(fake.lastRequest().responseType).toBe('buffer');
      expect(result.data.toString()).toBe('xlsx-bytes');
      expect(result.filename).toBe('projects.xlsx');
    });

    it('decodes a JSON error body even on a binary endpoint', async () => {
      const fake = createFakeTransport({
        status: 403,
        data: Buffer.from(JSON.stringify({ message: 'Node is READ_ONLY', success: false })),
      });

      await expect(
        requestBinary(context({ transport: fake.transport }), { method: 'GET', path: '/offer/' }),
      ).rejects.toMatchObject({ status: 403, body: { message: 'Node is READ_ONLY' } });
    });
  });
});
