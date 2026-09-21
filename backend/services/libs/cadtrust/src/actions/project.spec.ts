import { createCadTrustClient } from '../client';
import { CadTrustValidationError } from '../http/errors';
import { createFakeTransport, FakeScript } from '../testing/fake-transport';

const noSleep = async () => undefined;

function client(script: FakeScript = { data: { success: true } }) {
  const fake = createFakeTransport(script);
  return { fake, client: createCadTrustClient({ transport: fake.transport, sleep: noSleep }) };
}

const csv = { filename: 'projects.csv', content: Buffer.from('projectRegistryName,projectId\nVCS,P-1') };
const xlsx = { filename: 'projects.xlsx', content: Buffer.from('PK') };

describe('project actions', () => {
  it('stages a cross-organization transfer', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'Project transfer staged successfully', success: true },
    });

    await cadtrust.projectActions.transfer({ cadTrustProjectId: 'p-1', targetOrgUid: 'org-2' });

    expect(fake.lastRequest()).toMatchObject({
      method: 'PUT',
      url: 'http://localhost:31310/v2/project/transfer',
      body: { cadTrustProjectId: 'p-1', targetOrgUid: 'org-2' },
    });
  });

  describe('CSV batch upload', () => {
    it('POSTs multipart under the field name "csv"', async () => {
      const { fake, client: cadtrust } = client({
        data: { message: 'ok', success: true, stagedCount: 1, errorCount: 0 },
      });

      await cadtrust.projectActions.batchUploadCsv(csv);

      const req = fake.lastRequest();
      expect(req.method).toBe('POST');
      expect(req.url).toBe('http://localhost:31310/v2/project/batch');
      expect(req.body).toBeInstanceOf(FormData);
      expect((req.body as FormData).has('csv')).toBe(true);
      expect(req.headers['Content-Type']).toBeUndefined();
    });

    it('RETURNS a partial success rather than throwing — some rows staged is still a 200', async () => {
      const body = {
        message: 'CSV processing complete. 2 row(s) staged, 1 row(s) skipped due to errors.',
        success: true,
        stagedCount: 2,
        errorCount: 1,
        errors: [{ row: 3, error: "cadTrustProgramId 'invalid-id' does not exist" }],
      };
      const { client: cadtrust } = client({ status: 200, data: body });

      await expect(cadtrust.projectActions.batchUploadCsv(csv)).resolves.toEqual(body);
    });

    it('throws a validation error carrying the per-row errors when every row fails', async () => {
      const body = {
        message: 'No rows were staged. All rows failed validation.',
        success: false,
        stagedCount: 0,
        errorCount: 2,
        errors: [
          { row: 2, error: 'Missing required field(s): projectName' },
          { row: 3, error: "cadTrustProgramId 'invalid-id' does not exist" },
        ],
      };
      const { client: cadtrust } = client({ status: 400, data: body });

      const error = await cadtrust.projectActions.batchUploadCsv(csv).catch((e) => e);

      expect(error).toBeInstanceOf(CadTrustValidationError);
      expect(error.body).toEqual(body);
      expect(error.body.errors).toHaveLength(2);
    });
  });

  describe('XLSX', () => {
    it('PUTs multipart under the field name "xlsx"', async () => {
      const { fake, client: cadtrust } = client({
        data: { message: 'Updates from xlsx added to staging', success: true },
      });

      await cadtrust.projectActions.importXlsx(xlsx);

      const req = fake.lastRequest();
      expect(req.method).toBe('PUT');
      expect(req.url).toBe('http://localhost:31310/v2/project/xlsx');
      expect((req.body as FormData).has('xlsx')).toBe(true);
    });

    it('exports as binary with xls=true and returns the suggested filename', async () => {
      const { fake, client: cadtrust } = client({
        data: Buffer.from('workbook'),
        headers: { 'content-disposition': 'attachment; filename="projects.xlsx"' },
      });

      const result = await cadtrust.projectActions.exportXlsx();

      expect(fake.lastRequest().responseType).toBe('buffer');
      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project?xls=true');
      expect(result.filename).toBe('projects.xlsx');
      expect(result.data.toString()).toBe('workbook');
    });

    it('keeps caller-supplied filters alongside xls=true', async () => {
      const { fake, client: cadtrust } = client({ data: Buffer.from('') });

      await cadtrust.projectActions.exportXlsx({ orgUid: 'me' });

      expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/project?orgUid=me&xls=true');
    });
  });
});
