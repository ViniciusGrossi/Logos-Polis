"use client";

import { 
  Zap, 
  ArrowRight, 
  Sparkles, 
  ShieldAlert,
  Users,
  Target,
  Sword,
  TrendingUp,
  Activity
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from "recharts";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { MetricsCard } from "@/components/ui/metrics-card";
import { Badge } from "@/components/ui/badge";

import { useDashboard } from "@/features/dashboard/useDashboard";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Os dados de OSINT e evolução agora virão do hook useDashboard, 
// zerados por padrão enquanto os nós de IA não começam a mapear dados reais.

export default function Dashboard() {
  const { data: dashboardData, isLoading } = useDashboard();
  const router = useRouter();

  // Listen for F2 key to trigger report
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        router.push('/relatorios');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);
  
  if (isLoading) {
    return <div className="p-8 text-acid font-mono uppercase tracking-widest animate-pulse">Carregando painel estratégico...</div>;
  }

  const { metrics, influencers, efficacyData, radarData, growthData } = dashboardData || { metrics: {}, influencers: [], efficacyData: [], radarData: [], growthData: [] };
  
  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-10 animate-slide-up">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-1">
          <div className="font-mono text-xs text-acid uppercase tracking-[0.3em] flex items-center gap-2">
            <div className="w-2 h-2 bg-acid rounded-full animate-pulse"></div>
            Centro de Comando Estratégico
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-white leading-tight uppercase">Dashboard Executivo</h1>
        </div>
        
        <button 
          onClick={() => router.push('/relatorios')}
          className="relative group overflow-hidden bg-acid hover:bg-[#b3e600] text-black font-mono font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-3"
        >
          <Zap className="w-4 h-4" />
          Exportar Relatório [F2]
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></div>
        </button>
      </div>

      {/* KPI Grid (The 5 Core Indicators from PRD 5.7) */}
      <div className="flex overflow-x-auto pb-4 hide-scrollbar snap-x gap-4">
        <div className="min-w-[280px] snap-center">
          <MetricsCard 
            title="Força Política (Média)" 
            value={metrics?.avgScore || "0"} 
            icon={Target} 
            trend="Real-time" 
            trendUp={true} 
            context="Score Eleitoral Médio"
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <MetricsCard 
            title="Base Ativa (>40pts)" 
            value={metrics?.activeBase?.toString() || "0"} 
            icon={Users} 
            trend="Real-time" 
            trendUp={true} 
            context="Total Base Engajada"
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <MetricsCard 
            title="Gap Competitivo" 
            value={(metrics as any)?.competitiveGap ? `${(metrics as any).competitiveGap > 0 ? '+' : ''}${(metrics as any).competitiveGap}%` : "0%"} 
            icon={Sword} 
            trend={(metrics as any)?.competitiveGapTrend ? `${(metrics as any).competitiveGapTrend}%` : "Real-time"} 
            trendUp={Number((metrics as any)?.competitiveGapTrend || 0) >= 0} 
            context="Vantagem vs Concorrente Principal"
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <MetricsCard 
            title="Eficácia de Campanhas" 
            value={efficacyData?.[0]?.cta ? `${(Number(efficacyData[0].cta) * 100).toFixed(1)}%` : "0%"} 
            icon={TrendingUp} 
            trend="Global" 
            trendUp={true} 
            context="Taxa média de Resposta"
          />
        </div>
        <div className="min-w-[280px] snap-center">
          <MetricsCard 
            title="Líderes Mobilizados" 
            value={metrics?.leaders?.toString() || "0"} 
            icon={Activity} 
            trend="Total" 
            trendUp={true} 
            context="Top Influencers"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Radar Chart: Competitive Intelligence */}
        <FlashlightCard className="lg:col-span-1 min-h-[400px] flex flex-col pt-8 bg-black/60 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
          <div className="px-6 mb-2">
            <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest px-1">Radar de Forças (OSINT)</h3>
            <div className="flex gap-4 mt-4 text-[10px] font-mono text-neutral-400">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-acid rounded-sm"></div> Nosso Mandato</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-danger rounded-sm"></div> Oposição (Top 1)</div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                <Radar name="Nós" dataKey="A" stroke="#abd600" fill="#abd600" fillOpacity={0.6} />
                <Radar name="Oposição" dataKey="B" stroke="#ff4d4d" fill="#ff4d4d" fillOpacity={0.3} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff15', borderRadius: '8px', fontFamily: 'var(--font-jetbrains-mono)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </FlashlightCard>

        {/* Area Chart: Active Base Growth */}
        <FlashlightCard className="lg:col-span-2 min-h-[400px] flex flex-col pt-8">
          <div className="px-6 flex justify-between items-center mb-8">
            <div>
              <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest px-1">Evolução do CRM (Base Viva)</h3>
              <p className="text-[10px] font-mono text-acid/60 mt-1 pl-1">Aquisição Orgânica vs Reativação de Inativos</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <div className="w-2 h-2 bg-acid rounded-sm"></div> Novos Ativos
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <div className="w-2 h-2 bg-blue-500 rounded-sm"></div> Reativados (IA Bot)
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAtivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#abd600" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#abd600" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReativos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff08', borderRadius: '12px', fontFamily: 'var(--font-jetbrains-mono)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="ativos" stroke="#abd600" strokeWidth={2} fillOpacity={1} fill="url(#colorAtivos)" />
                <Area type="monotone" dataKey="reativos" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorReativos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </FlashlightCard>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Micro-Campaigns Efficacy (Bar Chart) */}
        <FlashlightCard className="lg:col-span-2 min-h-[300px] flex flex-col p-6">
          <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest px-1 mb-8">Eficácia de Campanhas (Taxa Analítica)</h3>
          
          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficacyData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff08" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'var(--font-jetbrains-mono)' }} />
                <RechartsTooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff15', borderRadius: '8px', fontFamily: 'var(--font-jetbrains-mono)' }}
                />
                <Bar dataKey="disparos" fill="#ffffff10" barSize={16} radius={[4, 4, 4, 4]} />
                <Bar dataKey="respostas" fill="#abd600" barSize={16} radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FlashlightCard>
        
        {/* Lideranças Mobilizadas / Heatmap List */}
        <div className="glass-panel p-6 flex flex-col gap-4 rounded-2xl bg-charcoal border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-2 pb-4 border-b border-white/5">
            <h3 className="font-mono text-xs text-white uppercase tracking-widest">Top Líderes (Influencers)</h3>
            <span className="px-2 py-0.5 bg-acid/10 text-acid text-[10px] font-mono rounded border border-acid/20 uppercase tracking-tighter cursor-pointer hover:bg-acid hover:text-black transition-colors">Ver Ranking</span>
          </div>
          
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
            {influencers.map(inf => (
              <div key={inf.id} className="p-4 bg-black/40 border border-white/5 p-4 rounded-xl hover:border-acid/30 transition-all group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-acid/5 to-transparent"></div>
                
                <h4 className="text-sm font-serif text-white group-hover:text-acid transition-colors">{inf.name}</h4>
                <div className="flex justify-between items-end mt-2">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Alcance</p>
                      <p className="font-mono text-xs text-neutral-300">{inf.reach}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest">Conversão</p>
                      <p className="font-mono text-xs text-acid">{inf.conversion}</p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-acid/30 group-hover:bg-acid/10 transition-colors">
                     <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-acid group-hover:-rotate-45 transition-all" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
