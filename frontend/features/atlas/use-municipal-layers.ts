"use client";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { fetchAtlasData } from "./use-atlas-data";
import type { AtlasGeometry, TerritoryDataset, TerritoryRecord } from "./types";

interface MunicipalBlock { uf: string; geometry: AtlasGeometry; records: TerritoryRecord[] }
function combine(results: UseQueryResult<MunicipalBlock>[]) {
  return {
    blocks: results.flatMap(result => result.data ? [result.data] : []),
    pending: results.some(result => result.isPending),
    failed: results.some(result => result.isError),
  };
}
export function useMunicipalLayers(ufs: string[], election?: {year: number; round: 1 | 2}) {
  return useQueries({
    queries: (election ? ufs : []).map(uf => ({
      queryKey: ["atlas-municipal", uf, election!.year, election!.round],
      staleTime: 10 * 60 * 1000,
      retry: 1,
      queryFn: async ({signal}: {signal: AbortSignal}): Promise<MunicipalBlock> => {
        // Publish geometry + matching edition atomically. Never color new polygons using stale votes.
        const [geometry, data] = await Promise.all([
          fetchAtlasData<AtlasGeometry>(`territorios?kind=geometry&uf=${uf}`, signal),
          fetchAtlasData<TerritoryDataset>(`territorios?uf=${uf}&year=${election!.year}&round=${election!.round}&pageSize=100`, signal),
        ]);
        return {uf, geometry:geometry.data, records:data.data.records};
      },
    })),
    combine,
  });
}
