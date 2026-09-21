/**
 * Live-node CAPTURE for the `organizations` endpoints — not an assertion suite.
 *
 * Skipped by default — `yarn test` must never need a node. Enable with:
 *
 *   CADT_V2_LIVE_URL=https://your-node/v2 yarn test -- libs/cadtrust/src/live/organizations.capture
 *   CADT_V2_LIVE_URL=... CADT_V2_LIVE_API_KEY=... yarn test -- libs/cadtrust/src/live/organizations.capture
 *
 * Purpose: every request/response shape in `interfaces/actions/organizations.ts` was auto-extracted
 * from the API guide, not validated against a running node — and `OrganizationSummary` already
 * turned out to be wrong (snake_case fields on the wire, several undocumented fields). Rather than
 * find the next mismatch as a production bug, this calls every SAFE (read-only, zero-side-effect)
 * organizations endpoint through the real typed client and records the literal wire request and
 * response via `createRecordingTransport` — the exact shapes production code actually exchanges with
 * this node, no guessing, no hand-copied Postman body.
 *
 * Deliberately excludes every MUTATING organizations endpoint (create, createFromFile, upgrade,
 * addMetadata, sync, addMirror, removeMirror, reclaimHome, edit, editFromFile, importOrganization,
 * subscribe, unsubscribe, resync, remove) — several are effectively irreversible (org creation takes
 * ~30 minutes and this node already has a home org) and none are worth risking on a shared test node
 * without an explicit, separate opt-in. Ask for a second capture file scoped to specific mutating
 * calls if you want those covered too.
 *
 * Output: one JSON file per run under `.captures/`, gitignored. Read directly (no copy-paste needed)
 * once it's written — the path is also logged.
 */

import * as fs from 'fs';
import * as path from 'path';

import { createCadTrustClient } from '../client';
import { createRecordingTransport } from '../testing/recording-transport';

const liveUrl = process.env.CADT_V2_LIVE_URL;
const describeLive = liveUrl ? describe : describe.skip;

describeLive('CADT v2 live capture — organizations (read-only)', () => {
  const recorder = createRecordingTransport();
  const client = createCadTrustClient({
    baseUrl: liveUrl,
    apiKey: process.env.CADT_V2_LIVE_API_KEY,
    timeoutMs: 60_000,
    transport: recorder.transport,
  });

  jest.setTimeout(120_000);

  let orgUidForFollowUpCalls: string | undefined;

  it('captures GET /organizations', async () => {
    const organizations = await client.organizations.list();
    const entries = Object.entries(organizations);

    // Prefer the entry the current (corrected) type calls home; fall back to the first entry so a
    // capture run still exercises getStatus/getMetadata below even if is_home itself turns out to
    // need another correction on this node's version.
    const home = entries.find(([, org]) => (org as unknown as Record<string, unknown>).is_home);
    orgUidForFollowUpCalls = (home ?? entries[0])?.[0];

    expect(entries.length).toBeGreaterThan(0);
  });

  it('captures GET /organizations/creation-status', async () => {
    await client.organizations.getCreationStatus();
  });

  it('captures GET /organizations/status?orgUid=', async () => {
    if (!orgUidForFollowUpCalls) {
      console.warn('No organization found on this node — skipping getStatus capture.');
      return;
    }
    await client.organizations.getStatus(orgUidForFollowUpCalls);
  });

  it('captures GET /organizations/metadata?orgUid=', async () => {
    if (!orgUidForFollowUpCalls) {
      console.warn('No organization found on this node — skipping getMetadata capture.');
      return;
    }
    await client.organizations.getMetadata(orgUidForFollowUpCalls);
  });

  afterAll(() => {
    const outDir = path.join(__dirname, '.captures');
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `organizations-${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(recorder.calls, null, 2));
    // eslint-disable-next-line no-console
    console.log(`Wrote ${recorder.calls.length} captured call(s) to ${outFile}`);
  });
});
