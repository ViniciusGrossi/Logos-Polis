import type { AtlasIndicator, CandidateResult, CorrelationResult, ElectionMetric } from "./types";

/** Percentage in 0–100 units. An absent denominator is not a zero percentage. */
export function percentShare(value: number, denominator: number): number | null {
  return Number.isFinite(value) && Number.isFinite(denominator) && denominator > 0 ? value / denominator * 100 : null;
}

export function findCandidate(metric: ElectionMetric | null, candidate = "PT"): CandidateResult | null {
  if (!metric) return null;
  return metric.candidates.find(c => c.id === candidate || c.party === candidate || (c.personKey != null && c.personKey === candidate)) ?? null;
}

export function candidateShare(metric: ElectionMetric | null, candidate = "PT"): number | null {
  const found = findCandidate(metric, candidate);
  return found && metric ? percentShare(found.votes, metric.validVotes) : null;
}

export function getWinner(metric: ElectionMetric | null): CandidateResult | null {
  if (!metric || metric.validVotes <= 0 || metric.candidates.length === 0) return null;
  const sorted = [...metric.candidates].sort((a, b) => b.votes - a.votes);
  if (!sorted[0] || sorted[0].votes === 0 || sorted[0].votes === sorted[1]?.votes) return null;
  return sorted[0];
}

export function getMargin(metric: ElectionMetric | null): number | null {
  if (!metric || metric.validVotes <= 0 || metric.candidates.length === 0) return null;
  const sorted = [...metric.candidates].sort((a, b) => b.votes - a.votes);
  return percentShare(sorted[0].votes - (sorted[1]?.votes ?? 0), metric.validVotes);
}

export function indicatorValue(metric: ElectionMetric | null, indicator: AtlasIndicator): number | null {
  if (!metric) return null;
  switch (indicator) {
    case "winner": { const winner = getWinner(metric); return winner ? percentShare(winner.votes, metric.validVotes) : null; }
    case "margin": return getMargin(metric);
    case "turnout": return percentShare(metric.turnout, metric.eligible);
    case "abstention": return percentShare(metric.abstentions, metric.eligible);
    case "blank": return percentShare(metric.blankVotes, metric.turnout);
    case "null": return percentShare(metric.nullVotes, metric.turnout);
  }
}

export function samePerson(before: CandidateResult, after: CandidateResult): boolean {
  if (before.personKey && after.personKey) return before.personKey === after.personKey;
  const normalize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
  return before.id === after.id || normalize(before.name) === normalize(after.name);
}

/** Political continuity, distinct from nominal identity: exact person OR same historical party. */
export function samePoliticalWinner(before: CandidateResult, after: CandidateResult): boolean {
  return samePerson(before, after) || before.party === after.party;
}

export function candidateLabel(candidate: CandidateResult | null): string {
  return candidate ? `${candidate.name} (${candidate.party})` : "Candidatura ausente";
}

function ranks(values: number[]): number[] {
  const sorted = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const result = new Array<number>(values.length);
  for (let start = 0; start < sorted.length;) {
    let end = start + 1;
    while (end < sorted.length && sorted[end].value === sorted[start].value) end++;
    const rank = (start + 1 + end) / 2;
    for (let index = start; index < end; index++) result[sorted[index].index] = rank;
    start = end;
  }
  return result;
}

/** Weighted option is weighted Pearson of the ordinary tied ranks (sensitivity to valid-vote weight). */
export function spearman(points: { x: number; y: number; weight: number }[], weighted = false): CorrelationResult {
  const valid = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (!weighted || (Number.isFinite(p.weight) && p.weight > 0)));
  const result: CorrelationResult = { n: valid.length, coefficient: null, weighted };
  if (valid.length < 30) return result;
  const xs = ranks(valid.map(p => p.x));
  const ys = ranks(valid.map(p => p.y));
  const ws = valid.map(p => weighted ? p.weight : 1);
  const total = ws.reduce((a, b) => a + b, 0);
  const meanX = xs.reduce((sum, x, i) => sum + x * ws[i], 0) / total;
  const meanY = ys.reduce((sum, y, i) => sum + y * ws[i], 0) / total;
  let covariance = 0, varianceX = 0, varianceY = 0;
  for (let i = 0; i < valid.length; i++) {
    const dx = xs[i] - meanX, dy = ys[i] - meanY;
    covariance += ws[i] * dx * dy; varianceX += ws[i] * dx * dx; varianceY += ws[i] * dy * dy;
  }
  if (varianceX > 0 && varianceY > 0) result.coefficient = Math.max(-1, Math.min(1, covariance / Math.sqrt(varianceX * varianceY)));
  return result;
}
