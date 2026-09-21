/**
 * AUTO-EXTRACTED from Chia-Network/cadt docs/cadt_rpc_api_v2.md, "System endpoints" section.
 *
 * These routes are mounted on the SERVER ROOT, not under /v1 or /v2 (the one
 * exception being /v2/health, which exists under both). Unlike the rest of the
 * API they stay reachable while the wallet or DataLayer is still syncing and
 * while migrations are running — which makes them the right readiness probe to
 * run before starting a sync.
 *
 * If CADT_API_KEY is set, these use the same global `x-api-key` check as
 * everything else.
 */

// ---------------------------------------------------------------------------
// Liveness  ·  GET /health  ·  GET /v1/health  ·  GET /v2/health
// ---------------------------------------------------------------------------

export interface HealthResponse {
  message: string;
  timestamp: string;
  /** Disk-space summary for the Chia root partition. Field set is not documented in detail. */
  diskSpace: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Wallet sync summary  ·  GET /v1/health/wallet  ·  GET /v2/health/wallet
// NOTE: The guide names this endpoint but gives no example response body, so
// there is nothing concrete to type. Left as an open record rather than guessed.
// ---------------------------------------------------------------------------

export type WalletHealthResponse = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Diagnostics snapshot  ·  GET /diagnostics
// NOTE: Returns 403 when the node is started READ_ONLY.
// NOTE: Individual probes can take ~10s each, worst case ~30s total — call this
// with a raised timeout, not the client default.
// NOTE: The guide documents the top-level shape only and states explicitly that
// "nested fields vary with the environment", so the subsections below are typed
// as open records rather than invented.
// ---------------------------------------------------------------------------

/** Per-subsection health indicator used throughout the diagnostics payload. */
export type DiagnosticsStatus = 'ok' | 'warning' | 'critical';

export interface DiagnosticsResponse {
  timestamp: string;
  cadt: Record<string, unknown>;
  network: Record<string, unknown>;
  chia: Record<string, unknown>;
  system: Record<string, unknown>;
  [section: string]: unknown;
}
