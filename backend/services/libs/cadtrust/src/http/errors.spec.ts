import { resolveConfig } from '../config';
import { createFakeTransport, transportError } from '../testing/fake-transport';
import {
  CadTrustAuthError,
  CadTrustConflictError,
  CadTrustHttpError,
  CadTrustNetworkError,
  CadTrustNotFoundError,
  CadTrustOrgOperationInProgressError,
  CadTrustRateLimitError,
  CadTrustReferentialIntegrityError,
  CadTrustServerError,
  CadTrustTimeoutError,
  CadTrustValidationError,
  isRetryableError,
} from './errors';
import { request } from './request';

const noSleep = async () => undefined;

/** Issues one request against a scripted reply and returns whatever it threw. */
async function failWith(reply: Parameters<typeof createFakeTransport>[0]): Promise<any> {
  const ctx = resolveConfig({
    transport: createFakeTransport(reply).transport,
    sleep: noSleep,
    retry: { attempts: 1 },
  });

  try {
    await request(ctx, { method: 'POST', path: '/project', body: {} });
  } catch (error) {
    return error;
  }
  throw new Error('expected the request to reject');
}

describe('error classification', () => {
  it('maps a refused connection to a retryable network error', async () => {
    const error = await failWith({ throws: transportError('ECONNREFUSED') });

    expect(error).toBeInstanceOf(CadTrustNetworkError);
    expect(isRetryableError(error)).toBe(true);
    expect(error.url).toBe('http://localhost:31310/v2/project');
  });

  it('maps a socket timeout to a timeout error, which is still a network error', async () => {
    const error = await failWith({ throws: transportError('ETIMEDOUT') });

    expect(error).toBeInstanceOf(CadTrustTimeoutError);
    expect(error).toBeInstanceOf(CadTrustNetworkError);
    expect(isRetryableError(error)).toBe(true);
  });

  it.each([401, 403])('maps %i to a non-retryable auth error', async (status) => {
    const error = await failWith({ status, data: { message: 'Invalid API key', success: false } });

    expect(error).toBeInstanceOf(CadTrustAuthError);
    expect(isRetryableError(error)).toBe(false);
    expect(error.readOnlyNode).toBe(false);
  });

  it('flags a 403 from a READ_ONLY node so it is not mistaken for a bad key', async () => {
    const error = await failWith({
      status: 403,
      data: { message: 'This node is READ_ONLY', success: false },
    });

    expect(error).toBeInstanceOf(CadTrustAuthError);
    expect(error.readOnlyNode).toBe(true);
  });

  it.each([400, 422])('maps %i to a validation error', async (status) => {
    const error = await failWith({ status, data: { message: 'Missing required field', success: false } });

    expect(error).toBeInstanceOf(CadTrustValidationError);
    expect(isRetryableError(error)).toBe(false);
  });

  it("surfaces CAD Trust's own validation message and body verbatim", async () => {
    const body = {
      message: 'No rows were staged. All rows failed validation.',
      success: false,
      stagedCount: 0,
      errorCount: 2,
      errors: [
        { row: 2, error: 'Missing required field(s): projectName' },
        { row: 3, error: "cadTrustProgramId 'invalid-id' does not exist" },
      ],
    };
    const error = await failWith({ status: 400, data: body });

    expect(error.message).toContain('No rows were staged. All rows failed validation.');
    expect(error.body).toEqual(body);
  });

  it('joins message and error when CAD Trust sends both', async () => {
    const error = await failWith({
      status: 400,
      data: { message: 'Batch Upload Failed.', error: 'unexpected end of CSV', success: false },
    });

    expect(error.message).toBe('Batch Upload Failed. — unexpected end of CSV');
  });

  it('maps 404 to a not-found error', async () => {
    const error = await failWith({ status: 404, data: { message: 'Not found' } });

    expect(error).toBeInstanceOf(CadTrustNotFoundError);
  });

  it('discriminates a referential-integrity 409 by its references array', async () => {
    const error = await failWith({
      status: 409,
      data: {
        success: false,
        message: 'Cannot delete program',
        error: 'Referenced by other records',
        references: [{ table: 'project', count: 3 }],
      },
    });

    expect(error).toBeInstanceOf(CadTrustReferentialIntegrityError);
    expect(error.references).toEqual([{ table: 'project', count: 3 }]);
  });

  it('discriminates an org-operation-in-progress 409 by its operationStatus object', async () => {
    const operationStatus = {
      operation: 'V2 organization creation',
      status: 'Waiting for stores to confirm on blockchain (2/4 confirmed)',
      startedAt: '2026-01-26T12:00:00.000Z',
      elapsedSeconds: 195,
    };
    const error = await failWith({
      status: 409,
      data: { message: 'A home organization operation is already in progress', operationStatus, success: false },
    });

    expect(error).toBeInstanceOf(CadTrustOrgOperationInProgressError);
    expect(error.operationStatus).toEqual(operationStatus);
  });

  it('falls back to a plain conflict error for an unrecognised 409 shape', async () => {
    const error = await failWith({ status: 409, data: { message: 'Conflict' } });

    expect(error).toBeInstanceOf(CadTrustConflictError);
    expect(error).not.toBeInstanceOf(CadTrustReferentialIntegrityError);
    expect(error).not.toBeInstanceOf(CadTrustOrgOperationInProgressError);
  });

  it('maps 429 to a retryable rate-limit error', async () => {
    const error = await failWith({ status: 429, data: { message: 'Slow down' } });

    expect(error).toBeInstanceOf(CadTrustRateLimitError);
    expect(isRetryableError(error)).toBe(true);
  });

  it('maps 5xx to a retryable server error', async () => {
    const error = await failWith({ status: 503, data: { message: 'Service unavailable' } });

    expect(error).toBeInstanceOf(CadTrustServerError);
    expect(isRetryableError(error)).toBe(true);
  });

  it('falls back to the base class for any other non-2xx status', async () => {
    const error = await failWith({ status: 302, data: {} });

    expect(error).toBeInstanceOf(CadTrustHttpError);
    expect(error.constructor.name).toBe('CadTrustHttpError');
    expect(isRetryableError(error)).toBe(false);
  });

  it('always carries the request context and raw body', async () => {
    const error = await failWith({ status: 500, data: { message: 'boom' }, headers: { 'x-trace': 'abc' } });

    expect(error.method).toBe('POST');
    expect(error.url).toBe('http://localhost:31310/v2/project');
    expect(error.status).toBe(500);
    expect(error.body).toEqual({ message: 'boom' });
    expect(error.headers).toEqual({ 'x-trace': 'abc' });
  });
});
