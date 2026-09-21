/**
 * Live-node CAPTURE for the `methodology` endpoints — not an assertion suite.
 *
 * Skipped by default — `yarn test` must never need a node. Enable with:
 *
 *   CADT_V2_LIVE_URL=https://your-node/v2 yarn test -- libs/cadtrust/src/live/methodology.capture
 *   CADT_V2_LIVE_URL=... CADT_V2_LIVE_API_KEY=... yarn test -- libs/cadtrust/src/live/methodology.capture
 *
 * Same pattern as `organizations.capture.spec.ts` — see its doc comment for the full reasoning
 * (recording transport, why a capture beats a hand-built Postman collection, output location).
 *
 * Covers only the SAFE (read-only, zero-side-effect) endpoints: `list`, `get`, and — the standing
 * rule for every CRUD-resource capture spec from here on — `staging.list({ table })`. `list()`/`get()`
 * alone only show COMMITTED records; see `program.capture.spec.ts`'s doc comment for why that turned
 * out to matter in practice (a program was staged-but-uncommitted on this node and `GET /program`
 * alone never revealed it). Every future `<resource>.capture.spec.ts` should check both committed and
 * staged state the same way.
 *
 * `stageCreate` / `stageUpdate` / `stageDelete` are deliberately excluded here — not because staging
 * a methodology is dangerous (it's just an editable/deletable row in the node's private staging table
 * until committed), but because manual dev testing already exercises those through the real
 * `CadTrustBootstrapHandler` flow; report back what that testing shows and it gets marked validated
 * in `../../LIVE_VALIDATION.md` the same way a capture run would.
 */

import * as fs from 'fs';
import * as path from 'path';

import { createCadTrustClient } from '../client';
import { createRecordingTransport } from '../testing/recording-transport';

const liveUrl = process.env.CADT_V2_LIVE_URL;
const describeLive = liveUrl ? describe : describe.skip;

describeLive('CADT v2 live capture — methodology (read-only)', () => {
  const recorder = createRecordingTransport();
  const client = createCadTrustClient({
    baseUrl: liveUrl,
    apiKey: process.env.CADT_V2_LIVE_API_KEY,
    timeoutMs: 60_000,
    transport: recorder.transport,
  });

  jest.setTimeout(120_000);

  let cadTrustMethodologyId: string | undefined;

  it('captures GET /methodology?page=&limit=', async () => {
    const page = await client.methodology.list({ page: 1, limit: 20 });
    cadTrustMethodologyId = (page.data as unknown as Array<{ cadTrustMethodologyId?: string }>)[0]
      ?.cadTrustMethodologyId;

    expect(Array.isArray(page.data)).toBe(true);
  });

  it('captures GET /methodology/{id}', async () => {
    if (!cadTrustMethodologyId) {
      console.warn('No methodology staged/committed on this node — skipping get() capture.');
      return;
    }
    await client.methodology.get(cadTrustMethodologyId);
  });

  it('captures GET /staging?table=methodology — the standing rule: committed AND staged state, always', async () => {
    await client.staging.list({ page: 1, limit: 20, table: 'methodology' });
  });

  afterAll(() => {
    const outDir = path.join(__dirname, '.captures');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `methodology-${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(recorder.calls, null, 2));
    // eslint-disable-next-line no-console
    console.log(`Wrote ${recorder.calls.length} captured call(s) to ${outFile}`);
  });
});
