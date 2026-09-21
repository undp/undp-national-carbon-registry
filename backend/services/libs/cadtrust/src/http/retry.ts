/**
 * Retry for transient failures only.
 *
 * Deliberately conservative: CADT mutations write to a staging table, so a blind
 * POST retry after an ambiguous failure risks double-staging a record that a
 * later commit would then publish twice. Retries are therefore opt-in per
 * request and default to GET only (see `request.ts`).
 */

import { isRetryableError } from './errors';

export interface RetryOptions {
  /** Total attempts including the first. 1 disables retrying. */
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export const DEFAULT_RETRY: RetryOptions = {
  attempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 5_000,
};

export type Sleep = (ms: number) => Promise<void>;

export const realSleep: Sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** Exponential backoff with full jitter, capped at `maxDelayMs`. */
export function backoffDelay(attempt: number, options: RetryOptions, random: () => number = Math.random): number {
  const exponential = options.baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(exponential, options.maxDelayMs);
  return Math.round(capped * (0.5 + random() * 0.5));
}

/**
 * Runs `operation`, retrying only while `isRetryableError` says the failure was
 * transient (network/timeout, 5xx, 429). Any 4xx propagates on the first attempt.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  sleep: Sleep = realSleep,
  random: () => number = Math.random,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= Math.max(1, options.attempts); attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt >= options.attempts;
      if (isLastAttempt || !isRetryableError(error)) {
        throw error;
      }
      await sleep(backoffDelay(attempt, options, random));
    }
  }

  throw lastError;
}
