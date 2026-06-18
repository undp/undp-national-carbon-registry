type TradeVolumeMetric = {
  boughtCredits?: number | null;
  soldCredits?: number | null;
};

const nonNegativeNumber = (value: number | null | undefined) => {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

export const singleCountTradeVolume = (metrics: TradeVolumeMetric[]) => {
  const boughtCredits = metrics.reduce(
    (total, metric) => total + nonNegativeNumber(metric.boughtCredits),
    0
  );
  const soldCredits = metrics.reduce(
    (total, metric) => total + nonNegativeNumber(metric.soldCredits),
    0
  );

  return Math.max(boughtCredits, soldCredits);
};
