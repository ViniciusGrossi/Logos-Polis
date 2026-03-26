import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const STATIC_CITY_CENTERS: Record<string, [number, number]> = {
  "Valparaiso de Goias": [-47.986, -16.068],
  "Novo Gama": [-48.037, -16.059],
  "Cidade Ocidental": [-47.925, -16.082],
  "Luziania": [-47.950, -16.252],
  "Luziânia": [-47.950, -16.252]
};

export function useRadar() {
  return useQuery({
    queryKey: ['radarDemands'],
    queryFn: async () => {
      // 1. Fetch real neighborhood coordinates from the DB
      const { data: bairrosData } = await supabase.from('bairros').select('cidade, bairro, latitude, longitude');
      const DB_COORDS: Record<string, [number, number]> = {};
      const citiesMeta: Record<string, { coords: [number, number][], center?: [number, number] }> = {};

      (bairrosData || []).forEach(b => {
        if (b.latitude && b.longitude) {
          const lgt = Number(b.longitude);
          const lat = Number(b.latitude);
          DB_COORDS[b.bairro] = [lgt, lat];
          
          if (!citiesMeta[b.cidade]) citiesMeta[b.cidade] = { coords: [] };
          citiesMeta[b.cidade].coords.push([lgt, lat]);
        }
      });

      // Calculate centers for each city, priority to static ones
      const cities: Record<string, [number, number]> = {};
      Object.entries(citiesMeta).forEach(([name, meta]) => {
        if (STATIC_CITY_CENTERS[name]) {
          cities[name] = STATIC_CITY_CENTERS[name];
        } else {
          const avgLgt = meta.coords.reduce((a, b) => a + b[0], 0) / meta.coords.length;
          const avgLat = meta.coords.reduce((a, b) => a + b[1], 0) / meta.coords.length;
          cities[name] = [avgLgt, avgLat];
        }
      });

      // 2. Fetch open demands
      const { data, error } = await supabase
        .from('demands')
        .select(`
          id,
          description,
          priority,
          status,
          created_at,
          target_neighborhood
        `)
        .in('status', ['pendente', 'aberto', 'em_andamento']);

      if (error) throw error;

      // Group by neighborhood
      const grouped: Record<string, any> = {};
      (data || []).forEach((demand: any) => {
        const hood = demand.target_neighborhood || "Geral";
        if (!grouped[hood]) {
          grouped[hood] = {
            id: hood,
            name: hood,
            coords: DB_COORDS[hood] || [-47.986, -16.068], 
            demands: [],
            demandCount: 0,
            severity: "Baixa",
            topProblem: hood === "Geral" ? "Geral" : "Infraestrutura"
          };
        }
        grouped[hood].demands.push({
          ...demand,
          title: demand.description.split('.')[0], 
        });
        grouped[hood].demandCount++;
        
        if (demand.priority === 'Crítica' || demand.priority === 'Alta') grouped[hood].severity = "Crítica";
        else if (demand.priority === 'Média' && grouped[hood].severity !== "Crítica") grouped[hood].severity = "Alta";
      });

      return {
        regions: Object.values(grouped),
        cities
      };
    }
  });
}
