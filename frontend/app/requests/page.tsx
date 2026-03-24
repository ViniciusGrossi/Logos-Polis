"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Map, 
  MapMarker, 
  MarkerPopup, 
  MapControls, 
  MarkerContent,
  MarkerTooltip,
  useMap
} from "@/components/ui/map";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  Zap,
  Navigation,
  Layers,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// Coordinates for each city
const CITY_COORDINATES: Record<string, [number, number]> = {
  "Valparaíso de Goiás": [-47.986, -16.068],
  "Cidade Ocidental": [-47.925, -16.082],
  "Novo Gama": [-48.037, -16.059],
  "Luziânia": [-47.950, -16.252]
};

const regionDemands = [
  { 
    id: 1, 
    name: "Jardim Ingá", 
    coords: [-48.012, -16.155], 
    demandCount: 18, 
    topProblem: "Saneamento", 
    severity: "Alta",
    description: "Vazamento de esgoto na Rua 15 e falta de asfalto no Setor 02."
  },
  { 
    id: 2, 
    name: "Céu Azul", 
    coords: [-47.973, -16.082], 
    demandCount: 12, 
    topProblem: "Segurança", 
    severity: "Crítica",
    description: "Pico de assaltos na região comercial. Iluminação pública inoperante."
  },
  { 
    id: 3, 
    name: "Ipanema", 
    coords: [-47.994, -16.071], 
    demandCount: 8, 
    topProblem: "Saúde", 
    severity: "Média",
    description: "Falta de médicos especialistas na Unidade de Saúde da Família."
  },
  { 
    id: 4, 
    name: "Parque Rio Branco", 
    coords: [-47.981, -16.059], 
    demandCount: 5, 
    topProblem: "Educação", 
    severity: "Baixa",
    description: "Reforma necessária no muro da Escola Municipal local."
  },
];

const cities = Object.keys(CITY_COORDINATES);

// Internal component to handle camera movements
function MapController({ center }: { center: [number, number] }) {
  const { map, isLoaded } = useMap();

  useEffect(() => {
    if (isLoaded && map) {
      map.flyTo({
        center,
        zoom: 13,
        duration: 2500,
        essential: true
      });
    }
  }, [center, isLoaded, map]);

  return null;
}

export default function RadarPage() {
  const [selectedRegion, setSelectedRegion] = useState<typeof regionDemands[0] | null>(null);
  const [viewMode, setViewMode] = useState<"heat" | "points">("points");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Valparaíso de Goiás");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Memoize map center
  const currentCenter = useMemo(() => CITY_COORDINATES[selectedCity], [selectedCity]);

  const mapStyles = useMemo(() => ({ 
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" 
  }), []);

  const filteredRegions = useMemo(() => {
    return regionDemands.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.topProblem.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="relative h-[calc(100vh-2rem)] w-full overflow-hidden rounded-3xl border border-white/5 bg-black">
      
      {/* Map is the Foundation */}
      <Map 
        center={currentCenter}
        zoom={13}
        styles={mapStyles}
      >
        <MapControls position="bottom-right" showLocate showZoom showFullscreen />
        <MapController center={currentCenter} />
        
        {viewMode === "points" && filteredRegions.map(region => (
          <MapMarker 
            key={region.id} 
            longitude={region.coords[0]} 
            latitude={region.coords[1]}
            onClick={() => setSelectedRegion(region)}
          >
            <MarkerContent>
               <div className={cn(
                 "relative flex items-center justify-center transition-transform hover:scale-125",
                 region.severity === "Crítica" ? "animate-pulse" : ""
               )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 border-white/20 shadow-2xl",
                    region.severity === "Crítica" ? "bg-danger text-white" : 
                    region.severity === "Alta" ? "bg-orange-500 text-white" : 
                    "bg-acid text-black"
                  )}>
                    <span className="font-mono text-xs font-bold">{region.demandCount}</span>
                  </div>
                  {/* Outer Glow */}
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-md -z-10",
                    region.severity === "Crítica" ? "bg-danger/40" : 
                    region.severity === "Alta" ? "bg-orange-500/30" : 
                    "bg-acid/20"
                  )} />
               </div>
            </MarkerContent>
            
            <MarkerTooltip>
              <div className="font-mono text-[10px] uppercase text-acid font-bold tracking-widest px-1">
                {region.name} :: {region.demandCount} Demandas
              </div>
            </MarkerTooltip>

            {selectedRegion?.id === region.id && (
              <MarkerPopup closeButton onClose={() => setSelectedRegion(null)} className="w-64 p-0 overflow-hidden bg-charcoal border-white/10">
                <div className="p-4 space-y-3">
                   <div className="flex justify-between items-center mb-2">
                      <Badge variant={region.severity === "Crítica" ? "danger" : "warning"}>{region.severity}</Badge>
                      <span className="font-mono text-[10px] text-neutral-500">#{region.id}</span>
                   </div>
                   <h4 className="text-xl font-serif text-white">{region.name}</h4>
                   <div className="space-y-1">
                      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Problema Principal</p>
                      <p className="text-sm text-acid font-medium">{region.topProblem}</p>
                   </div>
                   <p className="text-xs text-neutral-400 font-sans leading-relaxed border-t border-white/5 pt-2">
                     {region.description}
                   </p>
                   <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-mono uppercase tracking-widest transition-colors rounded">
                      Ver Processos
                   </button>
                </div>
              </MarkerPopup>
            )}
          </MapMarker>
        ))}

        {viewMode === "heat" && regionDemands.map(region => (
          <MapMarker 
            key={`heat-${region.id}`} 
            longitude={region.coords[0]} 
            latitude={region.coords[1]}
          >
            <MarkerContent className="pointer-events-none">
              <div className={cn(
                "relative flex items-center justify-center",
                region.severity === "Crítica" ? "w-64 h-64 opacity-70 bg-danger/50 shadow-[0_0_100px_rgba(239,68,68,0.4)]" : 
                region.severity === "Alta" ? "w-48 h-48 opacity-60 bg-orange-500/40 shadow-[0_0_80px_rgba(249,115,22,0.3)]" : 
                region.severity === "Média" ? "w-40 h-40 opacity-50 bg-yellow-400/40 shadow-[0_0_60px_rgba(250,204,21,0.3)]" : 
                "w-32 h-32 opacity-40 bg-acid/30 shadow-[0_0_40px_rgba(204,255,0,0.2)]",
                "rounded-full blur-[40px] animate-pulse"
              )} />
            </MarkerContent>
          </MapMarker>
        ))}
      </Map>

      {/* Overlays - UI elements anchored to the map */}
      
      {/* Top Header Overlay */}
      <div className="absolute top-6 left-6 pointer-events-none space-y-4">
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-danger font-mono text-[10px] tracking-[0.2em] uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded border border-white/5 w-fit shadow-2xl">
               <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
               RADAR :: {selectedCity.toUpperCase()}
            </div>
            
            {/* City Selector */}
            <div className="relative pointer-events-auto">
               <button 
                 onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                 className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 rounded text-[10px] font-mono text-neutral-400 hover:text-white transition-colors shadow-2xl"
               >
                  ALTERAR CIDADE <ChevronDown className="w-3 h-3" />
               </button>
               
               {isCityDropdownOpen && (
                 <div className="absolute top-full left-0 mt-2 w-48 bg-charcoal border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-1">
                    {cities.map(city => (
                      <button 
                        key={city}
                        onClick={() => {
                          setSelectedCity(city);
                          setIsCityDropdownOpen(false);
                          setSelectedRegion(null);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 text-[10px] font-mono uppercase transition-colors border-b border-white/5 last:border-0 hover:bg-white/5",
                          selectedCity === city ? "text-acid bg-white/5" : "text-neutral-400"
                        )}
                      >
                        {city}
                      </button>
                    ))}
                 </div>
               )}
            </div>
         </div>
         <h1 className="text-4xl font-serif text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Mapa de Demandas</h1>
      </div>

      {/* Side Intelligence Panel */}
      <div className="absolute top-6 right-6 w-80 space-y-4">
         <FlashlightCard className="bg-black/60 backdrop-blur-xl border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="space-y-1">
               <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest px-1">Inteligência Territorial</h3>
               <p className="text-xs text-neutral-400 leading-relaxed uppercase font-mono px-1">Detectamos um cluster de insatisfação em Céu Azul referente à Iluminação Pública.</p>
            </div>
            
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-[10px] font-mono mb-2">
                    <span className="text-neutral-500">COBERTURA MAPA</span>
                    <span className="text-acid">92%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-acid w-[92%] shadow-[0_0_10px_rgba(204,255,0,0.5)]" />
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                     <p className="text-[10px] font-mono text-neutral-500 uppercase">Totais</p>
                     <p className="text-xl font-mono text-white">43</p>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                     <p className="text-[10px] font-mono text-neutral-500 uppercase">Críticos</p>
                     <p className="text-xl font-mono text-danger">12</p>
                  </div>
               </div>
            </div>
         </FlashlightCard>

         {/* Bottom Legend / Controls */}
         <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-2xl ring-1 ring-white/10">
            <div className="flex gap-2">
               <button 
                 title="Visão de Pontos"
                 onClick={() => setViewMode("points")}
                 className={cn(
                   "p-2.5 rounded-xl transition-all border border-transparent hover:border-white/10", 
                   viewMode === "points" ? "bg-acid text-black border-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.4)]" : "text-neutral-500 hover:text-white bg-white/5"
                 )}
               >
                  <Navigation className="w-4 h-4" />
               </button>
               <button 
                 title="Mapa de Calor (Densidade)"
                 onClick={() => setViewMode("heat")}
                 className={cn(
                   "p-2.5 rounded-xl transition-all border border-transparent hover:border-white/10", 
                   viewMode === "heat" ? "bg-acid text-black border-acid/20 shadow-[0_0_20px_rgba(204,255,0,0.4)]" : "text-neutral-500 hover:text-white bg-white/5"
                 )}
               >
                  <Layers className="w-4 h-4" />
               </button>
            </div>
            
            <div className="relative group flex-1 ml-4 overflow-hidden rounded-xl border border-white/5">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-acid transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR BAIRRO..."
                className="w-full bg-white/5 py-2.5 pl-9 pr-4 text-[10px] font-mono text-white focus:outline-none focus:bg-white/10 transition-all uppercase placeholder:text-neutral-700"
              />
            </div>
         </div>
         
         {/* Search Results Preview */}
         {searchQuery && filteredRegions.length > 0 && (
           <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl overflow-hidden animate-in slide-in-from-top-2 shadow-2xl ring-1 ring-white/10">
              {filteredRegions.map(region => (
                <button 
                  key={region.id}
                  onClick={() => {
                    setSelectedRegion(region);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/10 transition-colors flex justify-between items-center"
                >
                   <span className="text-[10px] font-mono text-white uppercase tracking-wider font-bold">{region.name}</span>
                   <Badge variant="outline" className="text-[8px] opacity-60 border-white/20">{region.topProblem}</Badge>
                </button>
              ))}
           </div>
         )}
      </div>

      {/* Heatmap Layer Overlays (Visual Feedback) */}
      {viewMode === "heat" && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-5">
           <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-acid/20 shadow-[0_0_30px_rgba(204,255,0,0.2)]">
              <p className="text-acid font-mono text-[9px] uppercase tracking-[0.4em] animate-pulse">Integração Territorial :: Densidade de Demandas Ativa</p>
           </div>
        </div>
      )}

    </div>
  );
}
