/**
 * Typed error hierarchy for the CAD Trust v2 client.
 *
 * Nothing in this package ever throws a raw `Error`, and no axios exception is
 * allowed to escape upward. Every failure a caller can see is one of the classes
 * below, and every one of them carries the raw response so the caller can
 * inspect what CAD Trust actually said.
 */

export interface CadTrustErrorContext {
  method: string;
  url: string;
  status?: number;
  /** Parsed response body, verbatim. CAD Trust's own message is never rewritten. */
  body?: unknown;
  headers?: Record<string, string>;
  cause?: unknown;
}

/** Base class for every error this package throws. */
export class CadTrustHttpError extends Error {
  readonly method: string;
  readonly url: string;
  readonly status?: number;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly cause?: unknown;
  /** True when a retry could plausibly succeed (transient transport/server fault). */
  readonly retryable: boolean = false;

  constructor(message: string, ctx: CadTrustErrorContext) {
    super(message);
    this.name = new.target.name;
    this.method = ctx.method;
    this.url = ctx.url;
    this.status = ctx.status;
    this.body = ctx.body;
    this.headers = ctx.headers;
    this.cause = ctx.cause;
    // Required because the build targets ES2017 with a downlevelled class hierarchy;
    // without this, `instanceof` against subclasses fails.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The request never produced an HTTP response: DNS, refused connection, socket reset, timeout. */
export class CadTrustNetworkError extends CadTrustHttpError {
  readonly retryable = true;
}

/** The configured request timeout elapsed. Also used by the org-creation poller. */
export class CadTrustTimeoutError extends CadTrustNetworkError {}

/**
 * 401 / 403. Never retried — a missing or wrong `x-api-key` will not fix itself.
 * A CADT node started with READ_ONLY=true also answers 403 to every mutating call
 * and to /diagnostics, which is a configuration problem rather than a credential
 * one; `readOnlyNode` flags that case when the message gives it away.
 */
export class CadTrustAuthError extends CadTrustHttpError {
  readonly readOnlyNode: boolean;

  constructor(message: string, ctx: CadTrustErrorContext, readOnlyNode = false) {
    super(message, ctx);
    this.readOnlyNode = readOnlyNode;
  }
}

/**
 * 400 / 422. The CAD Trust message is surfaced as-is and the full body is
 * attached — for batch CSV uploads that body carries the per-row `errors[]`.
 */
export class CadTrustValidationError extends CadTrustHttpError {}

/** 404. */
export class CadTrustNotFoundError extends CadTrustHttpError {}

/** 409, shape not otherwise recognised. */
export class CadTrustConflictError extends CadTrustHttpError {}

/**
 * 409 raised because another record still references the one being deleted.
 *
 * The interfaces package only declares `*ReferentialIntegrityError` for program,
 * methodology and stakeholder — the three resources the API guide documents it
 * for. Detection here is deliberately SHAPE-based (body carries `references`),
 * not resource-based, so any resource behaving this way is classified correctly
 * even where the docs are silent.
 */
export class CadTrustReferentialIntegrityError extends CadTrustConflictError {
  readonly references: Array<{ table: string; count: number }>;

  constructor(
    message: string,
    ctx: CadTrustErrorContext,
    references: Array<{ table: string; count: number }>,
  ) {
    super(message, ctx);
    this.references = references;
  }
}

/**
 * 409 from the organization endpoints: only one home-organization operation
 * (create / upgrade / reclaim) may run at a time.
 */
export class CadTrustOrgOperationInProgressError extends CadTrustConflictError {
  readonly operationStatus: {
    operation: string;
    status: string;
    startedAt: string;
    elapsedSeconds: number;
  };

  constructor(
    message: string,
    ctx: CadTrustErrorContext,
    operationStatus: CadTrustOrgOperationInProgressError['operationStatus'],
  ) {
    super(message, ctx);
    this.operationStatus = operationStatus;
  }
}

/** Organization creation or upgrade reached state FAILED. Thrown by the poller, not by a request. */
export class CadTrustOrgCreationFailedError extends CadTrustHttpError {}

/** 5xx. Retryable. */
export class CadTrustServerError extends CadTrustHttpError {
  readonly retryable = true;
}

/** 429. Retryable. */
export class CadTrustRateLimitError extends CadTrustHttpError {
  readonly retryable = true;
}

const NETWORK_ERROR_CODES = [
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ERR_NETWORK',
  'ERR_BAD_RESPONSE',
];

const TIMEOUT_ERROR_CODES = ['ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNABORTED', 'ERR_CANCELED'];

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const parts = [record.message, record.error].filter(
      (part) => typeof part === 'string' && part.length > 0,
    );
    if (parts.length > 0) {
      return parts.join(' — ');
    }
  }
  if (typeof body === 'string' && body.length > 0) {
    return body;
  }
  return fallback;
}

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
}

/**
 * Maps a thrown transport failure (no HTTP response at all) onto the typed hierarchy.
 */
export function classifyTransportFailure(
  error: unknown,
  ctx: Omit<CadTrustErrorContext, 'status' | 'body' | 'headers'>,
): CadTrustNetworkError {
  const code = (error as { code?: string } | undefined)?.code;
  const rawMessage = (error as { message?: string } | undefined)?.message ?? String(error);

  if (code && TIMEOUT_ERROR_CODES.includes(code)) {
    return new CadTrustTimeoutError(
      `CAD Trust request timed out: ${ctx.method} ${ctx.url} (${code})`,
      { ...ctx, cause: error },
    );
  }
  if (code && NETWORK_ERROR_CODES.includes(code)) {
    return new CadTrustNetworkError(
      `CAD Trust node unreachable: ${ctx.method} ${ctx.url} (${code})`,
      { ...ctx, cause: error },
    );
  }
  return new CadTrustNetworkError(
    `CAD Trust request failed before a response was received: ${ctx.method} ${ctx.url} — ${rawMessage}`,
    { ...ctx, cause: error },
  );
}

/**
 * Maps a non-2xx HTTP response onto the typed hierarchy. See the README for the
 * full classification table.
 */
export function classifyResponse(ctx: CadTrustErrorContext): CadTrustHttpError {
  const status = ctx.status ?? 0;
  const body = asRecord(ctx.body);
  const message = messageFromBody(ctx.body, `CAD Trust responded ${status} for ${ctx.method} ${ctx.url}`);

  if (status === 401 || status === 403) {
    const readOnlyNode = status === 403 && /read[\s_-]?only/i.test(message);
    return new CadTrustAuthError(message, ctx, readOnlyNode);
  }

  if (status === 400 || status === 422) {
    return new CadTrustValidationError(message, ctx);
  }

  if (status === 404) {
    return new CadTrustNotFoundError(message, ctx);
  }

  if (status === 409) {
    if (Array.isArray(body.references)) {
      return new CadTrustReferentialIntegrityError(
        message,
        ctx,
        body.references as Array<{ table: string; count: number }>,
      );
    }
    if (body.operationStatus && typeof body.operationStatus === 'object') {
      return new CadTrustOrgOperationInProgressError(
        message,
        ctx,
        body.operationStatus as CadTrustOrgOperationInProgressError['operationStatus'],
      );
    }
    return new CadTrustConflictError(message, ctx);
  }

  if (status === 429) {
    return new CadTrustRateLimitError(message, ctx);
  }

  if (status >= 500) {
    return new CadTrustServerError(message, ctx);
  }

  return new CadTrustHttpError(message, ctx);
}

/** True when re-issuing the same request could plausibly succeed. */
export function isRetryableError(error: unknown): boolean {
  return error instanceof CadTrustHttpError && error.retryable;
}
