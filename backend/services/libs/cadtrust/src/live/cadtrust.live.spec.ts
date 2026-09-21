/**
 * Smoke tests against a REAL CADT v2 node.
 *
 * Skipped by default — `yarn test` must never need a node. Enable with:
 *
 *   CADT_V2_LIVE_URL=http://localhost:31310/v2 yarn test -- libs/cadtrust/src/live
 *   CADT_V2_LIVE_URL=... CADT_V2_LIVE_API_KEY=... yarn test -- libs/cadtrust/src/live
 *
 * These are read-only: nothing here stages, commits, or mutates. Their real
 * purpose is to settle the two documentation conflicts the interfaces package
 * flags (see src/interfaces/README.md) against a node that actually runs — the
 * co-benefit field name and the program registry-id fields. Record what you find
 * back into the package README.
 */

import { createCadTrustClient } from '../client';

const liveUrl = process.env.CADT_V2_LIVE_URL;
const describeLive = liveUrl ? describe : describe.skip;

describeLive('CADT v2 live node', () => {
  const client = createCadTrustClient({
    baseUrl: liveUrl,
    apiKey: process.env.CADT_V2_LIVE_API_KEY,
    timeoutMs: 60_000,
  });

  jest.setTimeout(120_000);

  it('answers the v2 health check', async () => {
    const health = await client.system.getHealth();

    expect(health).toBeDefined();
  });

  it('returns picklists as a map of string arrays', async () => {
    const picklists = await client.governance.getPickList();

    expect(typeof picklists).toBe('object');
    for (const values of Object.values(picklists)) {
      expect(Array.isArray(values)).toBe(true);
    }
  });

  it('lists organizations as a map keyed by org_uid, not an array', async () => {
    const organizations = await client.organizations.list();

    expect(Array.isArray(organizations)).toBe(false);
    for (const [key, org] of Object.entries(organizations)) {
      expect(org.org_uid).toBe(key);
    }
  });

  it('paginates projects', async () => {
    const page = await client.project.list({ page: 1, limit: 5 });

    expect(page.page).toBe(1);
    expect(Array.isArray(page.data)).toBe(true);
    expect(page.data.length).toBeLessThanOrEqual(5);
  });

  it('reports whether a commit is pending', async () => {
    const pending = await client.staging.hasPendingCommits();

    expect(typeof pending.confirmed).toBe('boolean');
  });

  describe('documented source conflicts', () => {
    it('CONFLICT 1 — co-benefit: is the field `cobenefit` (schema) or `coBenefitId` (guide)?', async () => {
      const page = await client.coBenefit.list({ page: 1, limit: 1 });
      const record = page.data[0];

      if (!record) {
        console.warn('No co-benefit records on this node — conflict 1 remains unverified.');
        return;
      }
      console.info('co-benefit record keys:', Object.keys(record));
      expect(record).toBeDefined();
    });

    it('CONFLICT 2 — program: `programRegistryActivityId` (guide) or `programRegistryId` (schema)?', async () => {
      const page = await client.program.list({ page: 1, limit: 1 });
      const record = page.data[0];

      if (!record) {
        console.warn('No program records on this node — conflict 2 remains unverified.');
        return;
      }
      console.info('program record keys:', Object.keys(record));
      expect(record).toBeDefined();
    });
  });
});
