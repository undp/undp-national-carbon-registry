import { AefBundleDeps, loadSubmissionBundle, toAefSubmissionExport } from '../submission/bundle';
import { AefSubmissionDefaults } from '../submission/bootstrap';
import { Clock, systemClock } from '../clock';
import { AefTableName } from '../tables';
import { exportFileName, submissionExportFileName, toCsv } from './csv';
import { AefSubmissionExport, toSubmissionCsv } from './submission';

/**
 * The one operation requirement 3 needs: fetch a year, then format it.
 *
 * **Must never import `exceljs`** — that is why XLSX rendering arrives as an
 * injected function rather than a direct call to `toXlsxBuffer` /
 * `toSubmissionXlsxBuffer`. Importing either here would pull ExcelJS into the
 * package barrel, which `export/xlsx.ts`'s docblock and `portability.spec.ts`
 * both exist to prevent. The registry supplies the renderer from the
 * `@app/aef-v2/export/xlsx` subpath.
 */

export type AefExportFormat = 'csv' | 'xlsx';

export interface AefExportResult {
  fileName: string;
  contentType: string;
  content: Buffer | string;
}

export interface AefExportRenderers {
  /** Injects `toSubmissionXlsxBuffer` for the whole-submission workbook. */
  xlsxSubmission?: (bundle: AefSubmissionExport) => Promise<Buffer>;
  /** Injects `toXlsxBuffer` for a single-table workbook. */
  xlsxTable?: (
    table: AefTableName,
    records: readonly Record<string, unknown>[],
  ) => Promise<Buffer>;
}

export interface AefExportOptions {
  format: AefExportFormat;
  /** Export one table only. Absent means the whole submission, five sections/sheets. */
  table?: AefTableName;
}

const CSV_CONTENT_TYPE = 'text/csv';
const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class MissingExportRendererError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MissingExportRendererError';
  }
}

/**
 * Renders one table. CSV is inline; XLSX needs `renderers.xlsxTable`, and
 * throws rather than silently falling back to CSV if it is missing — a caller
 * that asked for a workbook and got a comma-separated file would not notice
 * until CARP rejected it.
 */
export async function renderTableExport(
  table: AefTableName,
  records: readonly Record<string, unknown>[],
  year: number,
  format: AefExportFormat,
  renderers: AefExportRenderers = {},
): Promise<AefExportResult> {
  if (format === 'csv') {
    return {
      fileName: exportFileName(table, 'csv', year),
      contentType: CSV_CONTENT_TYPE,
      content: toCsv(table, records),
    };
  }

  if (!renderers.xlsxTable) {
    throw new MissingExportRendererError('renderTableExport: xlsx format requires renderers.xlsxTable');
  }
  return {
    fileName: exportFileName(table, 'xlsx', year),
    contentType: XLSX_CONTENT_TYPE,
    content: await renderers.xlsxTable(table, records),
  };
}

/**
 * Renders the whole submission — five sections (CSV) or five sheets (XLSX).
 *
 * Takes an already-shaped {@link AefSubmissionExport} rather than fetching one,
 * so a caller that already has a loaded bundle (`submitAefReport`, notably)
 * does not pay for a second round trip just to export it.
 */
export async function renderWholeSubmissionExport(
  exportData: AefSubmissionExport,
  year: number,
  format: AefExportFormat,
  renderers: AefExportRenderers = {},
): Promise<AefExportResult> {
  // `submissionExportFileName` names the file after the reporting Party, which
  // the submission itself carries — no extra parameter needed, and no way for a
  // caller to label a file with a Party the contents disagree with.
  const party = String(exportData.t1Submission?.[0]?.aefT1SubmissionParty ?? '');

  if (format === 'csv') {
    return {
      fileName: submissionExportFileName(party, year, 'csv'),
      contentType: CSV_CONTENT_TYPE,
      content: toSubmissionCsv(exportData),
    };
  }

  if (!renderers.xlsxSubmission) {
    throw new MissingExportRendererError(
      'renderWholeSubmissionExport: xlsx format requires renderers.xlsxSubmission',
    );
  }
  return {
    fileName: submissionExportFileName(party, year, 'xlsx'),
    contentType: XLSX_CONTENT_TYPE,
    content: await renderers.xlsxSubmission(exportData),
  };
}

/**
 * Fetches one reporting year and renders it in the requested format —
 * `loadSubmissionBundle` plus a render, in one call.
 */
export async function exportSubmission(
  deps: AefBundleDeps,
  defaults: AefSubmissionDefaults,
  year: number,
  options: AefExportOptions,
  renderers: AefExportRenderers = {},
  clock: Clock = systemClock,
): Promise<AefExportResult> {
  const bundle = await loadSubmissionBundle(deps, defaults, year, clock);
  const exportData = toAefSubmissionExport(bundle);

  if (options.table) {
    return renderTableExport(options.table, exportData[options.table] ?? [], year, options.format, renderers);
  }

  return renderWholeSubmissionExport(exportData, year, options.format, renderers);
}
