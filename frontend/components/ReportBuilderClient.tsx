"use client";

import React, { useState } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDraggable } from "@dnd-kit/core";
import { 
  BarChart, 
  Map as MapIcon, 
  MessageSquare, 
  AlertCircle, 
  LayoutTemplate,
  GripVertical,
  X,
  Download,
  Plus,
  TrendingUp,
  Calendar,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "@/components/ui/flashlight-card";
import { MetricsCard } from "@/components/ui/metrics-card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// --- MOCK DATA FOR WIDGETS ---
const evolutionData = [
  { name: "Seg", mentions: 400, requests: 240 },
  { name: "Ter", mentions: 300, requests: 139 },
  { name: "Qua", mentions: 200, requests: 980 },
  { name: "Qui", mentions: 278, requests: 390 },
  { name: "Sex", mentions: 189, requests: 480 },
  { name: "Sáb", mentions: 239, requests: 380 },
  { name: "Dom", mentions: 349, requests: 430 },
];

const activeAlerts = [
  { id: 1, title: "Pico de demandas de Infra no Setor Leste", severity: "Alta", time: "2h atrás", icon: AlertCircle },
  { id: 2, title: "Atraso no processamento de 12 mensagens", severity: "Média", time: "4h atrás", icon: AlertCircle },
];

// Define widget types
type WidgetType = "kpi-grid" | "evolution-chart" | "radar-map" | "text-block" | "alert-feed";

interface ReportWidget {
  id: string;
  type: WidgetType;
  title: string;
  data?: any;
}

const AVAILABLE_WIDGETS: { type: WidgetType; title: string; icon: React.ElementType; description: string }[] = [
  { type: "kpi-grid", title: "Métricas Principais", icon: BarChart, description: "Grade com os 4 KPIs principais" },
  { type: "evolution-chart", title: "Gráfico de Evolução", icon: LayoutTemplate, description: "Curva de demanda dos últimos 7 dias" },
  { type: "radar-map", title: "Mapa do Radar", icon: MapIcon, description: "Visão geográfica das demandas" },
  { type: "text-block", title: "Bloco de Texto", icon: MessageSquare, description: "Espaço para anotações livres" },
  { type: "alert-feed", title: "Feed de Alertas", icon: AlertCircle, description: "Lista de alertas recentes" },
];

function renderWidgetContent(type: WidgetType, widgetData: any = {}, onUpdate?: (newData: any) => void) {
  switch (type) {
    case "kpi-grid":
      const kpis = widgetData.kpis || [
        { title: "Mensagens Hoje", value: "124", icon: MessageSquare, trend: "+12%", trendUp: true },
        { title: "Fila Pendente", value: "42", icon: Calendar, trend: "-4", trendUp: false },
        { title: "Alertas Ativos", value: "08", icon: AlertCircle, trend: "Estável", trendUp: true },
        { title: "Taxa de Resposta", value: "94%", icon: TrendingUp, trend: "+2.1%", trendUp: true }
      ];

      const updateKpi = (index: number, field: string, value: string) => {
        const newKpis = [...kpis];
        newKpis[index] = { ...newKpis[index], [field]: value };
        onUpdate?.({ ...widgetData, kpis: newKpis });
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {kpis.map((kpi: any, idx: number) => (
            <div key={idx} className="relative group/kpi">
              <MetricsCard 
                title={kpi.title} 
                value={kpi.value} 
                icon={kpi.icon || MessageSquare} 
                trend={kpi.trend} 
                trendUp={kpi.trendUp} 
              />
              <div className="absolute inset-0 opacity-0 group-hover/kpi:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 bg-black/60 rounded-2xl backdrop-blur-[2px] border border-acid/20 print:hidden">
                <input 
                  className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-[10px] font-mono text-white w-4/5 text-center focus:border-acid outline-none" 
                  value={kpi.title} 
                  onChange={(e) => updateKpi(idx, 'title', e.target.value)}
                  placeholder="Título"
                />
                <input 
                  className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-lg font-mono text-acid w-4/5 text-center focus:border-acid outline-none" 
                  value={kpi.value}
                  onChange={(e) => updateKpi(idx, 'value', e.target.value)}
                  placeholder="Valor"
                />
              </div>
            </div>
          ))}
        </div>
      );
    case "evolution-chart":
      return (
        <div className="w-full h-[250px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={evolutionData}>
              <defs>
                <linearGradient id="colorMentions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#abd600" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#abd600" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff08', borderRadius: '12px' }} />
              <Area type="monotone" dataKey="mentions" stroke="#abd600" strokeWidth={2} fillOpacity={1} fill="url(#colorMentions)" />
              <Area type="monotone" dataKey="requests" stroke="#ffffff20" strokeWidth={1} fill="#ffffff05" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    case "radar-map":
      return (
        <div className="relative w-full h-[300px] rounded-xl overflow-hidden border border-white/5 bg-black/50 flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: "url('https://api.maptiler.com/maps/dataviz-dark/static/auto/800x600@2x.png?key=get_your_own_OpIi9ZULNHzrESv6T2vL')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(100%) contrast(1.2)"
          }}></div>
          <div className="absolute w-24 h-24 bg-acid/20 rounded-full blur-2xl"></div>
          <MapIcon className="w-10 h-10 text-acid/50 mb-2 relative z-10" />
          <p className="font-mono text-xs text-acid relative z-10 uppercase tracking-widest">{widgetData.caption || "Mapa Geográfico Estático para Impressão"}</p>
          <input 
            className="absolute bottom-4 bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-[10px] font-mono text-white/60 focus:text-white focus:border-acid outline-none z-20 print:hidden"
            value={widgetData.caption || ""}
            onChange={(e) => onUpdate?.({ ...widgetData, caption: e.target.value })}
            placeholder="Alterar legenda do mapa..."
          />
        </div>
      );
    case "text-block":
      return (
        <textarea 
          placeholder="Digite suas anotações ou análises para este relatório..."
          className="w-full min-h-[150px] bg-black/20 border border-dashed border-white/10 rounded-xl p-4 text-sm font-sans text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-acid/30 resize-y"
          value={widgetData.text || ""}
          onChange={(e) => onUpdate?.({ ...widgetData, text: e.target.value })}
        />
      );
    case "alert-feed":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeAlerts.map(alert => (
            <div key={alert.id} className="p-4 bg-black/40 border border-white/5 rounded-xl">
              <div className="flex gap-3">
                <div className={cn(
                  "mt-0.5 p-1.5 rounded-lg flex-shrink-0",
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
        </div>
      );
    default:
      return null;
  }
}

function DraggableLibraryItem({ widget, onClick }: { widget: any; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${widget.type}`,
    data: {
      type: widget.type,
      title: widget.title,
      isLibraryItem: true
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-acid/30 transition-all cursor-grab group flex items-start gap-3 relative z-30 select-none",
        isDragging && "border-acid scale-95 shadow-xl shadow-acid/10 bg-acid/5"
      )}
    >
      <div className="p-2 rounded-lg bg-black/40 text-neutral-400 group-hover:text-acid group-hover:bg-acid/10 transition-colors">
        <widget.icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-medium text-white group-hover:text-acid transition-colors">{widget.title}</h4>
        <p className="text-[10px] text-neutral-500 font-mono mt-1">{widget.description}</p>
      </div>
      <Plus className="w-4 h-4 ml-auto self-center text-neutral-600 group-hover:text-acid opacity-0 group-hover:opacity-100 transition-all" />
    </div>
  );
}

function SortableWidgetItem({ item, onRemove, onUpdateTitle, onUpdateData }: { 
  item: ReportWidget; 
  onRemove: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateData: (id: string, data: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn("relative group mb-6", isDragging && "select-none")}>
      <FlashlightCard className="p-6 border border-white/5 bg-charcoal/30 min-h-[200px] flex flex-col group/card hover:border-white/10 transition-colors print:border-black/20 print:bg-white print:text-black print:mb-8 print:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Multi-Handle - All card is draggable except interactive parts if needed, but we use a clear handle */}
            <div 
              className="p-1 px-1.5 rounded bg-white/5 hover:bg-acid/20 text-neutral-500 hover:text-acid cursor-grab active:cursor-grabbing transition-colors print:hidden"
              {...attributes} 
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {isEditingTitle ? (
              <input 
                autoFocus
                className="bg-black/40 border-b border-acid text-xs font-mono text-acid uppercase tracking-widest px-1 outline-none"
                value={item.title}
                onChange={(e) => onUpdateTitle(item.id, e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              />
            ) : (
              <h3 
                onClick={() => setIsEditingTitle(true)}
                className="font-mono text-xs text-acid uppercase tracking-widest px-1 hover:bg-acid/10 rounded cursor-text transition-colors print:text-neutral-500"
              >
                {item.title}
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button 
              onClick={() => onRemove(item.id)}
              className="w-8 h-8 rounded-lg bg-danger/10 text-danger/60 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all hover:bg-danger hover:text-white"
              title="Remover Widget"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1">
          {renderWidgetContent(item.type, item.data, (newData) => onUpdateData(item.id, newData))}
        </div>
      </FlashlightCard>
    </div>
  );
}

export default function ReportBuilderClient() {
  const [items, setItems] = useState<ReportWidget[]>([
    { id: "1", type: "kpi-grid", title: "Visão Geral do Mandato" },
    { id: "2", type: "evolution-chart", title: "Tendência Semanal" },
  ]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const addWidget = (type: WidgetType, title: string, index?: number) => {
    const newWidget = { id: Math.random().toString(36).substring(7), type, title };
    if (typeof index === 'number') {
      const newItems = [...items];
      newItems.splice(index, 0, newWidget);
      setItems(newItems);
    } else {
      setItems((prev) => [...prev, newWidget]);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Handle dropping a widget from the library
    if (active.data.current?.isLibraryItem) {
      const { type, title } = active.data.current;
      const overId = over.id as string;
      const overIndex = items.findIndex((i) => i.id === overId);
      
      // If dropped over a specific item, insert it there. Otherwise, append to the end
      if (overIndex !== -1) {
        addWidget(type as WidgetType, title, overIndex);
      } else {
        addWidget(type as WidgetType, title);
      }
      return;
    }

    // Handle reordering existing widgets
    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const removeWidget = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateWidgetTitle = (id: string, title: string) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, title } : item));
  };

  const updateWidgetData = (id: string, data: any) => {
    setItems((prev) => prev.map(item => item.id === id ? { ...item, data } : item));
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-theme(spacing.24))] gap-6">
        
        {/* Sidebar - Widget Pallete */}
        <div className="w-80 shrink-0 border-r border-white/5 pr-6 flex flex-col print:hidden animate-slide-right">
          <div className="mb-8 space-y-2">
            <h2 className="font-serif text-2xl text-white">Biblioteca</h2>
            <p className="text-sm font-sans text-neutral-400">Adicione ou arraste os componentes para o relatório</p>
          </div>

          <div className="space-y-3 overflow-y-auto pb-8 pr-2 custom-scrollbar">
            {AVAILABLE_WIDGETS.map((widget) => (
              <DraggableLibraryItem 
                key={widget.type}
                widget={widget}
                onClick={() => addWidget(widget.type, widget.title)}
              />
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col bg-charcoal/20 rounded-2xl border border-white/5 overflow-hidden animate-slide-up relative">
          <div className="h-16 shrink-0 border-b border-white/5 flex items-center justify-between px-8 bg-black/40 print:hidden">
            <div className="flex items-center gap-4">
              <span className="w-2 h-2 rounded-full bg-acid animate-pulse"></span>
              <span className="font-mono text-xs text-neutral-400 tracking-widest uppercase">Canvas de Edição Ao Vivo</span>
            </div>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 text-xs font-mono uppercase bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-12 custom-scrollbar report-canvas print:p-0 print:overflow-visible">
            <div className="max-w-4xl mx-auto print:max-w-none print:w-full">
              {/* Header Mocado do Relatório */}
              <div className="mb-12 border-b border-white/10 pb-8 print:border-black/20">
                <input 
                  type="text" 
                  defaultValue="Relatório de Desempenho: Prioridades Centro" 
                  className="w-full bg-transparent border-none focus:outline-none font-serif text-4xl text-white placeholder:text-neutral-700 print:text-black mb-2"
                />
                <p className="font-mono text-sm text-neutral-500 print:text-neutral-600">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>

              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6 print:space-y-8">
                  {items.map((item) => (
                    <SortableWidgetItem 
                      key={item.id} 
                      item={item} 
                      onRemove={removeWidget} 
                      onUpdateTitle={updateWidgetTitle}
                      onUpdateData={updateWidgetData}
                    />
                  ))}
                </div>
              </SortableContext>
              
              {items.length === 0 && (
                <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-3xl print:hidden">
                  <LayoutTemplate className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                  <h3 className="font-serif text-xl text-neutral-400">Canvas Vazio</h3>
                  <p className="font-mono text-xs text-neutral-500 mt-2">Adicione ou arraste widgets pelo painel lateral para começar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            activeId.toString().startsWith('library-') ? (
              <div className="p-4 rounded-xl border border-acid bg-acid/10 backdrop-blur-md opacity-80 scale-105 shadow-2xl flex items-start gap-3 select-none">
                <div className="p-2 rounded-lg bg-acid/20 text-acid">
                  {AVAILABLE_WIDGETS.find(w => `library-${w.type}` === activeId)?.title ? 
                    React.createElement(AVAILABLE_WIDGETS.find(w => `library-${w.type}` === activeId)!.icon, { className: "w-5 h-5" }) 
                    : <BarChart className="w-5 h-5" />
                  }
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{AVAILABLE_WIDGETS.find(w => `library-${w.type}` === activeId)?.title}</h4>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-acid/50 bg-acid/10 backdrop-blur-md rounded-2xl opacity-80 scale-105 shadow-2xl select-none">
                <h3 className="font-mono text-xs text-acid uppercase tracking-widest text-card">
                  {items.find((i) => i.id === activeId)?.title}
                </h3>
              </div>
            )
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
