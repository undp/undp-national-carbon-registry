import { RefResolver, RefResolverRegistry, UnresolvableRefError } from './resolver';

describe('RefResolverRegistry', () => {
  function projectResolver(overrides: Partial<RefResolver<string>> = {}): RefResolver<string> {
    return {
      role: 'project',
      resolve: async (id) => `project:${id}`,
      ...overrides,
    };
  }

  it('dispatches on role', async () => {
    const registry = new RefResolverRegistry().register(projectResolver());
    await expect(registry.resolve('project', 'p1')).resolves.toBe('project:p1');
  });

  it('throws for an unregistered role', async () => {
    const registry = new RefResolverRegistry();
    await expect(registry.resolve('unit', 'u1')).rejects.toThrow(UnresolvableRefError);
  });

  it('does not answer for a role it was not registered against', async () => {
    const registry = new RefResolverRegistry().register(projectResolver());
    await expect(registry.resolve('unit', 'u1')).rejects.toThrow(UnresolvableRefError);
  });

  it('uses resolveMany when the resolver provides one', async () => {
    const resolveMany = jest.fn(async (ids: readonly string[]) => {
      const out = new Map<string, string>();
      for (const id of ids) {
        out.set(id, `batched:${id}`);
      }
      return out;
    });
    const resolve = jest.fn(async (id: string) => `single:${id}`);

    const registry = new RefResolverRegistry().register(projectResolver({ resolve, resolveMany }));
    const result = await registry.resolveMany('project', ['a', 'b']);

    expect(resolveMany).toHaveBeenCalledTimes(1);
    expect(resolve).not.toHaveBeenCalled();
    expect(result.get('a')).toBe('batched:a');
  });

  it('falls back to N single calls when there is no batch hook', async () => {
    const resolve = jest.fn(async (id: string) => `single:${id}`);
    const registry = new RefResolverRegistry().register(projectResolver({ resolve }));

    const result = await registry.resolveMany('project', ['a', 'b']);

    expect(resolve).toHaveBeenCalledTimes(2);
    expect(result.get('b')).toBe('single:b');
  });

  it('de-duplicates ids before resolving', async () => {
    const resolve = jest.fn(async (id: string) => `single:${id}`);
    const registry = new RefResolverRegistry().register(projectResolver({ resolve }));

    await registry.resolveMany('project', ['a', 'a', 'a']);

    expect(resolve).toHaveBeenCalledTimes(1);
  });

  /**
   * A bulk enrichment pass must degrade to "some rows unenriched", never fail
   * wholesale — resolution is optional everywhere in this library.
   */
  it('returns an empty map for an unregistered role rather than throwing', async () => {
    const registry = new RefResolverRegistry().register(projectResolver());

    const result = await registry.resolveMany('unit', ['u1']);

    expect(result.size).toBe(0);
  });

  it('reports whether a role can be resolved', () => {
    const registry = new RefResolverRegistry().register(projectResolver());
    expect(registry.has('project')).toBe(true);
    expect(registry.has('unit')).toBe(false);
  });
});
