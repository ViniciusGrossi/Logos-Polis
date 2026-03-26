"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Search, Filter, BrainCircuit, CheckCircle2, UserCircle, 
  MapPin, Clock, ArrowRight, Zap, X, MessageSquare
} from "lucide-react";

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

import { useMessages } from "@/features/messages/useMessages";
import { useMemo } from "react";

export default function MessagesPage() {
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "analytics">("list");
  
  const { data: messagesList = [], isLoading } = useMessages();
  
  const typeStats = useMemo(() => {
    const counts = messagesList.reduce((acc: any, msg: any) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: "Reclamação", value: counts["Reclamação"] || 0, color: "#ff4d4d" },
      { name: "Pedido", value: counts["Pedido"] || 0, color: "#abd600" },
      { name: "Apoio", value: counts["Apoio"] || 0, color: "#3b82f6" },
      { name: "Informação", value: counts["Informação"] || 0, color: "#71717a" },
    ].filter(s => s.value > 0);
  }, [messagesList]);

  const categoryStats = useMemo(() => {
    const counts = messagesList.reduce((acc: any, msg: any) => {
      acc[msg.theme] = (acc[msg.theme] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [messagesList]);
  
  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden text-neutral-300">
      
      {/* LEFT COLUMN: Message List */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        selectedMsg ? "hidden lg:flex lg:w-1/2" : "flex w-full"
      )}>
        {/* Header & Tabs */}
        <div className="p-4 sm:p-6 border-b border-white/5 bg-charcoal/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-serif text-white">Mensagens</h1>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 w-full sm:w-auto">
              <button 
                onClick={() => setActiveTab("list")}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-mono transition-all",
                  activeTab === "list" ? "bg-acid text-black" : "text-neutral-500 hover:text-white"
                )}
              >
                Lista
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-mono transition-all",
                  activeTab === "analytics" ? "bg-acid text-black" : "text-neutral-500 hover:text-white"
                )}
              >
                Analytics
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Buscar mensagens..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-acid/50 transition-colors font-mono placeholder:text-[10px] sm:placeholder:text-xs"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="text-acid font-mono uppercase tracking-[0.2em] animate-pulse">Carregando mensagens...</div>
          ) : activeTab === "list" ? (
            <div className="space-y-3">
              {messagesList.map((msg) => (
                <div 
                  key={msg.id}
                  onClick={() => setSelectedMsg(msg)}
                  className={cn(
                    "p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all duration-200 animate-in fade-in slide-in-from-bottom-2",
                    selectedMsg?.id === msg.id 
                      ? "bg-acid/5 border-acid/50 shadow-[0_0_20px_rgba(204,255,0,0.05)]" 
                      : "bg-surface border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-charcoal border border-border flex items-center justify-center font-serif text-sm font-bold text-white">
                        {msg.name.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <div className="max-w-[150px] sm:max-w-none">
                        <h4 className="font-medium text-white truncate">{msg.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-neutral-500 mt-0.5">
                          <MapPin className="w-3 h-3" /> {msg.hood}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="text-[10px] sm:text-xs font-mono text-neutral-500 block mb-1">{msg.time}</span>
                      {msg.status === "Pendente" ? (
                        <span className="w-2 h-2 bg-acid rounded-full inline-block animate-pulse"></span>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 inline-block" />
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                    "{msg.text}"
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] sm:text-[10px] font-mono text-white">
                      {msg.type}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] sm:text-[10px] font-mono",
                      msg.theme === "Saúde" ? "text-blue-400" :
                      msg.theme === "Infra" ? "text-purple-400" :
                      msg.theme === "Segurança" ? "text-danger" : "text-acid"
                    )}>
                      {msg.theme}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Type Distribution */}
                <div className="glass-panel p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col min-h-[300px]">
                  <h3 className="text-xs font-mono text-neutral-500 uppercase mb-6">Distribuição por Intenção</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {typeStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff15', borderRadius: '8px', fontFamily: 'var(--font-jetbrains-mono)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontFamily: 'var(--font-jetbrains-mono)', color: '#71717a' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Category Frequency */}
                <div className="glass-panel p-6 rounded-2xl bg-black/20 border border-white/5 flex flex-col min-h-[300px]">
                  <h3 className="text-xs font-mono text-neutral-500 uppercase mb-6">Top Categorias Temáticas</h3>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats} layout="vertical" margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                        <RechartsTooltip 
                          cursor={{fill: '#ffffff05'}}
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff15', borderRadius: '8px', fontFamily: 'var(--font-jetbrains-mono)' }}
                        />
                        <Bar dataKey="value" fill="#abd600" radius={[0, 4, 4, 0]} barSize={15} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Insight Summary */}
              <div className="p-4 sm:p-6 bg-acid/5 border border-acid/10 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-4 h-4 text-acid" />
                  <span className="text-[10px] sm:text-xs font-mono text-acid uppercase tracking-widest">Resumo Estratégico IA</span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Volume anormal de <strong className="text-white">Reclamações sobre Infraestrutura</strong>. Recomendamos posicionamento imediato.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Drawer Panel (Conditional) */}
      {selectedMsg && (
        <div className="w-full lg:w-1/2 border-l border-white/5 bg-charcoal/30 flex flex-col animate-in slide-in-from-right duration-300 relative">
          
          {/* Drawer Header */}
          <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-black/20 sticky top-0 z-10">
            <h2 className="font-mono text-[10px] sm:text-sm tracking-widest uppercase text-neutral-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Triagem ID: {selectedMsg.id}
            </h2>
            <button onClick={() => setSelectedMsg(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors bg-white/5 lg:bg-transparent">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 pb-32 lg:pb-6">
            
            {/* Intel Breakdown */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden bg-black/40 border border-white/10">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <BrainCircuit className="w-24 h-24 text-acid" />
              </div>
              <h3 className="text-[10px] font-mono text-acid mb-4 uppercase flex items-center gap-2 tracking-widest">
                <Zap className="w-4 h-4" /> Classificação IA
              </h3>
              
              <div className="grid grid-cols-2 gap-4 relative z-10 font-mono">
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">Sentimento</p>
                  <p className="text-sm font-medium text-white">{selectedMsg.sentiment}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">Prioridade</p>
                  <p className={cn("text-sm font-medium", selectedMsg.priority === "Alta" ? "text-danger" : "text-white")}>
                    {selectedMsg.priority}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">Tema Principal</p>
                  <p className="text-sm font-medium text-white">{selectedMsg.theme}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-500 mb-1">Intenção</p>
                  <p className="text-sm font-medium text-white">{selectedMsg.type}</p>
                </div>
              </div>
            </div>

            {/* Original Message */}
            <div>
              <h3 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 px-1 tracking-widest">Mensagem Original</h3>
              <div className="p-5 bg-navy/20 border border-blue-900/30 rounded-2xl relative">
                <p className="text-white text-base sm:text-lg font-serif leading-relaxed italic">
                  "{selectedMsg.text}"
                </p>
              </div>
            </div>

            {/* Voter Context */}
            <div>
              <h3 className="text-[10px] font-mono text-neutral-500 uppercase mb-3 px-1 tracking-widest">Contexto do CRM</h3>
              <div className="p-4 border border-white/5 rounded-2xl bg-black/20 flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-serif text-lg bg-charcoal text-white shrink-0">
                  {selectedMsg.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1 text-center sm:text-left overflow-hidden">
                  <h4 className="text-white font-medium truncate">{selectedMsg.name}</h4>
                  <p className="text-xs text-neutral-400 font-mono truncate">{selectedMsg.phone}</p>
                </div>
                <div className="text-center sm:text-right sm:border-l border-white/5 sm:pl-4">
                  <p className="text-[10px] text-neutral-500 uppercase">Histórico</p>
                  <p className="text-acid font-mono font-bold">12 Msgs</p>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="space-y-3 pb-8 lg:pb-0">
              <h3 className="text-[10px] font-mono text-neutral-500 uppercase px-1 flex items-center gap-2 tracking-widest">
                <SparklesIcon className="w-4 h-4 text-blue-400" /> Resposta Sugerida
              </h3>
              <textarea 
                className="w-full h-32 bg-black/40 border border-blue-500/30 rounded-2xl p-4 text-sm text-neutral-300 focus:outline-none focus:border-blue-500/80 transition-colors font-sans resize-none custom-scrollbar"
                defaultValue={`Olá ${selectedMsg.name.split(" ")[0]}, tudo bem? Recebemos sua mensagem sobre a ${selectedMsg.theme.toLowerCase()}. Já abrimos uma solicitação formal e vamos cobrar a prefeitura. Manteremos você informado.`}
              ></textarea>
              
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button className="flex-1 bg-acid hover:bg-[#b3e600] text-black font-mono font-bold py-4 lg:py-3 rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-2 text-xs">
                  Enviar WhatsApp <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-6 py-4 lg:py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-mono transition-colors text-white">
                  Gerar Solicitação
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal icon since Lucide Sparkles didn't trigger correctly
function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a4.25 4.25 0 0 1 0-8.16l6.135-1.582a2 2 0 0 0 1.437-1.437l1.582-6.135a4.25 4.25 0 0 1 8.16 0l1.582 6.135a2 2 0 0 0 1.437 1.437l6.135 1.582a4.25 4.25 0 0 1 0 8.16l-6.135 1.582a2 2 0 0 0-1.437 1.437l-1.582 6.135a4.25 4.25 0 0 1-8.16 0z" />
    </svg>
  );
}
