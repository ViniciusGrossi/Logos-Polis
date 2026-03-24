"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  Search, Filter, BrainCircuit, CheckCircle2, UserCircle, 
  MapPin, Clock, ArrowRight, Zap, X, MessageSquare
} from "lucide-react";

// --- MOCK DATA ---
const messagesList = [
  { id: "M01", name: "João Silva", phone: "+55 11 99999-1111", hood: "Setor Sul", text: "A rua das Oliveiras está com o asfalto totalmente esburacado, começou depois daquela chuva na terça.", theme: "Infra", priority: "Alta", type: "Reclamação", sentiment: "Irritado", status: "Pendente", time: "10 min atrás" },
  { id: "M02", name: "Maria Oliveira", phone: "+55 11 98888-2222", hood: "Centro", text: "Vereador, parabéns pelo projeto de lei da merenda, vai ser muito importante pra comunidade.", theme: "Educação", priority: "Baixa", type: "Apoio", sentiment: "Positivo", status: "Respondido", time: "1 hora atrás" },
  { id: "M03", name: "Carlos Pereira", phone: "+55 11 97777-3333", hood: "Vila Norte", text: "Tem como providenciar a poda da árvore na praça da matriz? Está encostando nos fios.", theme: "Serviços", priority: "Média", type: "Pedido", sentiment: "Neutro", status: "Pendente", time: "2 horas atrás" },
  { id: "M04", name: "Ana Costa", phone: "+55 11 96666-4444", hood: "Setor Leste", text: "Assaltaram a farmácia ontem à noite. A gente precisa de mais policiamento aqui urgente!", theme: "Segurança", priority: "Alta", type: "Reclamação", sentiment: "Urgente", status: "Pendente", time: "3 horas atrás" },
];

export default function MessagesPage() {
  const [selectedMsg, setSelectedMsg] = useState<any | null>(null);
  
  return (
    <div className="flex h-screen overflow-hidden text-neutral-300">
      
      {/* LEFT COLUMN: Message List */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        selectedMsg ? "lg:w-1/2" : "w-full"
      )}>
        {/* Header & Filters */}
        <div className="p-6 border-b border-white/5 bg-charcoal/50">
          <h1 className="text-3xl font-serif text-white mb-6">Caixa de Entrada</h1>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input 
                type="text" 
                placeholder="Buscar por nome, bairro ou conteúdo..." 
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-acid/50 transition-colors font-mono"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-black/40 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-sm font-mono">
              <Filter className="w-4 h-4" /> Filtros
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messagesList.map((msg) => (
            <div 
              key={msg.id}
              onClick={() => setSelectedMsg(msg)}
              className={cn(
                "p-5 rounded-2xl border cursor-pointer transition-all duration-200",
                selectedMsg?.id === msg.id 
                  ? "bg-acid/5 border-acid/50 shadow-[0_0_20px_rgba(204,255,0,0.05)]" 
                  : "bg-surface border-white/5 hover:border-white/20 hover:bg-white/[0.02]"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-charcoal border border-border flex items-center justify-center font-serif text-sm font-bold text-white">
                    {msg.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{msg.name}</h4>
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mt-0.5">
                      <MapPin className="w-3 h-3" /> {msg.hood}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-neutral-500 block mb-1">{msg.time}</span>
                  {msg.status === "Pendente" ? (
                    <span className="w-2 h-2 bg-acid rounded-full inline-block animate-pulse"></span>
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-500 inline-block" />
                  )}
                </div>
              </div>
              
              <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                "{msg.text}"
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white">
                  {msg.type}
                </span>
                <span className={cn(
                  "px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono",
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
      </div>

      {/* RIGHT COLUMN: Drawer Panel (Conditional) */}
      {selectedMsg && (
        <div className="w-full lg:w-1/2 border-l border-white/5 bg-charcoal/30 flex flex-col animate-slide-up relative">
          
          {/* Drawer Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h2 className="font-mono text-sm tracking-widest uppercase text-neutral-400 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Triagem ID: {selectedMsg.id}
            </h2>
            <button onClick={() => setSelectedMsg(null)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Intel Breakdown */}
            <div className="glass-panel p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit className="w-24 h-24 text-acid" />
              </div>
              <h3 className="text-xs font-mono text-acid mb-4 uppercase flex items-center gap-2">
                <Zap className="w-4 h-4" /> Classificação IA
              </h3>
              
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Sentimento</p>
                  <p className="font-medium text-white">{selectedMsg.sentiment}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Prioridade</p>
                  <p className={cn("font-medium", selectedMsg.priority === "Alta" ? "text-danger" : "text-white")}>
                    {selectedMsg.priority}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Tema Principal</p>
                  <p className="font-medium text-white">{selectedMsg.theme}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Intenção</p>
                  <p className="font-medium text-white">{selectedMsg.type}</p>
                </div>
              </div>
            </div>

            {/* Original Message */}
            <div>
              <h3 className="text-xs font-mono text-neutral-500 uppercase mb-3 px-1">Mensagem Original</h3>
              <div className="p-5 bg-navy/20 border border-blue-900/30 rounded-2xl relative">
                <p className="text-white text-lg font-serif leading-snug">
                  "{selectedMsg.text}"
                </p>
              </div>
            </div>

            {/* Voter Context */}
            <div>
              <h3 className="text-xs font-mono text-neutral-500 uppercase mb-3 px-1">Contexto do CRM</h3>
              <div className="p-4 border border-white/5 rounded-2xl bg-black/20 flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center font-serif text-lg bg-surface">
                  {selectedMsg.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{selectedMsg.name}</h4>
                  <p className="text-sm text-neutral-400 font-mono">{selectedMsg.phone}</p>
                </div>
                <div className="text-right border-l border-white/5 pl-4">
                  <p className="text-xs text-neutral-500">Histórico</p>
                  <p className="text-acid font-mono font-bold">12 Interações</p>
                </div>
              </div>
            </div>

            {/* AI Suggestion */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono text-neutral-500 uppercase px-1 flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-400" /> Resposta Sugerida
              </h3>
              <textarea 
                className="w-full h-32 bg-black/40 border border-blue-500/30 rounded-2xl p-4 text-sm text-neutral-300 focus:outline-none focus:border-blue-500/80 transition-colors font-sans resize-none"
                defaultValue={`Olá ${selectedMsg.name.split(" ")[0]}, tudo bem? Aqui é do gabinete do Vereador João. Recebemos sua mensagem sobre a ${selectedMsg.theme.toLowerCase()} no ${selectedMsg.hood}. Já abrimos uma solicitação formal (Req. #902) e vamos cobrar a prefeitura. Manteremos você informado.`}
              ></textarea>
              
              <div className="flex gap-3 pt-2">
                <button className="flex-1 bg-acid hover:bg-[#b3e600] text-black font-mono font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Enviar WhatsApp <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-6 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-mono transition-colors">
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
