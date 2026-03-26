"use client";

import { useState } from "react";
import { Users, Target, Activity, Search, MapPin, Zap, Instagram, TrendingUp, BarChart2, Loader2 } from "lucide-react";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTeam } from "@/features/equipe/useTeam";

export default function TeamPage() {
  const [activeTab, setActiveTab] = useState<"ground" | "digital">("ground");
  const { data: team = [], isLoading } = useTeam();

  const teamData = team.filter(t => !t.is_digital);
  const digitalTeam = team.filter(t => t.is_digital);
  const activeLeaders = team.filter(t => t.status === 'Ativo').length;
  const totalConverted = team.reduce((acc, t) => acc + (t.converted || 0), 0);
  const totalTarget = team.reduce((acc, t) => acc + (t.target || 0), 0) || 60000;
  const percentageConverted = ((totalConverted / totalTarget) * 100).toFixed(1);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up bg-obsidian min-h-screen">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-acid font-mono text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-acid/30"></div>
            Recursos Humanos
          </div>
          <h1 className="text-6xl font-serif text-white leading-none uppercase">Equipe & Lideranças</h1>
          <p className="text-neutral-500 font-sans text-lg max-w-lg">
            Monitoramento de performance de coordenadores regionais, cabos eleitorais e influenciadores digitais.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-charcoal border border-white/5 p-2 rounded-full">
          <button 
            onClick={() => setActiveTab("ground")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-sans transition-all",
              activeTab === "ground" ? "bg-white/10 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            Operação de Rua
          </button>
          <button 
            onClick={() => setActiveTab("digital")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-sans transition-all",
              activeTab === "digital" ? "bg-white/10 text-acid font-medium shadow-sm" : "text-neutral-500 hover:text-neutral-300"
            )}
          >
            Mobilização Digital
          </button>
        </div>
      </div>

      {/* KPI Flashlight Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[200px] bg-charcoal border-white/5">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-acid/20 to-black border border-acid/30 flex items-center justify-center text-acid mb-6">
              <Target className="w-5 h-5" />
           </div>
           <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">Meta Global de Conversão</p>
           <div className="flex items-baseline gap-2">
             <h3 className="text-4xl font-serif text-white">{totalConverted.toLocaleString('pt-BR')}</h3>
             <span className="text-sm font-mono text-neutral-500">/ {totalTarget.toLocaleString('pt-BR')} votos</span>
           </div>
           <div className="mt-4 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
             <div className="h-full bg-acid transition-all" style={{ width: `${Math.min(Number(percentageConverted), 100)}%` }} />
           </div>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[200px] bg-charcoal border-white/5">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-black border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6">
              <Users className="w-5 h-5" />
           </div>
           <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">Força de Trabalho</p>
           <h3 className="text-4xl font-serif text-white">{team.length} <span className="text-xl text-neutral-500">líderes globais</span></h3>
           <p className="text-xs font-mono text-blue-400 mt-2">{activeLeaders} com status Ativo</p>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[200px] bg-charcoal border-white/5">
           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-black border border-white/20 flex items-center justify-center text-white mb-6">
              <Activity className="w-5 h-5" />
           </div>
           <p className="font-mono text-xs text-neutral-500 uppercase tracking-widest mb-2">Custo de Aquisição Estimado</p>
           <h3 className="text-4xl font-serif text-white">R$ 0,00 <span className="text-xl text-neutral-500">/voto</span></h3>
           <p className="text-xs font-mono text-neutral-500 mt-2">Aguardando Integração Ads</p>
        </FlashlightCard>
      </div>

      {/* Tables Section */}
      <div className="bg-charcoal border border-white/5 rounded-2xl overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
           <div className="relative group w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input 
                 type="text" 
                 placeholder="BUSCAR LIDERANÇA..."
                 className="w-full bg-black/40 border border-white/5 py-2 pl-10 pr-4 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-acid transition-all"
              />
           </div>
           <button className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white transition-colors bg-white/5 px-4 py-2 border border-white/5 rounded-lg">
             <BarChart2 className="w-3 h-3" /> Relatório Completo
           </button>
        </div>

        {activeTab === "ground" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/10">
                  <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Nome / Cargo</th>
                  <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Território</th>
                  <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Desempenho (Meta)</th>
                  <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Avaliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Carregando base de líderes...
                      </div>
                    </td>
                  </tr>
                ) : teamData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                      Nenhuma equipe em solo registrada.
                    </td>
                  </tr>
                ) : teamData.map((member) => (
                  <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black border border-white/10 rounded-full flex items-center justify-center font-serif text-neutral-300">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-sans text-white font-medium group-hover:text-acid transition-colors">{member.name}</p>
                          <p className="text-[10px] font-mono text-neutral-500 uppercase">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                        <MapPin className="w-3 h-3 text-acid/50" /> {member.zone}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="w-full max-w-[200px] space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
                          <span>{member.converted}</span>
                          <span className="text-neutral-600">/ {member.target}</span>
                        </div>
                        <div className="h-1.5 w-full bg-black rounded-full overflow-hidden border border-white/5">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              (member.converted / (member.target || 1)) > 0.8 ? "bg-acid" : 
                              (member.converted / (member.target || 1)) > 0.5 ? "bg-yellow-500" : "bg-danger"
                            )} 
                            style={{ width: `${Math.min((member.converted / (member.target || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant={member.status === "Alta Performance" ? "acid" : member.status === "Atenção" ? "danger" : "default"} className="font-mono text-[9px] uppercase tracking-wider">
                        {member.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "digital" && (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/10">
                    <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Identificação / Canal</th>
                    <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Alcance Base</th>
                    <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Tópico Central</th>
                    <th className="p-4 text-[10px] font-mono text-neutral-500 uppercase tracking-widest text-right">Rank Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                        <div className="flex justify-center items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Carregando time digital...
                        </div>
                      </td>
                    </tr>
                  ) : digitalTeam.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                        Nenhum produtor digital registrado.
                      </td>
                    </tr>
                  ) : digitalTeam.map((inf) => (
                    <tr key={inf.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-white/10 rounded-xl flex items-center justify-center text-white">
                            <Instagram className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-sans text-white font-medium group-hover:text-acid transition-colors">{inf.name}</p>
                            <p className="text-[10px] font-mono text-neutral-500 uppercase">{inf.platform}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <p className="text-lg font-serif text-white">{inf.reach}</p>
                          <p className="text-[10px] font-mono text-acid uppercase tracking-widest bg-acid/10 px-2 py-0.5 rounded-full inline-block">
                             Engaj: {inf.engagement}%
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                         <span className="text-xs font-mono text-neutral-400 border border-white/10 px-2 py-1 rounded bg-black/40">
                           {inf.topic}
                         </span>
                      </td>
                      <td className="p-4 text-right">
                         <div className="inline-flex items-center justify-center w-8 h-8 rounded bg-white/5 border border-white/10 text-acid font-bold font-mono">
                            {inf.conversion_rank || '-'}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>

    </div>
  );
}
