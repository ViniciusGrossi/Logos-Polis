'use client';

import { PageLayout } from '@/components/shared/PageLayout';
import { GlobalFilter } from '@/components/shared/GlobalFilter';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChartContainer } from '@/components/ui/ChartContainer';
import { LineChart, Line, XAxis, Tooltip, CartesianGrid } from 'recharts';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const sentimentData = [
  { name: 'Seg', score: 65 },
  { name: 'Ter', score: 68 },
  { name: 'Qua', score: 60 },
  { name: 'Qui', score: 75 },
  { name: 'Sex', score: 85 },
  { name: 'Sab', score: 82 },
  { name: 'Dom', score: 90 },
];

export default function DashboardFase2() {
  return (
    <PageLayout 
      title="Centro de Comando" 
      subtitle="Visão Panorâmica - Fase 2"
      headerContent={<GlobalFilter />}
    >
      {/* Nível 1: KPIs Globais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Score Geral" value="82.4" trend="up" trendValue="+1.2" context="Interações positivas na rede" />
        <MetricCard title="Base Mapeada" value="12,540" trend="up" trendValue="+340" context="Eleitores classificados" />
        <MetricCard title="Buracos Detectados" value="3" trend="down" trendValue="-1" context="Zonas críticas geográficas" />
        <MetricCard title="Engajamento" value="14.2%" trend="up" trendValue="+5%" context="Abertura de campanhas" />
      </div>

      {/* Nível 2: Gráfico e Acesso Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        <div className="md:col-span-2">
          <ChartContainer title="Evolução do Sentimento (7 Dias)" height={350}>
            <LineChart data={sentimentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontFamily: 'monospace', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 0 }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Quick Links Menu */}
        <div className="flex flex-col gap-4 border-2 border-slate-700 bg-black p-6 shadow-[4px_4px_0px_#1e293b]">
          <h3 className="text-slate-500 font-mono text-xs uppercase tracking-widest mb-4">
            Módulos Analíticos
          </h3>
          
          {[
            { label: 'Score de Eleitor', path: '/score' },
            { label: 'Mapa Inteligente', path: '/geo' },
            { label: 'Influence Score', path: '/influenciadores' },
            { label: 'Inteligência Competitiva', path: '/concorrencia' },
            { label: 'Micro-campanhas', path: '/campanhas' },
          ].map((link) => (
            <Link 
              key={link.path} 
              href={link.path}
              className="flex justify-between items-center p-4 border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-all group"
            >
              <span className="font-bold text-slate-300 uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                {link.label}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
