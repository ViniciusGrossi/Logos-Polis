import { indicatorValue } from "./analytics";
import type { AtlasIndicator, ComparisonRow, TerritoryRecord } from "./types";

/** Only complete pairs participate; an absent metric is never substituted with zero. */
export function growthContrasts(rows: ComparisonRow[]) {
  const valid = rows.filter(
    (r) =>
      r.beforeShare !== null &&
      r.afterShare !== null &&
      r.deltaPp !== null &&
      r.deltaVotes !== null &&
      r.status !== "missing",
  );
  return {
    n: valid.length,
    shareUpVotesDown: valid.filter((r) => r.deltaPp! > 0 && r.deltaVotes! < 0)
      .length,
    shareDownVotesUp: valid.filter((r) => r.deltaPp! < 0 && r.deltaVotes! > 0)
      .length,
  };
}
export function indicatorDistribution(
  records: TerritoryRecord[],
  indicator: AtlasIndicator,
) {
  const values = records
    .map((r) => indicatorValue(r.metric, indicator))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const quantile = (p: number) => {
    if (!values.length) return null;
    const i = (values.length - 1) * p;
    const floor = Math.floor(i);
    return values[floor] + (values[Math.ceil(i)] - values[floor]) * (i - floor);
  };
  return {
    n: values.length,
    missing: records.length - values.length,
    median: quantile(0.5),
    p10: quantile(0.1),
    p90: quantile(0.9),
    bins: Array.from({ length: 10 }, (_, i) => ({
      min: i * 10,
      count: values.filter(
        (v) => v >= i * 10 && (i === 9 ? v <= 100 : v < (i + 1) * 10),
      ).length,
    })),
  };
}
