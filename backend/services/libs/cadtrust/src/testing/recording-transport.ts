/**
 * A recording, PASSTHROUGH transport — for capturing real requests/responses, not scripting fakes.
 *
 * `fake-transport.ts` records requests while replying from a script, for offline unit tests.
 * This is the live-node counterpart: it forwards every request to a real `HttpTransport` (the real
 * `axiosTransport` by default) unchanged, and records the literal wire request and response as it
 * goes. Used by `live/*.capture.spec.ts` files to reconcile this package's vendored interface types
 * against what a real CADT node actually sends — see `live/organizations.capture.spec.ts` for the
 * first one, and its doc comment for why a recording transport is the right tool for that rather
 * than a hand-built Postman collection: it guarantees the captured shapes are byte-for-byte what the
 * typed client (and therefore production code) actually sends, with no separate copy to drift.
 */

import { HttpTransport, HttpMethod, axiosTransport } from '../http/transport';

/** One real request/response pair, as it actually happened on the wire. */
export interface RecordedCall {
  method: HttpMethod;
  /** Fully-qualified URL, query string already applied. */
  url: string;
  requestHeaders: Record<string, string>;
  /** `'[multipart FormData]'` in place of the real body for file uploads — not worth serialising. */
  requestBody?: unknown;
  /** Present only once a response arrived (absent when `error` is set instead). */
  status?: number;
  responseHeaders?: Record<string, string>;
  /** `'[binary N bytes]'` in place of the real body for buffer responses (XLSX/offer downloads). */
  responseBody?: unknown;
  /** Set only when the transport itself threw — no response arrived at all. */
  error?: string;
}

export interface RecordingTransport {
  transport: HttpTransport;
  /** Every call made through this transport, in order. */
  calls: RecordedCall[];
}

/**
 * Wraps `inner` (defaults to the real `axiosTransport`) so every request/response is pushed onto
 * `calls` as it happens, then forwarded/returned unchanged — the wrapped client behaves exactly as
 * it would unwrapped, this only observes.
 */
export function createRecordingTransport(inner: HttpTransport = axiosTransport): RecordingTransport {
  const calls: RecordedCall[] = [];

  const transport: HttpTransport = async (req) => {
    const call: RecordedCall = {
      method: req.method,
      url: req.url,
      requestHeaders: req.headers,
      requestBody:
        typeof FormData !== 'undefined' && req.body instanceof FormData
          ? '[multipart FormData]'
          : req.body,
    };
    calls.push(call);

    try {
      const response = await inner(req);
      call.status = response.status;
      call.responseHeaders = response.headers;
      call.responseBody = Buffer.isBuffer(response.data)
        ? `[binary ${response.data.length} bytes]`
        : response.data;
      return response;
    } catch (error) {
      call.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  };

  return { transport, calls };
}
