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
  ChevronDown,
  Activity,
  BrainCircuit,
  Crosshair,
  PanelRightClose,
  PanelRightOpen,
  LineChart,
  MessageSquareWarning,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRadar } from "@/features/requests/useRadar";

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

interface RadarRegion {
  id: string;
  name: string;
  coords: [number, number];
  demandCount: number;
  severity: "Crítica" | "Alta" | "Média" | "Baixa";
  topProblem: string;
  demands: any[];
}

export default function RadarPage() {
  const [selectedRegion, setSelectedRegion] = useState<RadarRegion | null>(null);
  const [viewMode, setViewMode] = useState<"heat" | "points">("heat");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Valparaíso de Goiás");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isAiPredictionActive, setIsAiPredictionActive] = useState(false);
  const [activeSeverity, setActiveSeverity] = useState<"Todas" | "Crítica" | "Alta" | "Média">("Todas");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: radarData } = useRadar();
  const radarDemands: RadarRegion[] = radarData?.regions || [];
  const dynamicCities = radarData?.cities || {};

  // Normalize city selection
  const normalizedSelectedCity = useMemo(() => {
    const keys = Object.keys(dynamicCities);
    return keys.find(k => k.toLowerCase() === selectedCity.toLowerCase()) || selectedCity;
  }, [selectedCity, dynamicCities]);

  const currentCenter = useMemo(() => {
    return dynamicCities[normalizedSelectedCity] || [-47.986, -16.068];
  }, [normalizedSelectedCity, dynamicCities]);

  const mapStyles = useMemo(() => ({ 
    dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" 
  }), []);

  const filteredRegions = useMemo(() => {
    return radarDemands.filter((r: RadarRegion) => {
      const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.topProblem.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSeverity = activeSeverity === "Todas" || r.severity === activeSeverity;
      return matchSearch && matchSeverity;
    });
  }, [radarDemands, searchQuery, activeSeverity]);

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
        
        {viewMode === "points" && filteredRegions.map((region: RadarRegion) => (
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
                   <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-[10px] font-mono uppercase tracking-widest transition-colors rounded">
                      Ver Processos
                   </button>
                </div>
              </MarkerPopup>
            )}
          </MapMarker>
        ))}

        {viewMode === "heat" && filteredRegions.map(region => (
          <MapMarker 
            key={`heat-${region.id}`} 
            longitude={region.coords[0]} 
            latitude={region.coords[1]}
          >
            <MarkerContent className="pointer-events-none">
              <div className={cn(
                "relative flex items-center justify-center",
                region.severity === "Crítica" ? "w-64 h-64 opacity-70 bg-danger/50 rounded-full blur-[40px] animate-pulse" : 
                region.severity === "Alta" ? "w-48 h-48 opacity-60 bg-orange-500/40 rounded-full blur-[40px] animate-pulse" : 
                "w-32 h-32 opacity-40 bg-acid/30 rounded-full blur-[40px] animate-pulse"
              )} />
            </MarkerContent>
          </MapMarker>
        ))}
      </Map>

      {/* NEW: Unified Command Panel (Right Side) */}
      <div className={cn(
        "absolute top-6 right-6 bottom-6 transition-all duration-500 ease-in-out z-50 pointer-events-none",
        isCollapsed ? "w-12" : "w-80"
      )}>
        <div className="h-full w-full pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
          
          {/* Collapse Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute top-4 right-4 z-[60] p-2 bg-white/5 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white transition-all border border-white/5"
          >
            {isCollapsed ? <PanelRightOpen className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
          </button>

          {!isCollapsed && (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              {/* Header Section */}
              <div className="p-6 border-b border-white/5 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-acid font-mono text-[10px] uppercase tracking-[0.2em]">
                    <Activity className="w-3 h-3" /> Radar de Inteligência
                  </div>
                  <h1 className="text-2xl font-serif text-white uppercase tracking-tight">Território</h1>
                </div>

                {/* Compact City Selector */}
                <div className="relative">
                  <button 
                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs font-mono text-neutral-300 hover:text-white transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3 h-3 text-acid" />
                      {selectedCity.toUpperCase()}
                    </div>
                    <ChevronDown className={cn("w-3 h-3 transition-transform", isCityDropdownOpen ? "rotate-180" : "")} />
                  </button>
                  
                  {isCityDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-charcoal border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
                      {Object.keys(dynamicCities).map(city => (
                        <button 
                          key={city}
                          onClick={() => {
                            setSelectedCity(city);
                            setIsCityDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-5 py-4 text-[10px] font-mono uppercase transition-colors border-b border-white/5 last:border-0 hover:bg-white/5",
                            selectedCity === city ? "text-acid bg-acid/5" : "text-neutral-400"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Intelligence & Stats Section (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* View Modes */}
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Modos de Visualização</p>
                  <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                    <button 
                      onClick={() => setViewMode("points")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-[9px] font-mono uppercase font-bold transition-all",
                        viewMode === "points" ? "bg-acid text-black" : "text-neutral-500 hover:text-white"
                      )}
                    >
                      Pontos
                    </button>
                    <button 
                      onClick={() => setViewMode("heat")}
                      className={cn(
                        "flex-1 py-1.5 rounded-lg text-[9px] font-mono uppercase font-bold transition-all",
                        viewMode === "heat" ? "bg-acid text-black" : "text-neutral-500 hover:text-white"
                      )}
                    >
                      Calor
                    </button>
                  </div>
                </div>

                {/* AI Insights Card */}
                <div className="p-4 bg-acid/5 border border-acid/10 rounded-2xl space-y-3 relative overflow-hidden group">
                  <div className="flex items-center gap-2 text-acid font-mono text-[9px] uppercase tracking-widest">
                    <BrainCircuit className="w-3.5 h-3.5" /> Insights da I.A.
                  </div>
                  <p className="text-[10px] text-white/80 font-sans leading-relaxed">
                    Setor Norte apresenta 85% de sentimento "Hostil" devido à falta de asfalto. Sugestão: Visita técnica urgente.
                  </p>
                </div>

                {/* NEW: Sentiment Intelligence Section (The Differentiator) */}
                <div className="space-y-3 p-4 bg-neutral-900/50 border border-white/5 rounded-2xl">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">Índice de Humor Local</p>
                      <Badge variant="info" className="bg-blue-500/10 text-blue-400 border-none text-[8px]">IA</Badge>
                   </div>
                   <div className="space-y-4">
                      <div>
                         <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-1">
                            <span>FRUSTRAÇÃO</span>
                            <span>64%</span>
                         </div>
                         <div className="h-1 bg-white/5 rounded-full"><div className="h-full w-[64%] bg-orange-500 rounded-full" /></div>
                      </div>
                      <div>
                         <div className="flex justify-between text-[9px] font-mono text-neutral-500 mb-1">
                            <span>APOIO POLÍTICO</span>
                            <span>22%</span>
                         </div>
                         <div className="h-1 bg-white/5 rounded-full"><div className="h-full w-[22%] bg-acid rounded-full" /></div>
                      </div>
                   </div>
                   <p className="text-[9px] font-sans text-neutral-500 pt-2 italic">
                     *Análise baseada no tom das mensagens recebidas nos últimos 15 dias.
                   </p>
                </div>

                {/* Filters & Search */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Filtrar Gravidade</p>
                    <div className="flex flex-wrap gap-2">
                      {(["Todas", "Crítica", "Alta", "Média"] as const).map(sev => (
                        <button 
                          key={sev}
                          onClick={() => setActiveSeverity(sev)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase border transition-all",
                            activeSeverity === sev 
                              ? "bg-white text-black border-white" 
                              : "bg-transparent text-neutral-500 border-white/10 hover:border-white/30"
                          )}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative group overflow-hidden">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-acid transition-colors" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="BUSCAR BAIRRO..."
                      className="w-full bg-white/5 border-b border-white/10 py-3 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-acid transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Branding */}
              <div className="p-4 bg-acid/10 border-t border-acid/20 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-acid font-mono text-[8px] uppercase tracking-[0.2em]">
                    <div className="w-2 h-2 bg-acid rounded-full animate-pulse" />
                    Engenharia de Inteligência
                 </div>
                 <LineChart className="w-4 h-4 text-acid/40" />
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="w-full h-full flex flex-col items-center py-20 pointer-events-none opacity-40">
               <div className="[writing-mode:vertical-lr] font-mono text-[10px] uppercase tracking-[0.5em] text-acid select-none">
                 EXPANDIR RADAR
               </div>
            </div>
          )}
        </div>
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
