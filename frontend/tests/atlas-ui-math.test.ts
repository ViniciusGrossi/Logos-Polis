import { test } from "node:test";
import assert from "node:assert/strict";
import {
  growthContrasts,
  indicatorDistribution,
} from "../features/atlas/insights";
import type { ComparisonRow, TerritoryRecord } from "../features/atlas/types";
test("growth contrasts separate proportional/absolute change and discard absent pairs", () => {
  const rows = [
    {
      beforeShare: 40,
      afterShare: 45,
      deltaPp: 5,
      deltaVotes: -3,
      status: "comparable",
    },
    {
      beforeShare: 45,
      afterShare: 40,
      deltaPp: -5,
      deltaVotes: 3,
      status: "comparable",
    },
    {
      beforeShare: null,
      afterShare: 40,
      deltaPp: null,
      deltaVotes: 3,
      status: "missing",
    },
  ] as ComparisonRow[];
  assert.deepEqual(growthContrasts(rows), {
    n: 2,
    shareUpVotesDown: 1,
    shareDownVotesUp: 1,
  });
});
test("distribution conserves missing, exact boundaries and interpolation", () => {
  const records = [
    { metric: { eligible: 10, turnout: 0 } },
    { metric: { eligible: 10, turnout: 10 } },
    { metric: null },
    { metric: { eligible: 0, turnout: 0 } },
  ] as TerritoryRecord[];
  const d = indicatorDistribution(records, "turnout");
  assert.equal(d.n, 2);
  assert.equal(d.missing, 2);
  assert.equal(d.median, 50);
  assert.equal(d.bins[0].count, 1);
  assert.equal(d.bins[9].count, 1);
});
