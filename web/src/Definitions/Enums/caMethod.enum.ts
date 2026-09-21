// Mirrors backend libs/shared/src/enum/ca.method.enum.ts.
import { NdcType } from './ndcType.enum';

export enum CaMethod {
  TRAJECTORY = 'Trajectory',
  AVERAGING = 'Averaging',
  MULTI_YEAR = 'MultiYear',
}

export const CA_METHOD_LABELS: Record<string, string> = {
  [CaMethod.TRAJECTORY]: 'Trajectory (para. 7a(i))',
  [CaMethod.AVERAGING]: 'Averaging (para. 7a(ii))',
  [CaMethod.MULTI_YEAR]: 'Multi-Year (para. 7b)',
};

// Mirrors backend isNdcMethodCompatible
// (libs/shared/src/util/ndc-method-compatibility.ts): SingleYear accepts
// Trajectory/Averaging (computed identically — no separate
// trajectory-baseline data source to differentiate them); MultiYear
// requires the MultiYear method.
export function getCompatibleCaMethods(ndcType: NdcType | string | undefined): CaMethod[] {
  return ndcType === NdcType.MULTI_YEAR
    ? [CaMethod.MULTI_YEAR]
    : [CaMethod.TRAJECTORY, CaMethod.AVERAGING];
}
