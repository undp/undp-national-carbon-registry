import * as ExcelJS from 'exceljs';

import { AEF_TABLE_ORDER } from '../tables';
import {
  AEF_FULL_REPORT_TEMPLATE,
  AEF_TEMPLATE_SHEET_NAMES,
  AefTemplateError,
  toSubmissionTemplateXlsxBuffer,
} from './xlsx';

/**
 * Guards the contract between the shipped CARP workbook
 * (`src/export/templates/aef_full_Report_template.xlsx`) and the field spec.
 *
 * `toSubmissionTemplateXlsxBuffer` locates columns by header text, so a
 * template revision that renames or drops a column fails here rather than
 * silently producing a submission with values in the wrong cells.
 *
 * Joined with a string rather than `path.join`: `path` is not in
 * `portability.spec.ts`'s dependency budget, and the library keeps it that way
 * on purpose. Under Jest `__dirname` is this file's own directory, so the
 * template sits right beside it.
 */
const TEMPLATE_PATH = `${__dirname}/templates/${AEF_FULL_REPORT_TEMPLATE.fileName}`;

/**
 * Where each sheet's data actually starts in the shipped template. Not used by
 * the fill itself - it scans for the header row - but asserted here so a
 * template whose layout shifts is noticed deliberately.
 *
 * Table 1 is absent: it is transposed, so it has a label column rather than a
 * first data row. See the vertical-layout tests below.
 */
const FIRST_DATA_ROW: Record<string, number> = {
  'Table 2 Authorizations': 8,
  'Table 3 Actions': 9,
  'Table 4 Holdings': 8,
  'Table 5 Auth. entities': 11,
};

/** The header row each horizontal table's labels sit on. */
const HEADER_ROW: Record<string, number> = {
  'Table 2 Authorizations': 7,
  'Table 3 Actions': 8,
  'Table 4 Holdings': 7,
  'Table 5 Auth. entities': 10,
};

const submission = {
  aefT1SubmissionParty: 'NGA',
  aefT1SubmissionVersion: '1.0',
  aefT1SubmissionReportYear: 2026,
  aefT1SubmissionNdcFirstYear: 2021,
  aefT1SubmissionNdcLastYear: 2030,
  status: 'DRAFT',
  id: 'sub-1',
};

const action = {
  aefT3ActionsDate: '2026-08-11T12:14:03.356Z',
  aefT3ActionsType: 'First transfer',
  aefT3ActionsSubtype: 'First transfer to another Party',
  aefT3ActionsAuthorizationId: '8',
  aefT3ActionsFirstTransferringPartyId: 'NGA',
  aefT3ActionsItmoFirstId: 2917,
  aefT3ActionsItmoLastId: 3916,
  aefT3ActionsQuantityTCo2: 1000,
  aefT3ActionsMitigationType: 'Emission reductions',
  aefT3ActionsVintageYear: 2026,
  aefT3ActionsAcquiringPartyId: 'JPN',
  id: 'action-1',
};

const holding = {
  aefT4HoldingsAuthorizationId: '9',
  aefT4HoldingsQuantityTCo2: 500,
  aefT4HoldingsMitigationType: 'Removals',
  aefT4HoldingsVintageYear: 2026,
};

const bundle = {
  t1Submission: [submission],
  t3Actions: [action],
  t4Holdings: [holding],
};

const load = async (buffer: Buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook;
};

/** Template labels are sometimes rich text, so compare what a reader sees. */
const text = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const rich = (value as { richText?: { text: string }[] }).richText;
    if (rich) return rich.map((run) => run.text).join('');
    return '';
  }
  return String(value);
};

const normalized = (value: ExcelJS.CellValue): string => text(value).replace(/\s+/g, ' ').trim();

const columnOf = (sheet: ExcelJS.Worksheet, headerRow: number, label: string): number => {
  for (let column = 1; column <= sheet.columnCount; column += 1) {
    if (normalized(sheet.getRow(headerRow).getCell(column).value) === label) {
      return column;
    }
  }
  throw new Error(`Header "${label}" not found on row ${headerRow} of ${sheet.name}`);
};

describe('full-report template', () => {
  // Filling the workbook costs a couple of seconds, and re-reading the 60KB
  // template inside every test made the suite miss Jest's 5s default under
  // load. Each distinct fill happens once here instead; every assertion below
  // is then a synchronous read of an already-filled workbook.
  let filled: ExcelJS.Workbook;
  let filledWithPartyName: ExcelJS.Workbook;
  let filledOneAction: ExcelJS.Workbook;
  let filledEmpty: ExcelJS.Workbook;
  let pristine: ExcelJS.Workbook;

  beforeAll(async () => {
    pristine = new ExcelJS.Workbook();
    await pristine.xlsx.readFile(TEMPLATE_PATH);

    filled = await load(await toSubmissionTemplateXlsxBuffer(bundle, { templatePath: TEMPLATE_PATH }));
    filledWithPartyName = await load(
      await toSubmissionTemplateXlsxBuffer(bundle, {
        templatePath: TEMPLATE_PATH,
        partyDisplayName: 'Nigeria',
      }),
    );
    filledOneAction = await load(
      await toSubmissionTemplateXlsxBuffer({ t3Actions: [action] }, { templatePath: TEMPLATE_PATH }),
    );
    filledEmpty = await load(await toSubmissionTemplateXlsxBuffer({}, { templatePath: TEMPLATE_PATH }));
  }, 120000);

  it('ships with the library, at the path it advertises', () => {
    expect(pristine.worksheets.length).toBeGreaterThan(0);
  });

  it('keeps every sheet the fill expects', () => {
    const names = pristine.worksheets.map((sheet) => sheet.name);

    for (const table of AEF_TABLE_ORDER) {
      expect(names).toContain(AEF_TEMPLATE_SHEET_NAMES[table]);
    }
  });

  /**
   * The fill itself happens in `beforeAll`, and it throws AefTemplateError on
   * any field it cannot place - so reaching this assertion at all is the
   * evidence that every field in every table was located.
   */
  it('fills without error, which means every spec field was located', () => {
    for (const table of AEF_TABLE_ORDER) {
      expect(filled.getWorksheet(AEF_TEMPLATE_SHEET_NAMES[table])).toBeDefined();
    }
  });

  /**
   * Table 1 is transposed - nine labels down a column with the values beside
   * them - so it needs the vertical fill, not a row of data under a header.
   */
  it('fills Table 1 beside its labels, not under them', async () => {
    const workbook = filled;

    const t1 = workbook.getWorksheet('Table 1 Submission')!;
    const valueBeside = (label: string) => {
      for (let row = 1; row <= t1.rowCount; row += 1) {
        if (normalized(t1.getRow(row).getCell(2).value) === label) {
          return t1.getRow(row).getCell(3).value;
        }
      }
      throw new Error(`Label "${label}" not found in Table 1's label column`);
    };

    // Party and reported year come from the record itself - the export needs
    // no separate plumbing for them.
    expect(valueBeside('Party')).toBe('NGA');
    expect(valueBeside('Version')).toBe('1.0');
    expect(valueBeside('Reported year')).toBe(2026);
    expect(valueBeside('First year of the NDC implementation period')).toBe(2021);
    expect(valueBeside('Last year of the NDC implementation period')).toBe(2030);
  });

  /**
   * The template right-aligns Table 1's value column, matching the CARP
   * placeholders already sitting there. Writing a value must not reset that to
   * the generated-grid default, which left the filled values under their own
   * labels rather than lined up with the placeholders.
   */
  it("keeps the template's own cell alignment", async () => {
    const workbook = filled;

    const t1 = workbook.getWorksheet('Table 1 Submission')!;
    for (const row of [4, 5, 6]) {
      expect(t1.getRow(row).getCell(3).alignment?.horizontal).toBe('right');
    }
  });

  /**
   * Display only. The spec gives aefT1SubmissionParty format ISO 3166-1
   * alpha-3, so the substitution must not leak into any other Party field.
   */
  it('renders Table 1 Party as a country name when the host supplies one', async () => {
    const workbook = filledWithPartyName;

    const t1 = workbook.getWorksheet('Table 1 Submission')!;
    expect(normalized(t1.getRow(4).getCell(3).value)).toBe('Nigeria');

    // Table 3's own Party columns keep the alpha-3 codes.
    const t3 = workbook.getWorksheet('Table 3 Actions')!;
    const t3Header = HEADER_ROW['Table 3 Actions'];
    const t3Row = t3.getRow(FIRST_DATA_ROW['Table 3 Actions']);
    expect(
      t3Row.getCell(columnOf(t3, t3Header, 'First transferring participating Party ID')).value,
    ).toBe('NGA');
    expect(t3Row.getCell(columnOf(t3, t3Header, 'Acquiring participating Party ID')).value).toBe(
      'JPN',
    );
  });

  it('leaves Party as the stored code when no display name is supplied', async () => {
    const workbook = filled;

    expect(
      normalized(workbook.getWorksheet('Table 1 Submission')!.getRow(4).getCell(3).value),
    ).toBe('NGA');
  });

  /**
   * Those three Table 1 fields are CARP's to fill, and the template says so in
   * the cell. Blanking them would throw away an instruction to the reader.
   */
  it("leaves CARP-populated cells showing the template's own instruction", async () => {
    const workbook = filled;

    const t1 = workbook.getWorksheet('Table 1 Submission')!;
    for (const row of [8, 9, 12]) {
      expect(String(t1.getRow(row).getCell(3).value ?? '')).toContain('CARP');
    }
  });

  it("writes each table's first row at the template's own start row", async () => {
    const workbook = filled;

    const t3 = workbook.getWorksheet('Table 3 Actions')!;
    const t3Row = t3.getRow(FIRST_DATA_ROW['Table 3 Actions']);
    expect(t3Row.getCell(columnOf(t3, HEADER_ROW['Table 3 Actions'], 'Action type')).value).toBe(
      'First transfer',
    );

    // Every table is indented by a gutter column, so nothing may land in A.
    for (const [sheetName, firstRow] of Object.entries(FIRST_DATA_ROW)) {
      const sheet = workbook.getWorksheet(sheetName)!;
      expect(sheet.getRow(firstRow).getCell(1).value ?? '').toBe('');
    }
  });

  /**
   * The regression this whole approach exists to prevent: Actions, Holdings and
   * Authorizations all carry unlabelled spacer columns mid-table, so a
   * positional fill would land Mitigation type, Vintage and everything after
   * them to the left of where they belong.
   */
  it('skips the unlabelled spacer columns', async () => {
    const workbook = filled;

    const t3 = workbook.getWorksheet('Table 3 Actions')!;
    const t3Header = HEADER_ROW['Table 3 Actions'];
    const t3Row = t3.getRow(FIRST_DATA_ROW['Table 3 Actions']);
    expect(t3Row.getCell(columnOf(t3, t3Header, 'Mitigation type')).value).toBe(
      'Emission reductions',
    );
    expect(t3Row.getCell(columnOf(t3, t3Header, 'Vintage')).value).toBe(2026);

    const t4 = workbook.getWorksheet('Table 4 Holdings')!;
    const t4Header = HEADER_ROW['Table 4 Holdings'];
    const t4Row = t4.getRow(FIRST_DATA_ROW['Table 4 Holdings']);
    expect(t4Row.getCell(columnOf(t4, t4Header, 'Mitigation type')).value).toBe('Removals');
    expect(t4Row.getCell(columnOf(t4, t4Header, 'Vintage')).value).toBe(2026);

    // Every unheaded column stays untouched, in the header row and the data
    // row alike. Derived from the sheet rather than listed, so a template that
    // moves its spacers is still covered.
    const spacersStayEmpty = (sheet: ExcelJS.Worksheet, headerRow: number, dataRow: number) => {
      for (let column = 2; column <= sheet.columnCount; column += 1) {
        if (String(sheet.getRow(headerRow).getCell(column).value ?? '') === '') {
          expect(sheet.getRow(dataRow).getCell(column).value ?? '').toBe('');
        }
      }
    };
    spacersStayEmpty(t3, t3Header, FIRST_DATA_ROW['Table 3 Actions']);
    spacersStayEmpty(t4, t4Header, FIRST_DATA_ROW['Table 4 Holdings']);
  });

  /**
   * The shipped template pre-fills the data region with each column's
   * controlled vocabulary - Action type's five values, Metric's two, Mitigation
   * type's two. They must not survive into an export, or a submission with one
   * action appears to have five.
   */
  it("clears the template's controlled-vocabulary rows below the written rows", async () => {
    const workbook = filledOneAction;

    const t3 = workbook.getWorksheet('Table 3 Actions')!;
    const first = FIRST_DATA_ROW['Table 3 Actions'];
    const actionType = columnOf(t3, HEADER_ROW['Table 3 Actions'], 'Action type');

    expect(t3.getRow(first).getCell(actionType).value).toBe('First transfer'); // the real row
    // Rows 10-13 held "Transfer", "Use", "Cancellation", "First transfer".
    for (let row = first + 1; row <= t3.rowCount; row += 1) {
      expect(t3.getRow(row).getCell(actionType).value ?? '').toBe('');
    }
  });

  it('leaves a table with no rows empty rather than dropping its sheet', async () => {
    const workbook = filledEmpty;

    const t5 = workbook.getWorksheet('Table 5 Auth. entities')!;
    expect(t5).toBeDefined();
    const nameColumn = columnOf(t5, HEADER_ROW['Table 5 Auth. entities'], 'Name');
    expect(
      t5.getRow(FIRST_DATA_ROW['Table 5 Auth. entities']).getCell(nameColumn).value ?? '',
    ).toBe('');
  });

  /** The revision added these; they carry reference material and are not ours to touch. */
  it('leaves the Index and Summary information sheets alone', async () => {
    const before = pristine;
    const after = filled;

    for (const name of ['Index', 'Summary information']) {
      const original = before.getWorksheet(name)!;
      const written = after.getWorksheet(name)!;
      expect(written).toBeDefined();
      for (let row = 1; row <= original.rowCount; row += 1) {
        for (let column = 1; column <= original.columnCount; column += 1) {
          expect(String(written.getRow(row).getCell(column).value ?? '')).toBe(
            String(original.getRow(row).getCell(column).value ?? ''),
          );
        }
      }
    }
  });

  it('raises AefTemplateError for a renamed sheet rather than filling nothing', async () => {
    await expect(
      toSubmissionTemplateXlsxBuffer(bundle, {
        templatePath: TEMPLATE_PATH,
        sheetNames: { t3Actions: 'Nope' },
      }),
    ).rejects.toBeInstanceOf(AefTemplateError);
  });
});
