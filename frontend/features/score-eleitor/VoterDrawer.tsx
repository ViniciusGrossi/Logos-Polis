'use client';

import { X } from 'lucide-react';
import { VoterScore } from './useVoterScores';
import { ScoreBadge } from '@/components/ui/ScoreBadge';

interface VoterDrawerProps {
  voter: VoterScore | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VoterDrawer({ voter, isOpen, onClose }: VoterDrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      <div 
        className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 border-l-2 border-slate-700 p-8 z-50 flex flex-col transform transition-transform duration-300 shadow-[-10px_0px_30px_rgba(0,0,0,0.5)]"
      >
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-xl font-bold uppercase tracking-widest text-slate-50">
            Ficha do Eleitor
          </h2>
          <button 
            onClick={onClose}
            className="p-2 border-2 border-transparent hover:border-slate-700 bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {voter ? (
          <div className="flex flex-col gap-8 flex-1 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
                {voter.name}
              </h1>
              <div className="text-slate-400 font-mono text-sm tracking-widest uppercase">
                {voter.neighborhood}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="border-2 border-slate-800 p-4 bg-black flex flex-col justify-center items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-widest">
                  Score Atual
                </span>
                <span className="text-4xl font-black text-white">{voter.score}</span>
              </div>
              <div className="border-2 border-slate-800 p-4 bg-black flex flex-col justify-center items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-widest">
                  Classificação
                </span>
                <ScoreBadge type={voter.sentiment} />
              </div>
            </div>

            <div className="border-t-2 border-slate-800 pt-6 mt-4">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider mb-4 text-sm">
                Informações de Contato
              </h3>
              <div className="flex flex-col gap-2 font-mono text-sm text-slate-400">
                <div className="flex justify-between">
                  <span>WhatsApp:</span>
                  <span className="text-white">{voter.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última Interação:</span>
                  <span className="text-white">{voter.lastInteraction}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-auto pt-6">
              <button 
                className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors border-2 border-white focus:outline-none focus:ring-4 focus:ring-slate-700"
              >
                Adicionar à Campanha
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500 font-mono uppercase text-sm tracking-widest">
            Nenhum eleitor selecionado.
          </div>
        )}
      </div>
    </>
  );
}
