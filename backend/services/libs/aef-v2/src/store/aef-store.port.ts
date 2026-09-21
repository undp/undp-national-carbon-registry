import { AefCreateInputMap, AefRecordMap, AefTableName } from '../tables';

/** Sort direction for {@link AefQuery}. */
export type AefSortOrder = 'ASC' | 'DESC';

export interface AefQuery {
  /** 1-based. */
  page?: number;
  /** Defaults to 25 in every implementation shipped here. */
  pageSize?: number;
  /** Exact-match filters, keyed by field. */
  where?: Readonly<Record<string, unknown>>;
  /**
   * `IN (...)` filters, keyed by field.
   *
   * Exists so a lookup across several ids resolves in one query — reading a
   * year's Holdings across every Submission version, for instance, rather than
   * one round trip per version. An empty array matches nothing.
   */
  whereIn?: Readonly<Record<string, readonly unknown[]>>;
  sort?: { key: string; order: AefSortOrder };
}

export interface AefPage<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * The only persistence contract.
 *
 * Table-keyed and generic, so `store.create('t3Actions', …)` is fully typed
 * without a method per table. A consuming registry may implement this over
 * anything — the TypeORM adapter in `src/typeorm/` is one implementation, and
 * `testing/in-memory-store` is another.
 *
 * **The store never validates.** A partial record is a legitimate draft; see
 * `validation/validate` for when completeness is enforced.
 */
export interface AefStore {
  create<K extends AefTableName>(table: K, input: AefCreateInputMap[K]): Promise<AefRecordMap[K]>;

  update<K extends AefTableName>(
    table: K,
    id: string,
    input: AefCreateInputMap[K],
  ): Promise<AefRecordMap[K]>;

  findById<K extends AefTableName>(table: K, id: string): Promise<AefRecordMap[K] | undefined>;

  find<K extends AefTableName>(table: K, query?: AefQuery): Promise<AefPage<AefRecordMap[K]>>;

  delete(table: AefTableName, id: string): Promise<void>;
}

/** DI token, for hosts that wire the store through a container. */
export const AEF_STORE = Symbol('AEF_STORE');

export const DEFAULT_PAGE_SIZE = 25;
