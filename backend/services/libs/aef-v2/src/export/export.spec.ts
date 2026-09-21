import * as ExcelJS from 'exceljs';

import { AEF_FIELD_SPECS } from '../spec/field-spec';
import { toCsv, exportFileName } from './csv';
import { toRows } from './rows';
import { toSubmissionCsv } from './submission';
import { toSubmissionXlsxBuffer, toXlsxBuffer } from './xlsx';

const action = {
  aefT3ActionsDate: '2025-06-01T10:30:00.000Z',
  aefT3ActionsType: 'First transfer',
  aefT3ActionsQuantityTCo2: 400,
  aefT3ActionsConsistencyCheckResult: 'Passed',
  // Library metadata and relationships, which must never reach the file.
  id: 'row-1',
  aefT1SubmissionId: 'sub-1',
  projectId: '0002',
};

describe('toRows', () => {
  it('uses the printed AEF labels in CSV order', () => {
    const { headers } = toRows('t3Actions', [action]);
    expect(headers).toEqual(AEF_FIELD_SPECS.t3Actions.map((spec) => spec.aefLabel));
  });

  it('emits one cell per spec field and nothing else', () => {
    const { rows } = toRows('t3Actions', [action]);
    expect(rows[0]).toHaveLength(AEF_FIELD_SPECS.t3Actions.length);
  });

  it('excludes library metadata and relationship columns', () => {
    const { headers } = toRows('t3Actions', [action]);
    expect(headers).not.toContain('id');
    expect(headers).not.toContain('aefT1SubmissionId');
    expect(headers).not.toContain('projectId');
  });

  /** The registry leaves these for CARP, but dropping the column would change the file's shape. */
  it('keeps CARP columns present but blank', () => {
    const { headers, rows, columns } = toRows('t3Actions', [action]);
    const index = columns.findIndex((spec) => spec.key === 'aefT3ActionsConsistencyCheckResult');

    expect(headers[index]).toBe('Result of the consistency checks');
    expect(rows[0][index]).toBeNull();
  });

  it('renders a missing value as null, not "undefined"', () => {
    const { rows, columns } = toRows('t3Actions', [{}]);
    const index = columns.findIndex((spec) => spec.key === 'aefT3ActionsType');
    expect(rows[0][index]).toBeNull();
  });
});

describe('toCsv', () => {
  it('emits the header row even with no records', () => {
    const csv = toCsv('t4Holdings', [], { bom: false });
    const [header, ...rest] = csv.trim().split('\r\n');

    expect(header.split(',')).toHaveLength(16);
    expect(rest).toEqual([]);
  });

  it('quotes values containing the delimiter', () => {
    const csv = toCsv(
      't5AuthorizedEntities',
      [{ aefT5AuthorizedEntitiesName: 'Alpine Carbon Markets AG, Zurich' }],
      { bom: false },
    );
    expect(csv).toContain('"Alpine Carbon Markets AG, Zurich"');
  });

  it('doubles embedded quotes', () => {
    const csv = toCsv(
      't5AuthorizedEntities',
      [{ aefT5AuthorizedEntitiesName: 'The "Alpine" AG' }],
      { bom: false },
    );
    expect(csv).toContain('"The ""Alpine"" AG"');
  });

  it('quotes values containing newlines', () => {
    const csv = toCsv(
      't5AuthorizedEntities',
      [{ aefT5AuthorizedEntitiesConditions: 'line one\nline two' }],
      { bom: false },
    );
    expect(csv).toContain('"line one\nline two"');
  });

  /** Without it Excel mis-decodes the non-ASCII characters in the AEF labels. */
  it('prefixes a BOM by default', () => {
    expect(toCsv('t4Holdings', []).charCodeAt(0)).toBe(0xfeff);
  });

  it('suggests a filename', () => {
    expect(exportFileName('t3Actions', 'csv', 2025)).toBe('aef-v2-t3Actions-2025.csv');
    expect(exportFileName('t3Actions', 'xlsx')).toBe('aef-v2-t3Actions.xlsx');
  });
});

describe('toSubmissionCsv', () => {
  const bundle = {
    t1Submission: [{ aefT1SubmissionParty: 'VUT', aefT1SubmissionReportYear: 2025 }],
    t3Actions: [action],
  };

  it('stacks all five tables in CMA.6 order', () => {
    const csv = toSubmissionCsv(bundle, { bom: false });
    const titles = csv
      .split('\r\n')
      .filter((line) => line.startsWith('Table '));

    expect(titles).toEqual([
      'Table 1: Submission',
      'Table 2: Authorizations',
      'Table 3: Actions',
      'Table 4: Holdings',
      'Table 5: Authorized entities',
    ]);
  });

  /** A submission with no Actions is a statement; a missing section is not. */
  it('still emits a section and header row for an empty table', () => {
    const csv = toSubmissionCsv(bundle, { bom: false });
    const lines = csv.split('\r\n');
    const holdingsIndex = lines.indexOf('Table 4: Holdings');

    expect(holdingsIndex).toBeGreaterThan(-1);
    // Title, blank, header.
    expect(lines[holdingsIndex + 1]).toBe('');
    expect(lines[holdingsIndex + 2].split(',')).toHaveLength(16);
  });

  it('carries each table its own columns', () => {
    const csv = toSubmissionCsv(bundle, { bom: false });
    const lines = csv.split('\r\n');

    const t1Header = lines[lines.indexOf('Table 1: Submission') + 2];
    const t3Header = lines[lines.indexOf('Table 3: Actions') + 2];

    expect(t1Header.split(',')).toHaveLength(9);
    expect(t3Header.split(',')).toHaveLength(27);
  });

  it('works with an entirely empty bundle', () => {
    const csv = toSubmissionCsv({}, { bom: false });
    expect(csv).toContain('Table 1: Submission');
    expect(csv).toContain('Table 5: Authorized entities');
  });
});

describe('toSubmissionXlsxBuffer', () => {
  it('produces one sheet per table, in order', async () => {
    const buffer = await toSubmissionXlsxBuffer({ t3Actions: [action] });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      'T1 Submission',
      'T2 Authorizations',
      'T3 Actions',
      'T4 Holdings',
      'T5 Authorized entities',
    ]);
  });

  it('writes rows into the right sheet', async () => {
    const buffer = await toSubmissionXlsxBuffer({ t3Actions: [action] });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.getWorksheet('T3 Actions')!.getRow(2).getCell(2).value).toBe('First transfer');
    // An empty table still gets its header row and nothing more.
    expect(workbook.getWorksheet('T4 Holdings')!.getRow(2).getCell(1).value).toBeNull();
  });

  it('keeps every sheet name within Excel\'s 31-character limit', async () => {
    const buffer = await toSubmissionXlsxBuffer({});

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    for (const sheet of workbook.worksheets) {
      expect(sheet.name.length).toBeLessThanOrEqual(31);
    }
  });
});

describe('toXlsxBuffer', () => {
  it('produces a workbook whose header row round-trips', async () => {
    const buffer = await toXlsxBuffer('t3Actions', [action]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('t3Actions');

    expect(sheet).toBeDefined();
    const header = sheet!.getRow(1);
    expect(header.getCell(1).value).toBe('Action date');
    expect(header.getCell(2).value).toBe('Action type');
  });

  it('writes the data row beneath the header', async () => {
    const buffer = await toXlsxBuffer('t3Actions', [action]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('t3Actions')!;

    expect(sheet.getRow(2).getCell(2).value).toBe('First transfer');
  });

  it('attaches the CSV footnote as a header note', async () => {
    const buffer = await toXlsxBuffer('t3Actions', [action]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = workbook.getWorksheet('t3Actions')!;

    expect(sheet.getRow(1).getCell(1).note).toBeDefined();
  });
});
