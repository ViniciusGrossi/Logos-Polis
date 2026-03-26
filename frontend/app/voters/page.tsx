"use client";

import { useState } from "react";
import { 
  Users, Search, Filter, MapPin, 
  Calendar, Tag, MoreHorizontal, ArrowRight, TrendingUp 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useVoterScores, VoterScore } from "@/features/score-eleitor/useVoterScores";
import { useBairros } from "@/features/bairros/useBairros";
import { VoterModal } from "@/features/score-eleitor/VoterModal";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

export default function VotersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { globalRegionFilter, setGlobalRegionFilter } = useAppStore();
  const { data: voters, isLoading } = useVoterScores(globalRegionFilter);
  const { data: bairros } = useBairros();
  const [selectedVoter, setSelectedVoter] = useState<VoterScore | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);

  const filteredVoters = voters?.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !activeStatusFilter || v.status === activeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 sm:space-y-12 animate-slide-up">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 sm:gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-acid font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-acid/30"></div>
            Sovereign CRM
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif text-white leading-none uppercase">Contatos</h1>
          <p className="text-neutral-500 font-sans text-base sm:text-lg max-w-md">Gestão estratégica de contatos, interações e Score Eleitoral.</p>
        </div>
        
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-2 text-right border-t md:border-none border-white/5 pt-6 md:pt-0">
          <div className="flex flex-col items-start md:items-end">
            <div className="text-3xl sm:text-5xl font-mono text-white tracking-tighter">[{voters?.length || 0}]</div>
            <p className="text-neutral-500 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest leading-none">Total de Contatos</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
               <span className="text-acid font-mono text-xs sm:text-sm font-bold">{(voters?.filter(v => v.status === "ativo")?.length || 0)}</span>
               <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 uppercase tracking-widest">Ativos</span>
            </div>
            <div className="flex flex-col items-end opacity-60">
               <span className="text-white/40 font-mono text-xs sm:text-sm font-bold">{(voters?.filter(v => v.status === "inativo")?.length || 0)}</span>
               <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 uppercase tracking-widest">Inativos</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-acid font-mono text-xs sm:text-sm font-bold">{(voters?.filter(v => v.sentiment === "apoiador")?.length || 0)}</span>
               <span className="text-[8px] sm:text-[9px] font-mono text-neutral-600 uppercase tracking-widest">Apoiadores</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Terminal Filters */}
        <aside className="lg:col-span-1 space-y-6 sm:space-y-8 order-2 lg:order-1">
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest px-1">Filtros de Precisão</h3>
            
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-acid transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR NOME..."
                className="w-full bg-surface border-b border-white/5 py-4 lg:py-3 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-acid transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Território</p>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {bairros?.map(h => (
                    <button 
                      key={h} 
                      onClick={() => setGlobalRegionFilter(globalRegionFilter === h ? null : h)}
                      className={cn(
                        "text-[10px] font-mono px-3 py-1.5 transition-all uppercase rounded-sm border",
                        globalRegionFilter === h 
                          ? "bg-acid/10 border-acid/30 text-acid" 
                          : "bg-charcoal border-white/5 text-neutral-400 hover:text-white hover:border-white/20"
                      )}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Status / Filtro</p>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setActiveStatusFilter(null)}
                    className={cn(
                      "text-[9px] font-mono px-3 py-1.5 transition-all uppercase font-bold rounded-sm",
                      !activeStatusFilter ? "bg-acid/10 border border-acid/30 text-acid" : "bg-charcoal border border-white/5 text-neutral-400"
                    )}
                  >
                    TODOS
                  </button>
                  <button 
                    onClick={() => setActiveStatusFilter("ativo")}
                    className={cn(
                      "text-[9px] font-mono px-3 py-1.5 transition-all uppercase font-bold rounded-sm",
                      activeStatusFilter === "ativo" ? "bg-acid/10 border border-acid/30 text-acid" : "bg-charcoal border border-white/5 text-neutral-400"
                    )}
                  >
                    ATIVOS
                  </button>
                  <button 
                    onClick={() => setActiveStatusFilter("inativo")}
                    className={cn(
                      "text-[9px] font-mono px-3 py-1.5 transition-all uppercase font-bold rounded-sm",
                      activeStatusFilter === "inativo" ? "bg-acid/10 border border-acid/30 text-acid" : "bg-charcoal border border-white/5 text-neutral-400"
                    )}
                  >
                    INATIVOS
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-acid/5 border border-acid/10 rounded-xl space-y-3">
             <div className="flex items-center gap-2 text-acid font-mono text-[10px]">
                <div className="w-1.5 h-1.5 bg-acid rounded-full animate-pulse"></div>
                SISTEMA EM TEMPO REAL
             </div>
             <p className="text-[10px] text-acid/60 font-mono leading-relaxed uppercase">
                A IA recalcula o Score de cada eleitor após qualquer interação.
             </p>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {isLoading ? (
            <div className="text-acid font-mono uppercase tracking-[0.2em] animate-pulse">Carregando contatos...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVoters?.map((voter) => (
                  <FlashlightCard 
                    key={voter.id} 
                    className="group relative overflow-hidden bg-surface/40 hover:bg-surface/60 transition-colors cursor-pointer border-none shadow-none p-0"
                  >
                    <div onClick={() => setSelectedVoter(voter)} className="p-6 space-y-6 block">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-charcoal border border-white/5 flex items-center justify-center font-serif text-xl text-neutral-400 group-hover:border-acid/30 group-hover:text-acid transition-colors">
                            {voter.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                          </div>
                          <div>
                            <h4 className="text-lg font-serif text-white group-hover:text-acid transition-colors">{voter.name}</h4>
                            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                              <MapPin className="w-3 h-3 text-acid/50" /> {voter.neighborhood}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <ScoreBadge type={voter.sentiment} />
                          <Badge variant={voter.status === 'ativo' ? 'acid' : 'default'} className={cn(
                            "font-mono text-[8px] uppercase tracking-widest py-0.5",
                             voter.status === 'ativo' ? "bg-acid/10 text-acid border-acid/20" : "bg-white/5 text-neutral-500 border-white/5"
                          )}>
                            {voter.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="info" className="bg-blue-500/5 border-blue-500/10 text-blue-400/80">
                           {voter.lastInteraction && `Ult: ${voter.lastInteraction}`}
                        </Badge>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest flex items-center gap-1 group-hover:text-acid transition-colors">
                             <TrendingUp className="w-3 h-3" /> Poder do Score
                          </p>
                          <p className="text-xl font-serif text-white">{voter.score}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest text-right">Contato ID</p>
                          <p className="text-xs font-mono text-neutral-400">#CRM-{voter.id}</p>
                        </div>
                      </div>
                    </div>
                  </FlashlightCard>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                 <button className="px-8 py-3 bg-charcoal border border-white/5 text-xs font-mono uppercase tracking-[0.2em] text-neutral-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-3 group">
                    Ver carregamento completo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                 </button>
              </div>
            </>
          )}
        </div>

      </div>

      <VoterModal 
        voter={selectedVoter} 
        isOpen={!!selectedVoter} 
        onClose={() => setSelectedVoter(null)} 
      />
    </div>
  );
}
