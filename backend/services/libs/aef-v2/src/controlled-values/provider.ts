import { ControlledValueKey, DEFAULT_CONTROLLED_VALUES } from './nomenclature';

/**
 * Supplies the accepted values for a controlled field.
 *
 * The seam exists because the two sources of controlled values move on
 * different clocks:
 *
 *  - the UNFCCC nomenclature is revised occasionally and shipped as defaults;
 *  - **cooperative approach IDs are registry data**, agreed continuously and
 *    held in the deployment's own table, so they have no default at all.
 *
 * Returning `undefined` means "no list is known for this key". Validation then
 * falls back to format checks rather than rejecting — a value list this library
 * has not been told about is not evidence that a value is wrong.
 */
export interface ControlledValueProvider {
  get(key: ControlledValueKey): readonly string[] | undefined;
}

/**
 * The nomenclature defaults, with optional per-key overrides.
 *
 * ```ts
 * // Cooperative approaches from the registry's own table.
 * new StaticControlledValueProvider({ cooperativeApproachId: await loadApprovedCaIds() });
 * ```
 */
export class StaticControlledValueProvider implements ControlledValueProvider {
  private readonly overrides: Partial<Record<ControlledValueKey, readonly string[]>>;

  constructor(overrides: Partial<Record<ControlledValueKey, readonly string[]>> = {}) {
    this.overrides = overrides;
  }

  get(key: ControlledValueKey): readonly string[] | undefined {
    return this.overrides[key] ?? DEFAULT_CONTROLLED_VALUES[key];
  }
}

/** Provider used when a caller supplies none. */
export const defaultControlledValueProvider: ControlledValueProvider = new StaticControlledValueProvider();

/**
 * Adapts a plain lookup function, for a host that reads its lists from a
 * database or cache rather than holding them in memory.
 */
export function controlledValueProviderFrom(
  lookup: (key: ControlledValueKey) => readonly string[] | undefined,
): ControlledValueProvider {
  return { get: lookup };
}
