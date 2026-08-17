import { AefTableName } from '../tables';
import { CellValue, toRows } from './rows';

export interface CsvOptions {
  delimiter?: string;
  /** Line ending. CRLF by default — RFC 4180, and what Excel expects. */
  newline?: string;
  /**
   * Prefix a UTF-8 byte-order mark. On by default: without it Excel mis-decodes
   * the non-ASCII characters that appear throughout the AEF labels.
   */
  bom?: boolean;
}

const DEFAULTS: Required<CsvOptions> = {
  delimiter: ',',
  newline: '\r\n',
  bom: true,
};

/**
 * Serialises one table to CSV. Pure — no dependencies, no file system.
 *
 * Returns a string rather than writing anywhere: uploading it is registry
 * infrastructure, and a library that reached for a file handler would stop
 * being liftable.
 */
export function toCsv<T extends Record<string, unknown>>(
  table: AefTableName,
  records: readonly T[],
  options: CsvOptions = {},
): string {
  const { delimiter, newline, bom } = { ...DEFAULTS, ...options };
  const { headers, rows } = toRows(table, records);

  const lines = [headers, ...rows].map((line) =>
    line.map((cell) => escapeCell(cell as CellValue, delimiter)).join(delimiter),
  );

  // The header row is emitted even for an empty record set — an export with no
  // rows should still be a well-formed file with the right columns.
  return `${bom ? '﻿' : ''}${lines.join(newline)}${newline}`;
}

function escapeCell(value: CellValue, delimiter: string): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  const needsQuoting =
    text.includes(delimiter) || text.includes('"') || text.includes('\n') || text.includes('\r');

  return needsQuoting ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Suggested filename, e.g. `aef-v2-t3Actions-2025.csv`. */
export function exportFileName(
  table: AefTableName,
  extension: 'csv' | 'xlsx',
  reportedYear?: number,
): string {
  const year = reportedYear === undefined ? '' : `-${reportedYear}`;
  return `aef-v2-${table}${year}.${extension}`;
}

/** Suggested filename for the whole-submission export, e.g. `aef-report-VUT-2025.xlsx`. */
export function submissionExportFileName(
  party: string,
  reportedYear: number,
  extension: 'csv' | 'xlsx',
): string {
  return `aef-report-${party}-${reportedYear}.${extension}`;
}
