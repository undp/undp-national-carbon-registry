/**
 * Verifies the package is reachable the way a consumer reaches it — through the
 * `@app/cadtrust` path alias, not a relative path. This is what catches a missing
 * entry in tsconfig `paths`, jest `moduleNameMapper`, or `nest-cli.json` projects.
 */

import {
  CadTrustHttpError,
  CadTrustModule,
  CadTrustV2Service,
  INSERT_ORDER,
  RESOURCES,
  createCadTrustClient,
  createFakeTransport,
} from '@app/cadtrust';
import type { ProjectCreateInput, UnitSplitInput } from '@app/cadtrust';

describe('@app/cadtrust package surface', () => {
  it('exports the factory, the error base class, and the Nest wrapper', () => {
    expect(typeof createCadTrustClient).toBe('function');
    expect(typeof createFakeTransport).toBe('function');
    expect(typeof CadTrustHttpError).toBe('function');
    expect(CadTrustModule).toBeDefined();
    expect(CadTrustV2Service).toBeDefined();
  });

  it('re-exports the vendored data contracts, so consumers depend on this package alone', () => {
    // Compile-time assertions: these fail the build if the barrel stops re-exporting
    // `./interfaces`, even though there is nothing to check at runtime.
    const project: ProjectCreateInput = {
      projectId: 'P-1',
      projectName: 'Solar Farm',
      projectRegistryName: 'VCS',
    } as ProjectCreateInput;
    const split: UnitSplitInput = { cadTrustUnitId: 'u-1', records: [{ unitCount: 1 }] };

    expect(project.projectId).toBe('P-1');
    expect(split.records).toHaveLength(1);
  });

  it('exposes the documented insert order and resource table', () => {
    expect(INSERT_ORDER[0]).toBe('program');
    expect(INSERT_ORDER[INSERT_ORDER.length - 1]).toBe('unitLabel');
    expect(RESOURCES.unit.path).toBe('/unit');
  });

  it('builds a working client through the alias', async () => {
    const fake = createFakeTransport({ data: { message: 'staged', uuid: 'u-1', success: true } });
    const client = createCadTrustClient({ transport: fake.transport });

    const result = await client.program.stageCreate({
      programName: 'Gold Standard',
      programRegistry: 'Gold Standard',
      programRegistryActivityId: 'GS-1234',
    });

    expect(result.staged).toBe(true);
    expect(fake.lastRequest().url).toBe('http://localhost:31310/v2/program');
  });
});
