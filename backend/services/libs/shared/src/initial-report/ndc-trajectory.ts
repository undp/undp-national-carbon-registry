// Validation for the NDC target trajectory.
//
// The interpolation itself lives in the ndc_target_yearly view (see
// view-entities/ndc.target.yearly.view.entity.ts) so that per-year
// targets are derived from stored inputs rather than materialised. What
// has to happen before those inputs are written is checked here, where
// it can be unit tested and where the resulting errors can name the
// offending field.

export enum NdcTrajectoryProblem {
  // targetYear <= baseYear would make the view's denominator zero or
  // negative, silently inverting every interpolated target.
  NON_POSITIVE_SPAN = "NON_POSITIVE_SPAN",
  // The period must lie at or after the base year, or early years
  // extrapolate backwards past the trajectory's origin.
  PERIOD_BEFORE_BASE_YEAR = "PERIOD_BEFORE_BASE_YEAR",
  PERIOD_INVERTED = "PERIOD_INVERTED",
  // targetYear is expected to be the period's final year; anything else
  // means the filed target is not the trajectory's destination.
  TARGET_YEAR_OUTSIDE_PERIOD = "TARGET_YEAR_OUTSIDE_PERIOD",
}

export interface NdcTrajectoryInput {
  ndcStartYear: number;
  ndcEndYear: number;
  baseYear: number;
  targetYear: number;
}

/**
 * Returns the reasons the given span cannot produce a usable
 * trajectory, or an empty array when it can. Callers map these onto
 * their own i18n messages.
 */
export function validateNdcTrajectory(
  input: NdcTrajectoryInput
): NdcTrajectoryProblem[] {
  const problems: NdcTrajectoryProblem[] = [];

  if (input.ndcEndYear < input.ndcStartYear) {
    problems.push(NdcTrajectoryProblem.PERIOD_INVERTED);
  }
  if (input.targetYear <= input.baseYear) {
    problems.push(NdcTrajectoryProblem.NON_POSITIVE_SPAN);
  }
  if (input.ndcStartYear < input.baseYear) {
    problems.push(NdcTrajectoryProblem.PERIOD_BEFORE_BASE_YEAR);
  }
  if (input.targetYear !== input.ndcEndYear) {
    problems.push(NdcTrajectoryProblem.TARGET_YEAR_OUTSIDE_PERIOD);
  }

  return problems;
}

/**
 * The same straight line the view computes, in TypeScript. Not used to
 * persist anything — it exists so the view's arithmetic can be asserted
 * against an independent implementation, and so callers can preview a
 * trajectory before it is filed.
 */
export function interpolateNdcTarget(params: {
  baseYear: number;
  baseYearEmission: number;
  targetYear: number;
  ndcTarget: number;
  year: number;
}): number {
  const { baseYear, baseYearEmission, targetYear, ndcTarget, year } = params;
  const span = targetYear - baseYear;
  if (span <= 0) {
    throw new Error(
      `NDC trajectory span must be positive (baseYear ${baseYear}, targetYear ${targetYear})`
    );
  }
  const value =
    baseYearEmission +
    ((ndcTarget - baseYearEmission) * (year - baseYear)) / span;
  // Matches the view's ROUND(..., 5) and the decimal(15,5) column.
  return Math.round(value * 1e5) / 1e5;
}
