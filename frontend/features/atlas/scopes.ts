import type { Territory } from "./types";

/** IBGE's five macroregions. Exterior is intentionally not a member. */
export const atlasRegions = [
  {
    id: "NORTE",
    name: "Norte",
    states: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  },
  {
    id: "NORDESTE",
    name: "Nordeste",
    states: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  },
  {
    id: "CENTRO-OESTE",
    name: "Centro-Oeste",
    states: ["DF", "GO", "MT", "MS"],
  },
  { id: "SUDESTE", name: "Sudeste", states: ["ES", "MG", "RJ", "SP"] },
  { id: "SUL", name: "Sul", states: ["PR", "RS", "SC"] },
] as const;

export type AtlasRegionId = (typeof atlasRegions)[number]["id"];
export const regionIds = [
  "NORTE",
  "NORDESTE",
  "CENTRO-OESTE",
  "SUDESTE",
  "SUL",
] as const;
export const regionForScope = (id: string) =>
  atlasRegions.find((region) => region.id === id);
export const isStateScope = (id: string) =>
  /^[A-Z]{2}$/.test(id) && id !== "BR";
export const scopeContainsState = (scope: string, state: string | null) =>
  state !== null &&
  (scope === "BR" ||
    scope === state ||
    Boolean(regionForScope(scope)?.states.some((member) => member === state)));
export const regionForState = (uf: string) =>
  atlasRegions.find((region) => region.states.some((member) => member === uf));
export const regionTerritories: Territory[] = atlasRegions.map((region) => ({
  id: region.id,
  name: region.name,
  level: "region",
  uf: null,
  tseCode: null,
  ibgeCode: null,
  mapped: true,
  comparable: true,
}));
