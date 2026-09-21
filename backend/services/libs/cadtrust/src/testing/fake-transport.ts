/**
 * A recording, scriptable transport.
 *
 * This is the seam that lets the whole client be tested without a CADT node, and
 * it is exported from the package on purpose: an adaptor built on top of this
 * client needs exactly the same thing to test its own mapping logic.
 */

import { HttpTransport, TransportRequest, TransportResponse } from '../http/transport';

/** One scripted reply. Set `throws` to simulate a transport-level failure (no HTTP response). */
export interface FakeReply {
  status?: number;
  headers?: Record<string, string>;
  data?: unknown;
  /** When set, the transport rejects with this instead of replying. */
  throws?: unknown;
}

export type FakeScript = FakeReply | FakeReply[] | ((req: TransportRequest) => FakeReply);

export interface FakeTransport {
  transport: HttpTransport;
  /** Every request the client attempted, in order — retries included. */
  requests: TransportRequest[];
  /** Convenience accessor for the single-request case. */
  lastRequest(): TransportRequest | undefined;
}

/**
 * When `script` is an array, replies are consumed in order and the final entry
 * repeats once the list is exhausted — which is what a retry test wants.
 */
export function createFakeTransport(script: FakeScript = {}): FakeTransport {
  const requests: TransportRequest[] = [];
  let index = 0;

  const nextReply = (req: TransportRequest): FakeReply => {
    if (typeof script === 'function') {
      return script(req);
    }
    if (Array.isArray(script)) {
      const reply = script[Math.min(index, script.length - 1)] ?? {};
      index += 1;
      return reply;
    }
    return script;
  };

  const transport: HttpTransport = async (req) => {
    requests.push(req);
    const reply = nextReply(req);

    if (reply.throws !== undefined) {
      throw reply.throws;
    }

    const response: TransportResponse = {
      status: reply.status ?? 200,
      headers: reply.headers ?? {},
      data: reply.data,
    };
    return response;
  };

  return {
    transport,
    requests,
    lastRequest: () => requests[requests.length - 1],
  };
}

/** Builds a Node-style transport failure, e.g. `transportError('ECONNREFUSED')`. */
export function transportError(code: string, message = code): Error & { code: string } {
  return Object.assign(new Error(message), { code });
}
