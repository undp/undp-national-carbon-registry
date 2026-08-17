/**
 * The two relationships that point outside this library.
 *
 * Everything else an AEF row references — Submission, Authorization, Authorized
 * entity — is a table this library owns, so those are ordinary foreign keys.
 * Only a project and a unit belong to the host registry.
 */
export type RefRole = 'project' | 'unit';

export const REF_ROLES: readonly RefRole[] = ['project', 'unit'];

/**
 * Turns a stored `projectId` / `unitId` into whatever the host holds.
 *
 * Implemented by the registry: this library stores the identifier and nothing
 * more, and has no idea what a project or a credit block is.
 *
 * Resolution is **always optional**. Reading, writing, validating and exporting
 * AEF records all work with zero resolvers registered — resolvers exist for
 * enrichment (showing a project name beside a reference) and for the opt-in
 * existence check in `validateRegistryRefs`. A missing resolver must never fail
 * a write.
 */
export interface RefResolver<T = unknown> {
  readonly role: RefRole;
  resolve(id: string): Promise<T | undefined>;
  /**
   * Optional batch hook, keyed by id. Without it the registry falls back to N
   * `resolve()` calls — correct, but chatty for a table of a few hundred rows.
   */
  resolveMany?(ids: readonly string[]): Promise<Map<string, T>>;
}

export class UnresolvableRefError extends Error {
  constructor(readonly role: RefRole, readonly id: string) {
    super(`No resolver registered for role "${role}" (id "${id}")`);
    this.name = 'UnresolvableRefError';
  }
}

/** Dispatches ids to the resolver registered for their role. */
export class RefResolverRegistry {
  private readonly resolvers = new Map<RefRole, RefResolver>();

  register(resolver: RefResolver): this {
    this.resolvers.set(resolver.role, resolver);
    return this;
  }

  has(role: RefRole): boolean {
    return this.resolvers.has(role);
  }

  /** Throws {@link UnresolvableRefError} when nothing is registered for the role. */
  async resolve<T = unknown>(role: RefRole, id: string): Promise<T | undefined> {
    const resolver = this.resolvers.get(role);
    if (!resolver) {
      throw new UnresolvableRefError(role, id);
    }
    return (await resolver.resolve(id)) as T | undefined;
  }

  /**
   * Batch resolve, keyed by id.
   *
   * Uses the resolver's `resolveMany` when it has one and falls back to
   * individual calls otherwise. An unregistered role yields an **empty map**
   * rather than throwing — a bulk enrichment pass should degrade to "some rows
   * unenriched", not fail wholesale.
   */
  async resolveMany<T = unknown>(
    role: RefRole,
    ids: readonly string[],
  ): Promise<Map<string, T>> {
    const resolver = this.resolvers.get(role);
    if (!resolver || ids.length === 0) {
      return new Map<string, T>();
    }

    const unique = [...new Set(ids)];

    if (resolver.resolveMany) {
      return (await resolver.resolveMany(unique)) as Map<string, T>;
    }

    const results = new Map<string, T>();
    for (const id of unique) {
      const value = await resolver.resolve(id);
      if (value !== undefined) {
        results.set(id, value as T);
      }
    }
    return results;
  }
}
