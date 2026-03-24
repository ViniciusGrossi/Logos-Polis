"use client";

import { 
  Users, MessageSquare, AlertCircle, 
  TrendingUp, Calendar, Zap, 
  ArrowRight, Sparkles, Clock, ShieldAlert
} from "lucide-react";
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { MetricsCard } from "@/components/ui/metrics-card";
import { Badge } from "@/components/ui/badge";

// --- MOCK DATA ---
const evolutionData = [
  { name: "Seg", mentions: 400, requests: 240 },
  { name: "Ter", mentions: 300, requests: 139 },
  { name: "Qua", mentions: 200, requests: 980 },
  { name: "Qui", mentions: 278, requests: 390 },
  { name: "Sex", mentions: 189, requests: 480 },
  { name: "Sáb", mentions: 239, requests: 380 },
  { name: "Dom", mentions: 349, requests: 430 },
];

const themeData = [
  { name: "Saúde", value: 400, color: "#abd600" },
  { name: "Educação", value: 300, color: "#3b82f6" },
  { name: "Segurança", value: 300, color: "#ff4d4d" },
  { name: "Infra", value: 200, color: "#71717a" },
];

const messages = [
  { id: 1, user: "João Silva", text: "Buraco na rua das oliveiras...", time: "10 min atrás", sentiment: "negative", hood: "Setor Sul", theme: "Infra" },
  { id: 2, user: "Maria Oliveira", text: "Parabéns pelo projeto da merenda!", time: "1h atrás", sentiment: "positive", hood: "Centro", theme: "Educação" },
  { id: 3, user: "Carlos Pereira", text: "Poda de árvore na praça matriz.", time: "2h atrás", sentiment: "neutral", hood: "Vila Norte", theme: "Serviços" },
];

const activeAlerts = [
  { id: 1, title: "Pico de demandas de Infra no Setor Leste", severity: "Alta", time: "2h atrás", icon: ShieldAlert },
  { id: 2, title: "Atraso no processamento de 12 mensagens", severity: "Média", time: "4h atrás", icon: Clock },
];

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-slide-up">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-acid uppercase tracking-[0.3em]">Ambiente de Inteligência</p>
          <h1 className="text-5xl font-serif text-white leading-tight">Painel Executivo</h1>
        </div>
        
        <button className="relative group overflow-hidden bg-acid hover:bg-[#b3e600] text-black font-mono font-bold py-3 px-8 rounded-xl transition-all flex items-center gap-3">
          <Zap className="w-4 h-4" />
          Gerar Relatório IA
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12"></div>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard 
          title="Mensagens Hoje" 
          value="124" 
          icon={MessageSquare} 
          trend="+12%" 
          trendUp={true} 
        />
        <MetricsCard 
          title="Fila Pendente" 
          value="42" 
          icon={Calendar} 
          trend="-4" 
          trendUp={false} 
        />
        <MetricsCard 
          title="Alertas Ativos" 
          value="08" 
          icon={AlertCircle} 
          trend="Estável" 
          trendUp={true} 
        />
        <MetricsCard 
          title="Taxa de Resposta" 
          value="94%" 
          icon={TrendingUp} 
          trend="+2.1%" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <FlashlightCard className="lg:col-span-2 min-h-[400px] flex flex-col pt-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest px-1">Evolução da Demanda (7d)</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <div className="w-2 h-2 bg-acid rounded-sm"></div> Menções
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-400">
                <div className="w-2 h-2 bg-white/10 rounded-sm"></div> Solicitações
              </div>
            </div>
          </div>
          
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#abd600" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#abd600" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'var(--font-jetbrains-mono)' }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff08', borderRadius: '12px', fontFamily: 'var(--font-jetbrains-mono)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="mentions" stroke="#abd600" strokeWidth={2} fillOpacity={1} fill="url(#colorMentions)" />
                <Area type="monotone" dataKey="requests" stroke="#ffffff20" strokeWidth={1} fill="#ffffff05" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </FlashlightCard>

        {/* Sidebar Mini-Charts */}
        <div className="space-y-6">
          <FlashlightCard className="h-full flex flex-col pt-8">
            <h3 className="font-mono text-xs text-neutral-500 uppercase tracking-widest px-1 mb-6">Volume por Tema</h3>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={themeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {themeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff08', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              {themeData.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                    {item.name}
                  </div>
                  <div className="text-sm font-mono text-white pl-3.5">{item.value}</div>
                </div>
              ))}
            </div>
          </FlashlightCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Alerts */}
        <div className="glass-panel p-6 flex flex-col gap-4 rounded-2xl bg-charcoal/50 border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-mono text-xs text-neutral-400 uppercase tracking-widest">Alertas Prioritários</h3>
            <span className="px-2 py-0.5 bg-danger/10 text-danger text-[10px] font-mono rounded border border-danger/20 tracking-tighter">2 ATIVOS</span>
          </div>
          
          {activeAlerts.map(alert => (
            <div key={alert.id} className="p-4 bg-black/40 border border-white/5 rounded-xl hover:border-white/10 transition-colors group">
              <div className="flex gap-3">
                <div className={cn(
                  "mt-0.5 p-1.5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform",
                  alert.severity === "Alta" ? "bg-danger/10 text-danger" : "bg-orange-500/10 text-orange-400"
                )}>
                  <alert.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-snug mb-1">{alert.title}</p>
                  <p className="font-mono text-[9px] text-neutral-500 uppercase">{alert.time}</p>
                </div>
              </div>
            </div>
          ))}

          <button className="mt-auto w-full py-2 text-xs font-mono uppercase text-neutral-400 hover:text-white transition-colors border border-dashed border-white/10 rounded-lg hover:border-white/20">
            Ver Todos
          </button>
        </div>

        {/* AI Insight Highlight */}
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-acid/10 bg-acid/[0.02] lg:col-span-2">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Sparkles className="w-24 h-24 text-acid" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-3">
              <Badge variant="acid">Discovery</Badge>
              <h4 className="text-3xl font-serif text-white tracking-tight leading-snug max-w-lg">
                Detectamos uma janela de oportunidade no Bairro Centro.
              </h4>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-xl font-sans">
              As menções positivas sobre "Infraestrutura" aumentaram 42% nas últimas 24h. O termômetro de sentimento indica aprovação das novas luminárias de LED. É o momento ideal para uma publicação técnica sobre metas de expansão.
            </p>
            <button className="flex items-center gap-3 text-acid font-mono text-xs uppercase tracking-[0.2em] hover:gap-5 transition-all group">
              Aprofundar Análise <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
