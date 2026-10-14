import type { ElectionMetric } from "./types";
import { percentShare } from "./analytics";

/** Aggregate numerators first, never average a state's percentage. */
export function aggregateRegionalMetric(
  id: string,
  members: (ElectionMetric | null)[],
): ElectionMetric | null {
  if (!members.length || members.some((metric) => metric === null)) return null;
  const metrics = members as ElectionMetric[];
  const first = metrics[0];
  if (
    metrics.some(
      (metric) => metric.year !== first.year || metric.round !== first.round,
    )
  )
    return null;
  const result: ElectionMetric = {
    territoryId: id,
    year: first.year,
    round: first.round,
    eligible: 0,
    turnout: 0,
    abstentions: 0,
    validVotes: 0,
    officialValidVotes: 0,
    blankVotes: 0,
    nullVotes: 0,
    candidates: [],
  };
  const nominations = new Map<string, ElectionMetric["candidates"][number]>();
  for (const metric of metrics) {
    result.eligible += metric.eligible;
    result.turnout += metric.turnout;
    result.abstentions += metric.abstentions;
    result.validVotes += metric.validVotes;
    result.officialValidVotes += metric.officialValidVotes;
    result.blankVotes += metric.blankVotes;
    result.nullVotes += metric.nullVotes;
    for (const candidate of metric.candidates) {
      const existing = nominations.get(candidate.id);
      if (existing) existing.votes += candidate.votes;
      else nominations.set(candidate.id, { ...candidate });
    }
  }
  result.candidates = [...nominations.values()]
    .map((candidate) => ({
      ...candidate,
      share: percentShare(candidate.votes, result.validVotes) ?? 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  return result;
}
