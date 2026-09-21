/**
 * Generic CRUD, parameterised by resource path and type.
 *
 * These six functions are the entire CRUD implementation for all 21 resources.
 * `entities.ts` adds nothing but type parameters on top.
 */

import { CadTrustContext } from '../config';
import { request } from '../http/request';
import { asQuery } from '../http/query';
import { ListQueryParams, PagedResponse } from '../interfaces/common';
import { ResourceDefinition } from './registry';

/**
 * A change written to the CADT node's PRIVATE, LOCAL staging table.
 *
 * Nothing wrapped in this type is visible to any other registry, to the CAD Trust
 * dashboard, or to the blockchain. It becomes public only when a separate
 * `client.staging.commit()` call runs. No method in this package ever commits on
 * your behalf.
 */
export interface Staged<T> {
  readonly staged: true;
  response: T;
}

function staged<T>(response: T): Staged<T> {
  return { staged: true, response };
}

/** The documented pagination contract: page >= 1, 1 <= limit <= 1000, both required. */
export const MAX_PAGE_LIMIT = 1000;

export function assertPagination(query: { page?: number; limit?: number }): void {
  const { page, limit } = query ?? {};

  if (typeof page !== 'number' || !Number.isInteger(page) || page < 1) {
    throw new TypeError(
      `CAD Trust list endpoints require an integer "page" >= 1 (received ${JSON.stringify(page)}).`,
    );
  }
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) {
    throw new TypeError(
      `CAD Trust list endpoints require an integer "limit" between 1 and ${MAX_PAGE_LIMIT} (received ${JSON.stringify(
        limit,
      )}).`,
    );
  }
}

/** `POST {path}` — stages a create. Does not publish. */
export async function stageCreate<TInput, TResponse>(
  ctx: CadTrustContext,
  path: string,
  body: TInput,
): Promise<Staged<TResponse>> {
  return staged(await request<TResponse>(ctx, { method: 'POST', path, body }));
}

/**
 * `PUT {path}/{id}` — stages an update. Does not publish.
 *
 * CAD Trust's PUT is a FULL REPLACE, not a patch: every field must be present.
 * That is why every `*UpdateInput` in the interfaces package is an alias of its
 * `*CreateInput`. Fetching the current record first is the caller's job.
 */
export async function stageUpdate<TInput, TResponse>(
  ctx: CadTrustContext,
  path: string,
  id: string,
  body: TInput,
): Promise<Staged<TResponse>> {
  return staged(
    await request<TResponse>(ctx, { method: 'PUT', path: `${path}/${encodeURIComponent(id)}`, body }),
  );
}

/** `DELETE {path}/{id}` — stages a delete. Does not publish. */
export async function stageDelete<TResponse>(
  ctx: CadTrustContext,
  path: string,
  id: string,
): Promise<Staged<TResponse>> {
  return staged(
    await request<TResponse>(ctx, { method: 'DELETE', path: `${path}/${encodeURIComponent(id)}` }),
  );
}

/** `GET {path}/{id}`. */
export async function getRecord<TRecord>(
  ctx: CadTrustContext,
  path: string,
  id: string,
): Promise<TRecord> {
  return request<TRecord>(ctx, { method: 'GET', path: `${path}/${encodeURIComponent(id)}` });
}

/** `GET {path}?page=&limit=` — one page. */
export async function listRecords<TRecord>(
  ctx: CadTrustContext,
  path: string,
  query: ListQueryParams,
): Promise<PagedResponse<TRecord>> {
  assertPagination(query);
  return request<PagedResponse<TRecord>>(ctx, { method: 'GET', path, query: asQuery(query) });
}

/**
 * Walks every page and yields records one at a time. Stops at `pageCount`, or
 * early if a page comes back empty (a node that ignores the requested page would
 * otherwise loop forever).
 */
export async function* listAllRecords<TRecord>(
  ctx: CadTrustContext,
  path: string,
  query: Omit<ListQueryParams, 'page'>,
): AsyncGenerator<TRecord, void, undefined> {
  let page = 1;
  let pageCount = 1;

  do {
    const result = await listRecords<TRecord>(ctx, path, { ...query, page });
    const rows = result?.data ?? [];
    if (rows.length === 0) {
      return;
    }
    for (const row of rows) {
      yield row;
    }
    pageCount = result.pageCount ?? 1;
    page += 1;
  } while (page <= pageCount);
}

/** The typed surface a single resource exposes. */
export interface ResourceClient<TCreate, TUpdate, TRecord, TCreateResponse, TMutationResponse> {
  readonly path: string;
  readonly primaryKey: string;
  stageCreate(body: TCreate): Promise<Staged<TCreateResponse>>;
  stageUpdate(id: string, body: TUpdate): Promise<Staged<TMutationResponse>>;
  stageDelete(id: string): Promise<Staged<TMutationResponse>>;
  get(id: string): Promise<TRecord>;
  list(query: ListQueryParams): Promise<PagedResponse<TRecord>>;
  listAll(query: Omit<ListQueryParams, 'page'>): AsyncGenerator<TRecord, void, undefined>;
}

/** Binds the generics above to one resource definition. */
export function makeResource<TCreate, TUpdate, TRecord, TCreateResponse, TMutationResponse>(
  ctx: CadTrustContext,
  definition: ResourceDefinition,
): ResourceClient<TCreate, TUpdate, TRecord, TCreateResponse, TMutationResponse> {
  const { path, primaryKey } = definition;

  return {
    path,
    primaryKey,
    stageCreate: (body) => stageCreate<TCreate, TCreateResponse>(ctx, path, body),
    stageUpdate: (id, body) => stageUpdate<TUpdate, TMutationResponse>(ctx, path, id, body),
    stageDelete: (id) => stageDelete<TMutationResponse>(ctx, path, id),
    get: (id) => getRecord<TRecord>(ctx, path, id),
    list: (query) => listRecords<TRecord>(ctx, path, query),
    listAll: (query) => listAllRecords<TRecord>(ctx, path, query),
  };
}
