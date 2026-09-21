import { NdcType } from "../enum/ndc.type.enum";
import { CaMethod } from "../enum/ca.method.enum";

// SingleYear accepts Trajectory or Averaging; MultiYear requires the
// MultiYear method.
//
// Trajectory and Averaging produce genuinely different numbers — see
// CorrespondingAdjustmentService.computeCaFields. Trajectory applies the
// year's own net first-transfer balance (para 7a(i)); Averaging applies
// the running average across the NDC period so far, cumulative balance ÷
// elapsed years (para 7a(ii)). They also finalize differently: per year
// vs. per NDC period.
//
// Extracted from CorrespondingAdjustmentService.computeCaFields so the
// initial report can enforce the same rule when a Party files ndcType +
// caMethod together, without the two call sites drifting apart.
export function isNdcMethodCompatible(
  ndcType: NdcType,
  caMethod: CaMethod
): boolean {
  return ndcType === NdcType.SINGLE_YEAR
    ? caMethod === CaMethod.TRAJECTORY || caMethod === CaMethod.AVERAGING
    : caMethod === CaMethod.MULTI_YEAR;
}
