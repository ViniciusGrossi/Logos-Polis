import { findCandidate } from "./analytics";
import type { CargoLeader, CargoRow, ElectionMetric, OfficeLine, OfficeResult, Territory } from "./types";

export const PROPORTIONAL_OFFICES: readonly number[] = [6, 7, 8];
export const OFFICE_LABELS: Record<number, string> = { 3: "Governador", 5: "Senador", 6: "Deputado federal", 7: "Deputado estadual", 8: "Deputado distrital" };

/** Presidential side of a line: Bolsonaro ran by PSL in 2018, so PL × PL-deputies compares different sides that year. */
export const presidentParty = (line: OfficeLine, year: number) => (line === "PL" && year === 2018 ? "PSL" : line);
export const isLineComparable = (line: OfficeLine, year: number) => presidentParty(line, year) === line;

const pct = (value: number, denominator: number) => (denominator > 0 ? (value / denominator) * 100 : null);

type OfficeSide = CargoRow["office"];

/** Sums municipal OfficeResults of one scope (a municipality or a whole state) for one line. */
export function summarizeOffice(records: OfficeResult[], line: OfficeLine): OfficeSide {
  const empty: OfficeSide = { validVotes: 0, officialValidVotes: 0, turnout: 0, leader: null, lineVotes: null, lineShare: null, topCandidate: null };
  if (records.length === 0) return empty;
  const proportional = PROPORTIONAL_OFFICES.includes(records[0].office);
  const validVotes = records.reduce((s, r) => s + r.validVotes, 0);
  const officialValidVotes = records.reduce((s, r) => s + r.officialValidVotes, 0);
  const turnout = records.reduce((s, r) => s + r.turnout, 0);
  const denominator = proportional ? officialValidVotes : validVotes;
  const totals = new Map<string, { name: string | null; party: string; votes: number }>();
  if (proportional) {
    for (const r of records) for (const [party, nominal, legend] of r.parties) {
      const entry = totals.get(party) ?? { name: null, party, votes: 0 };
      entry.votes += nominal + legend;
      totals.set(party, entry);
    }
  } else {
    for (const r of records) for (const [name, party, votes] of r.candidates) {
      const key = `${name}\u0000${party}`;
      const entry = totals.get(key) ?? { name, party, votes: 0 };
      entry.votes += votes;
      totals.set(key, entry);
    }
  }
  const ranked = [...totals.values()].sort((a, b) => b.votes - a.votes);
  const asLeader = (e: { name: string | null; party: string; votes: number }): CargoLeader => ({ ...e, share: pct(e.votes, denominator) });
  // Ties at the top have no leader, as in the presidential winner rule.
  const leader = ranked[0] && ranked[0].votes > 0 && ranked[0].votes !== ranked[1]?.votes ? asLeader(ranked[0]) : null;
  const lineEntries = ranked.filter((e) => e.party === line);
  const lineVotes = lineEntries.length ? lineEntries.reduce((s, e) => s + e.votes, 0) : null;
  const top = records.length === 1 && proportional ? records[0].candidates[0] : undefined;
  return {
    validVotes, officialValidVotes, turnout, leader, lineVotes,
    lineShare: lineVotes === null ? null : pct(lineVotes, denominator),
    topCandidate: top ? { name: top[0], party: top[1], votes: top[2], share: pct(top[2], officialValidVotes) } : null,
  };
}

/** President of the same year and round, summed over the metrics of a scope. */
export function summarizePresident(metrics: ElectionMetric[], party: string): NonNullable<CargoRow["president"]> | null {
  if (metrics.length === 0) return null;
  const validVotes = metrics.reduce((s, m) => s + m.validVotes, 0);
  const totals = new Map<string, CargoLeader>();
  let lineVotes: number | null = null;
  for (const m of metrics) {
    for (const c of m.candidates) {
      const entry = totals.get(c.id) ?? { name: c.name, party: c.party, votes: 0, share: null };
      entry.votes += c.votes;
      totals.set(c.id, entry);
    }
    const found = findCandidate(m, party);
    if (found && found.party === party) lineVotes = (lineVotes ?? 0) + found.votes;
  }
  const ranked = [...totals.values()].sort((a, b) => b.votes - a.votes);
  const leader = ranked[0] && ranked[0].votes > 0 && ranked[0].votes !== ranked[1]?.votes ? { ...ranked[0], share: pct(ranked[0].votes, validVotes) } : null;
  return { validVotes, leader, lineVotes, lineShare: lineVotes === null ? null : pct(lineVotes, validVotes) };
}

export function cargoRow(territory: Territory, offices: OfficeResult[], metrics: ElectionMetric[], line: OfficeLine, year: number): CargoRow {
  const office = summarizeOffice(offices, line);
  const president = summarizePresident(metrics, presidentParty(line, year));
  const splitPp = office.lineShare !== null && president?.lineShare != null ? office.lineShare - president.lineShare : null;
  return { territory, office, president, splitPp };
}

export interface LinearFit { slope: number; intercept: number; r: number | null; n: number }

/** Ordinary least squares y = a + b·x. Null below 30 points or without variance in x (no silent fit). */
export function ols(points: { x: number; y: number }[]): LinearFit | null {
  const n = points.length;
  if (n < 30) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (const p of points) { sxx += (p.x - mx) ** 2; sxy += (p.x - mx) * (p.y - my); syy += (p.y - my) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx, r: syy === 0 ? null : sxy / Math.sqrt(sxx * syy), n };
}
