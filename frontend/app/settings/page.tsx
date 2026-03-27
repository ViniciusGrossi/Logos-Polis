"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Users, Database, Save,
  LogOut, ChevronRight, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "personal", title: "Perfil Pessoal", icon: User, description: "Gerencie seus dados de acesso e preferências." },
  { id: "team", title: "Gestão de Equipe", icon: Users, description: "Acesso de assessores e permissões." },
  { id: "data", title: "Integrações & Dados", icon: Database, description: "WhatsApp API e exportação de relatórios." },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error("Erro ao fazer logout", error);
      setIsLoggingOut(false);
    }
  };

  const renderPersonal = () => (
    <section className="space-y-6 animate-fade-in">
      <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest border-l-2 border-acid pl-4">Acesso Institucional</h3>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Nome Completo</label>
          <input type="text" defaultValue="Operador Alpha" className="w-full bg-charcoal border border-white/5 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-acid transition-colors" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">E-mail Operacional</label>
          <input type="email" defaultValue="operativo@logospolis.com.br" disabled className="w-full bg-charcoal/50 border border-white/5 rounded-sm p-3 text-sm text-neutral-400 focus:outline-none focus:border-acid transition-colors font-mono cursor-not-allowed" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Nova Senha</label>
        <input type="password" placeholder="••••••••" className="w-full max-w-sm bg-charcoal border border-white/5 rounded-sm p-3 text-sm text-white focus:outline-none focus:border-acid transition-colors font-mono" />
      </div>
    </section>
  );

  const renderTeam = () => (
    <section className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest border-l-2 border-acid pl-4">Controle de Operadores</h3>
        <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-white/5 text-xs font-mono uppercase text-white transition-all rounded-sm">
          + Adicionar Assessor
        </button>
      </div>

      <div className="border border-white/5 rounded-xl bg-charcoal overflow-hidden divide-y divide-white/5">
        {[
          { name: "Vinícius Grossi", role: "Super Admin", status: "online", last: "Agora" },
          { name: "Mariana Souza", role: "Chefe de Gabinete", status: "offline", last: "Há 2 horas" },
          { name: "Carlos Andrade", role: "Assessor Externo", status: "offline", last: "Ontem" },
        ].map(member => (
          <div key={member.name} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-mono text-xs border border-white/10">
                {member.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-white font-medium">{member.name}</p>
                <p className="text-xs text-neutral-500 font-mono">{member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <span className={cn("w-1.5 h-1.5 rounded-full", member.status === 'online' ? 'bg-acid shadow-[0_0_5px_theme(colors.acid.DEFAULT)]' : 'bg-neutral-600')} />
                <span className="text-[10px] tracking-widest font-mono uppercase text-neutral-400">{member.status}</span>
              </div>
              <p className="text-[10px] text-neutral-600 mt-1">Último Acesso: {member.last}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const renderData = () => (
    <section className="space-y-6 animate-fade-in">
      <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest border-l-2 border-acid pl-4">Conectores de Campo</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-charcoal border border-white/5 hover:border-acid/30 transition-colors rounded-xl space-y-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-[#25D366]/10 rounded-lg text-[#25D366]">
                <Database className="w-5 h-5" />
             </div>
             <h4 className="text-sm font-medium text-white">WhatsApp Business API</h4>
           </div>
           <p className="text-xs text-neutral-500 leading-relaxed">Conectado e recebendo mensagens em tempo real para o número final 1234.</p>
           <button className="text-xs font-mono uppercase text-[#25D366] hover:text-white transition-colors">Gerenciar Conexão →</button>
        </div>

        <div className="p-6 bg-charcoal border border-white/5 hover:border-acid/30 transition-colors rounded-xl space-y-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-neutral-800 rounded-lg text-white">
                <Database className="w-5 h-5" />
             </div>
             <h4 className="text-sm font-medium text-white">Exportação TSE Base</h4>
           </div>
           <p className="text-xs text-neutral-500 leading-relaxed">Sincronização inativa. É necessário validar o token de acesso à base externa.</p>
           <button className="text-xs font-mono uppercase text-acid hover:text-white transition-colors">Autenticar Sistema →</button>
        </div>
      </div>
    </section>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "personal": return renderPersonal();
      case "team": return renderTeam();
      case "data": return renderData();
      default: return renderPersonal();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-slide-up">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-neutral-500 font-mono text-xs tracking-[0.2em] uppercase">
            <div className="w-8 h-[1px] bg-neutral-800"></div>
            Control Center
          </div>
          <h1 className="text-6xl font-serif text-white leading-none tracking-tight">SISTEMA</h1>
          <p className="text-neutral-500 font-sans text-lg max-w-lg">Configurações de infraestrutura e parâmetros operacionais.</p>
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
              onClick={() => setActiveTab(section.id)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group",
                section.id === activeTab ? "bg-white/5 text-white" : "text-neutral-500 hover:text-white hover:bg-white/[0.02]"
              )}
            >
              <div className="flex items-center gap-3">
                <section.icon className={cn("w-4 h-4", section.id === activeTab ? "text-acid" : "text-neutral-600")} />
                <span className="text-sm font-medium">{section.title}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-opacity", section.id === activeTab ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
            </button>
          ))}
          
          <div className="pt-8 border-t border-white/5 mt-4">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left p-4 rounded-xl text-danger hover:bg-danger/5 transition-all flex items-center gap-3 opacity-90 hover:opacity-100 disabled:opacity-50"
            >
               <LogOut className="w-4 h-4" />
               <span className="text-sm font-medium">{isLoggingOut ? "Encerrando..." : "Sair do Sistema"}</span>
            </button>
          </div>
        </nav>

        {/* Content Area */}
        <div className="lg:col-span-3 pb-20">
          {renderContent()}

          <div className="mt-12 p-8 border border-white/5 bg-surface rounded-3xl space-y-4">
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
