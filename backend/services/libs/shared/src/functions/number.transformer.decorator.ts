import { ValueTransformer } from 'typeorm';

export const NumberTransformer: ValueTransformer = {
  to(value: number | null): number | null {
    return value;
  },
  from(value: string | null): number | null {
    return value ? Number(value) : null;
  },
};
