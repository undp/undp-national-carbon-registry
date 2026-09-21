import { DataSource, EntityManager, ObjectLiteral, Repository } from 'typeorm';

import { AefPage, AefQuery, AefStore, DEFAULT_PAGE_SIZE } from '../store/aef-store.port';
import { AefCreateInputMap, AefRecordMap, AefTableName } from '../tables';
import { AEF_ENTITY_BY_TABLE } from './entities';

/**
 * TypeORM/Postgres implementation of {@link AefStore}.
 *
 * The only implementation that assumes a database. A consumer using something
 * else ignores this whole directory and implements the port instead.
 */
export class AefTypeOrmStore implements AefStore {
  constructor(private readonly manager: EntityManager) {}

  static fromDataSource(dataSource: DataSource): AefTypeOrmStore {
    return new AefTypeOrmStore(dataSource.manager);
  }

  private repo(table: AefTableName): Repository<ObjectLiteral> {
    return this.manager.getRepository(AEF_ENTITY_BY_TABLE[table]);
  }

  async create<K extends AefTableName>(
    table: K,
    input: AefCreateInputMap[K],
  ): Promise<AefRecordMap[K]> {
    const repo = this.repo(table);
    const entity = repo.create(input as ObjectLiteral);
    const saved = await repo.save(entity);
    return saved as unknown as AefRecordMap[K];
  }

  async update<K extends AefTableName>(
    table: K,
    id: string,
    input: AefCreateInputMap[K],
  ): Promise<AefRecordMap[K]> {
    const repo = this.repo(table);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`No ${table} record with id "${id}"`);
    }
    const merged = repo.merge(existing, input as ObjectLiteral);
    const saved = await repo.save(merged);
    return saved as unknown as AefRecordMap[K];
  }

  async findById<K extends AefTableName>(
    table: K,
    id: string,
  ): Promise<AefRecordMap[K] | undefined> {
    const found = await this.repo(table).findOne({ where: { id } });
    return (found ?? undefined) as AefRecordMap[K] | undefined;
  }

  async find<K extends AefTableName>(
    table: K,
    query: AefQuery = {},
  ): Promise<AefPage<AefRecordMap[K]>> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE);

    const qb = this.repo(table).createQueryBuilder('record');

    for (const [key, value] of Object.entries(query.where ?? {})) {
      // Parameter names are derived from the key, so a caller cannot inject SQL
      // through `where`; the key itself is a column identifier we quote.
      qb.andWhere(`record."${key}" = :where_${key}`, { [`where_${key}`]: value });
    }

    for (const [key, values] of Object.entries(query.whereIn ?? {})) {
      if (values.length === 0) {
        // `IN ()` is a syntax error in Postgres, and an empty set should match
        // nothing rather than silently drop the filter.
        qb.andWhere('1 = 0');
        continue;
      }
      qb.andWhere(`record."${key}" IN (:...in_${key})`, { [`in_${key}`]: [...values] });
    }

    if (query.sort) {
      qb.orderBy(`record."${query.sort.key}"`, query.sort.order);
    }

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await qb.getManyAndCount();
    return { data: data as unknown as AefRecordMap[K][], total, page, pageSize };
  }

  async delete(table: AefTableName, id: string): Promise<void> {
    await this.repo(table).delete({ id });
  }
}
