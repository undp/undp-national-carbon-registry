/**
 * Liveness and diagnostics.
 *
 * Worth knowing before you use these: `/health` and `/diagnostics` are mounted on
 * the SERVER ROOT, not under `/v2`, and they keep answering while the wallet or
 * DataLayer is still syncing and while migrations run — which is exactly when the
 * rest of the API does not. That makes them the right pre-flight check before a
 * sync run. `/v2/health` is the one that does live under the v2 prefix.
 */

import { CadTrustContext } from '../config';
import { request } from '../http/request';
import type {
  DiagnosticsResponse,
  HealthResponse,
  WalletHealthResponse,
} from '../interfaces/actions/system';

/** `/diagnostics` probes subsystems with per-section timeouts; ~30s worst case. */
const DIAGNOSTICS_TIMEOUT_MS = 45_000;

export interface SystemClient {
  /** `GET /v2/health` — V2 API liveness. */
  getHealth(): Promise<HealthResponse>;
  /** `GET /health` — process liveness, mounted on the server root. */
  getRootHealth(): Promise<HealthResponse>;
  /** `GET /v2/health/wallet` — wallet sync and pending-transaction summary. */
  getWalletHealth(): Promise<WalletHealthResponse>;
  /**
   * `GET /diagnostics` — full debug snapshot, on the server root.
   * Returns 403 (CadTrustAuthError with `readOnlyNode`) when the node is READ_ONLY.
   * Uses a raised timeout because individual probes can take ~10s each.
   */
  getDiagnostics(): Promise<DiagnosticsResponse>;
}

export function createSystemClient(ctx: CadTrustContext): SystemClient {
  return {
    getHealth() {
      return request<HealthResponse>(ctx, { method: 'GET', path: '/health' });
    },

    getRootHealth() {
      return request<HealthResponse>(ctx, {
        method: 'GET',
        path: '/health',
        baseUrl: ctx.rootUrl,
      });
    },

    getWalletHealth() {
      return request<WalletHealthResponse>(ctx, { method: 'GET', path: '/health/wallet' });
    },

    getDiagnostics() {
      return request<DiagnosticsResponse>(ctx, {
        method: 'GET',
        path: '/diagnostics',
        baseUrl: ctx.rootUrl,
        timeoutMs: DIAGNOSTICS_TIMEOUT_MS,
      });
    },
  };
}
