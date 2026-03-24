"use client";

import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FlashlightCard } from "./flashlight-card";

interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
}

export function MetricsCard({ title, value, icon: Icon, trend, trendUp }: MetricsCardProps) {
  return (
    <FlashlightCard className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-neutral-400 uppercase tracking-widest">{title}</span>
        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
          <Icon className="w-4 h-4 text-neutral-300" />
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-4xl text-white">{value}</span>
        <span className={cn(
          "flex items-center text-xs font-mono",
          trendUp ? "text-acid" : "text-danger"
        )}>
          {trendUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend}
        </span>
      </div>
    </FlashlightCard>
  );
}
