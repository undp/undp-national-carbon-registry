import { AEF_TABLE_ORDER, AefTableName } from '../tables';
import { CsvOptions } from './csv';
import { CellValue, toRows } from './rows';

/**
 * One reporting year's five tables, as exported together.
 *
 * Keys match {@link AefTableName}; a missing or empty table still gets its
 * section and header row, because a submission with no Actions is a meaningful
 * statement and an absent section is not.
 */
export type AefSubmissionExport = Partial<
  Record<AefTableName, readonly Record<string, unknown>[]>
>;

/** Section titles, as printed in `AEF_CMA6_second_iteration.csv`. */
export const AEF_TABLE_TITLES: Readonly<Record<AefTableName, string>> = {
  t1Submission: 'Table 1: Submission',
  t2Authorizations: 'Table 2: Authorizations',
  t3Actions: 'Table 3: Actions',
  t4Holdings: 'Table 4: Holdings',
  t5AuthorizedEntities: 'Table 5: Authorized entities',
};

const DEFAULTS: Required<CsvOptions> = {
  delimiter: ',',
  newline: '\r\n',
  bom: true,
};

function escapeCell(value: CellValue, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value);
  const needsQuoting =
    text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r');
  return needsQuoting ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The whole submission as a single CSV.
 *
 * CSV has no notion of sheets, so the five tables are stacked with a section
 * title and a blank line between them — the same layout
 * `AEF_CMA6_second_iteration.csv` itself uses. Following the source document's
 * own shape means a reviewer can diff the two directly.
 */
export function toSubmissionCsv(
  bundle: AefSubmissionExport,
  options: CsvOptions = {},
): string {
  const { delimiter, newline, bom } = { ...DEFAULTS, ...options };
  const lines: string[] = [];

  AEF_TABLE_ORDER.forEach((table, index) => {
    if (index > 0) {
      lines.push('');
    }

    const { headers, rows } = toRows(table, bundle[table] ?? []);

    lines.push(escapeCell(AEF_TABLE_TITLES[table], delimiter));
    lines.push('');
    lines.push(headers.map((header) => escapeCell(header, delimiter)).join(delimiter));

    for (const row of rows) {
      lines.push(row.map((cell) => escapeCell(cell, delimiter)).join(delimiter));
    }
  });

  return `${bom ? '﻿' : ''}${lines.join(newline)}${newline}`;
}
