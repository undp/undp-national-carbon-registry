import { Clock, systemClock } from '../clock';
import { AefPage, AefQuery, AefStore, DEFAULT_PAGE_SIZE } from '../store/aef-store.port';
import {
  AEF_TABLE_NAMES,
  AefCreateInputMap,
  AefRecordMap,
  AefTableName,
} from '../tables';
import { AefSubmissionStatus } from '../tables/aefT1Submission';

/**
 * In-memory {@link AefStore}, for tests and for driving a UI before a database
 * exists.
 *
 * Exported from the package so a consuming registry can test its own mapping
 * and provider code without standing up Postgres.
 */
export class InMemoryAefStore implements AefStore {
  private readonly rows = new Map<AefTableName, Map<string, Record<string, unknown>>>();
  private sequence = 0;

  constructor(
    private readonly idFactory: () => string = () => `mem-${++this.sequence}`,
    /** Timestamps go through the clock seam like everything else — see `clock.ts`. */
    private readonly clock: Clock = systemClock,
  ) {
    for (const table of AEF_TABLE_NAMES) {
      this.rows.set(table, new Map());
    }
  }

  private table(table: AefTableName): Map<string, Record<string, unknown>> {
    const store = this.rows.get(table);
    if (!store) {
      throw new Error(`Unknown AEF table "${table}"`);
    }
    return store;
  }

  async create<K extends AefTableName>(
    table: K,
    input: AefCreateInputMap[K],
  ): Promise<AefRecordMap[K]> {
    const now = this.clock.now().toISOString();
    const id = this.idFactory();
    const record: Record<string, unknown> = {
      ...(table === 't1Submission' ? { status: AefSubmissionStatus.DRAFT } : {}),
      ...(input as Record<string, unknown>),
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.table(table).set(id, record);
    return this.clone(record) as unknown as AefRecordMap[K];
  }

  async update<K extends AefTableName>(
    table: K,
    id: string,
    input: AefCreateInputMap[K],
  ): Promise<AefRecordMap[K]> {
    const existing = this.table(table).get(id);
    if (!existing) {
      throw new Error(`No ${table} record with id "${id}"`);
    }
    const patch = input as Record<string, unknown>;
    const merged: Record<string, unknown> = {
      ...existing,
      ...patch,
      id,
      updatedAt: this.clock.now().toISOString(),
    };
    this.table(table).set(id, merged);
    return this.clone(merged) as unknown as AefRecordMap[K];
  }

  async findById<K extends AefTableName>(
    table: K,
    id: string,
  ): Promise<AefRecordMap[K] | undefined> {
    const found = this.table(table).get(id);
    return found ? (this.clone(found) as unknown as AefRecordMap[K]) : undefined;
  }

  async find<K extends AefTableName>(
    table: K,
    query: AefQuery = {},
  ): Promise<AefPage<AefRecordMap[K]>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE);

    let matches = [...this.table(table).values()].filter((record) => {
      for (const [key, value] of Object.entries(query.where ?? {})) {
        if (record[key] !== value) {
          return false;
        }
      }
      for (const [key, values] of Object.entries(query.whereIn ?? {})) {
        // An empty set matches nothing, mirroring the SQL store rather than
        // silently dropping the filter.
        if (!values.includes(record[key])) {
          return false;
        }
      }
      return true;
    });

    if (query.sort) {
      const { key, order } = query.sort;
      matches = [...matches].sort((a, b) => {
        const left = a[key];
        const right = b[key];
        if (left === right) return 0;
        const ascending = (left as never) > (right as never) ? 1 : -1;
        return order === 'DESC' ? -ascending : ascending;
      });
    }

    const start = (page - 1) * pageSize;
    return {
      data: matches.slice(start, start + pageSize).map((row) => this.clone(row)) as unknown as AefRecordMap[K][],
      total: matches.length,
      page,
      pageSize,
    };
  }

  async delete(table: AefTableName, id: string): Promise<void> {
    this.table(table).delete(id);
  }

  /** Every stored row for a table. Test convenience, not part of the port. */
  all<K extends AefTableName>(table: K): AefRecordMap[K][] {
    return [...this.table(table).values()].map((row) => this.clone(row)) as unknown as AefRecordMap[K][];
  }

  clear(): void {
    for (const table of AEF_TABLE_NAMES) {
      this.table(table).clear();
    }
  }

  /**
   * Records are copied in and out.
   *
   * Without this a caller could mutate stored state by holding on to a returned
   * object, which a real database would never allow — and a test that passes
   * only because of shared references is worse than no test.
   */
  private clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}
