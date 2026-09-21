/**
 * Query-string serialisation for CADT v2 list endpoints.
 *
 * Kept separate from `request.ts` so its edge cases (repeatable `columns`,
 * boolean `xls`, dropping undefined) are testable in isolation.
 */

export type QueryValue = string | number | boolean | undefined | null | Array<string | number>;
export type QueryParams = Record<string, QueryValue>;

/**
 * Serialises a query object into a leading-`?` string, or `''` when nothing
 * survives. Rules, all taken from the API guide's own examples:
 *
 *  - `undefined` and `null` values are dropped entirely (so callers can spread
 *    optional filters without guarding each one).
 *  - Arrays are emitted as a repeated key (`columns=a&columns=b`), which is what
 *    the guide's `columns` examples use — not a comma-joined value.
 *  - Booleans are emitted as `true` / `false` (`xls=true`).
 */
export function serializeQuery(query?: QueryParams): string {
  if (!query) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null) {
          params.append(key, String(item));
        }
      }
      continue;
    }
    params.append(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * Narrowing helper for the typed query interfaces in the interfaces package
 * (`ListQueryParams`, `StagingListQueryParams`). They are plain interfaces, so
 * they carry no index signature and TypeScript will not widen them to
 * `QueryParams` on its own — but every one of their members is already a legal
 * query value.
 */
export function asQuery(params: object | undefined): QueryParams | undefined {
  return params as QueryParams | undefined;
}
