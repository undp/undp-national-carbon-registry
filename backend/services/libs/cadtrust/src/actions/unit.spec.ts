import { createCadTrustClient } from '../client';
import { createFakeTransport, FakeScript } from '../testing/fake-transport';

const noSleep = async () => undefined;

function client(script: FakeScript = { data: { success: true } }) {
  const fake = createFakeTransport(script);
  return { fake, client: createCadTrustClient({ transport: fake.transport, sleep: noSleep }) };
}

describe('unit actions', () => {
  it('splits a unit block', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'Unit split staged', uuid: 'u-1', success: true },
    });

    await cadtrust.unitActions.split({
      cadTrustUnitId: 'u-1',
      records: [{ unitCount: 400 }, { unitCount: 600, unitCurrentOwner: 'Buyer Ltd' }],
    });

    expect(fake.lastRequest()).toMatchObject({
      method: 'POST',
      url: 'http://localhost:31310/v2/unit/split',
      body: {
        cadTrustUnitId: 'u-1',
        records: [{ unitCount: 400 }, { unitCount: 600, unitCurrentOwner: 'Buyer Ltd' }],
      },
    });
  });

  it('does not expose a tokenize method — tokenization is a plain unit create', () => {
    const { client: cadtrust } = client();

    expect((cadtrust.unitActions as unknown as Record<string, unknown>).tokenize).toBeUndefined();
  });

  it('batch-uploads CSV under the field name "csv"', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'ok', success: true, stagedCount: 4, errorCount: 0 },
    });

    await cadtrust.unitActions.batchUploadCsv({
      filename: 'units.csv',
      content: Buffer.from('unitStartBlock,unitEndBlock\n1,100'),
    });

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/unit/batch');
    expect((fake.lastRequest().body as FormData).has('csv')).toBe(true);
  });

  it('imports XLSX under the field name "xlsx"', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'Updates from xlsx added to staging', success: true },
    });

    await cadtrust.unitActions.importXlsx({ filename: 'units.xlsx', content: Buffer.from('PK') });

    expect(fake.lastRequest()).toMatchObject({
      method: 'PUT',
      url: 'http://localhost:31310/v2/unit/xlsx',
    });
    expect((fake.lastRequest().body as FormData).has('xlsx')).toBe(true);
  });

  it('exports units as binary', async () => {
    const { fake, client: cadtrust } = client({ data: Buffer.from('workbook') });

    const result = await cadtrust.unitActions.exportXlsx();

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/unit?xls=true');
    expect(fake.lastRequest().responseType).toBe('buffer');
    expect(result.data.toString()).toBe('workbook');
  });
});

describe('offer flow', () => {
  it('generates the maker offer file as binary', async () => {
    const { fake, client: cadtrust } = client({ data: Buffer.from('offer1...') });

    const result = await cadtrust.offer.generate();

    expect(fake.lastRequest()).toMatchObject({
      method: 'GET',
      url: 'http://localhost:31310/v2/offer/',
      responseType: 'buffer',
    });
    expect(result.data.toString()).toBe('offer1...');
  });

  it.each([
    ['cancel', 'DELETE', '/offer/'],
    ['getImportedDetails', 'GET', '/offer/accept'],
    ['commitImported', 'POST', '/offer/accept/commit'],
    ['rejectImported', 'DELETE', '/offer/accept/cancel'],
  ])('%s -> %s %s', async (method, httpMethod, path) => {
    const { fake, client: cadtrust } = client({ data: { message: 'ok', success: true } });

    await cadtrust.offer[method as string]();

    expect(fake.lastRequest()).toMatchObject({
      method: httpMethod,
      url: `http://localhost:31310/v2${path}`,
    });
  });

  it('imports the taker offer file under the field name "file"', async () => {
    const { fake, client: cadtrust } = client({
      data: { message: 'Offer file imported successfully', success: true },
    });

    await cadtrust.offer.importOffer({ filename: 'offer-file.txt', content: Buffer.from('offer1...') });

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/offer/accept/import');
    expect((fake.lastRequest().body as FormData).has('file')).toBe(true);
  });
});

describe('governance and system', () => {
  it('fetches live picklists', async () => {
    const { fake, client: cadtrust } = client({ data: { unit_status: ['Held', 'Retired'] } });

    const picklists = await cadtrust.governance.getPickList();

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/governance/meta/pickList');
    expect(picklists.unit_status).toEqual(['Held', 'Retired']);
  });

  it('reads /v2/health under the v2 prefix', async () => {
    const { fake, client: cadtrust } = client({ data: { message: 'V2 API is running' } });

    await cadtrust.system.getHealth();

    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/health');
  });

  it('reads the root-mounted /health and /diagnostics outside the v2 prefix', async () => {
    const { fake, client: cadtrust } = client({ data: {} });

    await cadtrust.system.getRootHealth();
    expect(fake.lastRequest().url).toBe('http://localhost:31310/health');

    await cadtrust.system.getDiagnostics();
    expect(fake.lastRequest().url).toBe('http://localhost:31310/diagnostics');
  });

  it('raises the timeout for diagnostics, whose probes can take ~30s', async () => {
    const { fake, client: cadtrust } = client({ data: {} });

    await cadtrust.system.getDiagnostics();

    expect(fake.lastRequest().timeoutMs).toBeGreaterThan(30_000);
  });
});
