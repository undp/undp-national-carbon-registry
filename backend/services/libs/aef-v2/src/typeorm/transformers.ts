import { ValueTransformer } from 'typeorm';

/**
 * Local copy of the number transformer.
 *
 * `@app/shared` has an identical one, and importing it would be the obvious
 * convenience — but it would also make this library depend on one particular
 * registry, which is the single thing the design exists to avoid. Four lines is
 * a cheaper price than that coupling. `portability.spec.ts` fails the build if
 * anyone reaches for the shared one.
 */
export const NumberTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value;
  },
  from(value: string | null): number | null {
    return value === null || value === undefined ? null : Number(value);
  },
};
