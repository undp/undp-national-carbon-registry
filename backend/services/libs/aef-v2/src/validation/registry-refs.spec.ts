import { RefResolver, RefResolverRegistry } from '../refs/resolver';
import { validateRegistryRefs } from './registry-refs';

const PROJECT_ID = '0002';

function projectResolver(known: readonly string[]): RefResolver<string> {
  return {
    role: 'project',
    resolve: async (id) => (known.includes(id) ? `project:${id}` : undefined),
  };
}

describe('validateRegistryRefs', () => {
  it('passes when every reference resolves', async () => {
    const resolvers = new RefResolverRegistry().register(projectResolver([PROJECT_ID]));

    const issues = await validateRegistryRefs(
      [{ table: 't3Actions', records: [{ id: 'a1', projectId: PROJECT_ID }] }],
      resolvers,
    );

    expect(issues).toEqual([]);
  });

  it('flags a reference that does not resolve', async () => {
    const resolvers = new RefResolverRegistry().register(projectResolver([PROJECT_ID]));

    const issues = await validateRegistryRefs(
      [{ table: 't3Actions', records: [{ id: 'a1', projectId: 'nope' }] }],
      resolvers,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('unresolved-registry-ref');
    expect(issues[0].key).toBe('projectId');
    expect(issues[0].recordId).toBe('a1');
  });

  /**
   * The rule that keeps an unbound deployment usable: without a resolver the
   * library cannot know whether an id is valid, and guessing would make every
   * such deployment permanently unsubmittable.
   */
  it('skips a role with no registered resolver', async () => {
    const resolvers = new RefResolverRegistry();

    const issues = await validateRegistryRefs(
      [{ table: 't3Actions', records: [{ id: 'a1', projectId: 'nope', unitId: 'also-nope' }] }],
      resolvers,
    );

    expect(issues).toEqual([]);
  });

  it('checks only the roles that have resolvers', async () => {
    const resolvers = new RefResolverRegistry().register(projectResolver([]));

    const issues = await validateRegistryRefs(
      [{ table: 't3Actions', records: [{ id: 'a1', projectId: 'nope', unitId: 'also-nope' }] }],
      resolvers,
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('projectId');
  });

  it('ignores rows with no reference set', async () => {
    const resolvers = new RefResolverRegistry().register(projectResolver([]));

    const issues = await validateRegistryRefs(
      [{ table: 't3Actions', records: [{ id: 'a1' }, { id: 'a2', projectId: '   ' }] }],
      resolvers,
    );

    expect(issues).toEqual([]);
  });

  it('resolves a repeated id once but reports every holder', async () => {
    const resolve = jest.fn(async () => undefined);
    const resolvers = new RefResolverRegistry().register({ role: 'project', resolve });

    const issues = await validateRegistryRefs(
      [
        {
          table: 't3Actions',
          records: [
            { id: 'a1', projectId: 'shared' },
            { id: 'a2', projectId: 'shared' },
          ],
        },
      ],
      resolvers,
    );

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(issues.map((i) => i.recordId)).toEqual(['a1', 'a2']);
  });

  it('spans several tables in one pass', async () => {
    const resolvers = new RefResolverRegistry().register(projectResolver([]));

    const issues = await validateRegistryRefs(
      [
        { table: 't3Actions', records: [{ id: 'a1', projectId: 'x' }] },
        { table: 't4Holdings', records: [{ id: 'h1', projectId: 'y' }] },
      ],
      resolvers,
    );

    expect(issues.map((i) => i.table).sort()).toEqual(['t3Actions', 't4Holdings']);
  });
});
