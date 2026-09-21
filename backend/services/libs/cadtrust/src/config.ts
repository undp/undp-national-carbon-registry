/**
 * Client configuration and the resolved context every request carries.
 *
 * There is no hardcoded host, port or API key anywhere else in this package.
 * Pointing at a different CADT node — a different environment, or another
 * registry's node entirely — is a pure config change.
 */

import { DEFAULT_RETRY, RetryOptions, Sleep, realSleep } from './http/retry';
import { HttpTransport, axiosTransport } from './http/transport';

/** The CADT RPC API listens on port 31310 by default and mounts v2 under /v2. */
export const DEFAULT_BASE_URL = 'http://localhost:31310/v2';
export const DEFAULT_TIMEOUT_MS = 30_000;

/** Minimal logger shape, so a Nest `Logger` can be passed straight in. */
export interface CadTrustLogger {
  log(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
}

export interface CadTrustClientConfig {
  /** Defaults to `http://localhost:31310/v2`. A trailing slash is tolerated. */
  baseUrl?: string;
  /**
   * Sent as `x-api-key` on EVERY request when present. Per the API guide this is
   * a global check on the node (set via CADT_API_KEY), not a per-endpoint one —
   * including on the root-mounted /health and /diagnostics routes.
   */
  apiKey?: string;
  /** Per-request timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
  /** Retry policy for transient failures. See http/retry.ts for why this is conservative. */
  retry?: Partial<RetryOptions>;
  /** Injection seam for tests and for instrumented HTTP stacks. Defaults to axios. */
  transport?: HttpTransport;
  /** Injection seam for tests (fake timers). Defaults to setTimeout. */
  sleep?: Sleep;
  logger?: CadTrustLogger;
}

/** Config after defaults are applied. Passed to every internal function. */
export interface CadTrustContext {
  /** Normalised, no trailing slash, e.g. `http://localhost:31310/v2`. */
  baseUrl: string;
  /**
   * Server root, e.g. `http://localhost:31310`. The `/health` and `/diagnostics`
   * routes are mounted here rather than under /v2 — see actions/system.ts.
   */
  rootUrl: string;
  apiKey?: string;
  timeoutMs: number;
  retry: RetryOptions;
  transport: HttpTransport;
  sleep: Sleep;
  logger?: CadTrustLogger;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Derives the server root from the base URL by dropping a trailing `/v1` or
 * `/v2` segment. If the base URL points somewhere else entirely (a reverse proxy
 * with its own prefix), the base URL is returned unchanged — callers of the
 * system endpoints should then override it explicitly.
 */
function deriveRootUrl(baseUrl: string): string {
  return stripTrailingSlash(baseUrl.replace(/\/v[12]$/, ''));
}

export function resolveConfig(config: CadTrustClientConfig = {}): CadTrustContext {
  const baseUrl = stripTrailingSlash(config.baseUrl || DEFAULT_BASE_URL);

  return {
    baseUrl,
    rootUrl: deriveRootUrl(baseUrl),
    apiKey: config.apiKey || undefined,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    retry: { ...DEFAULT_RETRY, ...config.retry },
    transport: config.transport ?? axiosTransport,
    sleep: config.sleep ?? realSleep,
    logger: config.logger,
  };
}
