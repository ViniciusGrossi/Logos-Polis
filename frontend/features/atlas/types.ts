import type { FeatureCollection, Geometry } from "geojson";

export type ElectionRound = 1 | 2;
export type AtlasTab = "atlas" | "evolucao" | "contexto" | "pautas";
export type AtlasIndicator = "winner" | "margin" | "turnout" | "abstention" | "blank" | "null";
export type ContextIndicator = "income" | "education" | "density";
export interface Territory {
  id: string; name: string; level: "country" | "region" | "state" | "municipality" | "exterior";
  uf: string | null; tseCode: number | null; ibgeCode: number | null;
  mapped: boolean; comparable: boolean; centroid?: [number, number];
}
export interface CandidateResult {
  id: string; name: string; party: string; votes: number; share: number;
  personKey?: string | null;
}
export interface ElectionMetric {
  territoryId: string; year: number; round: ElectionRound;
  eligible: number; turnout: number; abstentions: number;
  validVotes: number; officialValidVotes: number; blankVotes: number; nullVotes: number;
  candidates: CandidateResult[];
}
export interface AtlasSource {
  id: string; title: string; url: string; period: string; collectedAt: string;
  methodology: string; status: "available" | "unavailable" | "partial";
}
export interface CoverageIssue { id: string; name: string; uf: string; reason: string; }
export interface AtlasCatalog {
  versions?: { snapshotId: string; generatedAt: string }[];
  schemaVersion: 1; snapshotId: string; generatedAt: string;
  elections: { year: number; rounds: ElectionRound[]; provisional: boolean }[];
  territories: Territory[];
  coverage: { resultsMunicipalities: number; mappedMunicipalities: number; issues: CoverageIssue[]; geometryEdition: string };
  sources: AtlasSource[]; methodology: string[];
}
export type AtlasGeometry = FeatureCollection<Geometry, { id: string; name?: string }>;
export interface AtlasMeta { snapshotId: string; source: string; methodology: string; generatedAt: string; }
export interface AtlasResponse<T> { data: T; meta: AtlasMeta; }
export interface TerritoryRecord { territory: Territory; metric: ElectionMetric | null; }
export interface TerritoryDataset {
  records: TerritoryRecord[]; rows: TerritoryRecord[];
  pagination: { page: number; pageSize: number; total: number };
  summary: ElectionMetric | null;
}
export interface ComparisonRow {
  territory: Territory; before: ElectionMetric | null; after: ElectionMetric | null;
  beforeShare: number | null; afterShare: number | null; deltaPp: number | null;
  deltaVotes: number | null; marginBefore: number | null; marginAfter: number | null;
  winnerBefore: string | null; winnerAfter: string | null;
  changed: boolean; status: "comparable" | "missing" | "tie";
}
export interface ComparisonDataset {
  rows: ComparisonRow[]; fromYear: number; toYear: number; round: ElectionRound;
  candidateLabelBefore: string; candidateLabelAfter: string;
  summary: { comparable: number; changed: number; missing: number; ties: number; votesInChanged: number; positive: number; negative: number; };
  transitions: { from: string; to: string; municipalities: number; votes: number }[];
}
export interface ContextValue {
  territoryId: string; income: number | null; education: number | null; density: number | null;
}
export interface ContextDataset {
  values: ContextValue[];
  indicators: { id: ContextIndicator; label: string; unit: string; period: string; sourceId: string; status: "available" | "unavailable" | "partial" }[];
  sources: AtlasSource[];
}
export interface ContextPoint { territory: Territory; x: number; y: number; weight: number; }
export interface CorrelationResult { n: number; coefficient: number | null; weighted: boolean; }
export interface ContextAnalysis {
  points: ContextPoint[]; national: CorrelationResult; regional: CorrelationResult;
  indicator: ContextDataset["indicators"][number]; missing: number;
  candidateLabel: string; methodology: string;
}
export interface ThemeSeries {
  id: string; name: string; geography: string; period: string; collectedAt: string;
  sourceUrl: string; normalization: string;
  values: { date: string; value: number | null }[];
}
export interface PublicSurvey {
  id: string; institution: string; title: string; question: string;
  universe: string; geography: string; collectedAt: string; sourceUrl: string;
  results: { topic: string; percentage: number }[]; methodology: string;
}
export interface ThemesDataset { topics: { id: string; name: string; description: string }[]; series: ThemeSeries[]; surveys: PublicSurvey[]; sources: AtlasSource[]; }
export interface Representation {
  territoryId: string; year: number;
  parties: { party: string; votes: number; share: number; seats: number }[];
  elected: { name: string; party: string; office: string }[];
}
export interface DossierDataset {
  territory: Territory; history: ElectionMetric[]; context: ContextValue | null;
  indicators: ContextDataset["indicators"]; representation: Representation[];
}
