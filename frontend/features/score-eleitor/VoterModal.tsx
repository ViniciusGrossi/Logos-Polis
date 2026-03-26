'use client';

import { X, Phone, Calendar, MapPin, TrendingUp, Zap, MessageSquare } from 'lucide-react';
import { VoterScore } from './useVoterScores';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VoterModalProps {
  voter: VoterScore | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VoterModal({ voter, isOpen, onClose }: VoterModalProps) {
  if (!isOpen || !voter) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0b] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300 custom-scrollbar"
      >
        {/* Top Glow Accent */}
        <div className="sticky top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-acid to-transparent opacity-50 z-[110]" />

        {/* Header */}
        <div className="p-6 sm:p-8 pb-4 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-charcoal border border-white/10 flex items-center justify-center font-serif text-3xl text-white shadow-inner">
               {voter.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
            </div>
            <div>
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-2">
                <h2 className="text-3xl sm:text-4xl font-serif text-white tracking-tight leading-tight uppercase">
                  {voter.name}
                </h2>
                <Badge variant={voter.status === 'ativo' ? 'acid' : 'default'} className={cn(
                  "font-mono text-[9px] uppercase tracking-widest px-3 py-1",
                   voter.status === 'ativo' ? "bg-acid/10 text-acid border-acid/20" : "bg-white/5 text-neutral-500 border-white/5"
                )}>
                  {voter.status}
                </Badge>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs font-mono text-neutral-500">
                <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-acid" /> {voter.neighborhood}</span>
                <span className="hidden sm:inline w-1 h-1 bg-white/10 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-neutral-400">ID: CRM-{voter.id}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 p-3 hover:bg-white/5 rounded-2xl transition-colors border border-white/5"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-4 space-y-8">
          {/* Intelligence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-3 group hover:border-acid/20 transition-colors">
              <div className="flex items-center gap-2 text-neutral-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                <TrendingUp className="w-3 h-3 text-acid" /> Score Eleitoral
              </div>
              <div className="text-6xl font-serif text-white group-hover:text-acid transition-colors">
                {voter.score}
              </div>
              <div className="text-[10px] font-mono text-neutral-600 bg-white/5 px-3 py-1 rounded-full text-center">
                Evolução de +5.2% vs set-25
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 flex flex-col items-center justify-center gap-4 hover:border-acid/20 transition-colors">
              <div className="flex items-center gap-2 text-neutral-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                <Zap className="w-3 h-3 text-acid" /> Sentimento IA
              </div>
              <ScoreBadge type={voter.sentiment} className="scale-125" />
              <div className="text-[10px] font-mono text-neutral-600 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest">
                Análise de Tom Instantânea
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.3em] mb-4 text-center sm:text-left">Informativo Estratégico</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-xs">
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-acid/5 rounded-lg">
                      <Phone className="w-4 h-4 text-acid" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-600 uppercase mb-0.5 tracking-tighter">Canal Principal</span>
                      <span className="text-white text-sm">{voter.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-acid/5 rounded-lg">
                      <Calendar className="w-4 h-4 text-acid" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-600 uppercase mb-0.5 tracking-tighter">Último Contato</span>
                      <span className="text-white text-sm">{voter.lastInteraction}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-acid/5 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-acid" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-600 uppercase mb-0.5 tracking-tighter">Histórico Total</span>
                      <span className="text-white text-sm">12 msgs / 3 reqs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-acid/5 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-acid" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-neutral-600 uppercase mb-0.5 tracking-tighter">Fidelidade Estimada</span>
                      <span className="text-acid text-sm font-bold shadow-[0_0_10px_rgba(204,255,0,0.2)]">82.4%</span>
                    </div>
                  </div>
                </div>
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 sticky bottom-0 bg-[#0a0a0b] py-4 border-t border-white/5">
            <button className="flex-1 py-4 bg-acid text-black font-mono font-bold uppercase rounded-2xl hover:bg-[#b3e600] transition-transform active:scale-95 shadow-[0_10px_20px_rgba(204,255,0,0.1)] text-sm tracking-widest">
              Iniciar Atendimento
            </button>
            <button className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-mono font-bold uppercase rounded-2xl hover:bg-white/10 transition-colors text-sm tracking-widest">
              Gerar Relatório
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
