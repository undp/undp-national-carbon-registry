import { AefFieldSpec, fieldSpecsFor } from '../spec/field-spec';
import { AefTableName } from '../tables';

export type CellValue = string | number | null;

export interface TabularProjection {
  /** Printed AEF labels, in the order of `AEF_CMA6_second_iteration.csv`. */
  headers: string[];
  /** Field spec per column, so a renderer can attach footnotes and formats. */
  columns: readonly AefFieldSpec[];
  rows: CellValue[][];
}

/**
 * Projects records into headers and rows.
 *
 * Column order and labels come from `AEF_FIELD_SPECS`, which is why the exported
 * file and the on-screen table cannot drift apart.
 *
 * Library metadata — `id`, `links`, `status`, `snapshotAt`, `createdAt` — is
 * excluded automatically, because only spec fields appear in the spec. That
 * exclusion falls out of the design rather than needing a filter to remember.
 *
 * CARP-populated columns are emitted but always blank: the spec says the
 * registry leaves them for CARP to fill, and dropping the column would change
 * the shape of the file.
 */
export function toRows<T extends Record<string, unknown>>(
  table: AefTableName,
  records: readonly T[],
): TabularProjection {
  const columns = fieldSpecsFor(table);

  return {
    headers: columns.map((spec) => spec.aefLabel),
    columns,
    rows: records.map((record) => columns.map((spec) => cellFor(spec, record[spec.key]))),
  };
}

function cellFor(spec: AefFieldSpec, value: unknown): CellValue {
  if (spec.carpPopulated) {
    return null;
  }
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}
