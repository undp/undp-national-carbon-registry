import * as ExcelJS from 'exceljs';

import { AEF_TABLE_ORDER, AefTableName } from '../tables';
import { TabularProjection, toRows } from './rows';
import { AefSubmissionExport } from './submission';

/**
 * Worksheet names. Excel caps these at 31 characters and forbids `[]:*?/\`, so
 * they are short rather than the full printed table titles.
 */
const AEF_SHEET_NAMES: Readonly<Record<AefTableName, string>> = {
  t1Submission: 'T1 Submission',
  t2Authorizations: 'T2 Authorizations',
  t3Actions: 'T3 Actions',
  t4Holdings: 'T4 Holdings',
  t5AuthorizedEntities: 'T5 Authorized entities',
};

/**
 * The only file in this library that depends on ExcelJS.
 *
 * Kept out of the package barrel and imported by subpath
 * (`@app/aef-v2/export/xlsx`) so a consumer that only wants the types and CSV
 * does not pull in a spreadsheet library. `portability.spec.ts` enforces that
 * `exceljs` appears nowhere else.
 */

export interface XlsxOptions {
  /** Worksheet name. Defaults to the table name. */
  sheetName?: string;
  /**
   * Fill an existing template workbook instead of generating a sheet.
   *
   * No official CMA.6 V2 template exists yet — only the V1 Actions and Holdings
   * ones. When UNFCCC publishes them, they drop in here and rows are written
   * from `startRow`, exactly as the V1 exporter does, without a rewrite.
   */
  templatePath?: string;
  /** First data row when filling a template. 1-based. Ignored otherwise. */
  startRow?: number;
  /** Attach each column's spec footnote as a header-cell note. On by default. */
  footnotesAsNotes?: boolean;
}

const HEADER_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 10, bold: true };
const BODY_FONT: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 10 };
const BODY_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  wrapText: true,
  vertical: 'top',
  horizontal: 'left',
};

/**
 * Renders one table to an XLSX buffer.
 *
 * Returns bytes, not a path or a URL: writing and uploading are registry
 * concerns. See `toCsv` for the same reasoning.
 */
export async function toXlsxBuffer<T extends Record<string, unknown>>(
  table: AefTableName,
  records: readonly T[],
  options: XlsxOptions = {},
): Promise<Buffer> {
  const { headers, columns, rows } = toRows(table, records);
  const workbook = new ExcelJS.Workbook();

  let sheet: ExcelJS.Worksheet;
  let firstDataRow: number;

  if (options.templatePath) {
    await workbook.xlsx.readFile(options.templatePath);
    const templateSheet = options.sheetName
      ? workbook.getWorksheet(options.sheetName)
      : workbook.worksheets[0];
    if (!templateSheet) {
      throw new Error(
        `Worksheet "${options.sheetName ?? '(first)'}" not found in ${options.templatePath}`,
      );
    }
    sheet = templateSheet;
    // A template already carries its own header block, so only data is written.
    firstDataRow = options.startRow ?? 2;
  } else {
    sheet = workbook.addWorksheet(options.sheetName ?? table);
    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = HEADER_FONT;
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

      const footnote = columns[index]?.footnote;
      if (footnote && options.footnotesAsNotes !== false) {
        // Preserves the CSV's Field/Footnote pairing without inventing layout.
        cell.note = footnote;
      }
    });
    headerRow.commit();
    firstDataRow = 2;
  }

  rows.forEach((row, offset) => {
    const sheetRow = sheet.getRow(firstDataRow + offset);
    row.forEach((value, index) => {
      const cell = sheetRow.getCell(index + 1);
      cell.value = value === null ? '' : value;
      cell.font = BODY_FONT;
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
    });
    sheetRow.commit();
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * The whole submission as a single workbook — one sheet per table, in CMA.6
 * order.
 *
 * This is the shape a CARP submission actually takes, as opposed to
 * {@link toXlsxBuffer}, which serves a single on-screen table.
 *
 * A table with no rows still gets its sheet and header row: a submission with
 * no Actions is a meaningful statement, whereas a missing sheet just looks like
 * something failed.
 */
export async function toSubmissionXlsxBuffer(
  bundle: AefSubmissionExport,
  options: Pick<XlsxOptions, 'footnotesAsNotes'> = {},
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const table of AEF_TABLE_ORDER) {
    const { headers, columns, rows } = toRows(table, bundle[table] ?? []);
    const sheet = workbook.addWorksheet(AEF_SHEET_NAMES[table]);

    const headerRow = sheet.getRow(1);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;
      cell.font = HEADER_FONT;
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };

      const footnote = columns[index]?.footnote;
      if (footnote && options.footnotesAsNotes !== false) {
        cell.note = footnote;
      }
    });
    headerRow.commit();

    rows.forEach((row, offset) => {
      const sheetRow = sheet.getRow(2 + offset);
      row.forEach((value, index) => {
        const cell = sheetRow.getCell(index + 1);
        cell.value = value === null ? '' : value;
        cell.font = BODY_FONT;
        cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
      });
      sheetRow.commit();
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * The CARP full-report workbook, shipped **with this library** rather than by
 * the host: the template is the AEF's, not any one registry's, so a host that
 * drops `@app/aef-v2` in gets a working full-report export with nothing extra
 * to source. It lives at `src/export/templates/` alongside the code that fills it.
 *
 * The host still resolves the absolute path, because only the host knows how
 * its build lays the library out (this repo bundles with webpack, so
 * `__dirname` here is the bundle's directory, not this file's). `segments` is
 * that path relative to the library's `src` root, so a future move within the
 * library needs no change on the host side.
 *
 * @see AefV2ReportService.fullReportTemplatePath for this repo's resolution.
 */
export const AEF_FULL_REPORT_TEMPLATE = {
  fileName: 'aef_full_Report_template.xlsx',
  segments: ['export', 'templates', 'aef_full_Report_template.xlsx'],
} as const;

/**
 * Worksheet each table fills in the CARP full-report template workbook
 * ({@link AEF_FULL_REPORT_TEMPLATE}). Unlike {@link AEF_SHEET_NAMES}, these are
 * not ours to choose — they are whatever the shipped template calls its tabs,
 * so a new template revision that renames a tab is handled by updating this
 * map (or passing `sheetNames`), not by editing the fill logic.
 */
export const AEF_TEMPLATE_SHEET_NAMES: Readonly<Record<AefTableName, string>> = {
  t1Submission: 'Table 1 Submission',
  t2Authorizations: 'Table 2 Authorizations',
  t3Actions: 'Table 3 Actions',
  t4Holdings: 'Table 4 Holdings',
  t5AuthorizedEntities: 'Table 5 Auth. entities',
};

/**
 * How far down a sheet to look for the header row, and how far across to look
 * for the label column. The template's tables start between rows 4 and 10
 * depending on how many banded sub-heading rows each has, and every table is
 * indented by a gutter column; these limits leave room for a revision that adds
 * more without needing a change here.
 */
const TEMPLATE_HEADER_SCAN_ROWS = 25;
const TEMPLATE_LABEL_SCAN_COLUMNS = 6;

/**
 * How each table is laid out in the template.
 *
 * Table 1 is **transposed**: it describes a single submission, so the template
 * lists its nine field labels down a column with the values beside them, rather
 * than as a header row with one record underneath. Every other table is a
 * conventional header row with one row per record.
 */
const TEMPLATE_LAYOUT: Readonly<Record<AefTableName, 'horizontal' | 'vertical'>> = {
  t1Submission: 'vertical',
  t2Authorizations: 'horizontal',
  t3Actions: 'horizontal',
  t4Holdings: 'horizontal',
  t5AuthorizedEntities: 'horizontal',
};

export class AefTemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AefTemplateError';
  }
}

export interface SubmissionTemplateOptions {
  /**
   * Absolute path to the CARP full-report template workbook — normally the
   * library's own shipped copy, resolved by the host from
   * {@link AEF_FULL_REPORT_TEMPLATE}.
   */
  templatePath: string;
  /** Overrides {@link AEF_TEMPLATE_SHEET_NAMES} for a renamed tab. */
  sheetNames?: Partial<Record<AefTableName, string>>;
  /**
   * Renders Table 1's Party cell as this string — a country name — instead of
   * the stored alpha-3 code.
   *
   * **Display only, and deliberately narrow.** The field spec gives
   * `aefT1SubmissionParty` `format: 'ISO 3166-1 alpha-3'` and validates it
   * against `PARTY_CODE_PATTERN`, so the stored value, the CSV export and every
   * other Party column in the workbook (Tables 3 and 4's transferring and
   * acquiring Party IDs) stay as codes. Only this one presentation cell
   * changes, and only when a host asks for it.
   *
   * The library cannot resolve the name itself: it holds no country data, by
   * design — see `portability.spec.ts`.
   */
  partyDisplayName?: string;
}

/**
 * The whole submission written into the official CARP template workbook,
 * preserving its headings, banding, column widths and print setup.
 *
 * The difference from {@link toSubmissionXlsxBuffer} is not cosmetic: that one
 * generates a plain grid whose columns are the spec's, in the spec's order, one
 * header row deep. The template's grid is the one CARP actually reads, and it
 * defeats a positional "write row 2, column N" fill in four separate ways:
 *
 *  - every table is indented by a gutter column and starts at a different row;
 *  - Actions, Authorizations and Holdings carry unlabelled spacer columns
 *    mid-table, which would shift every field after them;
 *  - Table 1 is transposed — labels down a column, values beside them;
 *  - the data region ships pre-filled with the controlled vocabulary of several
 *    columns (Metric's "GHG"/"non-GHG", Action type's five values...), which
 *    would read as real rows in any export shorter than those lists.
 *
 * So fields are located by matching the spec's own `aefLabel` against the
 * template's text, and the header row (or label column) is found by scanning.
 * Nothing is written until every one of a table's fields has been located; a
 * template that has drifted raises {@link AefTemplateError} rather than
 * producing a partly-filled submission that looks fine until CARP rejects it.
 *
 * Fields the spec marks `carpPopulated` are left exactly as the template has
 * them — those cells carry CARP's own "{Information in this field is populated
 * by the CARP}" instructions, which are more useful to a reader than a blank.
 */
export async function toSubmissionTemplateXlsxBuffer(
  bundle: AefSubmissionExport,
  options: SubmissionTemplateOptions,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(options.templatePath);

  for (const table of AEF_TABLE_ORDER) {
    const sheetName = options.sheetNames?.[table] ?? AEF_TEMPLATE_SHEET_NAMES[table];
    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
      throw new AefTemplateError(
        `Worksheet "${sheetName}" not found in ${options.templatePath}. ` +
          `Available: ${workbook.worksheets.map((each) => each.name).join(', ')}`,
      );
    }

    const records = bundle[table] ?? [];
    const projection = toRows(table, records);

    if (TEMPLATE_LAYOUT[table] === 'vertical') {
      fillVerticalTable(sheet, sheetName, projection, options);
    } else {
      fillHorizontalTable(sheet, sheetName, projection);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** One row per record, under a located header row. Tables 2 to 5. */
function fillHorizontalTable(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  { headers, columns, rows }: TabularProjection,
): void {
  const header = locateTemplateHeaderRow(sheet, sheetName, headers);
  const cells = headers.map((label) => header.positions.get(normalizeHeader(label))!);

  // Skipped entirely — never written, never cleared — so CARP's own
  // placeholder text survives into the export.
  const writable = cells.filter((_, index) => !columns[index]?.carpPopulated);

  const firstDataRow = header.index + 1;
  clearTemplateDataRegion(sheet, firstDataRow, writable);

  rows.forEach((row, offset) => {
    const sheetRow = sheet.getRow(firstDataRow + offset);
    row.forEach((value, index) => {
      if (columns[index]?.carpPopulated) {
        return;
      }
      writeTemplateCell(sheetRow.getCell(cells[index]), value);
    });
    sheetRow.commit();
  });
}

/**
 * Labels down a column, values in the column beside them. Table 1 only.
 *
 * A reporting year has exactly one live submission — `loadSubmissionBundle`
 * resolves versions before this point — and the transposed layout has room for
 * precisely that one, so any record past the first is ignored rather than
 * silently overwriting the previous one's values.
 */
function fillVerticalTable(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  { headers, columns, rows }: TabularProjection,
  options: SubmissionTemplateOptions,
): void {
  const labels = locateTemplateLabelColumn(sheet, sheetName, headers);
  // The template pairs each label with the cell immediately to its right.
  const valueColumn = labels.index + 1;
  const record = rows[0];

  headers.forEach((label, index) => {
    const spec = columns[index];
    if (spec?.carpPopulated) {
      return;
    }
    const row = labels.positions.get(normalizeHeader(label))!;
    const stored = record ? record[index] : null;
    // See SubmissionTemplateOptions.partyDisplayName - presentation only, and
    // only when the record actually carries a Party to substitute for.
    const value =
      spec?.key === 'aefT1SubmissionParty' && options.partyDisplayName && stored !== null
        ? options.partyDisplayName
        : stored;
    writeTemplateCell(sheet.getRow(row).getCell(valueColumn), value);
  });
}

function writeTemplateCell(cell: ExcelJS.Cell, value: string | number | null): void {
  // Whatever the template already specifies wins — Table 1 right-aligns its
  // value column, and overwriting that with the default left alignment left
  // the filled values sitting under the labels instead of lined up with the
  // CARP placeholders beside them. BODY_ALIGNMENT is only a fallback for cells
  // the template leaves unstyled.
  const templateAlignment = cell.alignment;
  cell.value = value === null ? '' : value;
  cell.font = BODY_FONT;
  cell.alignment = templateAlignment ?? BODY_ALIGNMENT;
}

/**
 * Excel cell values are not always plain scalars — a header can be rich text, a
 * formula result or a hyperlink object. Flattens all of those to the text a
 * reader sees, which is what the spec labels are compared against.
 */
function templateCellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    const candidate = value as {
      richText?: { text: string }[];
      text?: string;
      result?: unknown;
    };
    if (candidate.richText) {
      return candidate.richText.map((run) => run.text).join('');
    }
    if (typeof candidate.text === 'string') {
      return candidate.text;
    }
    if (candidate.result !== undefined && candidate.result !== null) {
      return String(candidate.result);
    }
    return '';
  }
  return String(value);
}

/**
 * Header comparison is whitespace- and case-insensitive. `\s` covers U+00A0 in
 * JavaScript, so this also absorbs the non-breaking spaces published templates
 * are full of — the labels are long enough that an exact match would be brittle
 * for no benefit.
 */
function normalizeHeader(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Where each of a table's labels sits, and the row/column the run was found on. */
interface TemplateAxis {
  /** Row number for a header row, column number for a label column. */
  index: number;
  /** Normalized label -> the perpendicular coordinate (column, or row). */
  positions: Map<string, number>;
}

/**
 * Finds the row that carries a table's column headers, and each header's column.
 *
 * Scanned rather than hard-coded because every sheet starts its table at a
 * different row. The scan takes the best-matching row and then insists it is a
 * complete match: a partial one means the template no longer matches the spec,
 * which must fail loudly.
 */
function locateTemplateHeaderRow(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  headers: readonly string[],
): TemplateAxis {
  const wanted = new Set(headers.map(normalizeHeader));
  const lastColumn = Math.max(sheet.columnCount, headers.length);
  const scanTo = Math.min(Math.max(sheet.rowCount, 1), TEMPLATE_HEADER_SCAN_ROWS);

  let best: TemplateAxis | undefined;
  for (let rowNumber = 1; rowNumber <= scanTo; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const positions = new Map<string, number>();
    for (let column = 1; column <= lastColumn; column += 1) {
      const label = normalizeHeader(templateCellText(row.getCell(column).value));
      // First occurrence wins: the banded sub-heading rows above repeat some
      // labels, but within the header row itself each one appears once.
      if (label && wanted.has(label) && !positions.has(label)) {
        positions.set(label, column);
      }
    }
    if (!best || positions.size > best.positions.size) {
      best = { index: rowNumber, positions };
    }
  }

  assertCompleteAxis(best, sheetName, headers, 'column header');
  return best;
}

/**
 * Finds the column that carries a transposed table's field labels, and each
 * label's row. Table 1's layout — see {@link TEMPLATE_LAYOUT}.
 *
 * Mirrors {@link locateTemplateHeaderRow} exactly, one axis over: scan for the
 * best-matching column, then insist the match is complete.
 */
function locateTemplateLabelColumn(
  sheet: ExcelJS.Worksheet,
  sheetName: string,
  headers: readonly string[],
): TemplateAxis {
  const wanted = new Set(headers.map(normalizeHeader));
  const lastRow = Math.max(sheet.rowCount, headers.length);
  const scanTo = Math.min(Math.max(sheet.columnCount, 1), TEMPLATE_LABEL_SCAN_COLUMNS);

  let best: TemplateAxis | undefined;
  for (let column = 1; column <= scanTo; column += 1) {
    const positions = new Map<string, number>();
    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
      const label = normalizeHeader(templateCellText(sheet.getRow(rowNumber).getCell(column).value));
      if (label && wanted.has(label) && !positions.has(label)) {
        positions.set(label, rowNumber);
      }
    }
    if (!best || positions.size > best.positions.size) {
      best = { index: column, positions };
    }
  }

  assertCompleteAxis(best, sheetName, headers, 'field label');
  return best;
}

function assertCompleteAxis(
  axis: TemplateAxis | undefined,
  sheetName: string,
  headers: readonly string[],
  kind: string,
): asserts axis is TemplateAxis {
  const found = new Set(axis?.positions.keys() ?? []);
  if (found.size >= headers.length) {
    return;
  }
  const missing = headers.filter((header) => !found.has(normalizeHeader(header)));
  throw new AefTemplateError(
    `Worksheet "${sheetName}" is missing ${missing.length} expected ${kind}(s): ` +
      `${missing.join(' | ')}`,
  );
}

/** Blanks every column this fill owns, from the first data row to the sheet's end. */
function clearTemplateDataRegion(
  sheet: ExcelJS.Worksheet,
  firstDataRow: number,
  columns: readonly number[],
): void {
  for (let rowNumber = firstDataRow; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    // Assigning null clears the value while leaving the template's own
    // borders, fills and column widths intact.
    columns.forEach((column) => {
      row.getCell(column).value = null;
    });
    row.commit();
  }
}
