"use client";

import { useState } from "react";
import { Copy, Navigation, Radar, Globe, MessageSquareWarning, Zap, Brain, ArrowDownRight, ArrowUpRight, Instagram, Search, Loader2 } from "lucide-react";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCompetitors } from "@/features/concorrencia/useCompetitors";

export default function CompetitionPage() {
  const [competitor, setCompetitor] = useState("candidato_a");
  const { data: scrapedPosts = [], isLoading } = useCompetitors(competitor);

  const negativePosts = scrapedPosts.filter(p => p.sentiment === 'Ataque' || p.sentiment === 'Denúncia');
  const negativePercentage = scrapedPosts.length ? ((negativePosts.length / scrapedPosts.length) * 100).toFixed(1) : "0";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up bg-obsidian min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
           <div className="flex items-center gap-2 text-acid font-mono text-xs tracking-[0.2em] uppercase">
             <div className="w-8 h-[1px] bg-acid/30"></div>
             Inteligência Competitiva
           </div>
           <h1 className="text-6xl font-serif text-white leading-none uppercase">Monitoramento</h1>
           <p className="text-neutral-500 font-sans text-lg max-w-lg">
             Scraping estruturado e análise de sentimento de menções da oposição.
           </p>
        </div>
        
        <div className="flex flex-col gap-2">
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest text-right">Alvo Mapeado</p>
           <select 
             value={competitor}
             onChange={(e) => setCompetitor(e.target.value)}
             className="px-6 py-3 bg-charcoal border border-white/5 text-sm font-bold uppercase tracking-widest text-white focus:outline-none focus:border-acid transition-all appearance-none text-right cursor-pointer"
           >
              <option value="candidato_a">Painel Geral (Todos Oponentes)</option>
           </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[160px] bg-charcoal border-white/5">
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Sentimento de Comentários</p>
           <h3 className={cn("text-4xl font-serif", Number(negativePercentage) > 50 ? "text-danger" : "text-white")}>
             {negativePercentage}% <span className={cn("text-sm font-sans", Number(negativePercentage) > 50 ? "text-danger/70" : "text-neutral-500")}>Rejeição Mensurada</span>
           </h3>
           <p className="text-[10px] font-mono text-neutral-400 mt-2 uppercase tracking-[0.2em]">Base: {scrapedPosts.length} menções analisadas (24h)</p>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[160px] bg-charcoal border-white/5">
           <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Crescimento Diario Redes</p>
           <h3 className="text-4xl font-serif text-white">+0 <span className="text-sm font-sans text-neutral-500">seguidores/dia</span></h3>
           <p className="text-[10px] font-mono text-neutral-600 mt-2 flex items-center gap-1 uppercase tracking-widest">
             <ArrowDownRight className="w-3 h-3" /> Aguardando API Insight
           </p>
        </FlashlightCard>

        <FlashlightCard className="p-8 rounded-2xl flex flex-col justify-end group min-h-[160px] bg-charcoal border-white/5">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-neutral-600" />
              <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">Status do Crawler</p>
           </div>
           <h3 className="text-xl font-serif text-neutral-400">Pausado</h3>
           <p className="text-[10px] font-mono text-neutral-500 mt-2 uppercase tracking-widest">Aguardando integração com Crawler.</p>
        </FlashlightCard>
      </div>

      {/* Content Columns */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Left: Feed Scraped */}
        <div className="h-full bg-charcoal border border-white/5 rounded-2xl flex flex-col overflow-hidden">
           <div className="p-6 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <Globe className="w-5 h-5 text-neutral-400" />
                 <h3 className="text-lg font-serif text-white">Radar de Movimentos</h3>
              </div>
              <Badge variant="default" className="border-acid/20 text-acid bg-acid/5 font-mono text-[10px] uppercase">
                Atualização Contínua
              </Badge>
           </div>
           
           <div className="flex-1 p-0 flex flex-col">
             {isLoading ? (
               <div className="flex items-center justify-center p-12 text-neutral-500 font-mono text-xs uppercase tracking-widest gap-2">
                 <Loader2 className="w-4 h-4 animate-spin" /> Localizando menções e posts...
               </div>
             ) : scrapedPosts.length === 0 ? (
               <div className="p-12 text-center text-neutral-500 font-mono text-xs uppercase tracking-widest">
                 O crawler não encontrou dados para este alvo nas últimas 24h.
               </div>
             ) : scrapedPosts.map((post, idx) => (
                <div key={post.id} className={cn(
                  "p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                  idx === 0 ? "bg-white/[0.01]" : ""
                )}>
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                         <Instagram className="w-4 h-4 text-neutral-500" />
                         <span className="text-xs font-mono text-neutral-500 uppercase tracking-widest">{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Desconhecido'}</span>
                      </div>
                      <Badge variant={post.sentiment === "Ataque" ? "danger" : post.sentiment === "Denúncia" ? "warning" : "default"} className="text-[9px] uppercase tracking-widest font-mono">
                        {post.sentiment}
                      </Badge>
                   </div>
                   <p className="text-base text-neutral-300 font-sans leading-relaxed mb-4">
                     "{post.text}"
                   </p>
                   <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                         <span className="text-[10px] font-mono border border-white/10 bg-black/40 px-2 py-1 rounded text-neutral-500 uppercase">Engajamento: <span className="text-white">{post.engagement}</span></span>
                      </div>
                      <button className="text-[10px] font-mono uppercase tracking-widest text-acid hover:text-white transition-colors flex items-center gap-1">
                        Gerar Contra-Resposta <ArrowUpRight className="w-3 h-3" />
                      </button>
                   </div>
                </div>
             ))}
           </div>
        </div>

        {/* Right: Topic Modeling / Vulnerabilities */}
        <div className="space-y-6">
           <FlashlightCard className="p-8 rounded-2xl bg-charcoal border-white/5 h-[280px] flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                 <Brain className="w-5 h-5 text-neutral-400" />
                 <div>
                    <h3 className="text-lg font-serif text-white">Nuvem de Crises (Comentários)</h3>
                    <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">O que os eleitores DELE estão reclamando no perfil DELE</p>
                 </div>
              </div>
              <div className="flex flex-wrap gap-4 items-center justify-center py-4 bg-black/20 rounded-xl border border-black/50 min-h-[100px]">
                {scrapedPosts.length > 0 ? (
                  <span className="text-xl text-danger font-bold opacity-60">Nenhum cluster formado</span>
                ) : (
                  <span className="text-xs font-mono uppercase tracking-widest text-neutral-500">Aguardando dados estruturados...</span>
                )}
              </div>
           </FlashlightCard>

           <div className="p-8 border border-white/10 bg-charcoal rounded-2xl space-y-4">
              <h3 className="font-mono text-xs uppercase text-neutral-500 font-bold tracking-widest flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4" /> Recomendação de Ataque Neural
              </h3>
              <p className="text-sm text-neutral-500 font-sans leading-relaxed">
                A IA está processando o repositório orgânico de reclamações da oposição. Nenhuma vulnerabilidade imediata foi agrupada ainda. Ative bots OCR para acelerar esse pipeline.
              </p>
              <button disabled className="px-6 py-3 border border-white/10 text-neutral-600 font-mono text-[10px] uppercase tracking-widest mt-2 font-bold w-full text-center">
                 Aguardando Insights
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
