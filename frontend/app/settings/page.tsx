"use client";

import { 
  Settings, User, Users, Zap, 
  Shield, Bell, Database, Save,
  LogOut, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";

const settingsSections = [
  { id: "personal", title: "Perfil Pessoal", icon: User, description: "Gerencie seus dados de acesso e preferências." },
  { id: "cabinet", title: "Gabinete Político", icon: Shield, description: "Configurações institucionais do mandato." },
  { id: "team", title: "Gestão de Equipe", icon: Users, description: "Acesso de assessores e permissões." },
  { id: "ai", title: "Automações IA", icon: Zap, description: "Thresholds de alerta e copiloto de resposta." },
  { id: "data", title: "Integrações & Dados", icon: Database, description: "WhatsApp API e exportação de relatórios." },
];

export default function SettingsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-neutral-800"></div>
            Control Center
          </div>
          <h1 className="text-6xl font-serif text-white leading-none tracking-tight text-center">SISTEMA</h1>
          <p className="text-neutral-500 font-sans text-lg max-w-lg">Configurações de infraestrutura e parâmetros da inteligência política.</p>
        </div>

        <button className="px-6 py-2 bg-charcoal border border-white/5 text-xs font-mono uppercase text-white hover:bg-white/5 transition-all flex items-center gap-2">
           <Save className="w-3 h-3 text-acid" /> Salvar Alterações
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        
        {/* Sidebar Nav */}
        <nav className="lg:col-span-1 space-y-2">
          {settingsSections.map((section) => (
            <button 
              key={section.id}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group",
                section.id === "cabinet" ? "bg-white/5 text-white" : "text-neutral-500 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-3">
                <section.icon className={cn("w-4 h-4", section.id === "cabinet" ? "text-acid" : "text-neutral-600")} />
                <span className="text-sm font-medium">{section.title}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity", section.id === "cabinet" && "opacity-100")} />
            </button>
          ))}
          
          <div className="pt-8">
            <button className="w-full text-left p-4 rounded-xl text-danger hover:bg-danger/5 transition-all flex items-center gap-3">
               <LogOut className="w-4 h-4" />
               <span className="text-sm font-medium">Sair do Sistema</span>
            </button>
          </div>
        </nav>

        {/* Content Area - Minimal & Sharp */}
        <div className="lg:col-span-3 space-y-8 pb-20">
          
          <div className="space-y-8">
            <section className="space-y-6">
              <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest border-l-2 border-acid pl-4">Gabinete Político</h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Nome do Mandato</label>
                  <input type="text" defaultValue="Ver. João Silva" className="w-full bg-charcoal border border-white/5 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-acid transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Ano de Início</label>
                  <input type="text" defaultValue="2025" className="w-full bg-charcoal border border-white/5 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-acid transition-colors font-mono" />
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Biografia Institucional (AI Context)</label>
                  <textarea rows={4} className="w-full bg-charcoal border border-white/5 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-acid transition-colors font-sans resize-none" defaultValue="Focado em saúde pública e transparência na gestão municipal. Representante do Setor Sul e articulador de projetos para juventude..."></textarea>
                </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest border-l-2 border-neutral-700 pl-4">Preferências de Alerta</h3>
              
              <div className="space-y-3">
                {[
                  "Notificar novos contatos identificados",
                  "Alerta de pico de demandas territoriais",
                  "Sumário diário de IA via e-mail",
                  "Bloquear mensagens fora do horário comercial"
                ].map((item, i) => (
                  <div key={item} className="flex items-center justify-between p-4 bg-charcoal/50 border border-white/5 rounded-xl">
                    <span className="text-sm text-neutral-300">{item}</span>
                    <div className={cn(
                      "w-10 h-5 rounded-full relative cursor-pointer pt-0.5 px-0.5 transition-colors",
                      i < 2 ? "bg-acid/20" : "bg-neutral-800"
                    )}>
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full transition-transform",
                        i < 2 ? "translate-x-5 shadow-[0_0_10px_rgba(204,255,0,0.5)]" : "translate-x-0"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="p-8 border border-white/5 bg-surface rounded-3xl space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-3 bg-acid/10 border border-acid/20 rounded-xl">
                   <Zap className="w-5 h-5 text-acid" />
                </div>
                <div>
                   <h4 className="text-white font-serif text-lg">Limite da API de Inteligência</h4>
                   <p className="text-xs text-neutral-500 font-mono">PLANO ENTERPRISE :: [84% UTILIZADO]</p>
                </div>
             </div>
             <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-acid w-[84%] shadow-[0_0_10px_rgba(204,255,0,0.4)]" />
             </div>
             <p className="text-[10px] text-neutral-600 font-sans">Seu limite será renovado em 08 dias. Consumo atual: 12.4k tokens processados.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
