/**
 * Live-node CAPTURE for the `program` endpoints — not an assertion suite.
 *
 * Skipped by default — `yarn test` must never need a node. Enable with:
 *
 *   CADT_V2_LIVE_URL=https://your-node/v2 yarn test -- libs/cadtrust/src/live/program.capture
 *   CADT_V2_LIVE_URL=... CADT_V2_LIVE_API_KEY=... yarn test -- libs/cadtrust/src/live/program.capture
 *
 * Same pattern as `organizations.capture.spec.ts` — see its doc comment for the full reasoning
 * (recording transport, why a capture beats a hand-built Postman collection, output location).
 *
 * Covers only the SAFE (read-only, zero-side-effect) endpoints: `list`, `get`, and — the standing
 * rule for every CRUD-resource capture spec from here on — `staging.list({ table })`. `list()`/`get()`
 * alone only show COMMITTED records: this node had zero committed programs, yet a real program was
 * sitting in the staging table uncommitted (found via a manual `GET /staging?table=program`), which
 * `list()`/`get()` would never have revealed. Every future `<resource>.capture.spec.ts` should check
 * both committed and staged state the same way.
 *
 * `stageCreate` / `stageUpdate` / `stageDelete` are deliberately excluded here — not because staging
 * a program is dangerous (it's just an editable/deletable row in the node's private staging table
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

describeLive('CADT v2 live capture — program (read-only)', () => {
  const recorder = createRecordingTransport();
  const client = createCadTrustClient({
    baseUrl: liveUrl,
    apiKey: process.env.CADT_V2_LIVE_API_KEY,
    timeoutMs: 60_000,
    transport: recorder.transport,
  });

  jest.setTimeout(120_000);

  let cadTrustProgramId: string | undefined;

  it('captures GET /program?page=&limit=', async () => {
    const page = await client.program.list({ page: 1, limit: 20 });
    cadTrustProgramId = (page.data as unknown as Array<{ cadTrustProgramId?: string }>)[0]
      ?.cadTrustProgramId;

    expect(Array.isArray(page.data)).toBe(true);
  });

  it('captures GET /program/{id}', async () => {
    if (!cadTrustProgramId) {
      console.warn('No program staged/committed on this node — skipping get() capture.');
      return;
    }
    await client.program.get(cadTrustProgramId);
  });

  it('captures GET /staging?table=program — the standing rule: committed AND staged state, always', async () => {
    await client.staging.list({ page: 1, limit: 20, table: 'program' });
  });

  afterAll(() => {
    const outDir = path.join(__dirname, '.captures');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `program-${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(recorder.calls, null, 2));
    // eslint-disable-next-line no-console
    console.log(`Wrote ${recorder.calls.length} captured call(s) to ${outFile}`);
  });
});
