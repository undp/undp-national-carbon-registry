import { REF_ROLES, RefResolverRegistry, RefRole } from '../refs/resolver';
import { AefTableName } from '../tables';
import { AefValidationIssue, issue } from './issues';

/** The column each role is stored in. */
const COLUMN_FOR_ROLE: Readonly<Record<RefRole, string>> = {
  project: 'projectId',
  unit: 'unitId',
};

export interface RegistryRefCheck {
  table: AefTableName;
  records: readonly Readonly<Record<string, unknown>>[];
}

/**
 * Checks that every `projectId` / `unitId` resolves in the host registry.
 *
 * **Separate from `validateRecord` and `validateSubmission`, and async.** Those
 * two are synchronous and pure; this one needs I/O, and most callers do not want
 * to pay for it on every keystroke. Run it before filing, not while editing.
 *
 * A role with **no registered resolver is skipped, not failed**. An unbound
 * library cannot know whether an identifier is valid, and guessing would make
 * every deployment that has not wired up resolvers permanently unsubmittable.
 *
 * Ids are de-duplicated and resolved in one batch per role, so a table of a few
 * hundred rows referencing a handful of projects costs a handful of lookups.
 */
export async function validateRegistryRefs(
  checks: readonly RegistryRefCheck[],
  resolvers: RefResolverRegistry,
): Promise<AefValidationIssue[]> {
  const issues: AefValidationIssue[] = [];

  for (const role of REF_ROLES) {
    if (!resolvers.has(role)) {
      continue;
    }

    const column = COLUMN_FOR_ROLE[role];

    /** id -> the records referencing it, so an issue can name the offender. */
    const referencedBy = new Map<string, { table: AefTableName; recordId?: string }[]>();

    for (const { table, records } of checks) {
      for (const record of records) {
        const value = record[column];
        if (typeof value !== 'string' || value.trim().length === 0) {
          continue;
        }
        const entry = {
          table,
          recordId: typeof record.id === 'string' ? record.id : undefined,
        };
        const bucket = referencedBy.get(value);
        if (bucket) {
          bucket.push(entry);
        } else {
          referencedBy.set(value, [entry]);
        }
      }
    }

    if (referencedBy.size === 0) {
      continue;
    }

    const resolved = await resolvers.resolveMany(role, [...referencedBy.keys()]);

    for (const [id, holders] of referencedBy) {
      if (resolved.has(id)) {
        continue;
      }
      for (const holder of holders) {
        issues.push(
          issue(
            'unresolved-registry-ref',
            holder.table,
            `${column} "${id}" does not resolve to a ${role} in this registry`,
            { key: column, recordId: holder.recordId },
          ),
        );
      }
    }
  }

  return issues;
}
