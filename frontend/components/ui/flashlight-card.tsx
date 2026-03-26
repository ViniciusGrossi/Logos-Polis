"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FlashlightCardProps {
  children: React.ReactNode;
  className?: string;
}

export function FlashlightCard({ children, className }: FlashlightCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div 
      className={cn("flashlight-card rounded-2xl p-6 relative overflow-hidden", className)}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      style={{ "--mouse-x": `${mousePos.x}px`, "--mouse-y": `${mousePos.y}px` } as React.CSSProperties}
    >
      <div className="flashlight-border rounded-2xl pointer-events-none"></div>
      <div className="relative z-10 h-full w-full flex flex-col">
        {children}
      </div>
    </div>
  );
}
