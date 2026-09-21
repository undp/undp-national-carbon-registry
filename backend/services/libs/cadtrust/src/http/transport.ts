/**
 * The transport seam.
 *
 * This is the ONLY file in the package that imports axios. Everything else talks
 * to the `HttpTransport` function type, which is what makes the whole client unit
 * testable without a live CADT node (and swappable if a deployment needs a
 * proxy-aware or instrumented HTTP stack).
 */

import axios from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface TransportRequest {
  method: HttpMethod;
  /** Fully-qualified URL, query string already applied. */
  url: string;
  headers: Record<string, string>;
  /** A JSON-serialisable object, a FormData instance, or nothing. */
  body?: unknown;
  timeoutMs: number;
  /** 'buffer' for the XLSX exports and the offer-file download. */
  responseType: 'json' | 'buffer';
}

export interface TransportResponse {
  status: number;
  headers: Record<string, string>;
  /** Parsed JSON for responseType 'json'; a Buffer for 'buffer'. */
  data: unknown;
}

/**
 * A transport MUST NOT throw on a non-2xx status — classifying HTTP failures is
 * `request.ts`'s job, and it needs the body to tell a referential-integrity 409
 * from an org-operation-in-progress 409. Throw only when no response arrived at
 * all (DNS failure, refused connection, socket reset, timeout).
 */
export type HttpTransport = (req: TransportRequest) => Promise<TransportResponse>;

function normalizeHeaders(raw: unknown): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') {
    return headers;
  }
  // Axios 1.x returns an AxiosHeaders instance, which exposes toJSON().
  const source =
    typeof (raw as { toJSON?: () => unknown }).toJSON === 'function'
      ? ((raw as { toJSON: () => unknown }).toJSON() as Record<string, unknown>)
      : (raw as Record<string, unknown>);

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value !== null) {
      headers[key.toLowerCase()] = String(value);
    }
  }
  return headers;
}

/** Default transport, built on the axios version this repo already depends on. */
export const axiosTransport: HttpTransport = async (req) => {
  const response = await axios.request({
    method: req.method,
    url: req.url,
    headers: req.headers,
    data: req.body,
    timeout: req.timeoutMs,
    responseType: req.responseType === 'buffer' ? 'arraybuffer' : 'json',
    // Hand every status back to the caller; see the note on HttpTransport above.
    validateStatus: () => true,
    // The XLSX exports and offer files have no meaningful upper bound.
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return {
    status: response.status,
    headers: normalizeHeaders(response.headers),
    data:
      req.responseType === 'buffer' && response.data !== undefined && response.data !== null
        ? Buffer.from(response.data as ArrayBuffer)
        : response.data,
  };
};
