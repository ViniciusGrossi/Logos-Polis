"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  FileBox, 
  BellRing, 
  Settings,
  BarChart2,
  TrendingUp,
  Map as MapIcon,
  Target,
  UserCheck,
  Zap,
  Sword,
  Menu,
  X as CloseIcon
} from "lucide-react";
import { useState } from "react";

const mainNavItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mensagens", href: "/messages", icon: MessageSquare },
  { name: "Contatos", href: "/voters", icon: Users },
  { name: "Radar de Demandas", href: "/requests", icon: FileBox },
  { name: "Alertas", href: "/alerts", icon: BellRing },
];

const stratNavItems = [
  { name: "Micro-campanhas", href: "/campanhas", icon: Target },
  { name: "Equipe & Lideranças", href: "/influenciadores", icon: UserCheck },
  { name: "Concorrência", href: "/concorrencia", icon: Sword },
];

const bottomNavItems = [
  { name: "Relatórios", href: "/relatorios", icon: BarChart2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-charcoal border border-white/10 rounded-lg lg:hidden"
      >
        {isOpen ? <CloseIcon className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-charcoal border-r border-border flex flex-col z-40 transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-acid rounded-sm shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
          <span className="font-mono font-bold text-white tracking-widest text-lg">LOGOS POLIS</span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-6 custom-scrollbar">
        {/* Gestão */}
        <nav className="flex flex-col gap-1">
          <p className="px-3 mb-2 font-mono text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Geral</p>
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-white/10 text-acid font-medium border border-acid/20" 
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-acid" : "text-neutral-500 group-hover:text-neutral-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Inteligência Estratégica */}
        <nav className="flex flex-col gap-1">
          <p className="px-3 mb-2 font-mono text-[10px] uppercase font-bold text-acid tracking-widest">Estratégico</p>
          {stratNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-acid/10 text-acid font-medium border border-acid/20" 
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-acid" : "text-neutral-500 group-hover:text-neutral-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Utilitários */}
        <nav className="flex flex-col gap-1">
          <p className="px-3 mb-2 font-mono text-[10px] uppercase font-bold text-neutral-600 tracking-widest">Utilitários</p>
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                  isActive 
                    ? "bg-white/10 text-acid font-medium border border-acid/20" 
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-acid" : "text-neutral-500 group-hover:text-neutral-300")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-full bg-navy border border-blue-500/30 flex items-center justify-center text-blue-400 font-serif font-bold">
            VJ
          </div>
          <div>
            <p className="text-sm font-medium text-white">Ver. João Silva</p>
            <p className="text-xs text-neutral-500 font-mono">Gabinete #04</p>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
}
