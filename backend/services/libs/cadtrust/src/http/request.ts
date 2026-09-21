/**
 * The single low-level request function every typed method in this package
 * funnels through. No other file is permitted to call the transport directly —
 * that is what keeps auth, timeouts, retry policy and error classification in
 * exactly one place instead of copy-pasted across ~90 endpoint methods.
 */

import { CadTrustContext } from '../config';
import { classifyResponse, classifyTransportFailure } from './errors';
import { filenameFromContentDisposition, buildMultipart, FileUpload } from './multipart';
import { QueryParams, serializeQuery } from './query';
import { HttpMethod } from './transport';
import { withRetry } from './retry';

export interface RequestOptions {
  method: HttpMethod;
  /** Path relative to the base URL, e.g. `/project` or `/staging/commit`. */
  path: string;
  query?: QueryParams;
  /** JSON request body. Mutually exclusive with `multipart`. */
  body?: unknown;
  /** Multipart file upload. Mutually exclusive with `body`. */
  multipart?: { field: string; file: FileUpload };
  /**
   * Override the base URL for this call. Used only by the system endpoints,
   * which are mounted on the server root rather than under /v2.
   */
  baseUrl?: string;
  /** Override the client-wide timeout — `/diagnostics` can take ~30s. */
  timeoutMs?: number;
  /**
   * Opt into retrying transient failures. Defaults to true for GET and false for
   * every mutation, because CADT mutations stage records and a blind retry after
   * an ambiguous failure risks double-staging.
   */
  retryable?: boolean;
}

/** A binary payload: the XLSX exports and the datalayer offer file. */
export interface BinaryResponse {
  data: Buffer;
  /** Server-suggested filename from `Content-Disposition`, when it sent one. */
  filename?: string;
  contentType?: string;
}

function buildUrl(ctx: CadTrustContext, options: RequestOptions): string {
  const base = options.baseUrl ?? ctx.baseUrl;
  const path = options.path.startsWith('/') ? options.path : `/${options.path}`;
  return `${base}${path}${serializeQuery(options.query)}`;
}

function buildHeaders(ctx: CadTrustContext, options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  if (ctx.apiKey) {
    headers['x-api-key'] = ctx.apiKey;
  }

  // Never set Content-Type for multipart — only the FormData instance knows its
  // own boundary, and overriding it produces an unparseable request.
  if (!options.multipart && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function execute(
  ctx: CadTrustContext,
  options: RequestOptions,
  responseType: 'json' | 'buffer',
) {
  const url = buildUrl(ctx, options);
  const headers = buildHeaders(ctx, options);
  const body = options.multipart
    ? buildMultipart(options.multipart.field, options.multipart.file)
    : options.body;

  const send = async () => {
    let response;
    try {
      response = await ctx.transport({
        method: options.method,
        url,
        headers,
        body,
        timeoutMs: options.timeoutMs ?? ctx.timeoutMs,
        responseType,
      });
    } catch (error) {
      throw classifyTransportFailure(error, { method: options.method, url });
    }

    if (response.status < 200 || response.status >= 300) {
      throw classifyResponse({
        method: options.method,
        url,
        status: response.status,
        // An error body always comes back as JSON even when the happy path is
        // binary, so decode it rather than handing the caller raw bytes.
        body:
          responseType === 'buffer' && Buffer.isBuffer(response.data)
            ? tryParseJson(response.data.toString('utf8'))
            : response.data,
        headers: response.headers,
      });
    }

    return response;
  };

  const retryable = options.retryable ?? options.method === 'GET';
  const response = retryable
    ? await withRetry(send, ctx.retry, ctx.sleep)
    : await send();

  ctx.logger?.log(`CAD Trust ${options.method} ${url} -> ${response.status}`);
  return response;
}

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Issues a request and returns the parsed JSON body typed as `T`. */
export async function request<T>(ctx: CadTrustContext, options: RequestOptions): Promise<T> {
  const response = await execute(ctx, options, 'json');
  return response.data as T;
}

/** Issues a request and returns the raw bytes plus any server-suggested filename. */
export async function requestBinary(
  ctx: CadTrustContext,
  options: RequestOptions,
): Promise<BinaryResponse> {
  const response = await execute(ctx, options, 'buffer');
  const data = Buffer.isBuffer(response.data)
    ? response.data
    : Buffer.from((response.data ?? '') as string);

  return {
    data,
    filename: filenameFromContentDisposition(response.headers['content-disposition']),
    contentType: response.headers['content-type'],
  };
}
