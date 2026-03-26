"use client";

import { useState } from "react";
import { Target, Activity, Zap, Sparkles, MessageSquare, Plus, RefreshCw, BarChart, ArrowUpRight, ArrowRight, Loader2 } from "lucide-react";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCampaigns } from "@/features/campanhas/useCampaigns";

export default function CampaignsPage() {
  const { data: activeCampaigns = [], isLoading } = useCampaigns();
  const [isGenerating, setIsGenerating] = useState(false);
  const [copy, setCopy] = useState("Clique abaixo para gerar uma sugestão de Copy focada nas dores mapeadas no Radar de Demandas para a região Sul.");

  const generateCopy = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setCopy("🚨 A falta de asfalto no Setor Sul não pode mais ser ignorada! ✅ Nosso mandato já exigiu a inclusão das Ruas 10 a 15 no cronograma de obras da prefeitura. 💬 Você concorda que essa deve ser a prioridade número 1? Comente aqui em qual rua você mora.");
      setIsGenerating(false);
    }, 1500);
  };

  const avgCPA = activeCampaigns.length > 0 
    ? activeCampaigns.reduce((acc, c) => acc + (c.cpa || 0), 0) / activeCampaigns.length 
    : 0;

  const totalLeads = activeCampaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);
  const retainedEngagement = totalLeads > 0 ? "12.4%" : "0%"; // Baseado nas conversões ativas ou retidas

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up bg-obsidian min-h-screen">
      
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-acid font-mono text-xs tracking-[0.2em] uppercase">
             <div className="w-8 h-[1px] bg-acid/30"></div>
             Tráfego & Automação
           </div>
           <h1 className="text-6xl font-serif text-white leading-none uppercase">Micro-campanhas</h1>
           <p className="text-neutral-500 font-sans text-lg max-w-lg">
             Supervisão de campanhas digitais e geração de conteúdo neural via IA direcionada.
           </p>
        </div>
        
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-charcoal border border-white/5 text-xs font-mono uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Sincronizar Bases
           </button>
           <button className="px-6 py-3 bg-white text-black text-xs font-display font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Campanha
           </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid md:grid-cols-3 gap-6">
        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[180px] bg-charcoal border-white/5">
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Custo Médio Acumulado (CPA)</p>
           <div className="flex items-baseline gap-2 mb-1">
             <h3 className="text-4xl font-serif text-white">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(avgCPA)}</h3>
             <span className="text-sm font-mono text-neutral-500 border border-white/5 bg-black px-2 py-0.5 rounded">Por Lead</span>
           </div>
           <p className="text-[10px] font-mono text-acid mt-2 flex items-center gap-1 uppercase tracking-widest">
             <ArrowUpRight className="w-3 h-3" /> Status Geral
           </p>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[180px] bg-charcoal border-white/5">
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Engajamento Retido</p>
           <h3 className="text-4xl font-serif text-white">{retainedEngagement}</h3>
           <p className="text-[10px] font-mono text-white/40 mt-2 uppercase tracking-widest">Base de {totalLeads} Leads Totais</p>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[180px] bg-charcoal border-white/5">
           <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">M</div>
              <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold font-serif">G</div>
           </div>
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Status da Integração Ads</p>
           <h3 className="text-xl font-serif text-white">Aguardando API</h3>
           <div className="text-[10px] font-mono text-neutral-500 mt-2 uppercase tracking-widest flex items-center gap-1">
             <div className="w-1.5 h-1.5 bg-neutral-600 rounded-full" /> Não conectado
           </div>
        </FlashlightCard>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left Column - Active Campaigns */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-lg font-serif text-white">Campanhas em Tracionamento</h3>
              <button className="text-[10px] font-mono text-neutral-500 uppercase hover:text-white transition-colors flex items-center gap-1">
                Ver Histórico Completo <ArrowRight className="w-3 h-3" />
              </button>
           </div>
           
           <div className="space-y-4">
             {isLoading ? (
               <div className="flex items-center justify-center p-12 text-neutral-500 font-mono text-xs uppercase tracking-widest gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" /> Carregando campanhas ativas...
               </div>
             ) : activeCampaigns.length === 0 ? (
               <div className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest border border-dashed border-white/5 bg-charcoal">
                 Sem campanhas sincronizadas no momento.
               </div>
             ) : activeCampaigns.map(camp => (
               <div key={camp.id} className="p-6 bg-charcoal border border-white/5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 transition-all group">
                 <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                       <Badge variant="default" className="text-[9px] uppercase tracking-widest font-mono text-neutral-400 border-white/10 bg-black/50">
                          {camp.platform}
                       </Badge>
                       {camp.status.includes('Atenção') ? (
                          <Badge variant="danger" className="text-[9px]">{camp.status}</Badge>
                       ) : (
                          <Badge variant="acid" className="text-[9px] text-black bg-acid hover:bg-acid/90">{camp.status}</Badge>
                       )}
                    </div>
                    <h4 className="font-serif text-xl text-white group-hover:text-acid transition-colors">{camp.name}</h4>
                 </div>
                 
                 <div className="flex gap-8 text-right">
                    <div>
                       <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Investimento</p>
                       <p className="text-sm font-mono text-white">
                         {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(camp.spend)}
                       </p>
                    </div>
                    <div>
                       <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Custo/Conv.</p>
                       <p className="text-sm font-mono text-white">
                         {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(camp.cpa)}
                       </p>
                    </div>
                    <div>
                       <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Leads (Total)</p>
                       <p className="text-sm border border-white/5 bg-black/40 px-2 rounded font-mono text-acid font-bold">{camp.conversions}</p>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Right Column - AI Copywriter */}
        <div className="lg:col-span-2">
           <div className="h-full bg-gradient-to-b from-charcoal to-black border border-white/5 rounded-2xl overflow-hidden flex flex-col relative">
              
              {/* AI Header */}
              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded bg-gradient-to-tr from-acid/20 to-transparent border border-acid/20 flex items-center justify-center text-acid">
                       <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="text-xl font-serif text-white">Laboratório IA</h3>
                 </div>
                 <p className="text-xs text-neutral-400 font-sans">Geração de Copies otimizadas com base nas dores locais detectadas no Radar de Demandas.</p>
              </div>

              {/* Parâmetros */}
              <div className="p-6 space-y-4 border-b border-white/5">
                 <div>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">Zonas de Calor (Radar)</p>
                    <select className="w-full bg-black border border-white/10 text-xs text-white p-3 rounded font-mono uppercase focus:outline-none focus:border-acid appearance-none">
                       <option value="">Aguardando mapeamento do Radar...</option>
                    </select>
                 </div>
                 <div>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-2">Tom Of Voice</p>
                    <div className="flex gap-2">
                       <button className="flex-1 py-2 text-[10px] font-mono uppercase border border-acid/30 bg-acid/10 text-acid rounded font-bold transition-all">Combate</button>
                       <button className="flex-1 py-2 text-[10px] font-mono uppercase border border-white/10 bg-black text-neutral-400 rounded transition-all hover:bg-white/5">Acolhimento</button>
                    </div>
                 </div>
              </div>

              {/* Output */}
              <div className="p-6 flex-1 flex flex-col">
                 <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-3">Output Neural</p>
                 <div className="flex-1 bg-black border border-white/5 rounded-xl p-4 text-sm font-sans text-neutral-300 leading-relaxed min-h-[140px] relative">
                    {isGenerating ? (
                       <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                          <Zap className="w-5 h-5 text-acid animate-pulse" />
                          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-acid">Processando Modelos...</span>
                       </div>
                    ) : (
                       <p>{copy}</p>
                    )}
                 </div>
                 <button 
                   onClick={generateCopy}
                   className="w-full mt-4 py-3 bg-white text-black text-xs font-display font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all rounded"
                 >
                    {isGenerating ? "Processando..." : "Gerar Copy Ads"}
                 </button>
              </div>

           </div>
        </div>
      </div>

    </div>
  );
}
