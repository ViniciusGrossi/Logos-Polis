'use client';

import { useState } from 'react';
import { PageLayout } from '@/components/shared/PageLayout';
import { GlobalFilter } from '@/components/shared/GlobalFilter';
import { MetricCard } from '@/components/ui/MetricCard';
import { DataGrid, ColumnDef } from '@/components/ui/DataGrid';
import { ScoreBadge } from '@/components/ui/ScoreBadge';
import { useAppStore } from '@/store/useAppStore';
import { useVoterScores, VoterScore } from '@/features/score-eleitor/useVoterScores';
import { VoterDrawer } from '@/features/score-eleitor/VoterDrawer';

export default function ScorePage() {
  const { globalRegionFilter } = useAppStore();
  const { data: voters, isLoading } = useVoterScores(globalRegionFilter);
  
  const [selectedVoter, setSelectedVoter] = useState<VoterScore | null>(null);

  const columns: ColumnDef<VoterScore>[] = [
    { header: 'Eleitor', accessorKey: 'name', width: '30%' },
    { header: 'Bairro', accessorKey: 'neighborhood', width: '25%' },
    { header: 'Contato', accessorKey: 'phone', width: '20%' },
    { 
      header: 'Score', 
      accessorKey: 'score',
      align: 'right',
      cell: (voter) => <span className="font-mono text-white text-lg font-bold">{voter.score}</span>,
      width: '10%'
    },
    { 
      header: 'Status', 
      accessorKey: 'sentiment',
      align: 'right',
      cell: (voter) => <ScoreBadge type={voter.sentiment} />,
      width: '15%'
    },
  ];

  return (
    <PageLayout 
      title="Score de Eleitores" 
      subtitle="Classificação Analítica Baseada em Interações"
      headerContent={<GlobalFilter />}
    >
      {/* KPIs Level 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Lealdade Média" 
          value={voters ? (voters.reduce((acc, v) => acc + v.score, 0) / (voters.length || 1)).toFixed(0) : '-'} 
          trend="up" 
          trendValue="+12%" 
          context="Nos últimos 30 dias" 
        />
        <MetricCard 
          title="Eleitores Mapeados" 
          value={voters ? voters.length : '-'} 
          trend="up" 
          trendValue="+5" 
          context="Neste Bairro/Região" 
        />
        <MetricCard 
          title="Base Crítica" 
          value={voters ? voters.filter(v => v.sentiment === 'critico').length : '-'} 
          trend="down" 
          trendValue="-2%" 
          context="Índice de distanciamento" 
        />
      </div>

      {/* Main Table */}
      <div className="mt-8">
        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-50 mb-6 border-b-2 border-slate-800 pb-2">
          Ranking de Lealdade
        </h2>
        <DataGrid 
          data={voters || []} 
          columns={columns} 
          isLoading={isLoading} 
          onRowClick={(voter) => setSelectedVoter(voter)} 
        />
      </div>

      <VoterDrawer 
        voter={selectedVoter} 
        isOpen={!!selectedVoter} 
        onClose={() => setSelectedVoter(null)} 
      />
    </PageLayout>
  );
}
