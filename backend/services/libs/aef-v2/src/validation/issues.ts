import { AefTableName } from '../tables';

export type AefIssueCode =
  /** A field the spec marks `required: true` is empty. */
  | 'required'
  /** A conditionally applicable field is empty where its condition holds. */
  | 'conditional-required'
  /** A value is present on a field that does not apply to this record. */
  | 'not-applicable'
  /** Wrong primitive type — a string where the spec says integer, say. */
  | 'wrong-type'
  /** Fails the field's documented format. */
  | 'format'
  /** Not in the controlled list, where one is known. */
  | 'unknown-controlled-value'
  /** A CARP-populated field was written by the registry. */
  | 'carp-populated'
  /** Cross-record: an Action or Holding references a missing Authorization. */
  | 'missing-authorization'
  /** Cross-record: an Action references an Authorized entity missing from Table 5. */
  | 'missing-entity'
  /** Cross-record: an immutable block attribute changes across its lifecycle. */
  | 'inconsistent-block'
  /** Cross-record: `ItmoFirstId` is greater than `ItmoLastId`. */
  | 'invalid-block-range'
  /** Cross-record: two blocks from the same registry overlap. */
  | 'overlapping-block'
  /**
   * A `projectId` / `unitId` does not resolve in the host registry.
   *
   * Only ever raised by the async `validateRegistryRefs`, never by the
   * synchronous validators — it needs I/O, and a role with no registered
   * resolver is skipped rather than failed.
   */
  | 'unresolved-registry-ref';

export interface AefValidationIssue {
  code: AefIssueCode;
  table: AefTableName;
  /** The CAD Trust key, where the issue is field-level. */
  key?: string;
  /** Identifier of the offending record, when it has one. */
  recordId?: string;
  message: string;
}

export function issue(
  code: AefIssueCode,
  table: AefTableName,
  message: string,
  extra: { key?: string; recordId?: string } = {},
): AefValidationIssue {
  return { code, table, message, ...extra };
}

/** True when nothing blocks submission. */
export function isSubmittable(issues: readonly AefValidationIssue[]): boolean {
  return issues.length === 0;
}
