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
  BarChart2
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Mensagens", href: "/messages", icon: MessageSquare },
  { name: "Contatos", href: "/voters", icon: Users },
  { name: "Radar de Demandas", href: "/requests", icon: FileBox },
  { name: "Alertas", href: "/alerts", icon: BellRing },
  { name: "Relatórios", href: "/relatorios", icon: BarChart2 },
  { name: "Configurações", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-charcoal border-r border-border flex flex-col z-40">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-acid rounded-sm shadow-[0_0_10px_rgba(204,255,0,0.5)]"></div>
          <span className="font-mono font-bold text-white tracking-widest text-lg">LOGOS POLIS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                isActive 
                  ? "bg-white/10 text-acid font-medium" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-acid" : "text-neutral-500 group-hover:text-neutral-300")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

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
  );
}
