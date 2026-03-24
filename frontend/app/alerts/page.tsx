"use client";

import { 
  BellRing, ShieldAlert, Zap, 
  TrendingUp, TrendingDown, Clock,
  ArrowUpRight, Info, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { Badge } from "@/components/ui/badge";

const alertsFeed = [
  { id: 1, type: "Intelligence", title: "Novo Padrão Identificado", description: "Aumento de 240% em menções positivas no Centro após anúncio do projeto de arborização.", severity: "Acid", time: "28 min atrás", icon: Zap },
  { id: 2, type: "Critical", title: "Alerta de Crise Território", description: "Pico anômalo de solicitações sobre Iluminação Pública no Setor Norte. Volume projetado 3x acima da média mensal.", severity: "Danger", time: "1 hora atrás", icon: ShieldAlert },
  { id: 3, type: "Performance", title: "Vencimento de SLA", description: "8 solicitações de 'Saúde' ultrapassarão o prazo de 48h nas próximas 4 horas.", severity: "Warning", time: "2 horas atrás", icon: Clock },
  { id: 4, type: "System", title: "Relatório Mensal Pronto", description: "O processamento analítico do mês de Março foi concluído pela IA.", severity: "Info", time: "5 horas atrás", icon: Info },
];

export default function AlertsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-acid font-mono text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-acid/30"></div>
            Sentinel System
          </div>
          <h1 className="text-6xl font-serif text-white leading-none tracking-tight">CENTRAL DE ALERTAS</h1>
          <p className="text-neutral-500 font-sans text-lg max-w-xl">Monitoramento preditivo e detecção de anomalias no pulso político local.</p>
        </div>
        
        <div className="bg-charcoal border border-white/5 p-4 flex gap-8 rounded-xl">
           <div className="text-center">
              <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mb-1">Alertas 24h</p>
              <p className="text-xl font-mono text-white">14</p>
           </div>
           <div className="text-center">
              <p className="text-[9px] font-mono text-neutral-600 uppercase tracking-widest mb-1">Resolvidos</p>
              <p className="text-xl font-mono text-acid">09</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Statistics Bar - Terminal Look */}
        <div className="lg:col-span-1 space-y-6">
           <div className="space-y-4">
              <h3 className="font-mono text-[10px] text-neutral-600 uppercase tracking-widest px-1">Indicadores Pulso</h3>
              
              <div className="space-y-2">
                {["ENGAGEMENT", "SENTIMENT", "CRISIS_PROX"].map((label, i) => (
                  <div key={label} className="p-4 bg-surface border border-white/5 rounded-sm flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400">{label}</span>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-mono text-white">{[82, 14, 0.4][i]}{i === 0 ? "%" : i === 1 ? "/100" : ""}</span>
                       <TrendingUp className="w-3 h-3 text-acid" />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="p-6 bg-gradient-to-br from-acid/10 to-transparent border border-acid/10 rounded-2xl relative overflow-hidden group">
              <Zap className="w-16 h-16 absolute -bottom-4 -right-4 text-acid/10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
              <h4 className="font-serif text-white text-lg mb-2">Sugestão Copiloto</h4>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed mb-4">
                Detectamos uma janela de engajamento positiva no Bairro Centro. Recomenda-se postagem sobre infraestrutura local agora.
              </p>
              <button className="text-acid text-[10px] font-mono uppercase tracking-[0.2em] flex items-center gap-2 hover:gap-3 transition-all">
                Executar Ação <ArrowRight className="w-3 h-3" />
              </button>
           </div>
        </div>

        {/* Alerts Feed - Layered Obsidian Depth */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2 mb-2">
             <h2 className="font-mono text-xs text-neutral-500 uppercase tracking-widest">Feed de Automações</h2>
             <span className="font-mono text-[10px] text-neutral-600 uppercase">Status: <span className="text-acid">Monitoramento Ativo</span></span>
          </div>

          <div className="space-y-3">
            {alertsFeed.map((alert) => (
              <FlashlightCard 
                key={alert.id} 
                className={cn(
                  "p-0 border-none shadow-none group transition-all duration-300",
                  alert.severity === "Acid" ? "bg-acid/5" : 
                  alert.severity === "Danger" ? "bg-danger/5" : "bg-charcoal/40"
                )}
              >
                <div className="p-6 flex gap-6">
                  <div className={cn(
                    "w-12 h-12 flex items-center justify-center rounded-sm flex-shrink-0 transition-transform group-hover:scale-110",
                    alert.severity === "Acid" ? "bg-acid/10 text-acid shadow-[0_0_15px_rgba(204,255,0,0.1)]" : 
                    alert.severity === "Danger" ? "bg-danger/10 text-danger shadow-[0_0_15px_rgba(255,51,0,0.1)]" : 
                    "bg-white/5 text-white"
                  )}>
                    <alert.icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <p className={cn(
                            "font-mono text-[9px] uppercase tracking-[0.3em] mb-1",
                            alert.severity === "Acid" ? "text-acid/60" : 
                            alert.severity === "Danger" ? "text-danger/60" : "text-neutral-500"
                          )}>
                            {alert.type} :: INTELLIGENCE
                          </p>
                          <h3 className="text-xl font-serif text-white group-hover:text-white/90 transition-colors uppercase tracking-tight">
                            {alert.title}
                          </h3>
                       </div>
                       <span className="font-mono text-[10px] text-neutral-600">{alert.time}</span>
                    </div>
                    
                    <p className="text-sm text-neutral-400 font-sans leading-relaxed max-w-2xl">
                       {alert.description}
                    </p>

                    <div className="pt-4 flex items-center gap-4">
                       <button className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors uppercase tracking-widest border-b border-white/5">Marcar como Lido</button>
                       <button className="text-[10px] font-mono text-neutral-500 hover:text-acid transition-colors uppercase tracking-widest border-b border-white/5">Analisar Contexto</button>
                    </div>
                  </div>
                </div>
              </FlashlightCard>
            ))}
          </div>

          <div className="py-6 border-t border-white/5 flex items-center justify-center">
             <div className="flex items-center gap-3 text-neutral-600 font-mono text-[10px] uppercase tracking-widest">
                <div className="w-1 h-1 bg-neutral-700 rounded-full"></div>
                Fim dos Alertas Recentes
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
