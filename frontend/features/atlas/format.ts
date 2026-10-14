import type { CandidateResult, ElectionMetric } from "./types";

const integer = new Intl.NumberFormat("pt-BR");
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
export const number = (value: number) => integer.format(value);
export const shortNumber = (value: number) => compact.format(value);
export const validVotesLabel = (metric: Pick<ElectionMetric,"validVotes"> | null | undefined) => metric == null ? "Sem dado de votos válidos" : `${shortNumber(metric.validVotes)} votos válidos`;
export const pct = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? "Sem dado" : `${decimal.format(value)}%`;
export const pp = (value: number | null | undefined) => value == null ? "Sem dado" : `${value > 0 ? "+" : ""}${decimal.format(value)} p.p.`;
export const rate = (numerator: number, denominator: number) => denominator > 0 ? numerator / denominator * 100 : null;
export const candidatePct = (candidate: CandidateResult, metric: ElectionMetric) => rate(candidate.votes, metric.validVotes);
export const displayName = (name: string) => name.split(" ").map(word => word.length < 3 ? word.toLowerCase() : word[0] + word.slice(1).toLowerCase()).join(" ");
export function candidateClass(candidate: CandidateResult | null | undefined): string {
  if (!candidate) return "neutral";
  if (candidate.party === "PT") return "pt";
  if (/BOLSONARO/i.test(candidate.name)) return "bolsonaro";
  return "other";
}
export function winner(metric: ElectionMetric | null | undefined): CandidateResult | null {
  if (!metric || !metric.validVotes) return null;
  const sorted = [...metric.candidates].sort((a, b) => b.votes - a.votes);
  if (!sorted[0] || sorted[0].votes === sorted[1]?.votes) return null;
  return sorted[0];
}
export function margin(metric: ElectionMetric | null | undefined) {
  if (!metric || !metric.validVotes) return null;
  const sorted = [...metric.candidates].sort((a, b) => b.votes - a.votes);
  return sorted.length >= 2 ? (sorted[0].votes - sorted[1].votes) / metric.validVotes * 100 : null;
}
export function readableDate(date: string) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
