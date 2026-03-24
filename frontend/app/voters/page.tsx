"use client";

import { useState } from "react";
import { 
  Users, Search, Filter, MapPin, 
  Calendar, Tag, MoreHorizontal, ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";

const votersData = [
  { id: "V001", name: "Ricardo Albuquerque", hood: "Setor Sul", tags: ["Saúde", "Educação"], lastInteraction: "24 Mar 2026", status: "Ativo" },
  { id: "V002", name: "Helena Matos", hood: "Centro", tags: ["Segurança"], lastInteraction: "22 Mar 2026", status: "Ativo" },
  { id: "V003", name: "Marcos Vinícius", hood: "Vila Norte", tags: ["Infra"], lastInteraction: "21 Mar 2026", status: "Inativo" },
  { id: "V004", name: "Sofia Rodrigues", hood: "Setor Leste", tags: ["Esporte", "Saúde"], lastInteraction: "20 Mar 2026", status: "Ativo" },
  { id: "V005", name: "Gabriel Souza", hood: "Setor Sul", tags: ["Educação"], lastInteraction: "18 Mar 2026", status: "Ativo" },
  { id: "V006", name: "Letícia Lima", hood: "Centro", tags: ["Segurança", "Transporte"], lastInteraction: "15 Mar 2026", status: "Ativo" },
];

export default function VotersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-acid font-mono text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-acid/30"></div>
            Sovereign CRM
          </div>
          <h1 className="text-6xl font-serif text-white leading-none uppercase">Contatos</h1>
          <p className="text-neutral-500 font-sans text-lg max-w-md">Gestão estratégica de contatos e mapeamento de interações.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2 text-right">
          <div className="text-5xl font-mono text-white tracking-tighter">[84.209]</div>
          <p className="text-neutral-500 font-mono text-xs uppercase tracking-widest">Total de Contatos na Base</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Terminal Filters Overlaying the Grid */}
        <aside className="lg:col-span-1 space-y-8">
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest px-1">Filtros de Precisão</h3>
            
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-acid transition-colors" />
              <input 
                type="text" 
                placeholder="BUSCAR NOME..."
                className="w-full bg-surface border-b border-white/5 py-3 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-acid transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Território</p>
                <div className="flex flex-wrap gap-2">
                  {["CENTRO", "NORTE", "SUL", "LESTE"].map(h => (
                    <button key={h} className="text-[10px] font-mono px-2 py-1 bg-charcoal border border-white/5 text-neutral-400 hover:text-white hover:border-white/20 transition-all uppercase">
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Temas Críticos</p>
                <div className="flex flex-wrap gap-2">
                  {["SAÚDE", "INFRA", "SEGURANÇA", "EDUCAÇÃO"].map(h => (
                    <button key={h} className="text-[10px] font-mono px-2 py-1 bg-charcoal border border-white/5 text-neutral-400 hover:text-white hover:border-white/20 transition-all uppercase">
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-acid/5 border border-acid/10 rounded-sm space-y-2">
             <div className="flex items-center gap-2 text-acid font-mono text-[10px]">
                <div className="w-1.5 h-1.5 bg-acid rounded-full animate-pulse"></div>
                SISTEMA EM TEMPO REAL
             </div>
             <p className="text-[10px] text-acid/60 font-mono leading-relaxed uppercase">
                24 novos contatos identificados via WhatsApp nas últimas 2h.
             </p>
          </div>
        </aside>

        {/* Main Grid - Asymmetric Tension */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {votersData.map((voter) => (
              <FlashlightCard key={voter.id} className="group relative overflow-hidden bg-surface/40 hover:bg-surface/60 transition-colors cursor-pointer border-none shadow-none p-0">
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-charcoal border border-white/5 flex items-center justify-center font-serif text-xl text-neutral-400">
                        {voter.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="text-lg font-serif text-white group-hover:text-acid transition-colors">{voter.name}</h4>
                        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500">
                          <MapPin className="w-3 h-3 text-acid/50" /> {voter.hood}
                        </div>
                      </div>
                    </div>
                    <Badge variant={voter.status === "Ativo" ? "acid" : "default"}>{voter.status}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {voter.tags.map(tag => (
                      <Badge key={tag} variant="info" className="bg-blue-500/5 border-blue-500/10 text-blue-400/80">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest">Ult. Interação</p>
                      <p className="text-xs font-mono text-neutral-400">{voter.lastInteraction}</p>
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
        </div>

      </div>
    </div>
  );
}
