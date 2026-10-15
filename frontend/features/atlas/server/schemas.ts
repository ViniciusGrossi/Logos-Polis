import { z } from "zod";
import type { Geometry } from "geojson";
import { AtlasError } from "./errors";
import { regionIds } from "../scopes";

export const ufs = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
export const ufSchema = z.enum(["BR", ...ufs, ...regionIds]);
const count = z.number().int().nonnegative();
const finite = z.number().finite();
const percentage = finite.min(0).max(100);
const text = z.string().min(1);
const publicUrl = z.url({ protocol: /^https?$/ });
const decimalInput = (defaultValue: number, min: number, max: number) => z.preprocess(v => v === undefined ? String(defaultValue) : v, z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(min).max(max)));
const year = decimalInput(2022, 1990, 2100);
const round = decimalInput(2, 1, 2).pipe(z.union([z.literal(1), z.literal(2)]));
const uf = ufSchema.default("BR");
const point = z.tuple([finite.min(-180).max(180), finite.min(-90).max(90)]);
export const territorySchema = z.object({ id: text, name: text, level: z.enum(["country", "region", "state", "municipality", "exterior"]), uf: z.enum([...ufs, "ZZ"]).nullable(), tseCode: count.nullable(), ibgeCode: count.nullable(), mapped: z.boolean(), comparable: z.boolean(), centroid: point.optional() });
export const candidateSchema = z.object({ id: text, name: text, party: text, votes: count, share: percentage, personKey: text.nullable().optional() });
export const metricSchema = z.object({ territoryId: text, year: count, round: z.union([z.literal(1), z.literal(2)]), eligible: count, turnout: count, abstentions: count, validVotes: count, officialValidVotes: count, blankVotes: count, nullVotes: count, candidates: z.array(candidateSchema) });
const officeCode = z.union([z.literal(3), z.literal(5), z.literal(6), z.literal(7), z.literal(8)]);
export const officeSchema = z.object({ territoryId: text, year: count, round: z.union([z.literal(1), z.literal(2)]), office: officeCode, seats: count.nullable(), eligible: count, turnout: count, abstentions: count, blankVotes: count, nullVotes: count, officialValidVotes: count, validVotes: count, candidates: z.array(z.tuple([text, text, count, text.nullable()])), parties: z.array(z.tuple([text, count, count])) });
export const sourceSchema = z.object({ id: text, title: text, url: publicUrl, period: text, collectedAt: text, methodology: text, status: z.enum(["available", "unavailable", "partial"]) });
export const catalogSchema = z.object({ schemaVersion: z.literal(1), snapshotId: text, generatedAt: z.iso.datetime({ offset: true }), elections: z.array(z.object({ year: count, rounds: z.array(z.union([z.literal(1), z.literal(2)])), provisional: z.boolean() })), territories: z.array(territorySchema), coverage: z.object({ resultsMunicipalities: count, mappedMunicipalities: count, issues: z.array(z.object({ id: text, name: text, uf: text, reason: text })), geometryEdition: text }), sources: z.array(sourceSchema), methodology: z.array(text), offices: z.array(z.object({ office: officeCode, label: text, elections: z.array(z.object({ year: count, rounds: z.array(z.union([z.literal(1), z.literal(2)])) })) })).optional() });
const contextValueSchema = z.object({ territoryId: text, income: finite.nonnegative().nullable(), education: percentage.nullable(), density: finite.nonnegative().nullable(), gdp: finite.nonnegative().nullable().optional(), homicide: finite.nonnegative().nullable().optional() });
export const contextSchema = z.object({ values: z.array(contextValueSchema), indicators: z.array(z.object({ id: z.enum(["income", "education", "density", "gdp", "homicide"]), label: text, unit: text, period: text, sourceId: text, status: z.enum(["available", "unavailable", "partial"]) })), sources: z.array(sourceSchema) });
export const themesSchema = z.object({ topics: z.array(z.object({ id: text, name: text, description: text })), series: z.array(z.object({ id: text, name: text, geography: text, period: text, collectedAt: text, sourceUrl: publicUrl, normalization: text, values: z.array(z.object({ date: z.iso.date(), value: percentage.nullable() })) })), surveys: z.array(z.object({ id: text, institution: text, title: text, question: text, universe: text, geography: text, collectedAt: text, sourceUrl: publicUrl, results: z.array(z.object({ topic: text, percentage })), methodology: text })), sources: z.array(sourceSchema) });
export const representationSchema = z.array(z.object({ territoryId: text, year: count, parties: z.array(z.object({ party: text, votes: count, share: percentage, seats: count })), elected: z.array(z.object({ name: text, party: text, office: text })) }));

function validCoordinates(value: unknown, depth: number): boolean {
  if (!Array.isArray(value)) return false;
  if (depth === 0) return value.length >= 2 && value.every(v => typeof v === "number" && Number.isFinite(v));
  return value.every(v => validCoordinates(v, depth - 1));
}
function validGeometry(value: unknown): value is Geometry {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  if (value.type === "GeometryCollection") return "geometries" in value && Array.isArray(value.geometries) && value.geometries.every(validGeometry);
  const depths: Record<string, number> = { Point: 0, MultiPoint: 1, LineString: 1, MultiLineString: 2, Polygon: 2, MultiPolygon: 3 };
  return typeof value.type === "string" && Object.hasOwn(depths, value.type) && "coordinates" in value && validCoordinates(value.coordinates, depths[value.type]);
}
export const geometrySchema = z.object({ type: z.literal("FeatureCollection"), features: z.array(z.object({ type: z.literal("Feature"), geometry: z.custom<Geometry>(validGeometry), properties: z.object({ id: text, name: text.optional() }), id: z.union([z.string(), z.number()]).optional() })) });

const territoryQuery = z.object({ uf, year, round, page: decimalInput(1, 1, 100000), pageSize: decimalInput(50, 1, 100), kind: z.literal("geometry").optional() }).strict();
const comparisonQuery = z.object({ uf, fromYear: decimalInput(2018, 1990, 2100), toYear: year, round, candidate: z.string().regex(/^[\p{L}\p{N} .:_-]{1,100}$/u).default("PT") }).strict();
const contextQuery = z.object({ uf, year, round, indicator: z.enum(["income", "education", "density", "gdp", "homicide"]).default("income"), candidate: z.enum(["PT","PL"]).default("PT"), measure: z.enum(["share", "delta"]).default("share"), weighted: z.enum(["true", "false"]).default("false").transform(v => v === "true") }).strict();
const line = z.enum(["PT", "PL"]).default("PT");
const cargosQuery = z.object({ uf, year, round: decimalInput(1, 1, 2).pipe(z.union([z.literal(1), z.literal(2)])), office: decimalInput(3, 3, 8).pipe(officeCode), line }).strict();
const residuosQuery = z.object({ uf, year: decimalInput(2026, 2026, 2026), line }).strict();
const dossierQuery = z.object({ id: z.string().regex(/^(BR|EXTERIOR|[A-Z]{2}|[A-Za-z0-9:_-]{1,32})$/) }).strict();
const emptyQuery = z.object({}).strict();
export type TerritoryQuery = z.infer<typeof territoryQuery>;
export type ComparisonQuery = z.infer<typeof comparisonQuery>;
export type ContextQuery = Omit<z.infer<typeof contextQuery>, 'candidate'> & { candidate?: 'PT' | 'PL' };
export type CargosQuery = z.infer<typeof cargosQuery>;
export type ResiduosQuery = z.infer<typeof residuosQuery>;
export type AtlasEndpoint = "catalogo" | "territorios" | "comparacao" | "contexto" | "pautas" | "dossie" | "cargos" | "residuos";

export function parseAtlasQuery(endpoint: "territorios", search: URLSearchParams): TerritoryQuery;
export function parseAtlasQuery(endpoint: "comparacao", search: URLSearchParams): ComparisonQuery;
export function parseAtlasQuery(endpoint: "contexto", search: URLSearchParams): z.infer<typeof contextQuery>;
export function parseAtlasQuery(endpoint: "cargos", search: URLSearchParams): CargosQuery;
export function parseAtlasQuery(endpoint: "residuos", search: URLSearchParams): ResiduosQuery;
export function parseAtlasQuery(endpoint: "dossie", search: URLSearchParams): { id: string };
export function parseAtlasQuery(endpoint: "catalogo" | "pautas", search: URLSearchParams): Record<string, never>;
export function parseAtlasQuery(endpoint: AtlasEndpoint, search: URLSearchParams) {
  const params: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, value] of search) {
    if (Object.hasOwn(params, key)) throw new AtlasError("INVALID_QUERY", "Parâmetro repetido.");
    params[key] = value;
  }
  const schema = { territorios: territoryQuery, comparacao: comparisonQuery, contexto: contextQuery, dossie: dossierQuery, cargos: cargosQuery, residuos: residuosQuery, catalogo: emptyQuery, pautas: emptyQuery }[endpoint];
  const parsed = schema.safeParse(params);
  if (!parsed.success) throw new AtlasError("INVALID_QUERY", "Filtros inválidos. Confira território, eleição, turno e paginação.");
  return parsed.data;
}
